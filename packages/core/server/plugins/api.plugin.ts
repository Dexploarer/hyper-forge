/**
 * API Routes Plugin for Elysia
 * Aggregates all /api/* routes into a single plugin
 *
 * This plugin consolidates route registration for:
 * - User management (users, user-api-keys, achievements)
 * - Asset management (assets, materials, projects)
 * - AI generation (generation, retexture, ai-vision, prompts)
 * - Audio (voice-generation, music, sound-effects)
 * - Content generation (content-generation, seed-data, world-config, vector-search)
 * - Admin (admin, playtester-swarm, debug-storage, cdn, error-monitoring)
 *
 * By aggregating routes, we reduce api-elysia.ts from ~1200 lines to ~300 lines
 */

import { Elysia } from "elysia";
import path from "path";

// Import all route modules
import { usersRoutes } from "../routes/users";
import { userApiKeysRoutes } from "../routes/user-api-keys";
import { achievementsRoutes } from "../routes/achievements";
import { projectsRoutes } from "../routes/projects";
import { createAssetRoutes } from "../routes/assets";
import { materialRoutes } from "../routes/materials";
import { createRetextureRoutes } from "../routes/retexture";
import { createGenerationRoutes } from "../routes/generation";
import { aiVisionRoutes } from "../routes/ai-vision";
import { promptRoutes } from "../routes/prompts";
import { voiceGenerationRoutes } from "../routes/voice-generation";
import { musicRoutes } from "../routes/music";
import { soundEffectsRoutes } from "../routes/sound-effects";
import { contentGenerationRoutes } from "../routes/content-generation";
import { seedDataRoutes } from "../routes/seed-data";
import { worldConfigRoutes } from "../routes/world-config";
import { vectorSearchRoutes } from "../routes/vector-search";
import { adminRoutes } from "../routes/admin";
import { playtesterSwarmRoutes } from "../routes/playtester-swarm";
import { debugStorageRoute } from "../routes/debug-storage";
import { createCDNRoutes } from "../routes/cdn";
import { errorMonitoringRoutes } from "../routes/error-monitoring";

/**
 * API Plugin Configuration
 * Requires service instances that some routes depend on
 */
export interface ApiPluginConfig {
  /** Root directory for file operations */
  rootDir: string;
  /** Retexture service instance */
  retextureService: any;
  /** Generation service getter (lazy-loaded for memory optimization) */
  getGenerationService: () => import("../services/GenerationService").GenerationService;
  /** CDN URL for asset delivery */
  cdnUrl: string;
  /** Legacy assets directory (backward compatibility for retexture) */
  assetsDir?: string;
}

/**
 * Create API Routes Plugin
 * Aggregates all API routes with proper dependency injection
 */
export function createApiPlugin(config: ApiPluginConfig) {
  const { rootDir, retextureService, getGenerationService, cdnUrl, assetsDir } =
    config;

  // Assets directory
  const legacyAssetsDir =
    assetsDir ||
    (process.env.RAILWAY_VOLUME_MOUNT_PATH
      ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "assets-legacy")
      : path.join(rootDir, "assets-legacy"));

  return (
    new Elysia({ name: "api-routes" })
      // User management routes
      .use(usersRoutes)
      .use(userApiKeysRoutes)
      .use(achievementsRoutes)

      // Project and asset management
      .use(projectsRoutes)
      .use(createAssetRoutes(rootDir))
      .use(materialRoutes)

      // AI generation routes
      .use(createRetextureRoutes(rootDir, retextureService, legacyAssetsDir))
      .use(createGenerationRoutes(getGenerationService)) // Pass getter for lazy loading
      .use(aiVisionRoutes)
      .use(promptRoutes)

      // Audio generation routes
      .use(voiceGenerationRoutes)
      .use(musicRoutes)
      .use(soundEffectsRoutes)

      // Content generation routes
      .use(contentGenerationRoutes)
      .use(seedDataRoutes)
      .use(worldConfigRoutes)
      .use(vectorSearchRoutes)

      // Admin and utility routes
      .use(adminRoutes)
      .use(playtesterSwarmRoutes)
      .use(debugStorageRoute)
      .use(createCDNRoutes(cdnUrl))
      .use(errorMonitoringRoutes)
  );
}
