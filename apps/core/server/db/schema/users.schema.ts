/**
 * Users & Projects Schema
 *
 * ⚠️ SINGLE-TEAM APPLICATION ARCHITECTURE ⚠️
 *
 * This application is designed for SINGLE-TEAM use only with NO access control:
 * - All users have full access to all data and features
 * - Authentication is OPTIONAL and used only for tracking who did what
 * - Role field (admin/member) is kept for organizational purposes ONLY
 * - ownerId/projectId fields are for organization ONLY, NOT access control
 * - isPublic defaults to true - everything is shared within the team
 *
 * If you need multi-team support with proper access control, you must:
 * 1. Add team/organization tables and relationships
 * 2. Implement proper permission checking in all routes
 * 3. Make authentication required (not optional)
 * 4. Filter all queries by team/organization membership
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * User role enum (kept for backward compatibility)
 * Everyone defaults to admin now
 */
export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);

/**
 * Users table (SIMPLIFIED)
 * All authentication fields optional - tracks users for organization only
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Privy authentication (OPTIONAL - nullable for single-team use)
    privyUserId: varchar("privy_user_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).unique(),
    walletAddress: varchar("wallet_address", { length: 255 }).unique(),

    // Profile (optional)
    displayName: varchar("display_name", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    discordUsername: varchar("discord_username", { length: 255 }),

    // Profile completion tracking (optional)
    profileCompleted: timestamp("profile_completed", { withTimezone: true }),

    // Role (default to admin for single-team use)
    role: userRoleEnum("role").notNull().default("admin"),

    // User preferences
    settings: jsonb("settings").notNull().default({}),

    // Encrypted API keys (user-provided for AI services)
    // These are encrypted using AES-256-GCM before storage
    meshyApiKey: text("meshy_api_key"), // Encrypted Meshy API key
    aiGatewayApiKey: text("ai_gateway_api_key"), // Encrypted Vercel AI Gateway key
    elevenLabsApiKey: text("elevenlabs_api_key"), // Encrypted ElevenLabs API key
    apiKeyIv: text("api_key_iv"), // Initialization vector for encryption

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => ({
    privyIdIdx: index("idx_users_privy_id").on(table.privyUserId),
    emailIdx: index("idx_users_email").on(table.email),
    walletIdx: index("idx_users_wallet").on(table.walletAddress),
  }),
);

/**
 * Projects table (SIMPLIFIED)
 * Organize assets into projects - no ownership restrictions
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Owner (OPTIONAL - just for organization, no restrictions)
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    // Status
    status: varchar("status", { length: 50 }).notNull().default("active"),

    // Visibility (REMOVED - everything is shared in single-team)
    isPublic: boolean("is_public").notNull().default(true),

    // Project settings and metadata
    settings: jsonb("settings").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    ownerIdx: index("idx_projects_owner").on(table.ownerId),
    statusIdx: index("idx_projects_status").on(table.status),
    ownerPublicIdx: index("idx_projects_owner_public").on(
      table.ownerId,
      table.isPublic,
    ),
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
    entityIdx: index("idx_activity_entity").on(
      table.entityType,
      table.entityId,
    ),
    actionIdx: index("idx_activity_action").on(table.action),
    createdIdx: index("idx_activity_created").on(table.createdAt.desc()),
    userTimelineIdx: index("idx_activity_user_timeline").on(
      table.userId,
      table.createdAt.desc(),
    ),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  activityLogs: many(activityLog),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
