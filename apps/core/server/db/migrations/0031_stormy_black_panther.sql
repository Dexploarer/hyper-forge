DROP INDEX IF EXISTS "idx_dialogues_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_dialogues_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_dialogues_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_dialogues_created_by_date";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_locations_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_locations_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_locations_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_lores_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_lores_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_lores_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_lores_created_by_date";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_music_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_music_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_music_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_music_mood_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_npcs_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_npcs_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_npcs_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_npcs_created_by_date";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_quests_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_quests_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_quests_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_quests_created_by_date";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_worlds_deleted_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_worlds_is_public";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_worlds_view_count";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_worlds_created_by_date";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "is_public" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "privy_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "visibility" SET DEFAULT 'public';--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN IF EXISTS "is_verified";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "deleted_at";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "deleted_by";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "view_count";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "favorite_count";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "last_viewed_at";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "version";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "is_template";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "quality_score";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN IF EXISTS "is_verified";