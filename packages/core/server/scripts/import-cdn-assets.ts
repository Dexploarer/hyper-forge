/**
 * Import CDN Assets to Database
 * Scans the CDN for assets and creates database records for them
 */

import { db } from "../db/db";
import { assets } from "../db/schema/assets.schema";
import { logger } from "../utils/logger";
import { randomUUID } from "crypto";

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
    const response = await fetch(`${CDN_URL}/api/files`);

    if (!response.ok) {
      throw new Error(
        `CDN list failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const cdnFiles: CDNAsset[] = data.files || [];
    logger.info(
      { context: "CDN Import", fileCount: cdnFiles.length },
      "Found files on CDN",
    );

    // Group files by asset ID (directory name)
    // Files from CDN are in format like "models/assetId/file.glb"
    const assetMap = new Map<string, CDNAsset[]>();
    for (const file of cdnFiles) {
      const parts = file.path.split("/");
      // Expected format: models/assetId/file.ext
      if (parts.length < 3 || parts[0] !== "models") continue;

      const assetId = parts[1]; // Second part is the asset ID (after 'models/')
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
        // Note: file.path already includes "models/" prefix
        const cdnUrl = `${CDN_URL}/${modelFile.path}`;
        const cdnThumbnailUrl = thumbnailFile
          ? `${CDN_URL}/${thumbnailFile.path}`
          : undefined;
        const cdnConceptArtUrl = conceptArtFile
          ? `${CDN_URL}/${conceptArtFile.path}`
          : undefined;

        const assetUUID = randomUUID();

        await db.insert(assets).values({
          id: assetUUID,
          name: assetId.replace(/-/g, " ").replace(/_/g, " "), // Convert kebab-case to readable name
          description: `Imported from CDN`,
          type: "character", // Default type, can be updated later
          cdnUrl,
          cdnThumbnailUrl,
          cdnConceptArtUrl,
          cdnFiles: files.map((f) => `${CDN_URL}/${f.path}`),
          metadata: {
            importedFromCDN: true,
            importedAt: new Date().toISOString(),
            fileCount: files.length,
            cdnAssetId: assetId, // Store original directory name
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
