DROP INDEX "idx_assets_published_to_cdn";--> statement-breakpoint
DROP INDEX "idx_music_tracks_published_to_cdn";--> statement-breakpoint
DROP INDEX "idx_media_assets_published_to_cdn";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "published_to_cdn";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN "cdn_published_at";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "published_to_cdn";--> statement-breakpoint
ALTER TABLE "music_tracks" DROP COLUMN "cdn_published_at";--> statement-breakpoint
ALTER TABLE "media_assets" DROP COLUMN "published_to_cdn";--> statement-breakpoint
ALTER TABLE "media_assets" DROP COLUMN "cdn_published_at";