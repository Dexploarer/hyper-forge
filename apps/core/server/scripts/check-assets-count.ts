/**
 * Quick script to check assets count in database
 */
import { db } from "../db";
import { assets } from "../db/schema";
import { count } from "drizzle-orm";

async function checkAssetsCount() {
  try {
    console.log("Checking assets in database...\n");

    // Get total count
    const result = await db.select({ count: count() }).from(assets);
    const totalAssets = result[0]?.count || 0;

    console.log(`Total assets in database: ${totalAssets}`);

    // Get first 5 assets to see what's there
    if (totalAssets > 0) {
      const sampleAssets = await db
        .select({
          id: assets.id,
          name: assets.name,
          type: assets.type,
          ownerId: assets.ownerId,
        })
        .from(assets)
        .limit(5);

      console.log("\nSample assets:");
      sampleAssets.forEach((asset, i) => {
        console.log(
          `  ${i + 1}. ${asset.name} (${asset.type}) - Owner: ${asset.ownerId}`,
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking assets:", error);
    process.exit(1);
  }
}

checkAssetsCount();
