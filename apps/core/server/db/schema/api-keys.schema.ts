/**
 * API Keys Schema
 * Stores user-generated API keys for programmatic access (AI agents, external tools)
 * Keys are hashed with SHA-256 before storage
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

/**
 * API Keys Table
 * Allows users to generate API keys for programmatic access alongside Privy JWT
 * Non-breaking addition: Existing Privy auth continues to work
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User who owns this API key
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // SHA-256 hash of the actual key (never store plaintext)
    keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),

    // Key prefix for display (e.g., "af_live_abc123...")
    // Shows first 16 chars so users can identify keys without seeing full key
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),

    // User-friendly name for the key
    name: varchar("name", { length: 255 }).notNull(),

    // Optional scoped permissions (future: restrict keys to specific endpoints)
    permissions: jsonb("permissions").$type<string[]>().default([]),

    // Optional custom rate limit for this key (NULL = use default)
    rateLimit: integer("rate_limit"),

    // Optional expiration date
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Track last usage for security monitoring
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    // Soft delete (NULL = active, timestamp = revoked)
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    // Index for finding keys by user
    userIdIdx: index("idx_api_keys_user_id").on(table.userId),

    // Index for fast key validation (most frequent query)
    keyHashIdx: index("idx_api_keys_key_hash").on(table.keyHash),

    // Index for cleanup queries (find expired/revoked keys)
    expiresAtIdx: index("idx_api_keys_expires_at").on(table.expiresAt),
  }),
);

// Export types
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
