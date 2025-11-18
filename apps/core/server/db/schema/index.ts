/**
 * Database Schema Index
 * Exports all schema tables and types
 */

// Users & Projects
export * from "./users.schema";

// Assets
export * from "./assets.schema";

// Content
export * from "./content.schema";

// Media
export * from "./media.schema";

// World Configuration
export * from "./world-config.schema";

// Generation Pipelines
export * from "./generation-pipelines.schema";

// Achievements
export * from "./achievements.schema";

// Asset Variants
export * from "./asset-variants.schema";

// API Errors
export * from "./api-errors.schema";

// API Keys
export * from "./api-keys.schema";

// Prompts
export * from "./prompts.schema";

// Material Presets
export * from "./material-presets.schema";

// Static Assets
export * from "./static-assets.schema";

// Re-export everything for drizzle
import * as usersSchema from "./users.schema";
import * as assetsSchema from "./assets.schema";
import * as contentSchema from "./content.schema";
import * as mediaSchema from "./media.schema";
import * as worldConfigSchema from "./world-config.schema";
import * as generationPipelinesSchema from "./generation-pipelines.schema";
import * as achievementsSchema from "./achievements.schema";
import * as assetVariantsSchema from "./asset-variants.schema";
import * as apiErrorsSchema from "./api-errors.schema";
import * as apiKeysSchema from "./api-keys.schema";
import * as promptsSchema from "./prompts.schema";
import * as materialPresetsSchema from "./material-presets.schema";
import * as staticAssetsSchema from "./static-assets.schema";

export const schema = {
  ...usersSchema,
  ...assetsSchema,
  ...contentSchema,
  ...mediaSchema,
  ...worldConfigSchema,
  ...generationPipelinesSchema,
  ...achievementsSchema,
  ...assetVariantsSchema,
  ...apiErrorsSchema,
  ...apiKeysSchema,
  ...promptsSchema,
  ...materialPresetsSchema,
  ...staticAssetsSchema,
};
