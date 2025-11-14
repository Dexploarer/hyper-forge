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
import { logger } from "./utils/logger";
import { env } from "./config/env";

// Services
import { AssetService } from "./services/AssetService";
import { RetextureService } from "./services/RetextureService";
import { GenerationService } from "./services/GenerationService";
import { CDNWebSocketService } from "./services/CDNWebSocketService";

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
import { errorMonitoringRoutes } from "./routes/error-monitoring";

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
  logger.error(
    { err: error },
    "[Startup] Qdrant initialization failed (non-fatal):",
  );
});

// Initialize services
const API_PORT = env.PORT || env.API_PORT;

// DEPRECATED: Local asset storage - all assets are now on CDN
// Kept for backward compatibility with legacy code only
const ASSETS_DIR = env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(env.RAILWAY_VOLUME_MOUNT_PATH, "assets-legacy")
  : env.ASSETS_DIR || path.join(ROOT_DIR, "assets-legacy");

// Validate required environment variables for API server
// Note: Workers don't need these, so they're optional in env.ts schema

// Authentication is REQUIRED for API server
if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
  throw new Error(
    "PRIVY_APP_ID and PRIVY_APP_SECRET are required for API server. Workers don't need these.",
  );
}

// API key encryption is REQUIRED for API server
if (!env.API_KEY_ENCRYPTION_SECRET) {
  throw new Error(
    "API_KEY_ENCRYPTION_SECRET is required for API server. Workers don't need this.",
  );
}

// CDN_URL and IMAGE_SERVER_URL must be set in production
const CDN_URL =
  env.CDN_URL ||
  (() => {
    if (env.NODE_ENV === "production") {
      throw new Error("CDN_URL must be set in production environment");
    }
    throw new Error("CDN_URL must be set in development environment");
  })();

const IMAGE_SERVER_URL =
  env.IMAGE_SERVER_URL ||
  (() => {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
      );
    }
    throw new Error("IMAGE_SERVER_URL must be set in development environment");
  })();

const assetService = new AssetService(ASSETS_DIR);
const retextureService = new RetextureService({
  meshyApiKey: env.MESHY_API_KEY || "",
  imageServerBaseUrl: IMAGE_SERVER_URL,
});

// Initialize GenerationService with database repository
import { generationPipelineRepository } from "./repositories/GenerationPipelineRepository";
const generationService = new GenerationService({
  pipelineRepo: generationPipelineRepository,
});
// Note: GenerationService uses env vars for now - refactoring to user keys requires
// architectural changes due to stateful pipeline storage

// Create Elysia app with full type inference for Eden Treaty
// @ts-ignore TS2742 - croner module reference from cron plugin is non-portable (doesn't affect runtime)
const app = new Elysia()
  // ==================== LIFECYCLE HOOKS ====================
  // Optional: Start workers in same process if ENABLE_EMBEDDED_WORKERS=true
  // For production, use separate worker service on Railway (better isolation & scaling)
  .onStart(async () => {
    logger.info(
      { context: "Startup" },
      `Elysia server started on port ${API_PORT}`,
    );

    // Initialize WebSocket client to CDN (if configured)
    if (env.CDN_WS_URL && env.CDN_API_KEY) {
      logger.info({}, "[CDN WebSocket] Initializing connection to CDN...");
      const cdnWebSocket = new CDNWebSocketService(
        env.CDN_WS_URL,
        env.CDN_API_KEY,
      );

      // Connect to CDN WebSocket server
      cdnWebSocket.connect().catch((error) => {
        console.error(
          "[CDN WebSocket] Failed to connect (non-fatal):",
          error instanceof Error ? error.message : String(error),
        );
      });

      // Store in app context for shutdown
      (app as any).cdnWebSocket = cdnWebSocket;
    } else {
      console.log(
        "[CDN WebSocket] Skipped - CDN_WS_URL or CDN_API_KEY not configured",
      );
    }

    // Run startup health checks (after a brief delay to ensure server is ready)
    setTimeout(async () => {
      const { runStartupHealthCheck, testFrontendConnectivity } = await import(
        "./utils/startup-health-check"
      );

      const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : process.env.RAILWAY_STATIC_URL || `http://localhost:${API_PORT}`;

      try {
        // Test all API endpoints
        await runStartupHealthCheck(baseUrl);

        // Test frontend-to-backend connectivity
        await testFrontendConnectivity(baseUrl);
      } catch (error) {
        logger.error(
          { err: error },
          "[Startup] Health check failed (non-fatal):",
        );
      }
    }, 2000); // Wait 2 seconds for server to fully start

    // Check if we should run workers embedded in API process (dev mode)
    if (process.env.ENABLE_EMBEDDED_WORKERS === "true" && env.REDIS_URL) {
      const WORKER_CONCURRENCY = env.WORKER_CONCURRENCY || 2;
      logger.info(
        {},
        `[Workers] Starting ${WORKER_CONCURRENCY} embedded workers...`,
      );

      // Store worker references for cleanup
      const workers: GenerationWorker[] = [];
      for (let i = 0; i < WORKER_CONCURRENCY; i++) {
        const worker = new GenerationWorker(`embedded-${i + 1}`);
        worker.start();
        workers.push(worker);
      }

      // Store in app context for shutdown
      (app as any).workers = workers;
      logger.info(
        {},
        `[Workers] ${WORKER_CONCURRENCY} workers started successfully`,
      );
    } else {
      logger.info(
        {},
        "[Workers] Using separate worker service (production mode)",
      );
    }
  })
  .onStop(async (ctx) => {
    logger.info({}, "[Shutdown] Stopping Elysia server...");

    // Disconnect CDN WebSocket if it exists
    const cdnWebSocket = (ctx as any).cdnWebSocket as
      | CDNWebSocketService
      | undefined;
    if (cdnWebSocket) {
      logger.info({}, "[CDN WebSocket] Disconnecting...");
      cdnWebSocket.disconnect();
      logger.info({}, "[CDN WebSocket] Disconnected");
    }

    // Stop embedded workers if they exist
    const workers = (ctx as any).workers as GenerationWorker[] | undefined;
    if (workers && workers.length > 0) {
      logger.info(
        { context: "Workers" },
        `Stopping ${workers.length} embedded workers...`,
      );
      for (const worker of workers) {
        worker.stop();
      }
      logger.info({}, "[Workers] All workers stopped");
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

  // Global error handler with structured logging and database tracking
  .onError(async ({ code, error, set, request }) => {
    const requestId = request.headers.get("x-request-id") || "unknown";
    const { logger } = await import("./utils/logger");
    const { apiErrorRepository } = await import(
      "./repositories/ApiErrorRepository"
    );
    const { isApiError, determineErrorCategory } = await import("./errors");

    // Extract user ID from authorization header if present
    let userId: string | undefined;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        // Simple JWT decode to get user ID (don't verify, just extract)
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || payload.userId;
      } catch {
        // Ignore decode errors
      }
    }

    const pathname = new URL(request.url).pathname;
    const method = request.method;

    // Log error with structured logging
    logger.error(
      {
        err: error,
        code,
        requestId,
        path: pathname,
        method,
        userId,
      },
      "Request error",
    );

    // Track error in database (non-blocking)
    apiErrorRepository
      .logError({
        userId,
        requestId,
        endpoint: pathname,
        method,
        errorCode: isApiError(error) ? error.code : String(code),
        errorMessage: (error as any).message || String(error),
        errorStack: (error as any).stack || undefined,
        severity: code === "VALIDATION" ? "warning" : "error",
        category: determineErrorCategory(error),
        statusCode: typeof set.status === "number" ? set.status : 500,
        context: isApiError(error) ? error.context || {} : {},
        tags: [],
      })
      .catch((loggingError) => {
        logger.error({ err: loggingError }, "Failed to log error to database");
      });

    // Return standardized error response
    if (isApiError(error)) {
      set.status = error.statusCode;
      return {
        error: error.code,
        message: error.message,
        requestId,
        ...error.context,
      };
    }

    // Handle Elysia built-in errors
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "NOT_FOUND", message: "Resource not found", requestId };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "VALIDATION_ERROR", message: error.message, requestId };
    }

    // Default internal server error
    set.status = 500;
    return {
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      requestId,
      ...(env.NODE_ENV !== "production" && {
        stack: (error as any).stack || undefined,
      }),
    };
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
      max: 1000, // 1000 requests per minute per IP (increased for development)
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
      origin: env.NODE_ENV === "production" ? env.FRONTEND_URL || "*" : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    }),
  )

  // Middleware
  .use(errorHandler)
  .use(loggingMiddleware)
  .use(cachingMiddleware)
  .use(compression)

  // Admin-only rate limiting (stricter than public endpoints)
  .group("/api/admin", (app) =>
    app.use(
      rateLimit({
        duration: 60000, // 1 minute window
        max: 100, // 100 requests per minute for admin endpoints (increased for development)
        errorResponse: {
          error: "TOO_MANY_REQUESTS",
          message:
            "Admin endpoint rate limit exceeded. Please try again later.",
        } as any,
      }),
    ),
  )

  // Strict rate limiting for expensive AI endpoints
  .group("/api/generation", (app) =>
    app.use(
      rateLimit({
        duration: 60000, // 1 minute window
        max: 10, // Only 10 generation requests per minute
        errorResponse: {
          error: "TOO_MANY_REQUESTS",
          message:
            "Generation rate limit exceeded. Please wait before generating more assets.",
        } as any,
      }),
    ),
  )
  .group("/api/music", (app) =>
    app.use(
      rateLimit({
        duration: 60000,
        max: 20, // 20 music generations per minute
        errorResponse: {
          error: "TOO_MANY_REQUESTS",
          message:
            "Music generation rate limit exceeded. Please try again later.",
        } as any,
      }),
    ),
  )
  .group("/api/sfx", (app) =>
    app.use(
      rateLimit({
        duration: 60000,
        max: 30, // 30 SFX generations per minute
        errorResponse: {
          error: "TOO_MANY_REQUESTS",
          message:
            "Sound effect generation rate limit exceeded. Please try again later.",
        } as any,
      }),
    ),
  )
  .group("/api/voice", (app) =>
    app.use(
      rateLimit({
        duration: 60000,
        max: 20, // 20 voice generations per minute
        errorResponse: {
          error: "TOO_MANY_REQUESTS",
          message:
            "Voice generation rate limit exceeded. Please try again later.",
        } as any,
      }),
    ),
  )

  // Cron jobs for background cleanup
  .use(
    cron({
      name: "cleanup-expired-jobs",
      pattern: "0 * * * *", // Every hour
      async run() {
        logger.info({}, "[Cron] Running job cleanup...");
        const expiredCount = await generationJobService.cleanupExpiredJobs();
        const failedCount = await generationJobService.cleanupOldFailedJobs();
        logger.info(
          { expiredCount, failedCount },
          "Cleaned up expired and old failed jobs",
        );
      },
    }),
  )
  .use(
    cron({
      name: "aggregate-errors",
      pattern: "5 * * * *", // Every hour at :05 (offset to avoid collision)
      async run() {
        logger.info({}, "[Cron] Running error aggregation...");
        const { aggregateErrors } = await import("./cron/error-aggregation");
        try {
          const result = await aggregateErrors();
          logger.info(
            {
              totalAggregations: result.totalAggregations,
              inserted: result.inserted,
              updated: result.updated,
            },
            "Error aggregation completed",
          );
        } catch (error) {
          logger.error({ err: error }, "Error aggregation failed");
        }
      },
    }),
  )
  .use(
    cron({
      name: "cleanup-old-errors",
      pattern: "0 2 * * *", // Daily at 2 AM
      async run() {
        logger.info({}, "[Cron] Running error cleanup...");
        const { cleanupOldErrors, cleanupOldAggregations } = await import(
          "./cron/error-aggregation"
        );
        try {
          const errorsResult = await cleanupOldErrors();
          const aggsResult = await cleanupOldAggregations();
          logger.info(
            {
              errorsDeleted: errorsResult.deletedCount,
              aggregationsDeleted: aggsResult.deletedCount,
            },
            "Error cleanup completed",
          );
        } catch (error) {
          logger.error({ err: error }, "Error cleanup failed");
        }
      },
    }),
  )

  // NOTE: Media assets stored in gdd-assets volume
  // Serve media files (voice, music, sfx, portraits, banners) from Railway volume
  // Migration to CDN in progress - this endpoint provides fallback access
  .get("/gdd-assets/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    // Media files are stored at gdd-assets/, not assets-legacy/
    const GDD_ASSETS_DIR = env.RAILWAY_VOLUME_MOUNT_PATH
      ? path.join(env.RAILWAY_VOLUME_MOUNT_PATH, "gdd-assets")
      : env.ASSETS_DIR
        ? path.join(path.dirname(env.ASSETS_DIR), "gdd-assets")
        : path.join(ROOT_DIR, "gdd-assets");
    const filePath = path.join(GDD_ASSETS_DIR, relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(relativePath).toLowerCase();
    const contentType =
      ext === ".mp3"
        ? "audio/mpeg"
        : ext === ".wav"
          ? "audio/wav"
          : ext === ".ogg"
            ? "audio/ogg"
            : ext === ".png"
              ? "image/png"
              : "application/octet-stream";

    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  })
  .head("/gdd-assets/*", async ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    // Media files are stored at gdd-assets/, not assets-legacy/
    const GDD_ASSETS_DIR = env.RAILWAY_VOLUME_MOUNT_PATH
      ? path.join(env.RAILWAY_VOLUME_MOUNT_PATH, "gdd-assets")
      : env.ASSETS_DIR
        ? path.join(path.dirname(env.ASSETS_DIR), "gdd-assets")
        : path.join(ROOT_DIR, "gdd-assets");
    const filePath = path.join(GDD_ASSETS_DIR, relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response(null, { status: 404 });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(relativePath).toLowerCase();
    const contentType =
      ext === ".mp3"
        ? "audio/mpeg"
        : ext === ".wav"
          ? "audio/wav"
          : ext === ".ogg"
            ? "audio/ogg"
            : ext === ".png"
              ? "image/png"
              : "application/octet-stream";

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  })

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
      logger.error({ err: error }, "Image proxy error:");
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
  .use(errorMonitoringRoutes)

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
        NODE_ENV: env.NODE_ENV,
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
      legacyAssetsPath: assetsPath,
      legacyAssetsExists: await pathExists(assetsPath),
      bowBaseExists: await pathExists(bowBasePath),
      modelGlbExists: await modelFile.exists(),
      filesInLegacyAssets: files,
      filesInBowBase: bowBaseFiles,
    };
  })

  // TEMPORARY: Download assets from URL for populating Railway volume
  // TODO: Remove this after assets are uploaded
  .post("/api/admin/download-assets", async ({ body, headers }) => {
    // SECURITY: Admin token must be set in environment - no defaults
    const adminToken = process.env.ADMIN_UPLOAD_TOKEN;

    if (
      !adminToken ||
      adminToken === "CHANGEME_GENERATE_WITH_OPENSSL_RAND_HEX_32"
    ) {
      logger.error(
        {},
        "[Security] ADMIN_UPLOAD_TOKEN not configured or using default",
      );
      return new Response("Admin endpoint not configured", { status: 503 });
    }

    if (headers.authorization !== `Bearer ${adminToken}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const { url } = body as any;
      if (!url) {
        return { error: "No URL provided" };
      }

      const tarPath = path.join(ROOT_DIR, "assets-legacy.tar.gz");
      const assetsDir = ASSETS_DIR;

      logger.info({}, `📥 Downloading from ${url}...`);

      // Download file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await Bun.write(tarPath, arrayBuffer);
      logger.info({}, `📦 Saved tar file to ${tarPath}`);

      // Extract tar file
      const proc = Bun.spawn(
        ["tar", "-xzf", tarPath, "-C", path.join(ROOT_DIR)],
        {
          cwd: ROOT_DIR,
        },
      );
      await proc.exited;
      logger.info({}, `✅ Extracted assets to ${assetsDir}`);

      // Clean up tar file
      await fs.promises.unlink(tarPath);

      return {
        success: true,
        message: "Assets downloaded and extracted successfully",
        path: assetsDir,
      };
    } catch (error) {
      logger.error({ err: error }, "Download error:");
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

  // Handle HEAD request for root path first (Coinbase Wallet CORS check)
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

try {
  // Start server with production configuration
  app.listen({
    port: Number(API_PORT),
    hostname: "0.0.0.0", // Bind to all interfaces for Railway/Docker
    maxRequestBodySize: 100 * 1024 * 1024, // 100MB limit (below 128MB default)
    development: env.NODE_ENV !== "production", // Disable detailed errors in prod
  });

  const publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.RAILWAY_STATIC_URL || `http://localhost:${API_PORT}`;

  const nodeEnv = env.NODE_ENV || "development";

  // Log startup
  logger.info({}, `\n[Server] Asset-Forge API started (${nodeEnv})`);
  logger.info({ context: "Server" }, `Port: ${API_PORT}`);
  logger.info({ context: "Server" }, `URL: ${publicUrl}`);
  logger.info({ context: "Server" }, `Docs: ${publicUrl}/swagger`);

  // Log configured services
  const services = [];
  if (env.DATABASE_URL) services.push("PostgreSQL");
  if (env.PRIVY_APP_ID && env.PRIVY_APP_SECRET) services.push("Privy");
  if (env.AI_GATEWAY_API_KEY || env.OPENAI_API_KEY) services.push("AI");
  if (env.MESHY_API_KEY) services.push("Meshy");
  if (env.ELEVENLABS_API_KEY) services.push("ElevenLabs");
  if (env.QDRANT_URL) services.push("Qdrant");
  if (env.REDIS_URL) services.push("Redis");

  if (services.length > 0) {
    logger.info({ context: "Server" }, `Services: ${services.join(", ")}`);
  }

  logger.info({}, "");
} catch (error) {
  logger.error({ err: error }, "[Startup] FATAL: Failed to start server:");
  console.error(
    "[Startup] Error details:",
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
}

// Export app for Eden Treaty - suppress declaration emit warning about croner
// @ts-ignore TS2742 - croner module reference is non-portable but type inference works at runtime
export type App = typeof app;
export { app };
