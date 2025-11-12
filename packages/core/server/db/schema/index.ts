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

// Generation Jobs
export * from "./generation-jobs.schema";

// Achievements
export * from "./achievements.schema";

// Re-export everything for drizzle
import * as usersSchema from "./users.schema";
import * as assetsSchema from "./assets.schema";
import * as contentSchema from "./content.schema";
import * as mediaSchema from "./media.schema";
import * as worldConfigSchema from "./world-config.schema";
import * as generationJobsSchema from "./generation-jobs.schema";
import * as achievementsSchema from "./achievements.schema";

export const schema = {
  ...usersSchema,
  ...assetsSchema,
  ...contentSchema,
  ...mediaSchema,
  ...worldConfigSchema,
  ...generationJobsSchema,
  ...achievementsSchema,
};
