CREATE TYPE "public"."pipeline_status" AS ENUM('initializing', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stage_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."error_category" AS ENUM('validation', 'authentication', 'authorization', 'external_api', 'database', 'file_system', 'network', 'application', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."error_severity" AS ENUM('debug', 'info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TABLE "generation_pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid,
	"config" jsonb NOT NULL,
	"status" "pipeline_status" DEFAULT 'initializing' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_stage" varchar(100),
	"error" text,
	"error_stage" varchar(100),
	"error_details" jsonb,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"meshy_task_id" varchar(255),
	"rigging_task_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"stage_name" varchar(100) NOT NULL,
	"stage_order" integer NOT NULL,
	"status" "stage_status" DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"result" jsonb,
	"error" text,
	"error_details" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_asset_id" uuid NOT NULL,
	"variant_asset_id" uuid NOT NULL,
	"preset_id" varchar(100) NOT NULL,
	"preset_name" varchar(255) NOT NULL,
	"preset_category" varchar(100),
	"preset_tier" varchar(50),
	"preset_color" varchar(50),
	"retexture_task_id" varchar(255),
	"generation_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"generation_error" text,
	"style_prompt" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "unique_variant_preset_per_asset" UNIQUE("base_asset_id","preset_id"),
	CONSTRAINT "valid_generation_status" CHECK ("asset_variants"."generation_status" IN ('pending', 'processing', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "variant_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_asset_id" uuid NOT NULL,
	"total_variants" integer DEFAULT 0 NOT NULL,
	"completed_variants" integer DEFAULT 0 NOT NULL,
	"failed_variants" integer DEFAULT 0 NOT NULL,
	"active_variants" integer DEFAULT 0 NOT NULL,
	"last_variant_created" timestamp with time zone,
	"last_variant_completed" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "variant_statistics_base_asset_id_unique" UNIQUE("base_asset_id")
);
--> statement-breakpoint
CREATE TABLE "api_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"request_id" varchar(255),
	"endpoint" varchar(512) NOT NULL,
	"method" varchar(10) NOT NULL,
	"error_code" varchar(100),
	"error_message" text NOT NULL,
	"error_stack" text,
	"severity" "error_severity" DEFAULT 'error' NOT NULL,
	"category" "error_category" DEFAULT 'unknown' NOT NULL,
	"status_code" integer,
	"request_body" jsonb,
	"request_headers" jsonb,
	"response_body" jsonb,
	"external_service" varchar(100),
	"external_error_code" varchar(100),
	"external_error_message" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution" text,
	"ip_address" varchar(45),
	"user_agent" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_aggregations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hour_bucket" timestamp with time zone NOT NULL,
	"endpoint" varchar(512),
	"severity" "error_severity",
	"category" "error_category",
	"external_service" varchar(100),
	"status_code" integer,
	"total_errors" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"first_occurrence" timestamp with time zone,
	"last_occurrence" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_pipelines" ADD CONSTRAINT "generation_pipelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_pipelines" ADD CONSTRAINT "generation_pipelines_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_generation_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."generation_pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_variants" ADD CONSTRAINT "asset_variants_base_asset_id_assets_id_fk" FOREIGN KEY ("base_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_variants" ADD CONSTRAINT "asset_variants_variant_asset_id_assets_id_fk" FOREIGN KEY ("variant_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_variants" ADD CONSTRAINT "asset_variants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_statistics" ADD CONSTRAINT "variant_statistics_base_asset_id_assets_id_fk" FOREIGN KEY ("base_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_errors" ADD CONSTRAINT "api_errors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_errors" ADD CONSTRAINT "api_errors_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pipelines_user" ON "generation_pipelines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pipelines_asset" ON "generation_pipelines" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_pipelines_status" ON "generation_pipelines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pipelines_created" ON "generation_pipelines" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_pipelines_expires" ON "generation_pipelines" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_pipelines_user_status" ON "generation_pipelines" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_pipelines_meshy_task" ON "generation_pipelines" USING btree ("meshy_task_id");--> statement-breakpoint
CREATE INDEX "idx_stages_pipeline" ON "pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_stages_status" ON "pipeline_stages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stages_pipeline_order" ON "pipeline_stages" USING btree ("pipeline_id","stage_order");--> statement-breakpoint
CREATE INDEX "idx_variants_base_asset" ON "asset_variants" USING btree ("base_asset_id");--> statement-breakpoint
CREATE INDEX "idx_variants_variant_asset" ON "asset_variants" USING btree ("variant_asset_id");--> statement-breakpoint
CREATE INDEX "idx_variants_owner" ON "asset_variants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_variants_status" ON "asset_variants" USING btree ("generation_status");--> statement-breakpoint
CREATE INDEX "idx_variants_preset" ON "asset_variants" USING btree ("preset_id");--> statement-breakpoint
CREATE INDEX "idx_variants_base_order" ON "asset_variants" USING btree ("base_asset_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_variants_retexture_task" ON "asset_variants" USING btree ("retexture_task_id");--> statement-breakpoint
CREATE INDEX "idx_variant_stats_base_asset" ON "variant_statistics" USING btree ("base_asset_id");--> statement-breakpoint
CREATE INDEX "idx_errors_user" ON "api_errors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_errors_endpoint" ON "api_errors" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_errors_severity" ON "api_errors" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_errors_category" ON "api_errors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_errors_external_service" ON "api_errors" USING btree ("external_service");--> statement-breakpoint
CREATE INDEX "idx_errors_created" ON "api_errors" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_errors_resolved" ON "api_errors" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_errors_status_code" ON "api_errors" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "idx_errors_request_id" ON "api_errors" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_errors_severity_category" ON "api_errors" USING btree ("severity","category");--> statement-breakpoint
CREATE INDEX "idx_error_agg_hour_bucket" ON "error_aggregations" USING btree ("hour_bucket" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_error_agg_endpoint" ON "error_aggregations" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_error_agg_severity" ON "error_aggregations" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_error_agg_category" ON "error_aggregations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_error_agg_external_service" ON "error_aggregations" USING btree ("external_service");--> statement-breakpoint
CREATE INDEX "idx_error_agg_bucket_endpoint" ON "error_aggregations" USING btree ("hour_bucket","endpoint");