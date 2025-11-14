/**
 * Import CDN Assets to Database
 * Scans the CDN for assets and creates database records for them
 */

import { db } from "../db/db";
import { assets } from "../db/schema/assets.schema";
import { logger } from "../utils/logger";

const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
const CDN_API_KEY = process.env.CDN_API_KEY;

interface CDNAsset {
  path: string;
  size: number;
  lastModified: string;
}

async function importCDNAssets() {
  try {
    logger.info({ context: "CDN Import" }, "Starting CDN asset import...");

    if (!CDN_API_KEY) {
      throw new Error("CDN_API_KEY is required");
    }

    // List all assets from CDN
    const response = await fetch(`${CDN_URL}/api/list?directory=models`, {
      headers: {
        "X-API-Key": CDN_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(
        `CDN list failed: ${response.status} ${response.statusText}`,
      );
    }

    const cdnFiles: CDNAsset[] = await response.json();
    logger.info(
      { context: "CDN Import", fileCount: cdnFiles.length },
      "Found files on CDN",
    );

    // Group files by asset ID (directory name)
    const assetMap = new Map<string, CDNAsset[]>();
    for (const file of cdnFiles) {
      const parts = file.path.split("/");
      if (parts.length < 2) continue;

      const assetId = parts[0]; // First part is the asset ID
      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, []);
      }
      assetMap.get(assetId)!.push(file);
    }

    logger.info(
      { context: "CDN Import", assetCount: assetMap.size },
      "Grouped into assets",
    );

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Import each asset
    for (const [assetId, files] of assetMap) {
      try {
        // Check if asset already exists in database
        const existing = await db.query.assets.findFirst({
          where: (assets, { eq }) => eq(assets.id, assetId),
        });

        if (existing) {
          logger.debug(
            { context: "CDN Import", assetId },
            "Asset already in database, skipping",
          );
          skipped++;
          continue;
        }

        // Find main model file (.glb)
        const modelFile = files.find((f) => f.path.endsWith(".glb"));
        if (!modelFile) {
          logger.warn(
            { context: "CDN Import", assetId },
            "No .glb file found, skipping",
          );
          skipped++;
          continue;
        }

        // Find other files
        const thumbnailFile = files.find(
          (f) => f.path.includes("thumbnail") || f.path.endsWith(".png"),
        );
        const conceptArtFile = files.find((f) =>
          f.path.includes("concept-art"),
        );

        // Create database record
        const cdnUrl = `${CDN_URL}/models/${modelFile.path}`;
        const cdnThumbnailUrl = thumbnailFile
          ? `${CDN_URL}/models/${thumbnailFile.path}`
          : undefined;
        const cdnConceptArtUrl = conceptArtFile
          ? `${CDN_URL}/models/${conceptArtFile.path}`
          : undefined;

        await db.insert(assets).values({
          id: assetId,
          name: assetId.replace(/-/g, " ").replace(/_/g, " "), // Convert kebab-case to readable name
          description: `Imported from CDN`,
          type: "character", // Default type, can be updated later
          cdnUrl,
          cdnThumbnailUrl,
          cdnConceptArtUrl,
          cdnFiles: files.map((f) => `${CDN_URL}/models/${f.path}`),
          metadata: {
            importedFromCDN: true,
            importedAt: new Date().toISOString(),
            fileCount: files.length,
          },
          isPublic: true, // Make imported assets public by default
          createdAt: new Date(modelFile.lastModified),
          updatedAt: new Date(),
        });

        logger.info({ context: "CDN Import", assetId }, "Imported asset");
        imported++;
      } catch (error) {
        logger.error(
          { context: "CDN Import", assetId, err: error },
          "Failed to import asset",
        );
        failed++;
      }
    }

    logger.info(
      { context: "CDN Import", imported, skipped, failed },
      "CDN import completed",
    );

    return { imported, skipped, failed };
  } catch (error) {
    logger.error({ context: "CDN Import", err: error }, "CDN import failed");
    throw error;
  }
}

// Run if called directly
if (import.meta.main) {
  importCDNAssets()
    .then((result) => {
      console.log("Import completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Import failed:", error);
      process.exit(1);
    });
}

export { importCDNAssets };
