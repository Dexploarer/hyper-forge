CREATE TABLE "material_presets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"style_prompt" text NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"color" varchar(7),
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "static_assets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"cdn_url" varchar(1024) NOT NULL,
	"file_size" integer,
	"category" varchar(100),
	"subcategory" varchar(100),
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "material_presets" ADD CONSTRAINT "material_presets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "material_presets_category_idx" ON "material_presets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "material_presets_tier_idx" ON "material_presets" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "material_presets_created_by_idx" ON "material_presets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "material_presets_is_system_idx" ON "material_presets" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "material_presets_is_active_idx" ON "material_presets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "static_assets_type_idx" ON "static_assets" USING btree ("type");--> statement-breakpoint
CREATE INDEX "static_assets_category_idx" ON "static_assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "static_assets_file_name_idx" ON "static_assets" USING btree ("file_name");