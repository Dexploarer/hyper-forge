#!/usr/bin/env bun
/**
 * Check CDN status in database
 */
import { db } from "./server/db/db";
import { assets } from "./server/db/schema";
import { sql } from "drizzle-orm";

async function checkCDNStatus() {
  console.log("🔍 Checking CDN status in database...\n");

  // Get counts
  const result = await db
    .select({
      totalAssets: sql<number>`count(*)::int`,
      withCdnUrl: sql<number>`count(*) FILTER (WHERE cdn_url IS NOT NULL)::int`,
      withoutCdnUrl: sql<number>`count(*) FILTER (WHERE cdn_url IS NULL)::int`,
    })
    .from(assets);

  const stats = result[0];

  console.log("📊 Asset Statistics:");
  console.log(`   Total assets:          ${stats.totalAssets}`);
  console.log(`   With CDN URL:          ${stats.withCdnUrl}`);
  console.log(`   Without CDN URL:       ${stats.withoutCdnUrl}`);
  console.log(
    `   % with CDN:            ${((stats.withCdnUrl / stats.totalAssets) * 100).toFixed(1)}%\n`,
  );

  // Sample some assets
  const sampleAssets = await db
    .select({
      id: assets.id,
      name: assets.name,
      cdnUrl: assets.cdnUrl,
      filePath: assets.filePath,
    })
    .from(assets)
    .limit(5);

  console.log("📦 Sample Assets (first 5):");
  for (const asset of sampleAssets) {
    console.log(`   ${asset.name}`);
    console.log(`     ID: ${asset.id}`);
    console.log(`     CDN URL: ${asset.cdnUrl || "❌ NOT SET"}`);
    console.log(`     File Path: ${asset.filePath || "N/A"}`);
    console.log("");
  }

  process.exit(0);
}

checkCDNStatus().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
