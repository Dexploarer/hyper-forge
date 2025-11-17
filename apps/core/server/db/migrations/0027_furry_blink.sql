DROP INDEX "idx_assets_file_path";--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "cdn_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "file_path";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "thumbnail_path";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "concept_art_path";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "rigged_model_path";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "media_assets" DROP COLUMN "file_url";