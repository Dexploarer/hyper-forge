/**
 * Debug & Admin Endpoints Plugin for Elysia
 *
 * Endpoints:
 * - GET /api/proxy/image: CORS-free image proxy for external URLs
 * - GET /api/debug/headers: Security headers and environment verification
 */

import { Elysia } from "elysia";
import path from "path";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Create debug plugin with dependencies
 * Factory function pattern for dependency injection
 */
export function createDebugPlugin(options: {
  rootDir: string;
  apiPort: number;
}) {
  const { rootDir, apiPort } = options;

  return (
    new Elysia({ name: "debug" })
      // ==================== IMAGE PROXY ====================
      // Image proxy to avoid CORS issues with external images
      .get("/api/proxy/image", async ({ query }) => {
        const { url } = query as { url?: string };

        if (!url || typeof url !== "string") {
          return new Response("URL parameter required", { status: 400 });
        }

        try {
          // Validate URL format
          const parsedUrl = new URL(url);

          // Only allow HTTP/HTTPS protocols
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return new Response("Only HTTP/HTTPS URLs are allowed", {
              status: 400,
            });
          }

          // Fetch external image with 30s timeout
          const { fetchWithTimeout } = await import(
            "../utils/fetch-with-timeout"
          );
          const response = await fetchWithTimeout(
            url,
            {
              headers: {
                "User-Agent": "Asset-Forge-Image-Proxy/1.0",
              },
            },
            30000, // 30s timeout
          );

          if (!response.ok) {
            return new Response(
              `Failed to fetch image: ${response.status} ${response.statusText}`,
              { status: response.status },
            );
          }

          // Get content type, default to jpeg if not specified
          const contentType =
            response.headers.get("Content-Type") || "image/jpeg";

          // Only allow image content types
          if (!contentType.startsWith("image/")) {
            return new Response("URL does not point to an image", {
              status: 400,
            });
          }

          // Stream the image
          const blob = await response.blob();

          return new Response(blob, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
              "Access-Control-Allow-Origin": "*",
              "X-Proxied-From": parsedUrl.hostname,
            },
          });
        } catch (error) {
          logger.error({ err: error }, "Image proxy error:");
          return new Response(
            `Invalid URL or fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            { status: 400 },
          );
        }
      })

      // ==================== HEADERS DEBUG ====================
      // Debug endpoint to verify security headers
      .get("/api/debug/headers", async ({ set, request }) => {
        const indexPath = path.join(rootDir, "dist", "index.html");
        const indexFile = Bun.file(indexPath);

        return {
          securityHeaders: {
            "Cross-Origin-Opener-Policy":
              set.headers["cross-origin-opener-policy"],
            "Cross-Origin-Embedder-Policy":
              set.headers["cross-origin-embedder-policy"],
            "X-Content-Type-Options": set.headers["x-content-type-options"],
            "X-Frame-Options": set.headers["x-frame-options"],
          },
          environment: {
            NODE_ENV: env.NODE_ENV,
            PORT: apiPort,
            ROOT_DIR: rootDir,
            cwd: process.cwd(),
          },
          frontend: {
            indexPath,
            indexExists: await indexFile.exists(),
            distExists: await Bun.file(path.join(rootDir, "dist")).exists(),
          },
          request: {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries()),
          },
        };
      })
  );
}
