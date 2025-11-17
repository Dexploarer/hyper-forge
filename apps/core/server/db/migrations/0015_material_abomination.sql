ALTER TABLE "projects" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_projects_owner_public" ON "projects" USING btree ("owner_id","is_public");