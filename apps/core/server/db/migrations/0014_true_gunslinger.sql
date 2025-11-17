CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(100),
	"type" varchar(50) DEFAULT 'achievement' NOT NULL,
	"category" varchar(50),
	"rarity" varchar(50) DEFAULT 'common' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"max_progress" integer,
	"progress_type" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_achievements_code" ON "achievements" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_achievements_type" ON "achievements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_achievements_category" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_achievements_rarity" ON "achievements" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "idx_achievements_active" ON "achievements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_user" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_achievement" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_unique" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_earned" ON "user_achievements" USING btree ("earned_at" DESC NULLS LAST);