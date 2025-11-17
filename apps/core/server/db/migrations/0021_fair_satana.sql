ALTER TABLE "assets" ADD COLUMN "cdn_rigged_model_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "cdn_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "published_to_cdn" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "cdn_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "cdn_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "published_to_cdn" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "cdn_published_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_music_tracks_published_to_cdn" ON "music_tracks" USING btree ("published_to_cdn");--> statement-breakpoint
CREATE INDEX "idx_media_assets_published_to_cdn" ON "media_assets" USING btree ("published_to_cdn");