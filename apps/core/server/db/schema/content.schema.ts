/**
 * Content Schema
 * AI-generated game content (NPCs, quests, dialogue, lore)
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { projects } from "./users.schema";

/**
 * NPCs table
 * Stores AI-generated NPC characters with complete data
 */
export const npcs = pgTable(
  "npcs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    name: varchar("name", { length: 255 }).notNull(),
    archetype: varchar("archetype", { length: 100 }).notNull(),

    // User tracking (optional - works without auth)
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Complete NPC data as JSON
    data: jsonb("data").notNull(),

    // Generation metadata
    generationParams: jsonb("generation_params").notNull().default({}),

    // Tags for searching/filtering
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

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
    nameIdx: index("idx_npcs_name").on(table.name),
    archetypeIdx: index("idx_npcs_archetype").on(table.archetype),
    createdByIdx: index("idx_npcs_created_by").on(table.createdBy),
    tagsIdx: index("idx_npcs_tags").using("gin", table.tags),
    deletedAtIdx: index("idx_npcs_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_npcs_project_id").on(table.projectId),
    isPublicIdx: index("idx_npcs_is_public").on(table.isPublic),
    viewCountIdx: index("idx_npcs_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    createdByDateIdx: index("idx_npcs_created_by_date").on(
      table.createdBy,
      table.createdAt.desc(),
    ),
    archetypeNameIdx: index("idx_npcs_archetype_name").on(
      table.archetype,
      table.name,
    ),
  }),
);

/**
 * Quests table
 * Stores AI-generated quest data
 */
export const quests = pgTable(
  "quests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    questType: varchar("quest_type", { length: 100 }).notNull(),
    difficulty: varchar("difficulty", { length: 50 }).notNull(),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Complete quest data as JSON
    data: jsonb("data").notNull(),

    // Generation metadata
    generationParams: jsonb("generation_params").notNull().default({}),

    // Tags for searching/filtering
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

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
    titleIdx: index("idx_quests_title").on(table.title),
    typeIdx: index("idx_quests_type").on(table.questType),
    difficultyIdx: index("idx_quests_difficulty").on(table.difficulty),
    createdByIdx: index("idx_quests_created_by").on(table.createdBy),
    tagsIdx: index("idx_quests_tags").using("gin", table.tags),
    deletedAtIdx: index("idx_quests_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_quests_project_id").on(table.projectId),
    isPublicIdx: index("idx_quests_is_public").on(table.isPublic),
    viewCountIdx: index("idx_quests_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    createdByDateIdx: index("idx_quests_created_by_date").on(
      table.createdBy,
      table.createdAt.desc(),
    ),
    difficultyTypeIdx: index("idx_quests_difficulty_type").on(
      table.difficulty,
      table.questType,
    ),
  }),
);

/**
 * Dialogues table
 * Stores AI-generated dialogue trees
 */
export const dialogues = pgTable(
  "dialogues",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    npcName: varchar("npc_name", { length: 255 }).notNull(),
    context: text("context"),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Dialogue nodes as JSON array
    nodes: jsonb("nodes").notNull(),

    // Generation metadata
    generationParams: jsonb("generation_params").notNull().default({}),

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
    npcNameIdx: index("idx_dialogues_npc_name").on(table.npcName),
    createdByIdx: index("idx_dialogues_created_by").on(table.createdBy),
    deletedAtIdx: index("idx_dialogues_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_dialogues_project_id").on(table.projectId),
    isPublicIdx: index("idx_dialogues_is_public").on(table.isPublic),
    viewCountIdx: index("idx_dialogues_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    createdByDateIdx: index("idx_dialogues_created_by_date").on(
      table.createdBy,
      table.createdAt.desc(),
    ),
  }),
);

/**
 * Lores table
 * Stores AI-generated world lore content
 */
export const lores = pgTable(
  "lores",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    summary: text("summary").notNull(),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Complete lore data as JSON
    data: jsonb("data").notNull(),

    // Generation metadata
    generationParams: jsonb("generation_params").notNull().default({}),

    // Tags for searching/filtering (includes relatedTopics)
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

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
    titleIdx: index("idx_lores_title").on(table.title),
    categoryIdx: index("idx_lores_category").on(table.category),
    createdByIdx: index("idx_lores_created_by").on(table.createdBy),
    tagsIdx: index("idx_lores_tags").using("gin", table.tags),
    deletedAtIdx: index("idx_lores_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_lores_project_id").on(table.projectId),
    isPublicIdx: index("idx_lores_is_public").on(table.isPublic),
    viewCountIdx: index("idx_lores_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    createdByDateIdx: index("idx_lores_created_by_date").on(
      table.createdBy,
      table.createdAt.desc(),
    ),
  }),
);

/**
 * Worlds table
 * Stores game world/setting information
 */
export const worlds = pgTable(
  "worlds",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    genre: varchar("genre", { length: 100 }).notNull(), // fantasy, sci-fi, modern, etc.

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // World data (geography, culture, history, magic system, etc.)
    data: jsonb("data").notNull(),

    // Tags for searching/filtering
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

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
    nameIdx: index("idx_worlds_name").on(table.name),
    genreIdx: index("idx_worlds_genre").on(table.genre),
    createdByIdx: index("idx_worlds_created_by").on(table.createdBy),
    deletedAtIdx: index("idx_worlds_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_worlds_project_id").on(table.projectId),
    isPublicIdx: index("idx_worlds_is_public").on(table.isPublic),
    viewCountIdx: index("idx_worlds_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    createdByDateIdx: index("idx_worlds_created_by_date").on(
      table.createdBy,
      table.createdAt.desc(),
    ),
  }),
);

/**
 * Locations table
 * Stores specific locations within worlds
 */
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // city, dungeon, wilderness, etc.
    worldId: uuid("world_id").references(() => worlds.id, {
      onDelete: "cascade",
    }),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // Location data (description, climate, inhabitants, resources, etc.)
    data: jsonb("data").notNull(),

    // Tags
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

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
    nameIdx: index("idx_locations_name").on(table.name),
    typeIdx: index("idx_locations_type").on(table.type),
    worldIdIdx: index("idx_locations_world_id").on(table.worldId),
    deletedAtIdx: index("idx_locations_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_locations_project_id").on(table.projectId),
    isPublicIdx: index("idx_locations_is_public").on(table.isPublic),
    viewCountIdx: index("idx_locations_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    worldIdTypeIdx: index("idx_locations_world_type").on(
      table.worldId,
      table.type,
    ),
  }),
);

/**
 * Entity Relationships table
 * Generic relationship system for linking any entities together
 */
export const entityRelationships = pgTable(
  "entity_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Source entity
    sourceType: varchar("source_type", { length: 50 }).notNull(), // npc, quest, lore, world, location, dialogue
    sourceId: uuid("source_id").notNull(),

    // Target entity
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: uuid("target_id").notNull(),

    // Relationship type and metadata
    relationshipType: varchar("relationship_type", { length: 100 }).notNull(), // mentions, requires, located_in, gives_quest, etc.
    strength: varchar("strength", { length: 20 }).default("medium"), // weak, medium, strong
    metadata: jsonb("metadata").default({}), // Additional context about the relationship

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sourceIdx: index("idx_relationships_source").on(
      table.sourceType,
      table.sourceId,
    ),
    targetIdx: index("idx_relationships_target").on(
      table.targetType,
      table.targetId,
    ),
    typeIdx: index("idx_relationships_type").on(table.relationshipType),
  }),
);

/**
 * Music Tracks table
 * Stores AI-generated or uploaded music for different contexts
 */
export const musicTracks = pgTable(
  "music_tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    mood: varchar("mood", { length: 100 }).notNull(), // epic, mysterious, peaceful, tense, etc.
    duration: varchar("duration", { length: 20 }),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Soft deletes (enables undo)
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by", { length: 255 }),

    // Usage analytics
    viewCount: integer("view_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

    // Visibility & discovery
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Project organization
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),

    // Versioning
    version: integer("version").notNull().default(1),
    parentId: uuid("parent_id"), // Self-reference for version history
    isTemplate: boolean("is_template").notNull().default(false),

    // AI cost tracking
    aiMetrics: jsonb("ai_metrics").default({}),

    // Quality & curation
    qualityScore: integer("quality_score"),
    isVerified: boolean("is_verified").notNull().default(false),

    // CDN storage (CDN-first architecture)
    cdnUrl: varchar("cdn_url", { length: 1024 }), // Full CDN URL for the music file

    // Music metadata
    data: jsonb("data").notNull(),

    // Tags
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    titleIdx: index("idx_music_title").on(table.title),
    moodIdx: index("idx_music_mood").on(table.mood),
    deletedAtIdx: index("idx_music_deleted_at").on(table.deletedAt),
    projectIdIdx: index("idx_music_project_id").on(table.projectId),
    isPublicIdx: index("idx_music_is_public").on(table.isPublic),
    viewCountIdx: index("idx_music_view_count").on(table.viewCount),
    // Composite indexes for query optimization
    moodPublicIdx: index("idx_music_mood_public").on(
      table.mood,
      table.isPublic,
    ),
  }),
);

// Type exports
export type NPC = typeof npcs.$inferSelect;
export type NewNPC = typeof npcs.$inferInsert;
export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type Dialogue = typeof dialogues.$inferSelect;
export type NewDialogue = typeof dialogues.$inferInsert;
export type Lore = typeof lores.$inferSelect;
export type NewLore = typeof lores.$inferInsert;
export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type EntityRelationship = typeof entityRelationships.$inferSelect;
export type NewEntityRelationship = typeof entityRelationships.$inferInsert;
export type MusicTrack = typeof musicTracks.$inferSelect;
export type NewMusicTrack = typeof musicTracks.$inferInsert;
