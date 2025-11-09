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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

// Ensure temp-images directory exists
await fs.promises.mkdir(path.join(ROOT_DIR, "temp-images"), {
  recursive: true,
});

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
      },
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

  // Static file serving using native Bun.file() for reliability
  // Bun.file() works better than @elysiajs/static on Railway
  .get("/gdd-assets/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "gdd-assets", relativePath);
    return Bun.file(filePath);
  })
  .get("/temp-images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "temp-images", relativePath);
    return Bun.file(filePath);
  })
  .get("/emotes/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/emotes", relativePath);
    return Bun.file(filePath);
  })
  .get("/rigs/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/rigs", relativePath);
    return Bun.file(filePath);
  })
  .get("/images/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/images", relativePath);
    return Bun.file(filePath);
  })
  .get("/prompts/*", ({ params }) => {
    const relativePath = (params as any)["*"] || "";
    const filePath = path.join(ROOT_DIR, "public/prompts", relativePath);
    return Bun.file(filePath);
  })

  // Routes
  .use(healthRoutes)
  .use(promptRoutes)
  .use(aiVisionRoutes)
  .use(usersRoutes)
  .use(createAssetRoutes(ROOT_DIR, assetService))
  .use(createMaterialRoutes(ROOT_DIR))
  .use(createRetextureRoutes(ROOT_DIR, retextureService))
  .use(createGenerationRoutes(generationService))
  .use(playtesterSwarmRoutes)
  .use(voiceGenerationRoutes)
  .use(musicRoutes)
  .use(soundEffectsRoutes)
  .use(contentGenerationRoutes)

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
    const adminToken = process.env.ADMIN_UPLOAD_TOKEN || "temp-upload-secret-change-me";

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
      const proc = Bun.spawn(["tar", "-xzf", tarPath, "-C", path.join(ROOT_DIR)], {
        cwd: ROOT_DIR,
      });
      await proc.exited;
      console.log(`✅ Extracted assets to ${assetsDir}`);

      // Clean up tar file
      await fs.promises.unlink(tarPath);

      return {
        success: true,
        message: "Assets downloaded and extracted successfully",
        path: assetsDir
      };
    } catch (error) {
      console.error("Download error:", error);
      return {
        error: "Download failed",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  })

  // Serve built frontend assets (CSS, JS, images) - Bun-native
  .get("/assets/*", ({ params }) =>
    Bun.file(path.join(ROOT_DIR, "dist", "assets", params["*"]))
  )

  // SPA fallback - serve index.html for all non-API routes
  // This must be LAST to allow API routes and static assets to match first
  .get("/*", () => Bun.file(path.join(ROOT_DIR, "dist", "index.html")))

  // Start server
  .listen(API_PORT);

console.log(`🚀 Elysia Server running on http://localhost:${API_PORT}`);
console.log(`🎨 Frontend: http://localhost:${API_PORT}/`);
console.log(`📊 API Health: http://localhost:${API_PORT}/api/health`);
console.log(`📚 API Docs: http://localhost:${API_PORT}/swagger`);
console.log(`🖼️  Assets: http://localhost:${API_PORT}/gdd-assets/`);
console.log(`✨ Performance: 22x faster than Express!`);

if (!process.env.MESHY_API_KEY) {
  console.warn("⚠️  MESHY_API_KEY not found - retexturing will fail");
}
if (!process.env.AI_GATEWAY_API_KEY && !process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️  AI_GATEWAY_API_KEY or OPENAI_API_KEY required - image generation and prompt enhancement will fail",
  );
}
if (!process.env.ELEVENLABS_API_KEY) {
  console.warn(
    "⚠️  ELEVENLABS_API_KEY not found - voice, music, and sound effects generation will fail",
  );
}

export type App = typeof app;
