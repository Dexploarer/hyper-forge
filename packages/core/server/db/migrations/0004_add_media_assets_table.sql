CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"file_url" text NOT NULL,
	"file_name" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_media_assets_type" ON "media_assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_media_assets_entity" ON "media_assets" USING btree ("entity_type", "entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_assets_created_by" ON "media_assets" USING btree ("created_by");
