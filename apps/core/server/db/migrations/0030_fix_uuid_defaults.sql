-- Fix UUID defaults for all tables
-- Ensures all UUID ID columns have gen_random_uuid() as default
-- This fixes any tables that might be missing UUID generation

-- Note: This migration is idempotent - it's safe to run multiple times
-- ALTER COLUMN SET DEFAULT doesn't error if the default already exists

-- Core tables
ALTER TABLE IF EXISTS "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "assets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "media_assets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Content tables
ALTER TABLE IF EXISTS "content" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "content_relationships" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Generation tables
ALTER TABLE IF EXISTS "generation_jobs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "generation_pipelines" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Asset management
ALTER TABLE IF EXISTS "static_assets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "asset_variants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "prompts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "material_presets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- API and monitoring
ALTER TABLE IF EXISTS "api_keys" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "api_errors" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "api_error_aggregations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- User features
ALTER TABLE IF EXISTS "achievements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "user_achievements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Activity and admin
ALTER TABLE IF EXISTS "activity_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE IF EXISTS "admin_whitelist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- World configuration
ALTER TABLE IF EXISTS "world_config" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
