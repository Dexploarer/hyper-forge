#!/usr/bin/env bun
/**
 * Fix UUID defaults for all tables
 * Ensures all UUID ID columns have gen_random_uuid() as default
 */

import { queryClient } from "../server/db/db";

async function fixUUIDDefaults() {
  console.log("🔧 Fixing UUID defaults in database...\n");

  try {
    // Check current defaults
    const columns = await queryClient`
      SELECT
        table_name,
        column_name,
        column_default,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND data_type = 'uuid'
      AND column_name = 'id'
      ORDER BY table_name
    `;

    console.log(`Found ${columns.length} UUID ID columns\n`);

    let fixed = 0;
    let alreadyOk = 0;

    for (const col of columns) {
      const hasDefault = col.column_default !== null;

      if (hasDefault) {
        console.log(`✅ ${col.table_name}.id - Already has default`);
        alreadyOk++;
      } else {
        console.log(`🔧 ${col.table_name}.id - FIXING...`);

        // Add UUID default
        await queryClient`
          ALTER TABLE ${queryClient(col.table_name)}
          ALTER COLUMN id SET DEFAULT gen_random_uuid()
        `;

        console.log(`   ✓ Added gen_random_uuid() default`);
        fixed++;
      }
    }

    console.log("\n" + "─".repeat(60));
    console.log(`✅ Fixed: ${fixed} tables`);
    console.log(`✓  Already OK: ${alreadyOk} tables`);
    console.log("─".repeat(60) + "\n");

    if (fixed > 0) {
      console.log("✅ UUID defaults fixed! New rows will auto-generate IDs.\n");
    } else {
      console.log("✅ All UUID defaults were already correct!\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing UUID defaults:", error);
    process.exit(1);
  }
}

fixUUIDDefaults();
