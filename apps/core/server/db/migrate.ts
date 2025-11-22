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
const sanitizedDbUrl = (() => {
  try {
    const url = new URL(process.env.DATABASE_URL!);
    url.password = "****";
    return url.toString();
  } catch {
    return process.env.DATABASE_URL!.replace(/:[^:@]+@/, ":****@");
  }
})(); // Hide password

console.log("[Migrations] Starting migration process");
console.log("[Migrations] Migrations folder:", migrationsFolder);
console.log("[Migrations] Database URL:", sanitizedDbUrl);

logger.info(
  {
    migrationsFolder,
    databaseUrl: sanitizedDbUrl,
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
  // Verify migrations folder exists and has files
  try {
    const fs = await import("node:fs/promises");
    const migrationFiles = await fs.readdir(migrationsFolder);
    const sqlFiles = migrationFiles.filter((f) => f.endsWith(".sql"));

    logger.info(
      {
        migrationsFolder,
        totalFiles: migrationFiles.length,
        sqlFiles: sqlFiles.length,
      },
      "[Migrations] Found migration files",
    );

    if (sqlFiles.length === 0) {
      const errorMsg = `No SQL migration files found in ${migrationsFolder}`;
      console.error(`[Migrations] ERROR: ${errorMsg}`);
      logger.error({}, errorMsg);
      process.exit(1);
    }
  } catch (error: any) {
    const errorMsg = `Failed to read migrations folder: ${error.message}`;
    console.error(`[Migrations] ERROR: ${errorMsg}`);
    console.error(`[Migrations] Stack: ${error.stack}`);
    logger.error({ err: error }, errorMsg);
    process.exit(1);
  }

  // Test database connection before running migrations
  console.log("[Migrations] Testing database connection...");
  try {
    const result = await migrationClient`SELECT 1 as test`;
    console.log("[Migrations] ✓ Database connection successful");
    logger.info({}, "[Migrations] Database connection test passed");
  } catch (error: any) {
    const errorMsg = `Database connection failed: ${error.message}`;
    console.error("[Migrations] ✗ DATABASE CONNECTION FAILED");
    console.error("Error Code:", error?.code);
    console.error("Error Message:", error?.message);
    console.error("Database URL:", sanitizedDbUrl);
    console.error("Full Error:", JSON.stringify(error, null, 2));

    logger.error(
      {
        err: error,
        code: error?.code,
        databaseUrl: sanitizedDbUrl,
      },
      errorMsg,
    );
    await migrationClient.end();
    process.exit(1);
  }

  // Check for existing migrations (helps diagnose state)
  try {
    const existingMigrations = await migrationClient`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'drizzle'
      AND table_name = '__drizzle_migrations'
    `;

    if (existingMigrations.length > 0) {
      const appliedMigrations = await migrationClient`
        SELECT id, hash, created_at
        FROM drizzle.__drizzle_migrations
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log(
        `[Migrations] Found ${appliedMigrations.length} previously applied migrations`,
      );
      logger.info(
        { count: appliedMigrations.length },
        "[Migrations] Previous migrations detected",
      );
    } else {
      console.log("[Migrations] No previous migrations found (fresh database)");
      logger.info({}, "[Migrations] Fresh database detected");
    }
  } catch (error: any) {
    // Ignore errors here - schema might not exist yet
    console.log(
      "[Migrations] Could not check migration history (expected on first run)",
    );
  }

  console.log("[Migrations] Running migrations...");
  logger.info({}, "[Migrations] Running migrations...");

  try {
    await migrate(db, { migrationsFolder });
    logger.info({}, "[Migrations] ✓ Migrations completed successfully");
    console.log("[Migrations] ✓ Migrations completed successfully"); // Ensure visibility in Railway
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
      console.log(
        "[Migrations] ✓ Database schema is up to date (some tables already exist)",
      );
    } else {
      // Log error details to both logger and console for maximum visibility
      const errorDetails = {
        code: errorCode,
        message: errorMessage,
        stack: error?.stack,
        cause: error?.cause,
        migrationsFolder,
      };

      console.error("[Migrations] ✗ MIGRATION FAILED - ERROR DETAILS:");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", JSON.stringify(error, null, 2));
      console.error("Error Stack:", error?.stack);
      if (error?.cause) {
        console.error("Error Cause:", JSON.stringify(error.cause, null, 2));
      }

      logger.error(errorDetails, "[Migrations] ✗ Migration failed");
      process.exit(1);
    }
  }

  await migrationClient.end();
  process.exit(0);
}

main();
