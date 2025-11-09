/**
 * Apply migration 0003 to Railway database
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = postgres(process.env.DATABASE_URL!);

try {
  console.log('Applying migration 0003_add_asset_columns.sql to Railway database...');

  // Read the migration file
  const migrationPath = join(import.meta.dir, 'server/db/migrations/0003_add_asset_columns.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('\nMigration SQL:');
  console.log(migrationSQL);

  // Execute the migration
  await sql.unsafe(migrationSQL);

  console.log('\n✓ Migration 0003 applied successfully!');

  // Add entry to drizzle migrations table
  const hash = require('crypto')
    .createHash('sha256')
    .update(migrationSQL)
    .digest('hex');

  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${Date.now().toString()})
  `;

  console.log('✓ Migration recorded in __drizzle_migrations table');

  // Verify columns were added
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets'
    AND column_name IN (
      'subtype', 'detailed_prompt', 'workflow', 'meshy_task_id',
      'generated_at', 'concept_art_path', 'has_concept_art', 'rigged_model_path',
      'is_base_model', 'is_variant', 'parent_base_model', 'variants',
      'variant_count', 'last_variant_generated', 'game_id'
    )
    ORDER BY column_name
  `;

  console.log('\n✓ Verified new columns:');
  columns.forEach((col) => console.log(`  - ${col.column_name}`));

} catch (error: any) {
  console.error('\n✗ Error applying migration:', error.message);
  process.exit(1);
}

await sql.end();
