-- Add performance indexes for common query patterns

-- Add index on assets.game_id for filtering by game
CREATE INDEX IF NOT EXISTS "idx_assets_game" ON "assets" USING btree ("game_id");

-- Add composite index on assets for "show me my completed assets" queries
CREATE INDEX IF NOT EXISTS "idx_assets_owner_status" ON "assets" USING btree ("owner_id", "status");

-- Add composite index on assets for "show all characters in this project" queries
CREATE INDEX IF NOT EXISTS "idx_assets_project_type" ON "assets" USING btree ("project_id", "type");

-- Add composite index on activity_log for user timeline queries
CREATE INDEX IF NOT EXISTS "idx_activity_user_timeline" ON "activity_log" USING btree ("user_id", "created_at" DESC);
