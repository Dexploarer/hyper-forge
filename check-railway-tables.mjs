import postgres from 'postgres';

const RAILWAY_DB_URL = 'postgresql://postgres:xkIkGHxaoOHyYDcoImazXmCtWlhYKLBi@interchange.proxy.rlwy.net:14786/railway';

const client = postgres(RAILWAY_DB_URL, { max: 1, ssl: 'require' });

console.log('📊 Railway Database Analysis\n');
console.log('='.repeat(60) + '\n');

try {
  // Get all tables
  const tables = await client`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  if (tables.length === 0) {
    console.log('❌ NO TABLES FOUND!');
    console.log('\nThis means migrations have NOT run on Railway.');
    console.log('Check Railway logs for migration errors.\n');
  } else {
    console.log(`✅ Found ${tables.length} tables:\n`);

    for (const t of tables) {
      try {
        const countResult = await client`SELECT COUNT(*) as count FROM ${client(t.table_name)}`;
        const count = countResult[0].count;
        const status = count > 0 ? '✅' : '⚠️ ';
        console.log(`${status} ${t.table_name.padEnd(35)} ${count.toString().padStart(6)} rows`);
      } catch (err) {
        console.log(`❌ ${t.table_name.padEnd(35)} ERROR: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nSummary:');
    console.log(`• Total tables: ${tables.length}`);
    console.log(`• Database: Railway PostgreSQL`);
    console.log(`• Status: Connected ✅\n`);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await client.end();
}
