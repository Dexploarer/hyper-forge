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

// Re-export everything for drizzle
import * as usersSchema from "./users.schema";
import * as assetsSchema from "./assets.schema";
import * as contentSchema from "./content.schema";

export const schema = {
  ...usersSchema,
  ...assetsSchema,
  ...contentSchema,
};
