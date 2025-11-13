/**
 * Assets Schema
 * 3D asset management and metadata
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  bigint,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { projects } from "./users.schema";

/**
 * Assets table
 * Links file-based assets to database records with metadata
 */
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Asset identification
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 100 }).notNull(), // character, item, environment, equipment
    subtype: varchar("subtype", { length: 100 }), // sword, axe, helmet, etc.
    category: varchar("category", { length: 100 }),

    // Ownership (for organization, not access control)
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    gameId: uuid("game_id"), // Optional game/project association

    // File storage (paths relative to gdd-assets directory)
    filePath: varchar("file_path", { length: 512 }), // e.g., "asset-id/model.glb"
    fileSize: bigint("file_size", { mode: "number" }),
    fileType: varchar("file_type", { length: 100 }),
    thumbnailPath: varchar("thumbnail_path", { length: 512 }),
    conceptArtPath: varchar("concept_art_path", { length: 512 }), // Generated concept art
    hasConceptArt: boolean("has_concept_art").default(false),
    riggedModelPath: varchar("rigged_model_path", { length: 512 }), // Rigged/animated model

    // Generation metadata
    prompt: text("prompt"),
    detailedPrompt: text("detailed_prompt"), // Enhanced prompt with details
    negativePrompt: text("negative_prompt"),
    modelUsed: varchar("model_used", { length: 255 }),
    generationParams: jsonb("generation_params").notNull().default({}),
    workflow: varchar("workflow", { length: 100 }), // text-to-3d, image-to-3d, etc.
    meshyTaskId: varchar("meshy_task_id", { length: 255 }), // Meshy API task ID
    generatedAt: timestamp("generated_at", { withTimezone: true }), // When generation completed

    // Asset properties
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),

    // Versioning and variants
    version: integer("version").notNull().default(1),
    parentAssetId: uuid("parent_asset_id").references((): any => assets.id, {
      onDelete: "set null",
    }),
    isBaseModel: boolean("is_base_model").default(false), // Is this a base model for variants?
    isVariant: boolean("is_variant").default(false), // Is this a variant of another asset?
    parentBaseModel: uuid("parent_base_model").references(
      (): any => assets.id,
      {
        onDelete: "set null",
      },
    ), // Reference to base model for variants
    variants: jsonb("variants").$type<string[]>().default([]), // Array of variant asset IDs
    variantCount: integer("variant_count").default(0), // Number of variants created
    lastVariantGenerated: timestamp("last_variant_generated", {
      withTimezone: true,
    }), // Last variant creation time

    // Status: 'draft' | 'processing' | 'completed' | 'failed' | 'approved' | 'published' | 'archived'
    status: varchar("status", { length: 50 }).notNull().default("draft"),

    // Visibility: 'private' | 'public'
    visibility: varchar("visibility", { length: 50 })
      .notNull()
      .default("private"),

    // Export tracking
    exportedToRepo: timestamp("exported_to_repo", { withTimezone: true }),
    manifestPath: varchar("manifest_path", { length: 512 }), // Path in assets repo manifest

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => ({
    ownerIdx: index("idx_assets_owner").on(table.ownerId),
    projectIdx: index("idx_assets_project").on(table.projectId),
    gameIdx: index("idx_assets_game").on(table.gameId),
    typeIdx: index("idx_assets_type").on(table.type),
    statusIdx: index("idx_assets_status").on(table.status),
    tagsIdx: index("idx_assets_tags").using("gin", table.tags),
    ownerStatusIdx: index("idx_assets_owner_status").on(
      table.ownerId,
      table.status,
    ),
    projectTypeIdx: index("idx_assets_project_type").on(
      table.projectId,
      table.type,
    ),
    filePathIdx: index("idx_assets_file_path").on(table.filePath),
    // Additional composite indexes for query optimization
    ownerCreatedIdx: index("idx_assets_owner_created").on(
      table.ownerId,
      table.createdAt.desc(),
    ),
    typeStatusIdx: index("idx_assets_type_status").on(table.type, table.status),
    projectStatusIdx: index("idx_assets_project_status").on(
      table.projectId,
      table.status,
    ),
  }),
);

// Type exports
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
