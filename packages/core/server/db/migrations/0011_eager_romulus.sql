ALTER TABLE "dialogues" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "dialogues" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "wallet_address" varchar(255);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "lores" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "wallet_address" varchar(255);--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "is_template" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "ai_metrics" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "worlds" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogues" ADD CONSTRAINT "dialogues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lores" ADD CONSTRAINT "lores_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dialogues_deleted_at" ON "dialogues" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_dialogues_project_id" ON "dialogues" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_dialogues_is_public" ON "dialogues" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_dialogues_view_count" ON "dialogues" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_locations_deleted_at" ON "locations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_locations_project_id" ON "locations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_locations_is_public" ON "locations" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_locations_view_count" ON "locations" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_lores_deleted_at" ON "lores" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_lores_project_id" ON "lores" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_lores_is_public" ON "lores" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_lores_view_count" ON "lores" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_music_deleted_at" ON "music_tracks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_music_project_id" ON "music_tracks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_music_is_public" ON "music_tracks" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_music_view_count" ON "music_tracks" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_npcs_deleted_at" ON "npcs" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_npcs_project_id" ON "npcs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_npcs_is_public" ON "npcs" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_npcs_view_count" ON "npcs" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_quests_deleted_at" ON "quests" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_quests_project_id" ON "quests" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_quests_is_public" ON "quests" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_quests_view_count" ON "quests" USING btree ("view_count");--> statement-breakpoint
CREATE INDEX "idx_worlds_deleted_at" ON "worlds" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_worlds_project_id" ON "worlds" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_worlds_is_public" ON "worlds" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_worlds_view_count" ON "worlds" USING btree ("view_count");