/**
 * Token Blocklist Schema
 * Simple JWT invalidation via blocklist
 * Tokens are added when users log out or when tokens are revoked
 */

import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Token Blocklist Table
 * Stores invalidated JWT token identifiers (jti claims)
 * Tokens are auto-cleaned after expiration
 */
export const tokenBlocklist = pgTable(
  "token_blocklist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Token identifier (jti claim from JWT or hash of token)
    tokenId: varchar("token_id", { length: 255 }).notNull().unique(),
    // User who owned this token (for audit)
    userId: uuid("user_id"),
    // Reason for blocklisting
    reason: varchar("reason", { length: 100 }),
    // When the token was blocklisted
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // When the original token expires (for cleanup)
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    // Note: tokenId already has a unique constraint which creates an index automatically
    // Only add index for expiresAt which is used for cleanup queries
    index("idx_token_blocklist_expires_at").on(table.expiresAt),
  ],
);

export type TokenBlocklistEntry = typeof tokenBlocklist.$inferSelect;
export type NewTokenBlocklistEntry = typeof tokenBlocklist.$inferInsert;
