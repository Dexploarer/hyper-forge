/**
 * Media Assets Schema
 * Storage for generated media (portraits, voices, music files)
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Media Assets Table
 * Stores references to generated media files (portraits, voices, music)
 * Links media to entities (NPCs, quests, locations, etc.)
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Type of media: portrait, voice, music, sound_effect
    type: varchar("type", { length: 50 }).notNull(),

    // Entity this media belongs to
    entityType: varchar("entity_type", { length: 50 }), // npc, quest, location, etc.
    entityId: uuid("entity_id"),

    // File storage
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }),

    // Generation metadata
    metadata: jsonb("metadata")
      .$type<{
        prompt?: string;
        model?: string;
        voiceId?: string;
        voiceSettings?: Record<string, any>;
        imageSettings?: Record<string, any>;
        duration?: number; // for audio files
        mimeType?: string;
        fileSize?: number;
        [key: string]: any;
      }>()
      .default({}),

    // Tracking
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIdx: index("idx_media_assets_type").on(table.type),
    entityIdx: index("idx_media_assets_entity").on(
      table.entityType,
      table.entityId,
    ),
    createdByIdx: index("idx_media_assets_created_by").on(table.createdBy),
    // Composite indexes for query optimization
    entityTypeMediaTypeIdx: index("idx_media_entity_type_media_type").on(
      table.entityType,
      table.entityId,
      table.type,
    ),
  }),
);

// Export types
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
