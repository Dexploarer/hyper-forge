/**
 * Asset Variants Schema
 * Normalized storage for material/texture variants
 * Replaces JSONB variants array in assets table
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { assets } from "./assets.schema";
import { users } from "./users.schema";

/**
 * Asset variants table
 * One row per material variant of a base asset
 */
export const assetVariants = pgTable(
  "asset_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationship to base asset
    baseAssetId: uuid("base_asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    // Variant asset reference (the actual variant asset record)
    variantAssetId: uuid("variant_asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),

    // Material preset information
    presetId: varchar("preset_id", { length: 100 }).notNull(),
    presetName: varchar("preset_name", { length: 255 }).notNull(),
    presetCategory: varchar("preset_category", { length: 100 }),
    presetTier: varchar("preset_tier", { length: 50 }),
    presetColor: varchar("preset_color", { length: 50 }),

    // Generation tracking
    retextureTaskId: varchar("retexture_task_id", { length: 255 }),
    generationStatus: varchar("generation_status", { length: 50 })
      .notNull()
      .default("pending"),
    generationError: text("generation_error"),

    // Variant metadata
    stylePrompt: text("style_prompt"),
    metadata: jsonb("metadata").notNull().default({}),

    // Display order
    displayOrder: integer("display_order").notNull().default(0),

    // Visibility
    isActive: boolean("is_active").notNull().default(true),

    // Owner tracking (inherited from base asset)
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    // Indexes for efficient queries
    baseAssetIdx: index("idx_variants_base_asset").on(table.baseAssetId),
    variantAssetIdx: index("idx_variants_variant_asset").on(
      table.variantAssetId,
    ),
    ownerIdx: index("idx_variants_owner").on(table.ownerId),
    statusIdx: index("idx_variants_status").on(table.generationStatus),
    presetIdx: index("idx_variants_preset").on(table.presetId),
    baseOrderIdx: index("idx_variants_base_order").on(
      table.baseAssetId,
      table.displayOrder,
    ),
    retextureTaskIdx: index("idx_variants_retexture_task").on(
      table.retextureTaskId,
    ),

    // Unique constraint: one variant per preset per base asset
    uniquePresetPerAsset: unique("unique_variant_preset_per_asset").on(
      table.baseAssetId,
      table.presetId,
    ),

    // Check constraint: status must be valid
    validStatusCheck: check(
      "valid_generation_status",
      sql`${table.generationStatus} IN ('pending', 'processing', 'completed', 'failed')`,
    ),
  }),
);

/**
 * Variant statistics table
 * Aggregated stats for base assets (denormalized for performance)
 */
export const variantStatistics = pgTable(
  "variant_statistics",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Base asset reference
    baseAssetId: uuid("base_asset_id")
      .notNull()
      .unique()
      .references(() => assets.id, { onDelete: "cascade" }),

    // Counts
    totalVariants: integer("total_variants").notNull().default(0),
    completedVariants: integer("completed_variants").notNull().default(0),
    failedVariants: integer("failed_variants").notNull().default(0),
    activeVariants: integer("active_variants").notNull().default(0),

    // Timestamps
    lastVariantCreated: timestamp("last_variant_created", {
      withTimezone: true,
    }),
    lastVariantCompleted: timestamp("last_variant_completed", {
      withTimezone: true,
    }),

    // Auto-updated
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    baseAssetIdx: index("idx_variant_stats_base_asset").on(table.baseAssetId),
  }),
);

// Type exports
export type AssetVariant = typeof assetVariants.$inferSelect;
export type NewAssetVariant = typeof assetVariants.$inferInsert;
export type VariantStatistics = typeof variantStatistics.$inferSelect;
export type NewVariantStatistics = typeof variantStatistics.$inferInsert;
