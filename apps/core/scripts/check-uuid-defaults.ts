#!/usr/bin/env bun
/**
 * Check UUID defaults in database schema
 * Verifies that UUID columns have proper default values
 */

import { queryClient } from "../server/db/db";

async function checkUUIDDefaults() {
  console.log("🔍 Checking UUID defaults in database schema...\n");

  try {
    // Check schema defaults for UUID columns
    const columns = await queryClient`
      SELECT
        table_name,
        column_name,
        column_default,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND data_type = 'uuid'
      AND column_name = 'id'
      ORDER BY table_name
    `;

    console.log(`Found ${columns.length} UUID ID columns:\n`);

    let missingDefaults = 0;

    for (const col of columns) {
      const hasDefault = col.column_default !== null;
      const icon = hasDefault ? "✅" : "❌";

      console.log(`${icon} ${col.table_name}.${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Default: ${col.column_default || "MISSING!"}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log();

      if (!hasDefault) {
        missingDefaults++;
      }
    }

    if (missingDefaults > 0) {
      console.log(
        `\n⚠️  ${missingDefaults} tables are missing UUID defaults!\n`,
      );
      console.log("These tables will not auto-generate UUIDs for new rows.");
      console.log(
        "Fix by running: ALTER TABLE ... ALTER COLUMN id SET DEFAULT gen_random_uuid();",
      );
      process.exit(1);
    } else {
      console.log("✅ All UUID columns have proper defaults!\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error checking UUID defaults:", error);
    process.exit(1);
  }
}

checkUUIDDefaults();
