/**
 * Drizzle-TypeBox Schema Conversion Utilities
 *
 * Converts Drizzle ORM schemas to TypeBox schemas for Elysia validation.
 * This eliminates duplicate type definitions - define once in Drizzle, use everywhere.
 *
 * Usage:
 *   import { UserInsertSchema, UserSelectSchema, spread } from './typebox-schemas'
 *
 *   .post('/users', handler, {
 *     body: UserInsertSchema,
 *     response: UserSelectSchema
 *   })
 *
 * IMPORTANT: To avoid TypeScript infinite type instantiation errors,
 * always declare TypeBox schemas as separate variables before using in Elysia.
 *
 * @see https://elysiajs.com/integrations/drizzle
 */

import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import type { TObject } from "@sinclair/typebox";
import { t } from "elysia";

// Import Drizzle schemas
import { users, projects, activityLog } from "./schema/users.schema";
import { assets } from "./schema/assets.schema";
import { apiKeys } from "./schema/api-keys.schema";
import { prompts } from "./schema/prompts.schema";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Spread utility - extracts TypeBox properties as plain object
 * Use this to pick specific fields from a schema
 *
 * @example
 * body: t.Object({
 *   ...spread(UserInsertSchema, ['displayName', 'email']),
 *   customField: t.String()
 * })
 */
export function spread<T extends TObject>(
  schema: T,
  keys: (keyof T["properties"])[],
): Partial<T["properties"]> {
  const result: Partial<T["properties"]> = {};
  for (const key of keys) {
    if (key in schema.properties) {
      result[key] = schema.properties[key];
    }
  }
  return result;
}

/**
 * Spreads all properties from a schema
 *
 * @example
 * body: t.Object({
 *   ...spreads(UserInsertSchema)
 * })
 */
export function spreads<T extends TObject>(schema: T): T["properties"] {
  return schema.properties;
}

// ============================================================================
// USER SCHEMAS
// ============================================================================

/** Schema for inserting a new user */
export const UserInsertSchema = createInsertSchema(users, {
  // Add email format validation
  email: t.Optional(t.String({ format: "email" })),
  // Ensure wallet addresses are lowercase
  walletAddress: t.Optional(t.String({ minLength: 42, maxLength: 42 })),
});

/** Schema for selecting/returning a user */
export const UserSelectSchema = createSelectSchema(users);

/** Schema for user profile updates */
export const UserProfileUpdateSchema = t.Object({
  displayName: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email" }),
  discordUsername: t.Optional(t.String({ maxLength: 255 })),
});

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

/** Schema for inserting a new project */
export const ProjectInsertSchema = createInsertSchema(projects, {
  name: t.String({ minLength: 1, maxLength: 255 }),
});

/** Schema for selecting/returning a project */
export const ProjectSelectSchema = createSelectSchema(projects);

// ============================================================================
// ACTIVITY LOG SCHEMAS
// ============================================================================

/** Schema for inserting activity log entries */
export const ActivityLogInsertSchema = createInsertSchema(activityLog);

/** Schema for selecting activity log entries */
export const ActivityLogSelectSchema = createSelectSchema(activityLog);

// ============================================================================
// ASSET SCHEMAS
// ============================================================================

/** Schema for inserting a new asset */
export const AssetInsertSchema = createInsertSchema(assets, {
  name: t.String({ minLength: 1, maxLength: 255 }),
});

/** Schema for selecting/returning an asset */
export const AssetSelectSchema = createSelectSchema(assets);

// ============================================================================
// API KEY SCHEMAS
// ============================================================================

/** Schema for inserting a new API key */
export const ApiKeyInsertSchema = createInsertSchema(apiKeys, {
  name: t.String({ minLength: 1, maxLength: 255 }),
});

/** Schema for selecting API keys */
export const ApiKeySelectSchema = createSelectSchema(apiKeys);

// ============================================================================
// PROMPT SCHEMAS
// ============================================================================

/** Schema for inserting prompts */
export const PromptInsertSchema = createInsertSchema(prompts);

/** Schema for selecting prompts */
export const PromptSelectSchema = createSelectSchema(prompts);

// ============================================================================
// TYPE EXPORTS (inferred from TypeBox schemas)
// ============================================================================

import type { Static } from "@sinclair/typebox";

export type UserInsert = Static<typeof UserInsertSchema>;
export type UserSelect = Static<typeof UserSelectSchema>;
export type ProjectInsert = Static<typeof ProjectInsertSchema>;
export type ProjectSelect = Static<typeof ProjectSelectSchema>;
export type AssetInsert = Static<typeof AssetInsertSchema>;
export type AssetSelect = Static<typeof AssetSelectSchema>;
export type ApiKeyInsert = Static<typeof ApiKeyInsertSchema>;
export type ApiKeySelect = Static<typeof ApiKeySelectSchema>;
