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
import { vectorSearchRoutes } from "./routes/vector-search";
import { createSeedDataRoutes } from "./routes/seed-data";
import { worldConfigRoutes } from "./routes/world-config";
import { generationQueueRoutes } from "./routes/generation-queue";

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
const app = new Elysia()
  // Performance monitoring
  .use(serverTiming())

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
  .get("/gdd-assets/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "gdd-assets", relativePath);
    return Bun.file(filePath);
  })
  .head("/gdd-assets/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "gdd-assets", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  })
  .get("/temp-images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "temp-images", relativePath);
    return Bun.file(filePath);
  })
  .head("/temp-images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "temp-images", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  })
  .get("/emotes/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/emotes", relativePath);
    return Bun.file(filePath);
  })
  .head("/emotes/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/emotes", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
      },
    });
  })
  .get("/rigs/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/rigs", relativePath);
    return Bun.file(filePath);
  })
  .head("/rigs/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/rigs", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
      },
    });
  })
  .get("/images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/images", relativePath);
    return Bun.file(filePath);
  })
  .head("/images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/images", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  })
  .get("/prompts/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/prompts", relativePath);
    return Bun.file(filePath);
  })
  .head("/prompts/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/prompts", relativePath);
    if (!fs.existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
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

      // Fetch external image
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Asset-Forge-Image-Proxy/1.0",
        },
      });

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
  .use(adminRoutes)
  .use(projectsRoutes)
  .use(createAssetRoutes(ROOT_DIR, assetService))
  .use(createMaterialRoutes(ROOT_DIR))
  .use(createRetextureRoutes(ROOT_DIR, retextureService))
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

  // TEMPORARY: Debug endpoint to check paths
  .get("/api/admin/debug-paths", async () => {
    const assetsPath = path.join(ROOT_DIR, "gdd-assets");
    const bowBasePath = path.join(assetsPath, "bow-base");
    const modelPath = path.join(bowBasePath, "model.glb");

    let files: string[] = [];
    let bowBaseFiles: string[] = [];

    try {
      files = await fs.promises.readdir(assetsPath);
      if (fs.existsSync(bowBasePath)) {
        bowBaseFiles = await fs.promises.readdir(bowBasePath);
      }
    } catch (e) {
      // ignore
    }

    return {
      cwd: process.cwd(),
      __dirname,
      ROOT_DIR,
      gddAssetsPath: assetsPath,
      gddAssetsExists: fs.existsSync(assetsPath),
      bowBaseExists: fs.existsSync(bowBasePath),
      modelGlbExists: fs.existsSync(modelPath),
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
      const assetsDir = path.join(ROOT_DIR, "gdd-assets");

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
  .get("/assets/*", ({ params }) => {
    const filePath = path.join(ROOT_DIR, "dist", "assets", params["*"]);
    if (!fs.existsSync(filePath)) {
      return new Response("Not Found", { status: 404 });
    }
    return Bun.file(filePath);
  })

  // SPA fallback - serve index.html for all non-API routes
  // This must be LAST to allow API routes and static assets to match first
  .get("/*", () => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      if (!fs.existsSync(indexPath)) {
        console.error(`❌ Frontend not found at: ${indexPath}`);
        console.error(`   Current working directory: ${process.cwd()}`);
        console.error(`   ROOT_DIR: ${ROOT_DIR}`);
        return new Response(
          "Frontend build not found. Please run 'bun run build'.",
          {
            status: 404,
          },
        );
      }
      return Bun.file(indexPath);
    } catch (error) {
      console.error("[GET /*] Error serving SPA:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  })

  // HEAD handler for SPA fallback - MUST be immediately after GET for proper routing
  // See: https://github.com/elysiajs/elysia/issues - Elysia v1.4.15 HEAD handling issue
  .head("/*", () => {
    try {
      const indexPath = path.join(ROOT_DIR, "dist", "index.html");
      if (!fs.existsSync(indexPath)) {
        return new Response(null, { status: 404 });
      }
      // Return successful HEAD response with content-type
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("[HEAD /*] Error checking SPA:", error);
      return new Response(null, { status: 500 });
    }
  })

  // Start server
  .listen(API_PORT);

// Startup banner
console.log("\n" + "=".repeat(60));
console.log("🚀 ASSET-FORGE API SERVER - ELYSIA + BUN");
console.log("=".repeat(60));

// Server info
console.log("\n📍 SERVER ENDPOINTS:");
console.log(`   🌐 Server:      http://localhost:${API_PORT}`);
console.log(`   🎨 Frontend:    http://localhost:${API_PORT}/`);
console.log(`   📊 Health:      http://localhost:${API_PORT}/api/health`);
console.log(`   📚 API Docs:    http://localhost:${API_PORT}/swagger`);
console.log(`   🖼️  Assets:      http://localhost:${API_PORT}/gdd-assets/`);
console.log(`   🔄 Proxy:       http://localhost:${API_PORT}/api/proxy/image`);
console.log(`   ✨ Performance: 22x faster than Express (2.4M req/s)`);

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

// Export with explicit type to avoid croner module reference issues
// @ts-ignore - Elysia + cron plugin creates non-portable type reference
export type App = typeof app;
export { app };
