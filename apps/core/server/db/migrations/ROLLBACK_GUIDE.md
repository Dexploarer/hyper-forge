# Database Migration Rollback Guide

This guide provides instructions for rolling back database migrations safely.

## Current Migration

**Migration File**: `0023_loud_shen.sql`
**Date**: 2025-11-13
**Description**: Add generation pipelines, asset variants, and API errors schemas

## Quick Rollback

To rollback the latest migration (0023):

```sql
-- Run this SQL in your PostgreSQL database

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_error_agg_bucket_endpoint;
DROP INDEX IF EXISTS idx_error_agg_external_service;
DROP INDEX IF EXISTS idx_error_agg_category;
DROP INDEX IF EXISTS idx_error_agg_severity;
DROP INDEX IF EXISTS idx_error_agg_endpoint;
DROP INDEX IF EXISTS idx_error_agg_hour_bucket;
DROP INDEX IF EXISTS idx_errors_severity_category;
DROP INDEX IF EXISTS idx_errors_request_id;
DROP INDEX IF EXISTS idx_errors_status_code;
DROP INDEX IF EXISTS idx_errors_resolved;
DROP INDEX IF EXISTS idx_errors_created;
DROP INDEX IF EXISTS idx_errors_external_service;
DROP INDEX IF EXISTS idx_errors_category;
DROP INDEX IF EXISTS idx_errors_severity;
DROP INDEX IF EXISTS idx_errors_endpoint;
DROP INDEX IF EXISTS idx_errors_user;
DROP INDEX IF EXISTS idx_variant_stats_base_asset;
DROP INDEX IF EXISTS idx_variants_retexture_task;
DROP INDEX IF EXISTS idx_variants_base_order;
DROP INDEX IF EXISTS idx_variants_preset;
DROP INDEX IF EXISTS idx_variants_status;
DROP INDEX IF EXISTS idx_variants_owner;
DROP INDEX IF EXISTS idx_variants_variant_asset;
DROP INDEX IF EXISTS idx_variants_base_asset;
DROP INDEX IF EXISTS idx_stages_pipeline_order;
DROP INDEX IF EXISTS idx_stages_status;
DROP INDEX IF EXISTS idx_stages_pipeline;
DROP INDEX IF EXISTS idx_pipelines_meshy_task;
DROP INDEX IF EXISTS idx_pipelines_user_status;
DROP INDEX IF EXISTS idx_pipelines_expires;
DROP INDEX IF EXISTS idx_pipelines_created;
DROP INDEX IF EXISTS idx_pipelines_status;
DROP INDEX IF EXISTS idx_pipelines_asset;
DROP INDEX IF EXISTS idx_pipelines_user;

-- Drop foreign key constraints
ALTER TABLE error_aggregations DROP CONSTRAINT IF EXISTS error_aggregations_resolved_by_users_id_fk;
ALTER TABLE api_errors DROP CONSTRAINT IF EXISTS api_errors_resolved_by_users_id_fk;
ALTER TABLE api_errors DROP CONSTRAINT IF EXISTS api_errors_user_id_users_id_fk;
ALTER TABLE variant_statistics DROP CONSTRAINT IF EXISTS variant_statistics_base_asset_id_assets_id_fk;
ALTER TABLE asset_variants DROP CONSTRAINT IF EXISTS asset_variants_owner_id_users_id_fk;
ALTER TABLE asset_variants DROP CONSTRAINT IF EXISTS asset_variants_variant_asset_id_assets_id_fk;
ALTER TABLE asset_variants DROP CONSTRAINT IF EXISTS asset_variants_base_asset_id_assets_id_fk;
ALTER TABLE pipeline_stages DROP CONSTRAINT IF EXISTS pipeline_stages_pipeline_id_generation_pipelines_id_fk;
ALTER TABLE generation_pipelines DROP CONSTRAINT IF EXISTS generation_pipelines_asset_id_assets_id_fk;
ALTER TABLE generation_pipelines DROP CONSTRAINT IF EXISTS generation_pipelines_user_id_users_id_fk;

-- Drop tables
DROP TABLE IF EXISTS error_aggregations;
DROP TABLE IF EXISTS api_errors;
DROP TABLE IF EXISTS variant_statistics;
DROP TABLE IF EXISTS asset_variants;
DROP TABLE IF EXISTS pipeline_stages;
DROP TABLE IF EXISTS generation_pipelines;

-- Drop enums
DROP TYPE IF EXISTS error_category;
DROP TYPE IF EXISTS error_severity;
DROP TYPE IF EXISTS stage_status;
DROP TYPE IF EXISTS pipeline_status;

COMMIT;
```

## Rollback via Drizzle Kit

Drizzle Kit doesn't have built-in rollback functionality. You must manually run the SQL above or:

1. **Remove the schema files**:

   ```bash
   cd apps/core/server/db/schema
   rm generation-pipelines.schema.ts
   rm asset-variants.schema.ts
   rm api-errors.schema.ts
   ```

2. **Update schema index**:
   Remove the exports from `server/db/schema/index.ts`

3. **Generate a new migration**:

   ```bash
   bun run db:generate
   ```

   This will create a migration that drops the tables.

4. **Apply the migration**:
   ```bash
   bun run db:migrate
   ```

## Prevention Best Practices

1. **Always backup before migrating**:

   ```bash
   pg_dump -U postgres -d asset_forge > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations on staging first**:

   ```bash
   DATABASE_URL=<staging_url> bun run db:migrate
   ```

3. **Review generated SQL**:
   Always check the SQL in `server/db/migrations/` before applying.

4. **Use transactions**:
   Migrations should be wrapped in transactions (Drizzle does this automatically).

## Data Recovery

If you need to recover data after a rollback:

1. **Check if backup exists**:

   ```bash
   ls -la backups/
   ```

2. **Restore from backup**:

   ```bash
   psql -U postgres -d asset_forge < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verify data**:
   ```sql
   SELECT COUNT(*) FROM generation_pipelines;
   SELECT COUNT(*) FROM asset_variants;
   SELECT COUNT(*) FROM api_errors;
   ```

## Migration History

| Migration                       | Date       | Description                     | Status  |
| ------------------------------- | ---------- | ------------------------------- | ------- |
| 0023_loud_shen.sql              | 2025-11-13 | Add pipelines, variants, errors | Current |
| 0022_confused_captain_cross.sql | -          | Previous migration              | Applied |

## Contact

If you encounter issues with rollback, contact the database specialist or check:

- Migration files in `server/db/migrations/`
- Schema files in `server/db/schema/`
- Drizzle docs: https://orm.drizzle.team/docs/migrations
