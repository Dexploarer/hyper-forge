/**
 * Prompts Seed Script
 * Migrates existing JSON prompt files to database
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { prompts } from "../schema/prompts.schema";
import { logger } from "../../utils/logger";

// Validate environment
if (!process.env.DATABASE_URL) {
  logger.error(
    {
      missing: "DATABASE_URL",
      purpose: "PostgreSQL connection for seeding prompts",
      action: "aborting",
    },
    "DATABASE_URL environment variable is required",
  );
  process.exit(1);
}

const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

// Map file names to prompt types
const PROMPT_TYPE_MAP: Record<string, string> = {
  "generation-prompts.json": "generation",
  "asset-type-prompts.json": "asset-type",
  "game-style-prompts.json": "game-style",
  "material-prompts.json": "material",
  "material-presets.json": "material-preset", // Will skip this - handled by separate seed
  "weapon-detection-prompts.json": "weapon-detection",
  "gpt4-enhancement-prompts.json": "gpt4-enhancement",
};

async function seedPrompts() {
  logger.info({}, "[Prompts Seed] Starting prompts migration...");

  const promptsDir = join(process.cwd(), "public", "prompts");

  try {
    const files = readdirSync(promptsDir).filter((f) => f.endsWith(".json"));
    logger.info(
      { count: files.length },
      `[Prompts Seed] Found ${files.length} prompt files`,
    );

    let totalInserted = 0;

    for (const file of files) {
      // Skip material-presets.json - it's handled by material presets seed
      if (file === "material-presets.json") {
        logger.info({}, `[Prompts Seed] Skipping ${file} (handled separately)`);
        continue;
      }

      const promptType = PROMPT_TYPE_MAP[file];
      if (!promptType) {
        logger.warn({ file }, `[Prompts Seed] Unknown prompt file: ${file}`);
        continue;
      }

      const filePath = join(promptsDir, file);
      const content = JSON.parse(readFileSync(filePath, "utf-8"));

      // Remove metadata fields
      const { __comment, version, ...promptData } = content;

      // Create a single prompt record for the entire file
      const promptId = `system-${promptType}`;
      const promptName = file.replace(".json", "").replace(/-/g, " ");

      await db
        .insert(prompts)
        .values({
          id: promptId,
          type: promptType,
          name: promptName,
          content: promptData, // Store the entire prompt structure as JSON
          description: __comment || `System ${promptName} prompts`,
          version: version || "1.0",
          isSystem: true,
          isActive: true,
          isPublic: false,
          createdBy: null, // System prompts have no creator
          metadata: {},
        })
        .onConflictDoUpdate({
          target: prompts.id,
          set: {
            content: promptData,
            version: version || "1.0",
            updatedAt: new Date(),
          },
        });

      totalInserted++;
      logger.info(
        { file, type: promptType },
        `[Prompts Seed] Migrated ${file}`,
      );
    }

    logger.info(
      { total: totalInserted },
      `[Prompts Seed] ✓ Successfully migrated ${totalInserted} prompt files`,
    );
  } catch (error: any) {
    logger.error({ err: error }, "[Prompts Seed] ✗ Migration failed:");
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Run seed
seedPrompts()
  .then(() => {
    logger.info({}, "[Prompts Seed] ✓ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ err: error }, "[Prompts Seed] ✗ Seed failed");
    process.exit(1);
  });
