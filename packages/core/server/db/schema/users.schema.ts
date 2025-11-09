/**
 * Users & Projects Schema
 * Simple user and project management - no restrictive auth
 * If you have dashboard access, you're an admin
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Users table
 * Tracks users for organization purposes - not for access control
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Privy authentication (optional)
    privyUserId: varchar("privy_user_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Profile
    displayName: varchar("display_name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    discordUsername: varchar("discord_username", { length: 255 }),

    // Profile completion tracking
    profileCompleted: timestamp("profile_completed", { withTimezone: true }),

    // Role (always admin if they have dashboard access)
    role: varchar("role", { length: 50 }).notNull().default("member"),

    // User preferences
    settings: jsonb("settings").notNull().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => ({
    privyIdIdx: index("idx_users_privy_id").on(table.privyUserId),
    emailIdx: index("idx_users_email").on(table.email),
    walletIdx: index("idx_users_wallet").on(table.walletAddress),
  }),
);

/**
 * Projects table
 * Organize assets into projects for better management
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Owner (no restrictions, just for organization)
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Status
    status: varchar("status", { length: 50 }).notNull().default("active"),

    // Project settings and metadata
    settings: jsonb("settings").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    ownerIdx: index("idx_projects_owner").on(table.ownerId),
    statusIdx: index("idx_projects_status").on(table.status),
  }),
);

/**
 * Activity Log table
 * Track user actions for debugging and analytics
 */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User who performed the action
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // What was affected
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),

    // What happened
    action: varchar("action", { length: 100 }).notNull(),
    details: jsonb("details").notNull().default({}),

    // Request metadata
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 512 }),

    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_activity_user").on(table.userId),
    entityIdx: index("idx_activity_entity").on(table.entityType, table.entityId),
    actionIdx: index("idx_activity_action").on(table.action),
    createdIdx: index("idx_activity_created").on(table.createdAt.desc()),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
