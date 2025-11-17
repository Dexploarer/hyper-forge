/**
 * Achievements & Medals Schema
 * Tracks user achievements and medals earned through gameplay
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
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";

/**
 * Achievements table
 * Defines all available achievements in the system
 */
export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Achievement identifier (unique, used for code references)
    code: varchar("code", { length: 100 }).notNull().unique(),

    // Display information
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    icon: varchar("icon", { length: 100 }), // Icon identifier (e.g., "trophy", "star", "medal")

    // Achievement type
    type: varchar("type", { length: 50 }).notNull().default("achievement"), // "achievement" | "medal" | "badge"
    category: varchar("category", { length: 50 }), // "generation", "social", "milestone", etc.

    // Rarity/Value
    rarity: varchar("rarity", { length: 50 }).notNull().default("common"), // "common", "rare", "epic", "legendary"
    points: integer("points").notNull().default(0), // Points awarded for earning this achievement

    // Progress tracking (for progressive achievements)
    maxProgress: integer("max_progress"), // If null, achievement is binary (earned/not earned)
    progressType: varchar("progress_type", { length: 50 }), // "count", "sum", "time", etc.

    // Metadata
    metadata: jsonb("metadata").notNull().default({}),

    // Visibility
    isActive: boolean("is_active").notNull().default(true),
    isHidden: boolean("is_hidden").notNull().default(false), // Hidden achievements don't show until earned

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    codeIdx: index("idx_achievements_code").on(table.code),
    typeIdx: index("idx_achievements_type").on(table.type),
    categoryIdx: index("idx_achievements_category").on(table.category),
    rarityIdx: index("idx_achievements_rarity").on(table.rarity),
    activeIdx: index("idx_achievements_active").on(table.isActive),
  }),
);

/**
 * User Achievements table
 * Tracks which achievements users have earned
 */
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User who earned the achievement
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Achievement earned
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    // Progress at time of earning (for progressive achievements)
    progress: integer("progress").notNull().default(0),

    // Metadata about how/when it was earned
    metadata: jsonb("metadata").notNull().default({}),

    // Timestamp when earned
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_user_achievements_user").on(table.userId),
    achievementIdx: index("idx_user_achievements_achievement").on(
      table.achievementId,
    ),
    userAchievementIdx: index("idx_user_achievements_unique").on(
      table.userId,
      table.achievementId,
    ),
    earnedIdx: index("idx_user_achievements_earned").on(table.earnedAt.desc()),
  }),
);

// Relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

// Type exports
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
