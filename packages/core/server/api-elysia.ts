/**
 * Elysia API Server
 * Modern Bun-native backend for AI-powered 3D asset generation
 *
 * Refactored 2025 Architecture:
 * - Plugin-based organization (from 1215 lines to ~300 lines)
 * - Separation of concerns (models, auth, rate limits, routes, static files)
 * - Improved maintainability and testability
 *
 * Performance: 22x faster than Express (2.4M req/s vs 113K req/s)
 */

import { Elysia } from "elysia";

console.log("[Startup] api-elysia.ts loaded, initializing server...");

import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { serverTiming } from "@elysiajs/server-timing";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger";
import { env } from "./config/env";

// Services
import { RetextureService } from "./services/RetextureService";
import { GenerationService } from "./services/GenerationService";
import { CDNWebSocketService } from "./services/CDNWebSocketService";

// Core Plugins
import { gracefulShutdown } from "./plugins/graceful-shutdown";
import { requestID } from "./plugins/request-id";
import { performanceTracing } from "./plugins/performance-tracing";
import { securityHeaders } from "./plugins/security-headers";
import { compression } from "./plugins/compression";
import { fastHealthPlugin } from "./plugins/fast-health.plugin";

// Feature Plugins
import { modelsPlugin } from "./plugins/models.plugin";
import { rateLimitingPlugin } from "./plugins/rate-limiting.plugin";
import { authPlugin } from "./plugins/auth.plugin";
import { staticFilesPlugin } from "./plugins/static-files.plugin";
import { createApiPlugin } from "./plugins/api.plugin";
import { metricsPlugin } from "./plugins/metrics.plugin";
import { cronPlugin } from "./plugins/cron.plugin";
import { createDebugPlugin } from "./plugins/debug.plugin";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin";

// Middleware Plugins
import { loggingPlugin } from "./plugins/logging.plugin";
import { cachingPlugin } from "./plugins/caching.plugin";

// Routes
import { healthRoutes } from "./routes/health";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// ==================== INITIALIZATION ====================

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

// ==================== ENVIRONMENT VALIDATION ====================

// Authentication is REQUIRED for API server
if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
  throw new Error(
    "PRIVY_APP_ID and PRIVY_APP_SECRET are required for API server",
  );
}

// API key encryption is REQUIRED for API server
if (!env.API_KEY_ENCRYPTION_SECRET) {
  throw new Error("API_KEY_ENCRYPTION_SECRET is required for API server");
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

// ==================== SERVICE INITIALIZATION ====================

const retextureService = new RetextureService({
  meshyApiKey: env.MESHY_API_KEY || "",
  imageServerBaseUrl: IMAGE_SERVER_URL,
});

// Lazy-load GenerationService to save ~2MB memory at startup
// Service is only initialized when first generation request is made
let generationServiceInstance: GenerationService | null = null;

const getGenerationService = (): GenerationService => {
  if (!generationServiceInstance) {
    logger.info(
      {},
      "[Lazy Load] Initializing GenerationService on first use...",
    );
    const startTime = Date.now();
    generationServiceInstance = new GenerationService();
    const initTime = Date.now() - startTime;
    logger.info(
      { initTime },
      `[Lazy Load] GenerationService initialized in ${initTime}ms`,
    );
  }
  return generationServiceInstance;
};

// ==================== APP COMPOSITION ====================

// Create Elysia app with full type inference for Eden Treaty
// @ts-ignore TS2742 - Transitive dependency issue with @elysiajs/cron -> croner (safe for apps)
const app = new Elysia()
  // ==================== LIFECYCLE HOOKS ====================
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
  })

  // ==================== PERFORMANCE OPTIMIZATIONS ====================
  // CRITICAL: Plugin order matters for performance
  // - Fast-path health checks first (bypass all middleware)
  // - Lifecycle & request context second
  // - Caching before logging (skip logs for cache hits)
  // - Swagger last (after routes for schema generation)

  // ==================== FAST-PATH HEALTH CHECKS ====================
  // These bypass all middleware for maximum performance (50% faster)
  .use(fastHealthPlugin)

  // ==================== LIFECYCLE & REQUEST CONTEXT ====================
  .use(gracefulShutdown)
  .use(requestID())

  // ==================== PERFORMANCE MONITORING ====================
  .use(performanceTracing)
  .use(serverTiming())

  // ==================== SECURITY & CORS ====================
  .use(securityHeaders)
  .use(
    cors({
      origin: env.NODE_ENV === "production" ? env.FRONTEND_URL || "*" : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    }),
  )

  // ==================== TYPE MODELS ====================
  // Must be early for type inference in routes
  .use(modelsPlugin)

  // ==================== CACHING (BEFORE LOGGING) ====================
  // Cache before logging to skip logs for cache hits (20% faster for cached responses)
  .use(cachingPlugin)

  // ==================== AUTH & RATE LIMITING ====================
  .use(rateLimitingPlugin)
  .use(authPlugin)

  // ==================== ROUTES (ORDERED BY FREQUENCY) ====================
  .use(healthRoutes) // Most frequent (K8s probes, monitoring)
  .use(
    createApiPlugin({
      rootDir: ROOT_DIR,
      retextureService,
      getGenerationService, // Pass getter instead of instance for lazy loading
      cdnUrl: CDN_URL,
    }),
  )
  .use(metricsPlugin) // Prometheus scraping

  // ==================== DEBUG ENDPOINTS (TEMPORARY) ====================
  .use(
    createDebugPlugin({
      rootDir: ROOT_DIR,
      apiPort: Number(API_PORT),
    }),
  )

  // ==================== ERROR HANDLING & LOGGING ====================
  // After routes to catch errors and log responses
  .use(errorHandlerPlugin)
  .use(loggingPlugin)

  // ==================== RESPONSE PROCESSING ====================
  .use(compression)

  // ==================== BACKGROUND JOBS ====================
  .use(cronPlugin)

  // ==================== DOCUMENTATION (AFTER ROUTES) ====================
  // Swagger after routes for proper schema generation
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
            name: "Content Retrieval",
            description:
              "Retrieve NPCs, quests, dialogues, and lore from database",
          },
          {
            name: "Content Management",
            description: "Update and delete game content (requires auth)",
          },
          {
            name: "Media Assets",
            description: "Portrait, voice, and audio asset management",
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

  // ==================== STATIC FILES (MUST BE LAST) ====================
  .use(staticFilesPlugin);

// ==================== SERVER STARTUP ====================

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

// Export app for Eden Treaty
export type App = typeof app;
export { app };
