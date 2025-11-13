ALTER TABLE "assets" ADD COLUMN "cdn_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "cdn_thumbnail_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "cdn_concept_art_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "published_to_cdn" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "cdn_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "cdn_files" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX "idx_assets_published_to_cdn" ON "assets" USING btree ("published_to_cdn");