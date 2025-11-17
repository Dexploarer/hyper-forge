/**
 * API Routes Plugin for Elysia
 * Aggregates standalone /api/* routes (routes that don't need config injection)
 *
 * Config-dependent routes (assets, retexture, generation, cdn) are registered
 * directly in api-elysia.ts for proper TypeScript type inference with Eden Treaty.
 */

import { Elysia } from "elysia";

// Standalone route modules (no config needed)
import { usersRoutes } from "../routes/users";
import { userApiKeysRoutes } from "../routes/user-api-keys";
import { achievementsRoutes } from "../routes/achievements";
import { projectsRoutes } from "../routes/projects";
import { materialRoutes } from "../routes/materials";
import { aiVisionRoutes } from "../routes/ai-vision";
import { promptRoutes } from "../routes/prompts";
import { voiceGenerationRoutes } from "../routes/voice-generation";
import { musicRoutes } from "../routes/music";
import { soundEffectsRoutes } from "../routes/sound-effects";
import { contentRoutes } from "../routes/content";
import { seedDataRoutes } from "../routes/seed-data";
import { worldConfigRoutes } from "../routes/world-config";
import { vectorSearchRoutes } from "../routes/vector-search";
import { adminRoutes } from "../routes/admin";
import { playtesterSwarmRoutes } from "../routes/playtester-swarm";
import { debugStorageRoute } from "../routes/debug-storage";
import { cdnAdminRoutes } from "../routes/cdn-admin";
import { errorMonitoringRoutes } from "../routes/error-monitoring";

/**
 * Standalone API Routes Plugin
 *
 * Aggregates all routes that don't require config injection.
 * Config-dependent routes (assets, retexture, generation, cdn) are
 * registered inline in api-elysia.ts to enable proper TypeScript type inference.
 *
 * This eliminates the factory function pattern that prevented TypeScript
 * from inferring the complete route tree for Eden Treaty.
 */
export const standaloneApiRoutes = new Elysia({ name: "standalone-api-routes" })
  // User management routes
  .use(usersRoutes)
  .use(userApiKeysRoutes)
  .use(achievementsRoutes)

  // Project and asset management
  .use(projectsRoutes)
  .use(materialRoutes)

  // AI vision and prompts
  .use(aiVisionRoutes)
  .use(promptRoutes)

  // Audio generation routes
  .use(voiceGenerationRoutes)
  .use(musicRoutes)
  .use(soundEffectsRoutes)

  // Content generation routes
  .use(contentRoutes)
  .use(seedDataRoutes)
  .use(worldConfigRoutes)
  .use(vectorSearchRoutes)

  // Admin and utility routes
  .use(adminRoutes)
  .use(playtesterSwarmRoutes)
  .use(debugStorageRoute)
  .use(cdnAdminRoutes)
  .use(errorMonitoringRoutes);
