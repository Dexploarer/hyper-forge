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
CREATE INDEX "idx_npcs_name" ON "npcs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_npcs_archetype" ON "npcs" USING btree ("archetype");--> statement-breakpoint
CREATE INDEX "idx_npcs_created_by" ON "npcs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_npcs_tags" ON "npcs" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_quests_title" ON "quests" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_quests_type" ON "quests" USING btree ("quest_type");--> statement-breakpoint
CREATE INDEX "idx_quests_difficulty" ON "quests" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_quests_created_by" ON "quests" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_quests_tags" ON "quests" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_dialogues_npc_name" ON "dialogues" USING btree ("npc_name");--> statement-breakpoint
CREATE INDEX "idx_dialogues_created_by" ON "dialogues" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_lores_title" ON "lores" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_lores_category" ON "lores" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_lores_created_by" ON "lores" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_lores_tags" ON "lores" USING gin ("tags");
