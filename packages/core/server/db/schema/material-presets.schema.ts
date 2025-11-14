/**
 * Material Presets Schema
 * Stores material/texture presets for asset retexturing with user ownership
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  varchar,
  boolean,
  integer,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * Material Presets table for storing texture/material configurations
 * Replaces the static material-presets.json file
 * Supports both system presets and user-created custom materials
 */
export const materialPresets = pgTable(
  "material_presets",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    // Material name
    name: varchar("name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),

    // Prompt for AI texture generation
    stylePrompt: text("style_prompt").notNull(),

    // Description
    description: text("description"),

    // Category (metal, leather, wood, custom, etc.)
    category: varchar("category", { length: 100 }).notNull(),

    // Tier/level (1-11+)
    tier: integer("tier").notNull().default(1),

    // Color (hex code)
    color: varchar("color", { length: 7 }), // e.g., "#CD7F32"

    // System vs User materials
    isSystem: boolean("is_system").default(false).notNull(), // true = built-in, false = user-created

    // Is this material active/enabled?
    isActive: boolean("is_active").default(true).notNull(),

    // Visibility
    isPublic: boolean("is_public").default(false).notNull(), // true = shared with community, false = private

    // User ownership (null for system materials)
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "cascade",
    }),

    // Metadata (for extensibility - art style preferences, etc.)
    metadata: jsonb("metadata").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("material_presets_category_idx").on(table.category),
    tierIdx: index("material_presets_tier_idx").on(table.tier),
    createdByIdx: index("material_presets_created_by_idx").on(table.createdBy),
    isSystemIdx: index("material_presets_is_system_idx").on(table.isSystem),
    isActiveIdx: index("material_presets_is_active_idx").on(table.isActive),
  }),
);

export type MaterialPreset = typeof materialPresets.$inferSelect;
export type NewMaterialPreset = typeof materialPresets.$inferInsert;
