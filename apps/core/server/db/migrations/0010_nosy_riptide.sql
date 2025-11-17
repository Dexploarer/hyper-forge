CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" varchar(255) NOT NULL,
	"asset_id" varchar(255) NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'initializing' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"stages" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"final_asset" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "generation_jobs_pipeline_id_unique" UNIQUE("pipeline_id")
);
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_pipeline" ON "generation_jobs" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_user" ON "generation_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_status" ON "generation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_asset" ON "generation_jobs" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_created" ON "generation_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_expires" ON "generation_jobs" USING btree ("expires_at");