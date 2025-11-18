#!/usr/bin/env bun
/**
 * Check for audio assets in database and CDN
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

console.log("\n🎵 CHECKING AUDIO ASSETS");
console.log("=".repeat(80));

try {
  // Check for all media assets
  console.log("\n1. All media assets in database:");
  const allMedia = await client`
    SELECT id, type, entity_type, entity_id, file_name, cdn_url, created_at
    FROM media_assets
    ORDER BY created_at DESC
    LIMIT 20
  `;

  console.log(`   Total: ${allMedia.length} media assets`);
  allMedia.forEach((m: any, i: number) => {
    console.log(`\n   ${i + 1}. ${m.type.toUpperCase()}`);
    console.log(`      File: ${m.file_name}`);
    console.log(
      `      Entity: ${m.entity_type || "none"}:${m.entity_id || "none"}`,
    );
    console.log(`      CDN URL: ${m.cdn_url}`);
    console.log(`      Created: ${m.created_at}`);
  });

  // Check specifically for audio types
  console.log("\n2. Audio/Music assets:");
  const audioMedia = await client`
    SELECT id, type, entity_type, entity_id, file_name, cdn_url
    FROM media_assets
    WHERE type IN ('music', 'voice', 'sound_effect')
    ORDER BY created_at DESC
  `;

  console.log(`   Found ${audioMedia.length} audio assets`);
  audioMedia.forEach((m: any, i: number) => {
    console.log(`\n   ${i + 1}. ${m.type}`);
    console.log(`      File: ${m.file_name}`);
    console.log(`      URL: ${m.cdn_url}`);
  });

  // Check CDN health
  console.log("\n3. Checking CDN accessibility:");
  const CDN_URL =
    process.env.CDN_URL || "https://hyperforge-cdn.up.railway.app";
  const healthResponse = await fetch(`${CDN_URL}/api/health`);
  console.log(
    `   CDN Health: ${healthResponse.status} ${healthResponse.statusText}`,
  );

  // Try to list files from CDN API
  console.log("\n4. Checking CDN files API:");
  const filesResponse = await fetch(
    `${CDN_URL}/api/files/list?directory=music`,
  );
  if (filesResponse.ok) {
    const files = await filesResponse.json();
    console.log(`   Music directory: ${JSON.stringify(files, null, 2)}`);
  } else {
    console.log(`   Failed to list music files: ${filesResponse.status}`);
  }
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ CHECK COMPLETE\n");
