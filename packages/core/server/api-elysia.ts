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
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { serverTiming } from "@elysiajs/server-timing";
import { rateLimit } from "elysia-rate-limit";
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

// Plugins
import { securityHeaders } from "./plugins/security-headers";

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
import { adminRoutes } from "./routes/admin";
import { projectsRoutes } from "./routes/projects";
import { achievementsRoutes } from "./routes/achievements";
import { vectorSearchRoutes } from "./routes/vector-search";
import { createSeedDataRoutes } from "./routes/seed-data";
import { worldConfigRoutes } from "./routes/world-config";
import { generationQueueRoutes } from "./routes/generation-queue";
import { publicProfilesRoutes } from "./routes/public-profiles";

// Cron and job cleanup
import { cron } from "@elysiajs/cron";
import { generationJobService } from "./services/GenerationJobService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// Ensure temp-images directory exists
await fs.promises.mkdir(path.join(ROOT_DIR, "temp-images"), {
  recursive: true,
});

// Initialize Qdrant vector database (async)
import { initializeQdrantCollections } from "./db/qdrant";
await initializeQdrantCollections();

// Initialize default achievements
import { achievementService } from "./services/AchievementService";
await achievementService.initializeDefaultAchievements();

// Initialize services
// Railway uses PORT, but we fallback to API_PORT for local dev
const API_PORT = process.env.PORT || process.env.API_PORT || 3004;
const assetService = new AssetService(path.join(ROOT_DIR, "gdd-assets"));
const retextureService = new RetextureService({
  meshyApiKey: process.env.MESHY_API_KEY || "",
  imageServerBaseUrl:
    process.env.IMAGE_SERVER_URL || `http://localhost:${API_PORT}`,
});
const generationService = new GenerationService();

// Create Elysia app
// Type as 'any' to avoid non-portable croner package reference from @elysiajs/cron plugin
const app: any = new Elysia()
  // Performance monitoring
  .use(serverTiming())

  // Security headers for Privy embedded wallets (applied to ALL responses)
  .use(securityHeaders)

  // Rate limiting - protect against abuse
  .use(
    rateLimit({
      duration: 60000, // 1 minute window
      max: 100, // 100 requests per minute per IP
      errorResponse: {
        error: "Too Many Requests",
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

  // Static file serving using native Bun.file() for reliability
  // Bun.file() works better than @elysiajs/static on Railway
  // NOTE: HEAD request handlers removed due to Elysia 1.4.15 bug
  // Error: TypeError: undefined is not an object (evaluating '_res.headers.set')
  // HEAD requests will return 404, which is acceptable for our use case
  .get("/gdd-assets/*", async ({ params, set }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "gdd-assets", relativePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return new Response("File not found", { status: 404 });
    }

    // Wrap Bun.file() in Response for proper HEAD request handling
    return new Response(file);
  });
