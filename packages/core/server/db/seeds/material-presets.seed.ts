/**
 * Material Presets Seed Script
 * Migrates existing material presets JSON to database
 */

import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { materialPresets } from "../schema/material-presets.schema";
import { logger } from "../../utils/logger";

// Validate environment
if (!process.env.DATABASE_URL) {
  logger.error(
    {
      missing: "DATABASE_URL",
      purpose: "PostgreSQL connection for seeding material presets",
      action: "aborting",
    },
    "DATABASE_URL environment variable is required",
  );
  process.exit(1);
}

const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

interface MaterialPresetJSON {
  id: string;
  name: string;
  displayName: string;
  stylePrompt: string;
  description?: string;
  category: string;
  tier: number;
  color?: string;
}

async function seedMaterialPresets() {
  logger.info(
    {},
    "[Material Presets Seed] Starting material presets migration...",
  );

  const presetsFilePath = join(
    process.cwd(),
    "public",
    "prompts",
    "material-presets.json",
  );

  try {
    const presetsData: MaterialPresetJSON[] = JSON.parse(
      readFileSync(presetsFilePath, "utf-8"),
    );

    logger.info(
      { count: presetsData.length },
      `[Material Presets Seed] Found ${presetsData.length} material presets`,
    );

    let totalInserted = 0;

    for (const preset of presetsData) {
      await db
        .insert(materialPresets)
        .values({
          id: preset.id,
          name: preset.name,
          displayName: preset.displayName,
          stylePrompt: preset.stylePrompt,
          description: preset.description || null,
          category: preset.category,
          tier: preset.tier,
          color: preset.color || null,
          isSystem: true, // All existing presets are system presets
          isActive: true,
          isPublic: false,
          createdBy: null, // System presets have no creator
          metadata: {},
        })
        .onConflictDoUpdate({
          target: materialPresets.id,
          set: {
            name: preset.name,
            displayName: preset.displayName,
            stylePrompt: preset.stylePrompt,
            description: preset.description || null,
            category: preset.category,
            tier: preset.tier,
            color: preset.color || null,
            updatedAt: new Date(),
          },
        });

      totalInserted++;
      logger.info(
        { id: preset.id, category: preset.category, tier: preset.tier },
        `[Material Presets Seed] Migrated ${preset.displayName}`,
      );
    }

    logger.info(
      { total: totalInserted },
      `[Material Presets Seed] ✓ Successfully migrated ${totalInserted} material presets`,
    );
  } catch (error: any) {
    logger.error({ err: error }, "[Material Presets Seed] ✗ Migration failed:");
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Run seed
seedMaterialPresets()
  .then(() => {
    logger.info({}, "[Material Presets Seed] ✓ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ err: error }, "[Material Presets Seed] ✗ Seed failed");
    process.exit(1);
  });
