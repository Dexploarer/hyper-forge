#!/usr/bin/env bun
/**
 * Cleanup script to delete orphaned media assets
 * Deletes media asset records where files don't exist on volume
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { mediaAssets } from "../db/schema/media.schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const GDD_ASSETS_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "gdd-assets")
  : process.env.ASSETS_DIR
    ? path.join(path.dirname(process.env.ASSETS_DIR), "gdd-assets")
    : path.join(process.cwd(), "gdd-assets");

console.log(`\n🔍 Cleanup Orphaned Media Assets`);
console.log(`📁 Checking directory: ${GDD_ASSETS_DIR}\n`);

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

try {
  // Fetch all media assets without cdnUrl
  const assetsToCheck = await sql`
    SELECT id, type, file_url
    FROM media_assets
    WHERE cdn_url IS NULL
    AND file_url LIKE '/gdd-assets%'
    ORDER BY type, created_at;
  `;

  console.log(`Found ${assetsToCheck.length} media assets to check\n`);

  if (assetsToCheck.length === 0) {
    console.log("✅ No media assets to clean up");
    await sql.end();
    process.exit(0);
  }

  let deleted = 0;
  const deletedAssets = [];

  for (const asset of assetsToCheck) {
    const fileUrl = asset.file_url || asset.fileUrl;
    const relativePath = fileUrl.replace("/gdd-assets/", "");
    const localPath = path.join(GDD_ASSETS_DIR, relativePath);

    // Check if file exists
    try {
      await fs.access(localPath);
      console.log(
        `✓ File exists, keeping: ${asset.type} ${asset.id.substring(0, 8)}...`,
      );
    } catch {
      // File doesn't exist, delete from database
      console.log(
        `✗ File not found, deleting: ${asset.type} ${asset.id.substring(0, 8)}...`,
      );

      try {
        await db.delete(mediaAssets).where(eq(mediaAssets.id, asset.id));

        deleted++;
        deletedAssets.push({
          id: asset.id,
          type: asset.type,
          fileUrl: asset.file_url,
        });
      } catch (error) {
        console.error(`  ⚠️  Failed to delete ${asset.id}:`, error);
      }
    }
  }

  await sql.end();

  console.log(`\n✅ Cleanup complete!`);
  console.log(
    `   Deleted: ${deleted}/${assetsToCheck.length} orphaned media assets`,
  );

  if (deletedAssets.length > 0) {
    console.log(`\n📋 Deleted assets by type:`);
    const byType = deletedAssets.reduce(
      (acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [type, count] of Object.entries(byType)) {
      console.log(`   ${type}: ${count}`);
    }
  }

  process.exit(0);
} catch (error) {
  console.error("\n❌ Cleanup failed:", error);
  await sql.end();
  process.exit(1);
}
