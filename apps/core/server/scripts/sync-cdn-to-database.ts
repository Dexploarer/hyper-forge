/**
 * Sync CDN Assets to Database
 *
 * This script fetches all assets from the CDN and creates database records for them.
 * Use this when the CDN has assets but the database is empty.
 *
 * Usage: bun server/scripts/sync-cdn-to-database.ts <owner-user-id>
 */

import { db } from "../db/db";
import { assets } from "../db/schema";
import { env } from "../config/env";

const ownerId = process.argv[2];

if (!ownerId) {
  console.error(
    "Usage: bun server/scripts/sync-cdn-to-database.ts <owner-user-id>",
  );
  console.error("\nGet your user ID from Railway database:");
  console.error("  SELECT id, email, display_name FROM users;");
  process.exit(1);
}

async function syncCDNToDatabase() {
  try {
    const CDN_URL = env.CDN_URL;
    const CDN_API_KEY = env.CDN_API_KEY;

    if (!CDN_URL || !CDN_API_KEY) {
      console.error("❌ CDN_URL and CDN_API_KEY must be set in .env");
      process.exit(1);
    }

    console.log(`\n🔍 Fetching files from CDN: ${CDN_URL}\n`);

    // Fetch all files from CDN
    const response = await fetch(`${CDN_URL}/api/files`, {
      headers: {
        "X-API-Key": CDN_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch from CDN: ${response.status} ${response.statusText}`,
      );
      process.exit(1);
    }

    const data = await response.json();
    const files = data.files || [];

    console.log(`📦 Found ${files.length} files on CDN\n`);

    // Filter for model files (.glb)
    const modelFiles = files.filter(
      (file: any) => file.path.endsWith(".glb") && file.directory === "models",
    );

    console.log(`🎯 Found ${modelFiles.length} 3D model files\n`);

    if (modelFiles.length === 0) {
      console.log("No model files found. Exiting.");
      process.exit(0);
    }

    // Group files by asset ID (directory name)
    const assetGroups = new Map<string, any[]>();
    for (const file of files) {
      // Extract asset ID from path: "models/asset-id/file.glb" -> "asset-id"
      const pathParts = file.path.split("/");
      if (pathParts.length >= 2 && pathParts[0] === "models") {
        const assetId = pathParts[1];
        if (!assetGroups.has(assetId)) {
          assetGroups.set(assetId, []);
        }
        assetGroups.get(assetId)!.push(file);
      }
    }

    console.log(`📁 Found ${assetGroups.size} unique assets\n`);
    console.log("Creating database records...\n");

    let created = 0;
    let skipped = 0;

    for (const [assetId, assetFiles] of assetGroups) {
      // Find main model file
      const modelFile = assetFiles.find((f) => f.path.endsWith(".glb"));
      if (!modelFile) {
        console.log(`⚠️  Skipping ${assetId} - no .glb file found`);
        skipped++;
        continue;
      }

      // Check if already exists in database
      const existing = await db.query.assets.findFirst({
        where: (assets, { eq }) => eq(assets.id, assetId),
      });

      if (existing) {
        console.log(`⏭️  ${assetId} - already in database`);
        skipped++;
        continue;
      }

      // Extract metadata from asset ID and files
      const name = assetId
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const cdnUrl = `${CDN_URL}/${modelFile.path}`;

      // Find thumbnail and concept art
      const thumbnailFile = assetFiles.find(
        (f) => f.path.includes("sprites") && f.path.endsWith(".png"),
      );
      const conceptArtFile = assetFiles.find(
        (f) => f.path.endsWith("concept-art.png") || f.path.endsWith("pfp.png"),
      );

      // Determine asset type from path or name
      let type = "unknown";
      if (assetId.includes("character") || assetId.includes("npc")) {
        type = "character";
      } else if (
        assetId.includes("weapon") ||
        assetId.includes("sword") ||
        assetId.includes("axe")
      ) {
        type = "weapon";
      } else if (assetId.includes("armor") || assetId.includes("helmet")) {
        type = "armor";
      } else if (
        assetId.includes("environment") ||
        assetId.includes("building")
      ) {
        type = "environment";
      } else if (assetId.includes("prop")) {
        type = "prop";
      }

      // Create database record
      await db.insert(assets).values({
        id: assetId,
        name,
        description: `Imported from CDN`,
        type,
        ownerId,
        cdnUrl,
        cdnThumbnailUrl: thumbnailFile
          ? `${CDN_URL}/${thumbnailFile.path}`
          : null,
        cdnConceptArtUrl: conceptArtFile
          ? `${CDN_URL}/${conceptArtFile.path}`
          : null,
        metadata: {
          name,
          type,
          importedFromCDN: true,
          cdnFiles: assetFiles.map((f: any) => `${CDN_URL}/${f.path}`),
        },
        status: "completed",
        visibility: "public",
        tags: [],
      });

      console.log(`✅ ${assetId} - created (${type})`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📦 Total: ${assetGroups.size}`);

    console.log(`\n✨ Sync complete! Refresh your app to see assets.\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

syncCDNToDatabase();
