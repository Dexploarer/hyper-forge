-- Fix Schema Drift Migration
-- Drop unused admin_whitelist table that exists in DB but not in TypeScript schemas
-- This table was created in migration 0000 but was never needed (single-team app)

-- Drop the index if it exists (safe even if table doesn't exist)
DROP INDEX IF EXISTS "idx_admin_whitelist_wallet";

-- Drop the table with CASCADE to handle any dependent constraints
-- CASCADE will automatically drop the foreign key constraint if the table exists
-- IF EXISTS ensures this is safe even if the table was already dropped
DROP TABLE IF EXISTS "admin_whitelist" CASCADE;
