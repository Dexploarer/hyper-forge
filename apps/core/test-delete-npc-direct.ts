#!/usr/bin/env bun
/**
 * Direct test of ContentDatabaseService.deleteNPC()
 * Bypasses API to test the service method directly
 */

import postgres from "postgres";
import { ContentDatabaseService } from "./server/services/ContentDatabaseService";

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL);

const NPC_ID = "3805d060-614b-465b-8a72-009d40949266";
const userId = "7e1da00d-3f79-474f-af13-0c8a82491927";

console.log("\n🧪 DIRECT TEST: ContentDatabaseService.deleteNPC()");
console.log("=".repeat(80));

try {
  // Check if NPC exists first
  console.log("\n1. Checking if NPC exists...");
  const [npc] = await client`
    SELECT id, name, created_by, deleted_at
    FROM npcs
    WHERE id = ${NPC_ID}
  `;

  if (!npc) {
    console.log("❌ NPC not found in database");
    await client.end();
    process.exit(1);
  }

  console.log(`✅ Found NPC: ${npc.name}`);
  console.log(`   ID: ${npc.id}`);
  console.log(`   Created By: ${npc.created_by}`);
  console.log(`   Deleted At: ${npc.deleted_at || "null"}`);

  // Check for related media assets
  console.log("\n2. Checking for related media assets...");
  const mediaAssets = await client`
    SELECT id, type, file_name, cdn_url
    FROM media_assets
    WHERE entity_type = 'npc' AND entity_id = ${NPC_ID}
  `;
  console.log(`   Found ${mediaAssets.length} media assets`);
  mediaAssets.forEach((asset: any) => {
    console.log(`   - ${asset.type}: ${asset.file_name}`);
  });

  // Try to delete using ContentDatabaseService
  console.log("\n3. Attempting to delete NPC via ContentDatabaseService...");
  const service = new ContentDatabaseService();

  await service.deleteNPC(NPC_ID, userId);

  console.log("✅✅✅ DELETE SUCCESSFUL!");

  // Verify deletion
  console.log("\n4. Verifying NPC was deleted...");
  const [deleted] = await client`
    SELECT id, name, deleted_at
    FROM npcs
    WHERE id = ${NPC_ID}
  `;

  if (deleted) {
    console.log(`❌ NPC still exists in database!`);
    console.log(`   Deleted At: ${deleted.deleted_at}`);
  } else {
    console.log(`✅ NPC successfully removed from database`);
  }
} catch (error) {
  console.error("\n❌ ERROR:");
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack:\n${error.stack}`);
  } else {
    console.error(error);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ TEST COMPLETE\n");
process.exit(0);
