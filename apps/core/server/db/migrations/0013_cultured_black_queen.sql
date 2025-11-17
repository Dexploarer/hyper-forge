ALTER TABLE "generation_jobs" DROP CONSTRAINT "generation_jobs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "generation_jobs" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;