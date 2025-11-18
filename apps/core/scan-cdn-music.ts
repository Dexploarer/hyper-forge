#!/usr/bin/env bun
/**
 * Scan CDN for existing music files and check if they have database records
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const CDN_URL = process.env.CDN_URL || "https://hyperforge-cdn.up.railway.app";
const CDN_API_KEY = process.env.CDN_API_KEY || "";
const client = postgres(DATABASE_URL);

console.log("\n🎵 SCANNING CDN FOR MUSIC FILES");
console.log("=".repeat(80));
console.log(`CDN URL: ${CDN_URL}`);

try {
  // Try to list music files via CDN API
  console.log("\n1. Fetching music directory listing from CDN...");

  const response = await fetch(`${CDN_URL}/api/files/list?directory=music`, {
    headers: {
      "X-API-Key": CDN_API_KEY,
    },
  });

  console.log(`   Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    console.log("\n   ❌ Could not list music files from CDN API");
    console.log("   Trying alternative: direct CDN browse...");

    // Try browsing the CDN directly
    const browseResponse = await fetch(`${CDN_URL}/api/assets?type=music`);
    console.log(`   Browse response: ${browseResponse.status}`);

    if (browseResponse.ok) {
      const assets = await browseResponse.json();
      console.log(`   Found assets: ${JSON.stringify(assets, null, 2)}`);
    }
  } else {
    const files = await response.json();
    console.log(`\n   Found ${files.length || 0} music files:`);
    console.log(JSON.stringify(files, null, 2));

    // Check which files have database records
    console.log("\n2. Checking which files have database records:");
    for (const file of files) {
      const cdnUrl = `${CDN_URL}/music/${file.name}`;
      const [dbRecord] = await client`
        SELECT id, file_name, cdn_url
        FROM media_assets
        WHERE cdn_url = ${cdnUrl}
      `;

      if (dbRecord) {
        console.log(`   ✅ ${file.name} - HAS database record`);
      } else {
        console.log(`   ❌ ${file.name} - MISSING database record`);
      }
    }
  }

  // Check if there are ANY files in the /music path on CDN
  console.log("\n3. Testing direct CDN music path access:");
  const testFiles = ["sample.mp3", "theme.mp3", "battle.mp3"];
  for (const filename of testFiles) {
    const testUrl = `${CDN_URL}/music/${filename}`;
    const testResponse = await fetch(testUrl, { method: "HEAD" });
    console.log(`   ${testUrl}: ${testResponse.status}`);
  }
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ SCAN COMPLETE\n");
