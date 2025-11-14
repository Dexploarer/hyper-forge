CREATE TABLE "prompts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" jsonb NOT NULL,
	"description" text,
	"version" varchar(50) DEFAULT '1.0',
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompts_type_idx" ON "prompts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "prompts_created_by_idx" ON "prompts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "prompts_is_system_idx" ON "prompts" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "prompts_is_active_idx" ON "prompts" USING btree ("is_active");
