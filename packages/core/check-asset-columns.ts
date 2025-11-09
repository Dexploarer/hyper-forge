/**
 * Check if asset columns from migration 0003 exist
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

try {
  // Check columns in assets table
  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets'
    ORDER BY ordinal_position
  `;

  console.log('Assets table columns:');
  columns.forEach((col) => {
    console.log(`- ${col.column_name} (${col.data_type})`);
  });

  // Check specific columns from migration 0003
  const expectedColumns = [
    'subtype',
    'detailed_prompt',
    'workflow',
    'meshy_task_id',
    'generated_at',
    'concept_art_path',
    'has_concept_art',
    'rigged_model_path',
    'is_base_model',
    'is_variant',
    'parent_base_model',
    'variants',
    'variant_count',
    'last_variant_generated',
    'game_id'
  ];

  console.log('\n\nChecking columns from migration 0003:');
  const columnNames = columns.map(c => c.column_name);
  expectedColumns.forEach(col => {
    const exists = columnNames.includes(col);
    console.log(`${exists ? '✓' : '✗'} ${col}`);
  });
} catch (error: any) {
  console.error('Error checking columns:', error.message);
}

await sql.end();
