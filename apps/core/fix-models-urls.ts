#!/usr/bin/env bun
/**
 * Fix /models/* media asset URLs to point to main API server
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

const API_SERVER_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "http://localhost:3004";

console.log("\n🔧 FIXING /models/* MEDIA URLs");
console.log("=".repeat(80));
console.log(`Target API Server: ${API_SERVER_URL}`);

try {
  // Get all media assets with /models/ paths
  const assets = await client`
    SELECT id, type, file_name, cdn_url
    FROM media_assets
    WHERE cdn_url LIKE '%/models/%'
  `;

  console.log(`\nFound ${assets.length} /models/* assets to update`);

  let updated = 0;

  for (const asset of assets) {
    // Extract the path after the CDN URL
    // Current: https://hyperforge-cdn.up.railway.app/models/npc_*/voice/*.mp3
    // Target: http://localhost:3004/models/npc_*/voice/*.mp3

    const match = asset.cdn_url.match(/\/models\/.+$/);
    if (!match) {
      console.log(
        `   ⏭️  ${asset.file_name} - no /models/ path found, skipping`,
      );
      continue;
    }

    const modelsPath = match[0];
    const newUrl = `${API_SERVER_URL}${modelsPath}`;

    await client`
      UPDATE media_assets
      SET cdn_url = ${newUrl}, updated_at = NOW()
      WHERE id = ${asset.id}
    `;

    console.log(`   ✅ ${asset.file_name}`);
    console.log(`      ${newUrl}`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} /models/* URLs`);
} catch (error) {
  console.error("\n❌ ERROR:", error);
}

await client.end();
console.log("\n" + "=".repeat(80) + "\n");
