#!/usr/bin/env bun

/**
 * Migrate media files from /gdd-assets to CDN
 * Updates database cdnUrl field after successful upload
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { mediaAssets } from "../db/schema/media.schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
const CDN_API_KEY = process.env.CDN_API_KEY;
const ASSETS_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.ASSETS_DIR ||
  "/Users/home/Forge Workspace/asset-forge/packages/core/gdd-assets";

if (!CDN_API_KEY) {
  console.error("❌ CDN_API_KEY is required");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

console.log("\n🚀 Media CDN Migration Tool\n");
console.log(`CDN URL: ${CDN_URL}`);
console.log(`Assets Dir: ${ASSETS_DIR}\n`);

async function uploadFileToCDN(
  filePath: string,
  cdnPath: string,
): Promise<string | null> {
  try {
    const file = await fs.readFile(filePath);
    const formData = new FormData();

    // Extract filename from cdnPath
    const fileName = path.basename(cdnPath);
    const blob = new Blob([file], {
      type: fileName.endsWith(".mp3")
        ? "audio/mpeg"
        : fileName.endsWith(".wav")
          ? "audio/wav"
          : fileName.endsWith(".ogg")
            ? "audio/ogg"
            : fileName.endsWith(".png")
              ? "image/png"
              : "application/octet-stream",
    });

    formData.append("files", blob, fileName);
    formData.append("path", path.dirname(cdnPath));

    const response = await fetch(`${CDN_URL}/api/upload`, {
      method: "POST",
      headers: {
        "x-api-key": CDN_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ CDN upload failed (${response.status}): ${error}`);
      return null;
    }

    const result = await response.json();
    const uploadedFile = result.files?.[0];
    if (!uploadedFile) {
      console.error("  ❌ No file in upload response");
      return null;
    }

    return uploadedFile.cdnUrl;
  } catch (error) {
    console.error(`  ❌ Error uploading: ${error}`);
    return null;
  }
}

async function migrateMediaAsset(asset: any): Promise<boolean> {
  // Extract relative path from fileUrl (SQL returns snake_case)
  // /gdd-assets/media/voice/voice_123.mp3 -> media/voice/voice_123.mp3
  const fileUrl = asset.file_url || asset.fileUrl;
  const relativePath = fileUrl.replace("/gdd-assets/", "");
  const localPath = path.join(ASSETS_DIR, relativePath);

  console.log(`\n📦 ${asset.type}: ${asset.id.substring(0, 8)}...`);
  console.log(`  Local: ${relativePath}`);

  // Check if file exists locally
  try {
    await fs.access(localPath);
  } catch {
    console.log(`  ⚠️  Local file not found, skipping`);
    return false;
  }

  // Upload to CDN
  const cdnUrl = await uploadFileToCDN(localPath, relativePath);

  if (!cdnUrl) {
    return false;
  }

  console.log(`  ✅ CDN: ${cdnUrl}`);

  // Update database
  try {
    await db
      .update(mediaAssets)
      .set({ cdnUrl })
      .where(eq(mediaAssets.id, asset.id));

    console.log(`  ✅ Database updated`);
    return true;
  } catch (error) {
    console.error(`  ❌ Database update failed: ${error}`);
    return false;
  }
}

async function main() {
  try {
    // Fetch all media assets without cdnUrl
    const assetsToMigrate = await sql`
      SELECT id, type, file_url
      FROM media_assets
      WHERE cdn_url IS NULL
      AND file_url LIKE '/gdd-assets%'
      ORDER BY type, created_at;
    `;

    console.log(`Found ${assetsToMigrate.length} media assets to migrate\n`);

    if (assetsToMigrate.length === 0) {
      console.log("✅ No migration needed!\n");
      await sql.end();
      return;
    }

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const asset of assetsToMigrate) {
      const result = await migrateMediaAsset(asset);
      if (result === true) {
        succeeded++;
      } else if (result === false) {
        skipped++;
      } else {
        failed++;
      }

      // Small delay to avoid overwhelming CDN
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n\n📊 Migration Summary:`);
    console.log(`  ✅ Succeeded: ${succeeded}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📦 Total: ${assetsToMigrate.length}\n`);

    await sql.end();
  } catch (error) {
    console.error("❌ Migration error:", error);
    await sql.end();
    process.exit(1);
  }
}

main();
