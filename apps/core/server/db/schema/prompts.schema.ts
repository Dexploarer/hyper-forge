/**
 * Prompts Schema
 * Stores AI generation prompts and templates with user ownership
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  varchar,
  boolean,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * Prompts table for storing AI generation templates
 * Replaces the static JSON files in /public/prompts
 * Supports both system prompts and user-created custom prompts
 */
export const prompts = pgTable(
  "prompts",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    // Prompt type/category
    type: varchar("type", { length: 100 }).notNull(), // e.g., 'generation', 'asset-type', 'game-style', 'material', etc.

    // Prompt name/key
    name: varchar("name", { length: 255 }).notNull(),

    // The actual prompt template or configuration
    content: jsonb("content").notNull(), // Flexible JSON structure for different prompt types

    // Optional description
    description: text("description"),

    // Version control
    version: varchar("version", { length: 50 }).default("1.0"),

    // System vs User prompts
    isSystem: boolean("is_system").default(false).notNull(), // true = built-in system prompt, false = user-created

    // Is this prompt active/enabled?
    isActive: boolean("is_active").default(true).notNull(),

    // Visibility
    isPublic: boolean("is_public").default(false).notNull(), // true = shared with community, false = private

    // User ownership (null for system prompts)
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "cascade",
    }),

    // Metadata
    metadata: jsonb("metadata").default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("prompts_type_idx").on(table.type),
    createdByIdx: index("prompts_created_by_idx").on(table.createdBy),
    isSystemIdx: index("prompts_is_system_idx").on(table.isSystem),
    isActiveIdx: index("prompts_is_active_idx").on(table.isActive),
  }),
);

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
