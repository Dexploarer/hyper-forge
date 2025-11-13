CREATE INDEX IF NOT EXISTS "idx_assets_owner_created" ON "assets" USING btree ("owner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assets_type_status" ON "assets" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assets_project_status" ON "assets" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_locations_world_type" ON "locations" USING btree ("world_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lores_created_by_date" ON "lores" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_music_mood_public" ON "music_tracks" USING btree ("mood","is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_worlds_created_by_date" ON "worlds" USING btree ("created_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_entity_type_media_type" ON "media_assets" USING btree ("entity_type","entity_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generation_jobs_user_status" ON "generation_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generation_jobs_user_created" ON "generation_jobs" USING btree ("user_id","created_at" DESC NULLS LAST);