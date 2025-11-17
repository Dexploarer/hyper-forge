/**
 * Static Files Plugin for Elysia
 * Consolidates all static file serving into a single plugin
 *
 * Handles:
 * - Temporary images (/temp-images/*)
 * - Emotes (/emotes/*)
 * - Rigs (/rigs/*)
 * - Images (/images/*)
 * - Prompts (/prompts/*)
 * - Vite build assets (/assets/*)
 * - SPA fallback (/ and /*)
 *
 * Supports both GET and HEAD requests for all routes
 * Uses dynamic pattern to reduce code repetition from ~400 lines to ~100 lines
 */

import { Elysia, type Context } from "elysia";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../..");

/**
 * Static file route configuration
 * Maps URL paths to filesystem directories with content types
 */
interface StaticRoute {
  /** URL path pattern (e.g., "/temp-images/*") */
  path: string;
  /** Filesystem directory relative to ROOT_DIR */
  fsDir: string;
  /** Default Content-Type header for HEAD requests */
  contentType: string;
}

const STATIC_ROUTES: StaticRoute[] = [
  {
    path: "/temp-images",
    fsDir: "temp-images",
    contentType: "image/png",
  },
  {
    path: "/emotes",
    fsDir: "public/emotes",
    contentType: "model/gltf-binary",
  },
  {
    path: "/rigs",
    fsDir: "public/rigs",
    contentType: "model/gltf-binary",
  },
  {
    path: "/images",
    fsDir: "public/images",
    contentType: "image/png",
  },
  {
    path: "/prompts",
    fsDir: "public/prompts",
    contentType: "application/json",
  },
];

/**
 * Create GET and HEAD handlers for a static file route
 * Reduces repetition by using the same logic for all routes
 *
 * SECURITY: Includes path traversal prevention to block attacks like:
 * - /temp-images/../../../.env
 * - /emotes/../../server/config/env.ts
 */
function createStaticHandler(route: StaticRoute) {
  const getHandler = async ({
    params,
    set,
  }: Context<{ params: Record<string, string> }>) => {
    const relativePath = params["*"] || "";

    // CRITICAL SECURITY: Validate path to prevent directory traversal
    const baseDir = path.resolve(ROOT_DIR, route.fsDir);
    const filePath = path.resolve(baseDir, relativePath);

    // Ensure resolved path is within the allowed directory
    if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
      logger.warn(
        {
          baseDir,
          requestedPath: relativePath,
          resolvedPath: filePath,
        },
        "[Security] Blocked path traversal attempt",
      );
      set.status = 403;
      return new Response("Access Denied", { status: 403 });
    }

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  };

  const headHandler = async ({
    params,
  }: Context<{ params: Record<string, string> }>) => {
    const relativePath = params["*"] || "";

    // CRITICAL SECURITY: Validate path to prevent directory traversal
    const baseDir = path.resolve(ROOT_DIR, route.fsDir);
    const filePath = path.resolve(baseDir, relativePath);

    // Ensure resolved path is within the allowed directory
    if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
      logger.warn(
        {
          baseDir,
          requestedPath: relativePath,
          resolvedPath: filePath,
        },
        "[Security] Blocked path traversal attempt",
      );
      return new Response(null, { status: 403 });
    }

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": route.contentType },
    });
  };

  return { getHandler, headHandler };
}

/**
 * Static Files Plugin
 * Registers all static file routes with GET and HEAD support
 */
export const staticFilesPlugin = new Elysia({ name: "static-files" })
  // Register all static file routes dynamically
  .use((app) => {
    for (const route of STATIC_ROUTES) {
      const { getHandler, headHandler } = createStaticHandler(route);
      app.get(`${route.path}/*`, getHandler);
      app.head(`${route.path}/*`, headHandler);
    }
    return app;
  })

  // Vite build assets (must come BEFORE SPA fallback)
  .get(
    "/assets/*",
    async ({ params, set }: Context<{ params: Record<string, string> }>) => {
      const relativePath = params["*"] || "";

      // CRITICAL SECURITY: Validate path to prevent directory traversal
      const baseDir = path.resolve(ROOT_DIR, "dist", "assets");
      const filePath = path.resolve(baseDir, relativePath);

      // Ensure resolved path is within the allowed directory
      if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
        logger.warn(
          {
            baseDir,
            requestedPath: relativePath,
            resolvedPath: filePath,
          },
          "[Security] Blocked path traversal attempt in /assets/*",
        );
        set.status = 403;
        return new Response("Access Denied", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        set.status = 404;
        return new Response("Not Found", { status: 404 });
      }
      // Wrap Bun.file() in Response for proper HEAD request handling
      return new Response(file);
    },
  )
  .head(
    "/assets/*",
    async ({ params }: Context<{ params: Record<string, string> }>) => {
      const relativePath = params["*"] || "";

      // CRITICAL SECURITY: Validate path to prevent directory traversal
      const baseDir = path.resolve(ROOT_DIR, "dist", "assets");
      const filePath = path.resolve(baseDir, relativePath);

      // Ensure resolved path is within the allowed directory
      if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
        logger.warn(
          {
            baseDir,
            requestedPath: relativePath,
            resolvedPath: filePath,
          },
          "[Security] Blocked path traversal attempt in /assets/*",
        );
        return new Response(null, { status: 403 });
      }

      const file = Bun.file(filePath);

      if (!(await file.exists())) {
        return new Response(null, { status: 404 });
      }

      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
      });
    },
  )

  // SPA fallback - handle HEAD request for root first (Coinbase Wallet CORS check)
  .head("/", async () => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      const file = Bun.file(indexPath);

      if (!(await file.exists())) {
        return new Response(null, { status: 404 });
      }

      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (error) {
      logger.error({ err: error }, "[HEAD /] Error checking SPA:");
      return new Response(null, { status: 500 });
    }
  })

  // SPA fallback - serve index.html for all non-API routes
  // This must be LAST to allow API routes and static assets to match first
  .get("/*", async ({ set }) => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      const file = Bun.file(indexPath);
      if (!(await file.exists())) {
        logger.error({}, `❌ Frontend not found at: ${indexPath}`);
        logger.error({}, `   Current working directory: ${process.cwd()}`);
        logger.error({}, `   ROOT_DIR: ${ROOT_DIR}`);
        set.status = 404;
        return new Response(
          "Frontend build not found. Please run 'bun run build'.",
          {
            status: 404,
          },
        );
      }
      // Wrap Bun.file() in Response for proper HEAD request handling
      return new Response(file);
    } catch (error) {
      logger.error({ err: error }, "[GET /*] Error serving SPA:");
      set.status = 500;
      return new Response("Internal Server Error", { status: 500 });
    }
  })
  .head("/*", async () => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      const file = Bun.file(indexPath);

      if (!(await file.exists())) {
        logger.warn({}, `[HEAD /*] Frontend not found at: ${indexPath}`);
        logger.warn({}, `   Current working directory: ${process.cwd()}`);
        logger.warn({}, `   ROOT_DIR: ${ROOT_DIR}`);
        return new Response(null, { status: 404 });
      }

      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (error) {
      logger.error({ err: error }, "[HEAD /*] Error checking SPA:");
      logger.error({}, `   ROOT_DIR: ${ROOT_DIR}`);
      logger.error({}, `   cwd: ${process.cwd()}`);
      console.error(
        `   Error details:`,
        error instanceof Error ? error.message : String(error),
      );
      return new Response(null, { status: 500 });
    }
  });
