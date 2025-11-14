#!/usr/bin/env bun
/**
 * Direct SQL cleanup - delete orphaned media assets
 * Run with: bun /tmp/cleanup-orphaned-media-direct.ts
 */

import postgres from "postgres";

// Get DATABASE_URL from Railway
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  console.error("Run with: railway run --service hyperforge bun /tmp/cleanup-orphaned-media-direct.ts");
  process.exit(1);
}

console.log(`\n🔍 Deleting orphaned media assets from database`);
console.log(`📊 Connected to: ${DATABASE_URL.split('@')[1]}\n`);

const sql = postgres(DATABASE_URL);

try {
  // Delete all media assets without CDN URLs
  const result = await sql`
    DELETE FROM media_assets
    WHERE cdn_url IS NULL
    AND file_url LIKE '/gdd-assets%'
    RETURNING id, type;
  `;

  console.log(`✅ Deleted ${result.length} orphaned media assets\n`);

  if (result.length > 0) {
    // Count by type
    const byType = result.reduce((acc, row: any) => {
      acc[row.type] = (acc[row.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📋 Deleted by type:`);
    for (const [type, count] of Object.entries(byType)) {
      console.log(`   ${type}: ${count}`);
    }
  }

  // Show remaining count
  const remaining = await sql`SELECT COUNT(*) as count FROM media_assets`;
  console.log(`\n📊 Remaining media assets: ${remaining[0].count}`);

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error("\n❌ Cleanup failed:", error);
  await sql.end();
  process.exit(1);
}
