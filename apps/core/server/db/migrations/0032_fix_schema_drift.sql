-- Fix Schema Drift Migration
-- Drop unused admin_whitelist table that exists in DB but not in TypeScript schemas
-- This table was created in migration 0000 but was never needed (single-team app)

-- Drop the foreign key constraint first
ALTER TABLE "admin_whitelist" DROP CONSTRAINT IF EXISTS "admin_whitelist_added_by_users_id_fk";

-- Drop the index
DROP INDEX IF EXISTS "idx_admin_whitelist_wallet";

-- Drop the table
DROP TABLE IF EXISTS "admin_whitelist";
