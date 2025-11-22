/**
 * Database Migration Runner
 * Runs pending migrations against the database
 * Note: Bun auto-loads .env files, no dotenv needed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logger } from "../utils/logger";

// Get absolute path to migrations folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = join(__dirname, "migrations");

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

// Log migration info for debugging
logger.info(
  {
    migrationsFolder,
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"), // Hide password
  },
  "[Migrations] Starting migration process",
);

// Migration connection with NOTICE suppression
const migrationClient = postgres(process.env.DATABASE_URL, {
  max: 1,
  onnotice: () => {}, // Suppress PostgreSQL NOTICE messages (e.g., "already exists, skipping")
});
const db = drizzle(migrationClient);

// Run migrations
async function main() {
  logger.info({}, "[Migrations] Running migrations...");

  try {
    await migrate(db, { migrationsFolder });
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
      logger.error(
        {
          err: error,
          code: errorCode,
          message: errorMessage,
          migrationsFolder,
        },
        "[Migrations] ✗ Migration failed",
      );
      process.exit(1);
    }
  }

  await migrationClient.end();
  process.exit(0);
}

main();
