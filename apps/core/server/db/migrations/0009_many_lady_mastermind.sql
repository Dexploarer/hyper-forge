ALTER TABLE "world_configurations" ADD COLUMN "character_classes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "world_configurations" ADD COLUMN "magic_systems" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "world_configurations" ADD COLUMN "creature_types" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "world_configurations" ADD COLUMN "religions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "world_configurations" ADD COLUMN "cultural_elements" jsonb DEFAULT '[]'::jsonb NOT NULL;