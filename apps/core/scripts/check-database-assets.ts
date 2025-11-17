#!/usr/bin/env bun
/**
 * Check Database Assets Script
 * Queries the database to see what assets exist and their CDN URL status
 */

import { db } from "../server/db/db";
import { assets } from "../server/db/schema";
import { sql } from "drizzle-orm";

async function checkAssets() {
  console.log("🔍 Checking assets in database...\n");

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets);
  
  console.log(`📊 Total assets: ${countResult.count}\n`);

  if (countResult.count === 0) {
    console.log("❌ No assets found in database!");
    console.log("💡 This is why the assets page appears empty.\n");
    return;
  }

  // Get sample assets with CDN status
  const sampleAssets = await db
    .select({
      id: assets.id,
      name: assets.name,
      type: assets.type,
      hasModel: sql<boolean>`${assets.cdnUrl} IS NOT NULL`,
      cdnUrl: assets.cdnUrl,
      cdnThumbnailUrl: assets.cdnThumbnailUrl,
      cdnConceptArtUrl: assets.cdnConceptArtUrl,
      ownerId: assets.ownerId,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .limit(10);

  console.log("📋 Sample assets:\n");
  
  sampleAssets.forEach((asset, index) => {
    console.log(`${index + 1}. ${asset.name} (${asset.type})`);
    console.log(`   ID: ${asset.id}`);
    console.log(`   Owner: ${asset.ownerId || 'N/A'}`);
    console.log(`   Has CDN URL: ${asset.hasModel ? '✅' : '❌'}`);
    if (asset.cdnUrl) {
      console.log(`   CDN URL: ${asset.cdnUrl}`);
    }
    if (asset.cdnThumbnailUrl) {
      console.log(`   Thumbnail: ${asset.cdnThumbnailUrl}`);
    }
    if (asset.cdnConceptArtUrl) {
      console.log(`   Concept Art: ${asset.cdnConceptArtUrl}`);
    }
    console.log(`   Created: ${asset.createdAt}`);
    console.log("");
  });

  // Get CDN URL statistics
  const [statsResult] = await db
    .select({
      withCdnUrl: sql<number>`count(*) FILTER (WHERE ${assets.cdnUrl} IS NOT NULL)`,
      withoutCdnUrl: sql<number>`count(*) FILTER (WHERE ${assets.cdnUrl} IS NULL)`,
      withThumbnail: sql<number>`count(*) FILTER (WHERE ${assets.cdnThumbnailUrl} IS NOT NULL)`,
      withConceptArt: sql<number>`count(*) FILTER (WHERE ${assets.cdnConceptArtUrl} IS NOT NULL)`,
    })
    .from(assets);

  console.log("📈 CDN Statistics:");
  console.log(`   Assets with CDN URL: ${statsResult.withCdnUrl} / ${countResult.count}`);
  console.log(`   Assets without CDN URL: ${statsResult.withoutCdnUrl} / ${countResult.count}`);
  console.log(`   Assets with Thumbnail: ${statsResult.withThumbnail} / ${countResult.count}`);
  console.log(`   Assets with Concept Art: ${statsResult.withConceptArt} / ${countResult.count}\n`);

  if (statsResult.withoutCdnUrl > 0) {
    console.log("⚠️  Some assets are missing CDN URLs!");
    console.log("💡 These assets were created before CDN migration.\n");
  }

  // Check if any users exist
  const [userCount] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
  console.log(`👥 Total users: ${(userCount as any).count}\n`);

  process.exit(0);
}

checkAssets().catch((error) => {
  console.error("❌ Error checking assets:", error);
  process.exit(1);
});
