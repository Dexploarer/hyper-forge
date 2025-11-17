-- Add missing columns to assets table
ALTER TABLE "assets" ADD COLUMN "subtype" varchar(100);
ALTER TABLE "assets" ADD COLUMN "detailed_prompt" text;
ALTER TABLE "assets" ADD COLUMN "workflow" varchar(100);
ALTER TABLE "assets" ADD COLUMN "meshy_task_id" varchar(255);
ALTER TABLE "assets" ADD COLUMN "generated_at" timestamp with time zone;
ALTER TABLE "assets" ADD COLUMN "concept_art_path" varchar(512);
ALTER TABLE "assets" ADD COLUMN "has_concept_art" boolean DEFAULT false;
ALTER TABLE "assets" ADD COLUMN "rigged_model_path" varchar(512);
ALTER TABLE "assets" ADD COLUMN "is_base_model" boolean DEFAULT false;
ALTER TABLE "assets" ADD COLUMN "is_variant" boolean DEFAULT false;
ALTER TABLE "assets" ADD COLUMN "parent_base_model" uuid;
ALTER TABLE "assets" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "assets" ADD COLUMN "variant_count" integer DEFAULT 0;
ALTER TABLE "assets" ADD COLUMN "last_variant_generated" timestamp with time zone;
ALTER TABLE "assets" ADD COLUMN "game_id" uuid;

-- Add foreign key constraint for parent_base_model
ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_base_model_assets_id_fk" FOREIGN KEY ("parent_base_model") REFERENCES "assets"("id") ON DELETE set null;
