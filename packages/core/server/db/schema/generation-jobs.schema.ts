/**
 * Generation Jobs Schema
 * Persistent storage for 3D asset generation tasks
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * Generation jobs table
 * Stores state for long-running 3D asset generation pipelines
 */
export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Job identification
    pipelineId: varchar("pipeline_id", { length: 255 }).notNull().unique(),
    assetId: varchar("asset_id", { length: 255 }).notNull(),
    assetName: varchar("asset_name", { length: 255 }).notNull(),

    // Ownership (required - users must be authenticated to generate)
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    // Job configuration (stores the full PipelineConfig)
    config: jsonb("config").notNull(),

    // Job status: 'initializing' | 'processing' | 'completed' | 'failed'
    status: varchar("status", { length: 50 }).notNull().default("initializing"),

    // Overall progress (0-100)
    progress: integer("progress").notNull().default(0),

    // Individual stage results
    stages: jsonb("stages").notNull().default({}),

    // Aggregated results
    results: jsonb("results").notNull().default({}),

    // Final asset information (populated on completion)
    finalAsset: jsonb("final_asset"),

    // Error information (if failed)
    error: text("error"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Cleanup tracking
    expiresAt: timestamp("expires_at", { withTimezone: true }), // When this job can be cleaned up
  },
  (table) => ({
    pipelineIdIdx: index("idx_generation_jobs_pipeline").on(table.pipelineId),
    userIdIdx: index("idx_generation_jobs_user").on(table.userId),
    statusIdx: index("idx_generation_jobs_status").on(table.status),
    assetIdIdx: index("idx_generation_jobs_asset").on(table.assetId),
    createdAtIdx: index("idx_generation_jobs_created").on(table.createdAt),
    expiresAtIdx: index("idx_generation_jobs_expires").on(table.expiresAt),
    // Composite indexes for query optimization
    userStatusIdx: index("idx_generation_jobs_user_status").on(
      table.userId,
      table.status,
    ),
    userCreatedIdx: index("idx_generation_jobs_user_created").on(
      table.userId,
      table.createdAt.desc(),
    ),
  }),
);

// Type exports
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
