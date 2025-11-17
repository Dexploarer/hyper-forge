/**
 * Generation Pipelines Schema
 * Persistent storage for AI generation pipeline state
 * Replaces in-memory Map storage in GenerationService
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
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { assets } from "./assets.schema";

/**
 * Pipeline status enum
 */
export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "initializing",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * Pipeline stage status enum
 */
export const stageStatusEnum = pgEnum("stage_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "skipped",
]);

/**
 * Generation pipelines table
 * Tracks AI generation jobs with full state persistence
 */
export const generationPipelines = pgTable(
  "generation_pipelines",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Ownership
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Asset association (nullable until asset is created)
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),

    // Pipeline configuration (validated JSON)
    config: jsonb("config").notNull(),

    // Overall status
    status: pipelineStatusEnum("status").notNull().default("initializing"),
    progress: integer("progress").notNull().default(0),

    // Stage tracking (normalized)
    currentStage: varchar("current_stage", { length: 100 }),

    // Error tracking
    error: text("error"),
    errorStage: varchar("error_stage", { length: 100 }),
    errorDetails: jsonb("error_details"),

    // Results storage (temporary until asset is created)
    results: jsonb("results").notNull().default({}),

    // External service IDs for tracking
    meshyTaskId: varchar("meshy_task_id", { length: 255 }),
    riggingTaskId: varchar("rigging_task_id", { length: 255 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Auto-cleanup tracking
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("idx_pipelines_user").on(table.userId),
    assetIdx: index("idx_pipelines_asset").on(table.assetId),
    statusIdx: index("idx_pipelines_status").on(table.status),
    createdIdx: index("idx_pipelines_created").on(table.createdAt.desc()),
    expiresIdx: index("idx_pipelines_expires").on(table.expiresAt),
    userStatusIdx: index("idx_pipelines_user_status").on(
      table.userId,
      table.status,
    ),
    meshyTaskIdx: index("idx_pipelines_meshy_task").on(table.meshyTaskId),
  }),
);

/**
 * Pipeline stages table
 * Normalized stage tracking for detailed monitoring
 */
export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Pipeline association
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => generationPipelines.id, { onDelete: "cascade" }),

    // Stage identification
    stageName: varchar("stage_name", { length: 100 }).notNull(),
    stageOrder: integer("stage_order").notNull(),

    // Status
    status: stageStatusEnum("status").notNull().default("pending"),
    progress: integer("progress").notNull().default(0),

    // Results and errors
    result: jsonb("result"),
    error: text("error"),
    errorDetails: jsonb("error_details"),

    // Timing
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    duration: integer("duration"), // Duration in milliseconds

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pipelineIdx: index("idx_stages_pipeline").on(table.pipelineId),
    statusIdx: index("idx_stages_status").on(table.status),
    pipelineOrderIdx: index("idx_stages_pipeline_order").on(
      table.pipelineId,
      table.stageOrder,
    ),
  }),
);

// Type exports
export type GenerationPipeline = typeof generationPipelines.$inferSelect;
export type NewGenerationPipeline = typeof generationPipelines.$inferInsert;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type NewPipelineStage = typeof pipelineStages.$inferInsert;
