#!/usr/bin/env bun
/**
 * Test audio URLs to see if they're accessible
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

console.log("\n🎵 TESTING AUDIO PLAYBACK URLS");
console.log("=".repeat(80));

try {
  // Get a few audio assets from each type
  console.log("\n1. Fetching sample audio assets from database:");
  const samples = await client`
    SELECT id, type, file_name, cdn_url
    FROM media_assets
    WHERE type IN ('music', 'voice', 'sound_effect')
    ORDER BY type, created_at DESC
    LIMIT 10
  `;

  console.log(`   Found ${samples.length} sample audio assets`);

  // Test each URL
  console.log("\n2. Testing audio URLs:");
  for (const asset of samples) {
    console.log(`\n   Testing: ${asset.type} - ${asset.file_name}`);
    console.log(`   URL: ${asset.cdn_url}`);

    try {
      const response = await fetch(asset.cdn_url, { method: "HEAD" });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get("content-type")}`);
      console.log(
        `   Content-Length: ${response.headers.get("content-length")}`,
      );

      if (response.status === 200) {
        console.log(`   ✅ Accessible`);
      } else {
        console.log(`   ❌ Not accessible`);
      }
    } catch (error) {
      console.log(
        `   ❌ Error: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    }
  }

  // Check what the frontend query returns
  console.log("\n3. Testing frontend audio query (/api/voice/saved):");
  const frontendResponse = await fetch("http://localhost:3004/api/voice/saved");
  console.log(`   Status: ${frontendResponse.status}`);

  if (frontendResponse.ok) {
    const data = await frontendResponse.json();
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } else {
    console.log(`   Error: ${await frontendResponse.text()}`);
  }
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ TEST COMPLETE\n");
