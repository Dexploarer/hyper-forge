/**
 * Check Database Schema and Apply Migrations
 */

import { db } from "./index";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  console.log("[Database Check] Checking for world_configurations table...");

  try {
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'world_configurations'
      );
    `);

    const tableExists = result.rows[0]?.exists;

    if (tableExists) {
      console.log(
        "[Database Check] ✓ world_configurations table already exists",
      );
    } else {
      console.log(
        "[Database Check] ✗ world_configurations table does not exist",
      );
      console.log("[Database Check] Applying migration manually...");

      // Read and execute the migration file
      const migrationSQL = await Bun.file(
        "./server/db/migrations/0008_freezing_tarot.sql",
      ).text();

      // Split by statement breakpoint and execute each statement
      const statements = migrationSQL
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement));
          console.log("[Database Check] ✓ Executed statement");
        } catch (error: any) {
          // Skip if table/index already exists
          if (error.code === "42P07" || error.code === "42P06") {
            console.log("[Database Check] ⚠️  Already exists, skipping");
          } else {
            throw error;
          }
        }
      }

      console.log("[Database Check] ✓ Migration applied successfully");
    }

    // Verify table exists now
    const verifyResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'world_configurations'
      );
    `);

    const nowExists = verifyResult.rows[0]?.exists;

    if (nowExists) {
      console.log("[Database Check] ✓ Verification passed: Table exists");
    } else {
      console.log(
        "[Database Check] ✗ Verification failed: Table still missing",
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("[Database Check] Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
