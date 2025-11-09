-- Add missing content tables
CREATE TABLE IF NOT EXISTS "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"relationship_type" varchar(100) NOT NULL,
	"strength" varchar(20) DEFAULT 'medium',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "worlds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"genre" varchar(100) NOT NULL,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"world_id" uuid,
	"created_by" varchar(255),
	"data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "music_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"mood" varchar(100) NOT NULL,
	"duration" varchar(20),
	"created_by" varchar(255),
	"file_url" text,
	"data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relationships_source" ON "entity_relationships" USING btree ("source_type", "source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relationships_target" ON "entity_relationships" USING btree ("target_type", "target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_relationships_type" ON "entity_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_worlds_name" ON "worlds" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_worlds_genre" ON "worlds" USING btree ("genre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_worlds_created_by" ON "worlds" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_locations_name" ON "locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_locations_type" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_locations_world_id" ON "locations" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_music_title" ON "music_tracks" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_music_mood" ON "music_tracks" USING btree ("mood");
