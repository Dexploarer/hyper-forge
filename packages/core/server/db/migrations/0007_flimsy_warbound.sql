CREATE TABLE "dialogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"npc_name" varchar(255) NOT NULL,
	"context" text,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"nodes" jsonb NOT NULL,
	"generation_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relationships" (
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
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"world_id" uuid,
	"created_by" varchar(255),
	"data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"summary" text NOT NULL,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"data" jsonb NOT NULL,
	"generation_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_tracks" (
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
CREATE TABLE "npcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"archetype" varchar(100) NOT NULL,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"data" jsonb NOT NULL,
	"generation_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"quest_type" varchar(100) NOT NULL,
	"difficulty" varchar(50) NOT NULL,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"data" jsonb NOT NULL,
	"generation_params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worlds" (
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
ALTER TABLE "admin_whitelist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_whitelist" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "discord_username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "subtype" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "game_id" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "concept_art_path" varchar(512);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "has_concept_art" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "rigged_model_path" varchar(512);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "detailed_prompt" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "workflow" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "meshy_task_id" varchar(255);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_base_model" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_variant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "parent_base_model" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "variant_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "last_variant_generated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dialogues_npc_name" ON "dialogues" USING btree ("npc_name");--> statement-breakpoint
CREATE INDEX "idx_dialogues_created_by" ON "dialogues" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_relationships_source" ON "entity_relationships" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_target" ON "entity_relationships" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_type" ON "entity_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_locations_name" ON "locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_locations_type" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_locations_world_id" ON "locations" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "idx_lores_title" ON "lores" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_lores_category" ON "lores" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_lores_created_by" ON "lores" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_lores_tags" ON "lores" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_music_title" ON "music_tracks" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_music_mood" ON "music_tracks" USING btree ("mood");--> statement-breakpoint
CREATE INDEX "idx_npcs_name" ON "npcs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_npcs_archetype" ON "npcs" USING btree ("archetype");--> statement-breakpoint
CREATE INDEX "idx_npcs_created_by" ON "npcs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_npcs_tags" ON "npcs" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_quests_title" ON "quests" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_quests_type" ON "quests" USING btree ("quest_type");--> statement-breakpoint
CREATE INDEX "idx_quests_difficulty" ON "quests" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_quests_created_by" ON "quests" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_quests_tags" ON "quests" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_worlds_name" ON "worlds" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_worlds_genre" ON "worlds" USING btree ("genre");--> statement-breakpoint
CREATE INDEX "idx_worlds_created_by" ON "worlds" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_media_assets_type" ON "media_assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_media_assets_entity" ON "media_assets" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_assets_created_by" ON "media_assets" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_base_model_assets_id_fk" FOREIGN KEY ("parent_base_model") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_user_timeline" ON "activity_log" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_assets_game" ON "assets" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_assets_owner_status" ON "assets" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "idx_assets_project_type" ON "assets" USING btree ("project_id","type");