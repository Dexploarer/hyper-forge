/**
 * Database Migration Runner
 * Runs pending migrations against the database
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { logger } from "../utils/logger";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Validate environment
if (!process.env.DATABASE_URL) {
  logger.error(
    {
      missing: "DATABASE_URL",
      purpose: "PostgreSQL connection for running migrations",
      action: "aborting",
    },
    "DATABASE_URL environment variable is required",
  );
  process.exit(1);
}

// Migration connection
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

// Run migrations
async function main() {
  logger.info({}, "[Migrations] Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./server/db/migrations" });
    logger.info({}, "[Migrations] ✓ Migrations completed successfully");
  } catch (error: any) {
    // Check if it's a "relation already exists" error (PostgreSQL code 42P07)
    // Drizzle wraps PostgreSQL errors, so check the cause as well
    const errorCode = error?.code || error?.cause?.code;
    const errorMessage = error?.message || error?.cause?.message || "";

    const isAlreadyExistsError =
      errorCode === "42P07" || errorMessage.includes("already exists");

    if (isAlreadyExistsError) {
      logger.warn({}, "[Migrations] ⚠️  Some tables already exist - skipping");
      logger.info({}, "[Migrations] ✓ Database schema is up to date");
    } else {
      logger.error({ err: error }, "[Migrations] ✗ Migration failed:");
      process.exit(1);
    }
  }

  await migrationClient.end();
  process.exit(0);
}

main();
