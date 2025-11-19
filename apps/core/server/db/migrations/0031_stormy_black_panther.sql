DROP INDEX "idx_dialogues_deleted_at";--> statement-breakpoint
DROP INDEX "idx_dialogues_is_public";--> statement-breakpoint
DROP INDEX "idx_dialogues_view_count";--> statement-breakpoint
DROP INDEX "idx_dialogues_created_by_date";--> statement-breakpoint
DROP INDEX "idx_locations_deleted_at";--> statement-breakpoint
DROP INDEX "idx_locations_is_public";--> statement-breakpoint
DROP INDEX "idx_locations_view_count";--> statement-breakpoint
DROP INDEX "idx_lores_deleted_at";--> statement-breakpoint
DROP INDEX "idx_lores_is_public";--> statement-breakpoint
DROP INDEX "idx_lores_view_count";--> statement-breakpoint
DROP INDEX "idx_lores_created_by_date";--> statement-breakpoint
DROP INDEX "idx_music_deleted_at";--> statement-breakpoint
DROP INDEX "idx_music_is_public";--> statement-breakpoint
DROP INDEX "idx_music_view_count";--> statement-breakpoint
DROP INDEX "idx_music_mood_public";--> statement-breakpoint
DROP INDEX "idx_npcs_deleted_at";--> statement-breakpoint
DROP INDEX "idx_npcs_is_public";--> statement-breakpoint
DROP INDEX "idx_npcs_view_count";--> statement-breakpoint
DROP INDEX "idx_npcs_created_by_date";--> statement-breakpoint
DROP INDEX "idx_quests_deleted_at";--> statement-breakpoint
DROP INDEX "idx_quests_is_public";--> statement-breakpoint
DROP INDEX "idx_quests_view_count";--> statement-breakpoint
DROP INDEX "idx_quests_created_by_date";--> statement-breakpoint
DROP INDEX "idx_worlds_deleted_at";--> statement-breakpoint
DROP INDEX "idx_worlds_is_public";--> statement-breakpoint
DROP INDEX "idx_worlds_view_count";--> statement-breakpoint
DROP INDEX "idx_worlds_created_by_date";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "is_public" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "privy_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "visibility" SET DEFAULT 'public';--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "dialogues" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "lores" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "npcs" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "deleted_by";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "favorite_count";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "last_viewed_at";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "is_public";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "is_template";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "quality_score";--> statement-breakpoint
ALTER TABLE "worlds" DROP COLUMN "is_verified";