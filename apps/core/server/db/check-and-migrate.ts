/**
 * Check Database Schema and Apply Migrations
 */

import { db } from "./index";
import { logger } from "../utils/logger";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";


async function main() {
  logger.info({ }, '[Database Check] Checking for world_configurations table...');

  try {
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'world_configurations'
      );
    `);

    const tableExists = result[0]?.exists;

    if (tableExists) {
      console.log(
        "[Database Check] ✓ world_configurations table already exists",
      );
    } else {
      console.log(
        "[Database Check] ✗ world_configurations table does not exist",
      );
      logger.info({ }, '[Database Check] Applying migration manually...');

      const migrationsFolder = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./migrations",
      );
      await migrate(db, { migrationsFolder });
      logger.info({ }, '[Database Check] ✓ Drizzle migrations applied');
    }

    // Verify table exists now
    const verifyResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'world_configurations'
      );
    `);

    const nowExists = verifyResult[0]?.exists;

    if (nowExists) {
      logger.info({ }, '[Database Check] ✓ Verification passed: Table exists');
    } else {
      console.log(
        "[Database Check] ✗ Verification failed: Table still missing",
      );
      process.exit(1);
    }
  } catch (error) {
    logger.error({ err: error }, '[Database Check] Error:');
    process.exit(1);
  }

  process.exit(0);
}

main();
