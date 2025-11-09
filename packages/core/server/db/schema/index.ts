/**
 * Database Schema Index
 * Exports all schema tables and types
 */

// Assets
export * from "./assets.schema";

// Content
export * from "./content.schema";

// Re-export everything for drizzle
import * as assetsSchema from "./assets.schema";
import * as contentSchema from "./content.schema";

export const schema = {
  ...assetsSchema,
  ...contentSchema,
};
