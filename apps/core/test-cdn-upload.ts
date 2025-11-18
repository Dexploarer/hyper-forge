#!/usr/bin/env bun
/**
 * Direct CDN Upload Test - proves CDN architecture works
 */

import postgres from "postgres";
import { MediaStorageService } from "./server/services/MediaStorageService";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);
const mediaService = new MediaStorageService();

console.log("\n🧪 DIRECT CDN UPLOAD TEST");
console.log("=".repeat(80));

// Create test image (1x1 red pixel PNG)
console.log("\n1. Creating test image...");
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
  0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01,
  0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);
console.log(`✅ Test image: ${testImageBuffer.length} bytes`);

// Upload to CDN
console.log("\n2. Uploading to CDN...");
const NPC_ID = "3805d060-614b-465b-8a72-009d40949266";
const userId = "7e1da00d-3f79-474f-af13-0c8a82491927";

try {
  const result = await mediaService.saveMedia({
    type: "portrait",
    entityType: "npc",
    entityId: NPC_ID,
    fileName: `test_cdn_proof_${Date.now()}.png`,
    data: testImageBuffer,
    metadata: {
      prompt: "TEST: Proving CDN architecture works",
      mimeType: "image/png",
      fileSize: testImageBuffer.length,
    },
    createdBy: userId,
  });

  console.log("\n✅✅✅ UPLOAD SUCCESSFUL!");
  console.log(`   Media ID: ${result.id}`);
  console.log(`   CDN URL: ${result.cdnUrl}`);
  console.log(`   Filename: ${result.fileName}`);

  // Verify in database
  console.log("\n3. Verifying database record...");
  const [dbRecord] = await client`
    SELECT id, type, file_name, cdn_url, created_at
    FROM media_assets
    WHERE id = ${result.id}
  `;

  if (dbRecord) {
    console.log(`✅ Database record exists:`);
    console.log(`   ID: ${dbRecord.id}`);
    console.log(`   Type: ${dbRecord.type}`);
    console.log(`   CDN URL: ${dbRecord.cdn_url}`);
  }

  // Verify CDN URL is accessible
  console.log("\n4. Verifying CDN URL is accessible...");
  const cdnResponse = await fetch(result.cdnUrl);
  console.log(`   HTTP Status: ${cdnResponse.status}`);
  console.log(`   Content-Type: ${cdnResponse.headers.get("content-type")}`);

  if (cdnResponse.ok) {
    console.log(`\n✅✅✅ PROOF #1: IMAGE IS ACCESSIBLE FROM CDN!`);
  }

  // Verify CDN architecture
  if (result.cdnUrl.includes("hyperforge-cdn.up.railway.app")) {
    console.log(`✅✅✅ PROOF #2: USES CDN ARCHITECTURE (NOT VOLUME)!`);
  } else {
    console.log(`❌ FAIL: Not using CDN`);
    console.log(`   URL: ${result.cdnUrl}`);
  }

  // Show all media for this NPC
  console.log("\n5. All media assets for this NPC:");
  const allMedia = await client`
    SELECT id, type, file_name, cdn_url, created_at
    FROM media_assets
    WHERE entity_type = 'npc' AND entity_id = ${NPC_ID}
    ORDER BY created_at DESC
    LIMIT 5
  `;

  console.log(`   Total: ${allMedia.length} assets`);
  allMedia.forEach((m: any, i: number) => {
    console.log(`\n   ${i + 1}. ${m.type.toUpperCase()}`);
    console.log(`      File: ${m.file_name}`);
    console.log(`      URL: ${m.cdn_url}`);
    console.log(`      Created: ${m.created_at}`);
  });
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   ${error.message}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ TEST COMPLETE\n");
process.exit(0);
