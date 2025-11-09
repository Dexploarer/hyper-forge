/**
 * Temporary script to check applied migrations in Railway database
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

try {
  // Check if drizzle migrations table exists
  const migrations = await sql`
    SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at
  `;

  console.log('Applied migrations in Railway database:');
  console.log(JSON.stringify(migrations, null, 2));

  // Also check what tables exist
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('\nTables in Railway database:');
  console.log(JSON.stringify(tables, null, 2));
} catch (error: any) {
  console.error('Error checking migrations:', error.message);
}

await sql.end();
