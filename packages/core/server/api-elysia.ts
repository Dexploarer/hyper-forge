/**
 * Elysia API Server
 * Modern Bun-native backend for AI-powered 3D asset generation
 *
 * Migration from Express to Elysia for:
 * - 22x better performance (2.4M req/s vs 113K req/s)
 * - Native Bun file handling
 * - End-to-end type safety
 * - Built-in file upload support
 */

import "dotenv/config";
import { Elysia, t } from "elysia";

console.log("[Startup] api-elysia.ts loaded, initializing server...");
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { serverTiming } from "@elysiajs/server-timing";
import { rateLimit } from "elysia-rate-limit";
import { requestID } from "./plugins/request-id";
import prometheus from "elysia-prometheus";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Services
import { AssetService } from "./services/AssetService";
import { RetextureService } from "./services/RetextureService";
import { GenerationService } from "./services/GenerationService";

// Middleware
import { errorHandler } from "./middleware/errorHandler";
import { loggingMiddleware } from "./middleware/logging";
import { cachingMiddleware } from "./middleware/caching";
import { optionalAuth } from "./middleware/auth";
import {
  extractAssetIdFromPath,
  getAssetFromPath,
  canViewAsset,
} from "./middleware/assetAuth";

// Plugins
import { securityHeaders } from "./plugins/security-headers";
import { gracefulShutdown } from "./plugins/graceful-shutdown";
import { performanceTracing } from "./plugins/performance-tracing";
import { compression } from "./plugins/compression";

// Routes
import { healthRoutes } from "./routes/health";
import { createMaterialRoutes } from "./routes/materials";
import { createRetextureRoutes } from "./routes/retexture";
import { createGenerationRoutes } from "./routes/generation";
import { aiVisionRoutes } from "./routes/ai-vision";
import { createAssetRoutes } from "./routes/assets";
import { promptRoutes } from "./routes/prompts";
import { playtesterSwarmRoutes } from "./routes/playtester-swarm";
import { voiceGenerationRoutes } from "./routes/voice-generation";
import { musicRoutes } from "./routes/music";
import { soundEffectsRoutes } from "./routes/sound-effects";
import { contentGenerationRoutes } from "./routes/content-generation";
import { usersRoutes } from "./routes/users";
import { userApiKeysRoutes } from "./routes/user-api-keys";
import { adminRoutes } from "./routes/admin";
import { projectsRoutes } from "./routes/projects";
import { achievementsRoutes } from "./routes/achievements";
import { vectorSearchRoutes } from "./routes/vector-search";
import { createSeedDataRoutes } from "./routes/seed-data";
import { worldConfigRoutes } from "./routes/world-config";
import { generationQueueRoutes } from "./routes/generation-queue";
import { publicProfilesRoutes } from "./routes/public-profiles";
import { debugStorageRoute } from "./routes/debug-storage";
import { createCDNRoutes } from "./routes/cdn";

// Cron and job cleanup
import { cron } from "@elysiajs/cron";
import { generationJobService } from "./services/GenerationJobService";

// Worker system for background job processing
import { GenerationWorker } from "./workers/generation-worker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// Ensure temp-images directory exists
await fs.promises.mkdir(path.join(ROOT_DIR, "temp-images"), {
  recursive: true,
});

// Initialize Qdrant vector database (async, non-blocking)
import { initializeQdrantCollections } from "./db/qdrant";
initializeQdrantCollections().catch((error) => {
  console.error("[Startup] Qdrant initialization failed (non-fatal):", error);
});

// Initialize default achievements (async, non-blocking)
import { achievementService } from "./services/AchievementService";
achievementService.initializeDefaultAchievements().catch((error) => {
  console.error(
    "[Startup] Achievement initialization failed (non-fatal):",
    error,
  );
});

// Initialize services
// Railway uses PORT, but we fallback to API_PORT for local dev
const API_PORT = process.env.PORT || process.env.API_PORT || 3004;

// Railway volume path takes priority, then ASSETS_DIR env var, then local default
const ASSETS_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "gdd-assets")
    : process.env.ASSETS_DIR || path.join(ROOT_DIR, "gdd-assets");

// CDN_URL and IMAGE_SERVER_URL must be set in production
const CDN_URL =
  process.env.CDN_URL ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CDN_URL must be set in production environment");
    }
    throw new Error("CDN_URL must be set in development environment");
  })();

const IMAGE_SERVER_URL =
  process.env.IMAGE_SERVER_URL ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
      );
    }
    throw new Error("IMAGE_SERVER_URL must be set in development environment");
  })();

const assetService = new AssetService(ASSETS_DIR);
const retextureService = new RetextureService({
  meshyApiKey: process.env.MESHY_API_KEY || "",
  imageServerBaseUrl: IMAGE_SERVER_URL,
});
const generationService = new GenerationService();
// Note: GenerationService uses env vars for now - refactoring to user keys requires
// architectural changes due to stateful pipeline storage in memory

// Create Elysia app with full type inference for Eden Treaty
// @ts-ignore TS2742 - croner module reference from cron plugin is non-portable (doesn't affect runtime)
const app = new Elysia()
  // ==================== LIFECYCLE HOOKS ====================
  // Optional: Start workers in same process if ENABLE_EMBEDDED_WORKERS=true
  // For production, use separate worker service on Railway (better isolation & scaling)
  .onStart(async () => {
    console.log(`[Startup] Elysia server started on port ${API_PORT}`);

    // Check if we should run workers embedded in API process (dev mode)
    if (process.env.ENABLE_EMBEDDED_WORKERS === "true" && process.env.REDIS_URL) {
      const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
      console.log(`[Workers] Starting ${WORKER_CONCURRENCY} embedded workers...`);

      // Store worker references for cleanup
      const workers: GenerationWorker[] = [];
      for (let i = 0; i < WORKER_CONCURRENCY; i++) {
        const worker = new GenerationWorker(`embedded-${i + 1}`);
        worker.start();
        workers.push(worker);
      }

      // Store in app context for shutdown
      (app as any).workers = workers;
      console.log(`[Workers] ${WORKER_CONCURRENCY} workers started successfully`);
    } else {
      console.log("[Workers] Using separate worker service (production mode)");
    }
  })
  .onStop(async (ctx) => {
    console.log("[Shutdown] Stopping Elysia server...");

    // Stop embedded workers if they exist
    const workers = (ctx as any).workers as GenerationWorker[] | undefined;
    if (workers && workers.length > 0) {
      console.log(`[Workers] Stopping ${workers.length} embedded workers...`);
      for (const worker of workers) {
        worker.stop();
      }
      console.log("[Workers] All workers stopped");
    }
  })

  // ==================== SHARED RESPONSE MODELS ====================
  // Define common response schemas for reusability across all routes
  // Use t.Ref('model.name') in route handlers to reference these schemas
  .model({
    // Success responses
    "success.basic": t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),

    // Error responses with consistent structure
    "error.validation": t.Object({
      error: t.Literal("VALIDATION_ERROR"),
      message: t.String(),
      fields: t.Optional(
        t.Array(
          t.Object({
            field: t.String(),
            message: t.String(),
            expected: t.Optional(t.String()),
            received: t.Optional(t.String()),
          }),
        ),
      ),
      requestId: t.Optional(t.String()),
    }),

    "error.unauthorized": t.Object({
      error: t.Union([t.Literal("UNAUTHORIZED"), t.String()]),
      message: t.String(),
      requestId: t.Optional(t.String()),
    }),

    "error.forbidden": t.Object({
      error: t.Union([
        t.Literal("FORBIDDEN"),
        t.Literal("Forbidden"),
        t.String(),
      ]),
      message: t.String(),
      requestId: t.Optional(t.String()),
    }),

    "error.notFound": t.Object({
      error: t.Union([t.Literal("NOT_FOUND"), t.String()]),
      message: t.Optional(t.String()),
      requestId: t.Optional(t.String()),
    }),

    "error.internal": t.Object({
      error: t.Union([t.Literal("INTERNAL_SERVER_ERROR"), t.String()]),
      message: t.String(),
      requestId: t.Optional(t.String()),
      stack: t.Optional(t.String()),
    }),

    // Pagination models
    "pagination.query": t.Object({
      page: t.Optional(t.Number({ minimum: 1, default: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    }),

    "pagination.meta": t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
      totalPages: t.Number(),
      hasNext: t.Boolean(),
      hasPrev: t.Boolean(),
    }),
  })

  // Graceful shutdown handler
  .use(gracefulShutdown)

  // Request correlation ID (must be first for logging correlation)
  .use(requestID())

  // Performance monitoring (Elysia's native tracing)
  .use(performanceTracing)
  .use(serverTiming())

  // Security headers for Privy embedded wallets (applied to ALL responses)
  .use(securityHeaders)

  // Rate limiting - protect against abuse
  // Note: elysia-rate-limit automatically adds X-RateLimit-* headers
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 100, // 100 requests per minute per IP
      errorResponse: {
        error: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later.",
      } as any,
      // Skip rate limiting for health checks
      skip: (req) => new URL(req.url).pathname === "/api/health",
    }),
  )

  // Swagger API documentation
  .use(
    swagger({
      documentation: {
        info: {
          title: "3D Asset Forge API",
          version: "1.0.0",
          description: "AI-powered 3D asset generation and management system",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Assets", description: "Asset management endpoints" },
          {
            name: "Projects",
            description: "Project management and organization",
          },
          {
            name: "Users",
            description: "User profile and settings management",
          },
          {
            name: "Public Profiles",
            description:
              "Public user profile viewing (no authentication required)",
          },
          {
            name: "Achievements",
            description: "User achievements and medals system",
          },
          {
            name: "Admin",
            description: "Admin-only endpoints for user and system management",
          },
          {
            name: "Material Presets",
            description: "Material preset management",
          },
          {
            name: "Retexturing",
            description: "Asset retexturing and regeneration",
          },
          {
            name: "Generation",
            description: "AI-powered asset generation pipeline",
          },
          { name: "Sprites", description: "Sprite generation and management" },
          { name: "VRM", description: "VRM file upload and processing" },
          {
            name: "AI Vision",
            description: "GPT-4 Vision-powered weapon detection",
          },
          {
            name: "Voice Generation",
            description: "ElevenLabs text-to-speech for NPC dialogue",
          },
          {
            name: "Music Generation",
            description: "ElevenLabs AI music generation for game soundtracks",
          },
          {
            name: "Sound Effects",
            description: "ElevenLabs text-to-sound-effects for game audio",
          },
          {
            name: "Content Generation",
            description: "AI-powered NPC, quest, dialogue, and lore generation",
          },
          {
            name: "Vector Search",
            description: "Semantic search using Qdrant vector database",
          },
          {
            name: "Seed Data",
            description:
              "Generate interconnected game worlds with NPCs, quests, lore, and music",
          },
          {
            name: "Relationships",
            description: "Entity relationship management and graph queries",
          },
          {
            name: "World Configuration",
            description: "Master parameters for AI content generation",
          },
          {
            name: "CDN",
            description:
              "CDN publishing and health checks for stable asset delivery",
          },
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Privy access token (optional - some endpoints work without auth)",
            },
          },
        },
      },
    }),
  )

  // CORS configuration
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "*"
          : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    }),
  )

  // Middleware
  .use(errorHandler)
  .use(loggingMiddleware)
  .use(cachingMiddleware)
  .use(compression)

  // Cron jobs for background cleanup
  .use(
    cron({
      name: "cleanup-expired-jobs",
      pattern: "0 * * * *", // Every hour
      async run() {
        console.log("[Cron] Running job cleanup...");
        const expiredCount = await generationJobService.cleanupExpiredJobs();
        const failedCount = await generationJobService.cleanupOldFailedJobs();
        console.log(
          `[Cron] Cleaned up ${expiredCount} expired and ${failedCount} old failed jobs`,
        );
      },
    }),
  )

  // NOTE: /gdd-assets/* is NOT served from main app
  // Assets are published to and served from the CDN service
  // Database stores CDN URLs: asset.cdnUrl = https://cdn.../models/{id}/{file}

  .get("/temp-images/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "temp-images", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/temp-images/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "temp-images", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  })
  .get("/emotes/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/emotes", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/emotes/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/emotes", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "model/gltf-binary" },
    });
  })
  .get("/rigs/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/rigs", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/rigs/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/rigs", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "model/gltf-binary" },
    });
  })
  .get("/images/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/images", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/images/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/images", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  })
  .get("/prompts/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/prompts", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/prompts/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/prompts", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  })

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
      const { fetchWithTimeout } = await import("./utils/fetch-with-timeout");
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
      const contentType = response.headers.get("Content-Type") || "image/jpeg";

      // Only allow image content types
      if (!contentType.startsWith("image/")) {
        return new Response("URL does not point to an image", { status: 400 });
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
      console.error("Image proxy error:", error);
      return new Response(
        `Invalid URL or fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 400 },
      );
    }
  })

  // Routes
  .use(healthRoutes)
  .use(promptRoutes)
  .use(aiVisionRoutes)
  .use(usersRoutes)
  .use(userApiKeysRoutes)
  .use(achievementsRoutes)
  .use(adminRoutes)
  .use(projectsRoutes)
  .use(publicProfilesRoutes)
  .use(createAssetRoutes(ROOT_DIR, assetService))
  .use(createMaterialRoutes(ROOT_DIR))
  .use(createRetextureRoutes(ROOT_DIR, retextureService, ASSETS_DIR))
  .use(createGenerationRoutes(generationService))
  .use(playtesterSwarmRoutes)
  .use(voiceGenerationRoutes)
  .use(musicRoutes)
  .use(soundEffectsRoutes)
  .use(contentGenerationRoutes)
  .use(vectorSearchRoutes)
  .use(createSeedDataRoutes())
  .use(worldConfigRoutes)
  .use(generationQueueRoutes)
  .use(debugStorageRoute)
  .use(createCDNRoutes(ASSETS_DIR, CDN_URL))

  // Prometheus metrics endpoint (after all routes)
  .use(
    prometheus({
      metricsPath: "/metrics", // Prometheus scrape endpoint
    }),
  )

  // Enhanced metrics endpoint with business metrics
  .get("/metrics/business", async () => {
    const { getBusinessMetrics } = await import("./metrics/business");
    const metrics = await getBusinessMetrics();

    return new Response(metrics, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  })

  // Debug endpoint to verify security headers
  .get("/api/debug/headers", async ({ set, request }) => {
    const indexPath = path.join(ROOT_DIR, "dist", "index.html");
    const indexFile = Bun.file(indexPath);

    return {
      securityHeaders: {
        "Cross-Origin-Opener-Policy": set.headers["cross-origin-opener-policy"],
        "Cross-Origin-Embedder-Policy":
          set.headers["cross-origin-embedder-policy"],
        "X-Content-Type-Options": set.headers["x-content-type-options"],
        "X-Frame-Options": set.headers["x-frame-options"],
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: API_PORT,
        ROOT_DIR,
        cwd: process.cwd(),
      },
      frontend: {
        indexPath,
        indexExists: await indexFile.exists(),
        distExists: await Bun.file(path.join(ROOT_DIR, "dist")).exists(),
      },
      request: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
    };
  })

  // TEMPORARY: Debug endpoint to check paths
  .get("/api/admin/debug-paths", async () => {
    const assetsPath = ASSETS_DIR;
    const bowBasePath = path.join(assetsPath, "bow-base");
    const modelPath = path.join(bowBasePath, "model.glb");

    let files: string[] = [];
    let bowBaseFiles: string[] = [];

    // Helper to check if path exists (works for both files and directories)
    const pathExists = async (p: string): Promise<boolean> => {
      try {
        await fs.promises.access(p);
        return true;
      } catch {
        return false;
      }
    };

    try {
      files = await fs.promises.readdir(assetsPath);
      if (await pathExists(bowBasePath)) {
        bowBaseFiles = await fs.promises.readdir(bowBasePath);
      }
    } catch (e) {
      // ignore
    }

    const modelFile = Bun.file(modelPath);

    return {
      cwd: process.cwd(),
      __dirname,
      ROOT_DIR,
      gddAssetsPath: assetsPath,
      gddAssetsExists: await pathExists(assetsPath),
      bowBaseExists: await pathExists(bowBasePath),
      modelGlbExists: await modelFile.exists(),
      filesInGddAssets: files,
      filesInBowBase: bowBaseFiles,
    };
  })

  // TEMPORARY: Download assets from URL for populating Railway volume
  // TODO: Remove this after assets are uploaded
  .post("/api/admin/download-assets", async ({ body, headers }) => {
    const adminToken =
      process.env.ADMIN_UPLOAD_TOKEN || "temp-upload-secret-change-me";

    if (headers.authorization !== `Bearer ${adminToken}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const { url } = body as any;
      if (!url) {
        return { error: "No URL provided" };
      }

      const tarPath = path.join(ROOT_DIR, "gdd-assets.tar.gz");
      const assetsDir = ASSETS_DIR;

      console.log(`📥 Downloading from ${url}...`);

      // Download file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await Bun.write(tarPath, arrayBuffer);
      console.log(`📦 Saved tar file to ${tarPath}`);

      // Extract tar file
      const proc = Bun.spawn(
        ["tar", "-xzf", tarPath, "-C", path.join(ROOT_DIR)],
        {
          cwd: ROOT_DIR,
        },
      );
      await proc.exited;
      console.log(`✅ Extracted assets to ${assetsDir}`);

      // Clean up tar file
      await fs.promises.unlink(tarPath);

      return {
        success: true,
        message: "Assets downloaded and extracted successfully",
        path: assetsDir,
      };
    } catch (error) {
      console.error("Download error:", error);
      return {
        error: "Download failed",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  })

  // Serve built frontend assets (CSS, JS, images) - Bun-native
  // This must come BEFORE the SPA fallback to match first
  .get("/assets/*", async ({ params, set }) => {
    const filePath = path.join(ROOT_DIR, "dist", "assets", params["*"]);
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      set.status = 404;
      return new Response("Not Found", { status: 404 });
    }
    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  })
  .head("/assets/*", async ({ params }) => {
    const filePath = path.join(ROOT_DIR, "dist", "assets", params["*"]);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  })

  // SPA fallback - serve index.html for all non-API routes
  // This must be LAST to allow API routes and static assets to match first
  .get("/*", async ({ set }) => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      const file = Bun.file(indexPath);
      if (!(await file.exists())) {
        console.error(`❌ Frontend not found at: ${indexPath}`);
        console.error(`   Current working directory: ${process.cwd()}`);
        console.error(`   ROOT_DIR: ${ROOT_DIR}`);
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
      console.error("[GET /*] Error serving SPA:", error);
      set.status = 500;
      return new Response("Internal Server Error", { status: 500 });
    }
  })
  .head("/*", async () => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      const file = Bun.file(indexPath);

      if (!(await file.exists())) {
        console.warn(`[HEAD /*] Frontend not found at: ${indexPath}`);
        console.warn(`   Current working directory: ${process.cwd()}`);
        console.warn(`   ROOT_DIR: ${ROOT_DIR}`);
        return new Response(null, { status: 404 });
      }

      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (error) {
      console.error("[HEAD /*] Error checking SPA:", error);
      console.error(`   ROOT_DIR: ${ROOT_DIR}`);
      console.error(`   cwd: ${process.cwd()}`);
      console.error(
        `   Error details:`,
        error instanceof Error ? error.message : String(error),
      );
      return new Response(null, { status: 500 });
    }
  });

try {
  // Start server with production configuration
  app.listen({
    port: Number(API_PORT),
    hostname: "0.0.0.0", // Bind to all interfaces for Railway/Docker
    maxRequestBodySize: 100 * 1024 * 1024, // 100MB limit (below 128MB default)
    development: process.env.NODE_ENV !== "production", // Disable detailed errors in prod
  });

  console.log(
    `[Startup] Server listen() completed successfully on port ${API_PORT}`,
  );
} catch (error) {
  console.error("[Startup] FATAL: Failed to start server:", error);
  console.error(
    "[Startup] Error details:",
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
}

// Startup banner
console.log("\n" + "=".repeat(60));
console.log("🚀 ASSET-FORGE API SERVER - ELYSIA + BUN");
console.log("=".repeat(60));

// Server info
// Get public URL from environment
const publicUrl =
  process.env.RAILWAY_STATIC_URL ||
  process.env.RAILWAY_PUBLIC_DOMAIN ||
  process.env.PUBLIC_URL ||
  `http://0.0.0.0:${API_PORT}`;

console.log("\n📍 SERVER ENDPOINTS:");
console.log(`   🌐 Server:      ${publicUrl}`);
console.log(`   🎨 Frontend:    ${publicUrl}/`);
console.log(`   📊 Health:      ${publicUrl}/api/health`);
console.log(`   📚 API Docs:    ${publicUrl}/swagger`);
console.log(`   🖼️  CDN Assets:  ${CDN_URL}/models/`);
console.log(`   📁 Local Store: ${ASSETS_DIR}`);
console.log(`   🔄 Proxy:       ${publicUrl}/api/proxy/image`);
console.log(`   ✨ Performance: 22x faster than Express (2.4M req/s)`);

// Show environment info
if (process.env.NODE_ENV === "production") {
  console.log(`   🚀 Environment: Production (Railway)`);
} else {
  console.log(`   🔧 Environment: Development (Local)`);
}

// Configuration status
console.log("\n🔧 CONFIGURATION STATUS:");

const configs = [
  {
    name: "Database (PostgreSQL)",
    icon: "🗄️",
    key: "DATABASE_URL",
    enabled: !!process.env.DATABASE_URL,
  },
  {
    name: "Authentication (Privy)",
    icon: "🔐",
    key: "PRIVY_APP_ID",
    enabled: !!(process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET),
  },
  {
    name: "AI Gateway / OpenAI",
    icon: "🤖",
    key: "AI_GATEWAY_API_KEY",
    enabled: !!(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY),
  },
  {
    name: "3D Generation (Meshy)",
    icon: "🎨",
    key: "MESHY_API_KEY",
    enabled: !!process.env.MESHY_API_KEY,
  },
  {
    name: "Voice/Audio (ElevenLabs)",
    icon: "🎤",
    key: "ELEVENLABS_API_KEY",
    enabled: !!process.env.ELEVENLABS_API_KEY,
  },
  {
    name: "Vector Search (Qdrant)",
    icon: "🔍",
    key: "QDRANT_URL",
    enabled: !!process.env.QDRANT_URL,
  },
  {
    name: "Queue System (Redis)",
    icon: "⚡",
    key: "REDIS_URL",
    enabled: !!process.env.REDIS_URL,
    optional: true,
  },
  {
    name: "Image Hosting (Imgur)",
    icon: "📸",
    key: "IMGUR_CLIENT_ID",
    enabled: !!process.env.IMGUR_CLIENT_ID,
    optional: true,
  },
];

const configured = configs.filter((c) => c.enabled);
const missing = configs.filter((c) => !c.enabled && !c.optional);

configured.forEach((config) => {
  console.log(`   ✅ ${config.icon} ${config.name}`);
});

if (missing.length > 0) {
  console.log("\n⚠️  MISSING CONFIGURATION:");
  missing.forEach((config) => {
    console.log(`   ❌ ${config.icon} ${config.name}`);
    console.log(`      → Set ${config.key} in environment variables`);
  });
}

// Feature availability
console.log("\n🎯 AVAILABLE FEATURES:");
const features = [
  { name: "Asset Management", enabled: true },
  { name: "3D Generation Pipeline", enabled: !!process.env.MESHY_API_KEY },
  {
    name: "Content Generation (NPC/Quest/Lore)",
    enabled: !!(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY),
  },
  { name: "Voice Generation", enabled: !!process.env.ELEVENLABS_API_KEY },
  { name: "Music Generation", enabled: !!process.env.ELEVENLABS_API_KEY },
  { name: "Sound Effects", enabled: !!process.env.ELEVENLABS_API_KEY },
  { name: "Vector Search", enabled: !!process.env.QDRANT_URL },
  {
    name: "User Authentication",
    enabled: !!(process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET),
  },
  { name: "Image Proxy (CORS)", enabled: true },
  { name: "World Configuration", enabled: true },
];

features.forEach((feature) => {
  const status = feature.enabled ? "✅" : "❌";
  console.log(`   ${status} ${feature.name}`);
});

console.log("\n" + "=".repeat(60));
console.log(
  `✨ Server ready! Environment: ${process.env.NODE_ENV || "development"}`,
);
console.log("=".repeat(60) + "\n");

// Export app for Eden Treaty - suppress declaration emit warning about croner
// @ts-ignore TS2742 - croner module reference is non-portable but type inference works at runtime
export type App = typeof app;
export { app };
