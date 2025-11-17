/**
 * Static Assets Schema
 * Tracks static application assets (emotes, rigs, images) on CDN
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Static Assets table for tracking CDN-hosted application assets
 * Replaces local file serving for /emotes, /rigs, /images
 */
export const staticAssets = pgTable(
  "static_assets",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    // Asset type
    type: varchar("type", { length: 50 }).notNull(), // 'emote', 'rig', 'image', 'animation'

    // File information
    fileName: varchar("file_name", { length: 255 }).notNull(),
    cdnUrl: varchar("cdn_url", { length: 1024 }).notNull(),
    fileSize: integer("file_size"), // in bytes

    // Category/subcategory for organization
    category: varchar("category", { length: 100 }), // e.g., 'character-animation', 'skeleton-point', 'ui-icon'
    subcategory: varchar("subcategory", { length: 100 }), // e.g., 'idle', 'walk', 'run' for animations

    // Description
    description: text("description"),

    // Metadata (tags, dimensions, etc.)
    metadata: jsonb("metadata").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("static_assets_type_idx").on(table.type),
    categoryIdx: index("static_assets_category_idx").on(table.category),
    fileNameIdx: index("static_assets_file_name_idx").on(table.fileName),
  }),
);

export type StaticAsset = typeof staticAssets.$inferSelect;
export type NewStaticAsset = typeof staticAssets.$inferInsert;
