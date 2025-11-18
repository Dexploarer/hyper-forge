#!/usr/bin/env bun
/**
 * Fix media asset URLs to point to main API server instead of CDN
 * CDN doesn't have serving routes, so we proxy through the main API
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

// Main API server URL (localhost for dev, Railway public domain for prod)
const API_SERVER_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "http://localhost:3004";

console.log("\n🔧 FIXING MEDIA ASSET URLs");
console.log("=".repeat(80));
console.log(`Target API Server: ${API_SERVER_URL}`);

try {
  // Get all media assets with CDN URLs
  const assets = await client`
    SELECT id, type, file_name, cdn_url
    FROM media_assets
    WHERE cdn_url IS NOT NULL
  `;

  console.log(`\nFound ${assets.length} media assets to update`);

  let updated = 0;
  let skipped = 0;

  for (const asset of assets) {
    // Extract the path after the CDN URL
    // Current: https://hyperforge-cdn.up.railway.app/media/portrait/...
    // Target: http://localhost:3004/media/portrait/...

    const match = asset.cdn_url.match(/\/media\/.+$/);
    if (!match) {
      console.log(
        `   ⏭️  ${asset.file_name} - no /media/ path found, skipping`,
      );
      skipped++;
      continue;
    }

    const mediaPath = match[0]; // e.g., /media/portrait/npc/...
    const newUrl = `${API_SERVER_URL}${mediaPath}`;

    // Update the URL
    await client`
      UPDATE media_assets
      SET cdn_url = ${newUrl}, updated_at = NOW()
      WHERE id = ${asset.id}
    `;

    console.log(`   ✅ ${asset.file_name}`);
    console.log(`      Old: ${asset.cdn_url}`);
    console.log(`      New: ${newUrl}`);
    updated++;
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Updated: ${updated} URLs`);
  console.log(`   ⏭️  Skipped: ${skipped} URLs`);

  // Verify a few samples
  console.log("\n🔍 Verification - Sample URLs:");
  const samples = await client`
    SELECT type, file_name, cdn_url
    FROM media_assets
    LIMIT 5
  `;

  samples.forEach((s: any) => {
    console.log(`   ${s.type}: ${s.cdn_url}`);
  });
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ URL FIX COMPLETE\n");
