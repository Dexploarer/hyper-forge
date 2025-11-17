CREATE TABLE "configuration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"changed_by" varchar(255),
	"snapshot" jsonb NOT NULL,
	"change_description" text,
	"changed_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "world_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"genre" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255),
	"wallet_address" varchar(255),
	"races" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"factions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"npc_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quest_config" jsonb NOT NULL,
	"items_config" jsonb NOT NULL,
	"locations_config" jsonb NOT NULL,
	"economy_settings" jsonb NOT NULL,
	"ai_preferences" jsonb NOT NULL,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "configuration_history" ADD CONSTRAINT "configuration_history_config_id_world_configurations_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."world_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_config_history_config_id" ON "configuration_history" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "idx_config_history_type" ON "configuration_history" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "idx_world_configs_name" ON "world_configurations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_world_configs_genre" ON "world_configurations" USING btree ("genre");--> statement-breakpoint
CREATE INDEX "idx_world_configs_active" ON "world_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_world_configs_created_by" ON "world_configurations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_world_configs_template" ON "world_configurations" USING btree ("is_template");