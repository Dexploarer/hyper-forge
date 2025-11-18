#!/usr/bin/env bun
/**
 * Quick database check script
 * Queries database to see what data we have
 */

import { db } from "./server/db/db";
import { mediaAssets } from "./server/db/schema";
import { eq, count, sql } from "drizzle-orm";

async function checkDatabase() {
  console.log("\n📊 Database Content Check\n");
  console.log("─".repeat(80));

  // Check media assets
  console.log("\n1. Media Assets:");
  const allMedia = await db.select().from(mediaAssets).limit(10);
  console.log(`   Total media assets (first 10):`, allMedia.length);

  if (allMedia.length > 0) {
    console.log("\n   Sample media assets:");
    for (const media of allMedia) {
      console.log(`   - Type: ${media.type}, ID: ${media.id}`);
      console.log(`     CDN URL: ${media.cdnUrl}`);
      console.log(`     Entity: ${media.entityType}:${media.entityId}`);
      console.log(`     Created: ${media.createdAt}`);
    }
  } else {
    console.log("   ❌ No media assets found in database");
  }

  // Check by type
  console.log("\n2. Media Assets by Type:");
  const types = ["portrait", "banner", "voice", "music", "sound_effect"];
  for (const type of types) {
    const typeMedia = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.type, type));
    console.log(`   - ${type}: ${typeMedia.length} files`);

    // Check unassigned
    const unassigned = typeMedia.filter((m) => !m.entityType && !m.entityId);
    if (unassigned.length > 0) {
      console.log(`     └─ ${unassigned.length} unassigned`);
    }
  }

  // Check content
  console.log("\n3. Content Items:");
  const allContent = await db.select().from(content).limit(10);
  console.log(`   Total content items (first 10):`, allContent.length);

  if (allContent.length > 0) {
    console.log("\n   Sample content:");
    for (const item of allContent) {
      console.log(`   - Type: ${item.type}, ID: ${item.id}`);
      console.log(`     Name: ${item.name}`);
      console.log(`     Created: ${item.createdAt}`);
    }
  } else {
    console.log("   ❌ No content items found in database");
  }

  // Check content by type
  console.log("\n4. Content by Type:");
  const contentTypes = ["npc", "quest", "dialogue", "lore"];
  for (const type of contentTypes) {
    const typeContent = await db
      .select()
      .from(content)
      .where(eq(content.type, type));
    console.log(`   - ${type}: ${typeContent.length} items`);
  }

  console.log("\n" + "─".repeat(80));
  console.log("✅ Database check complete\n");
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error checking database:", err);
    process.exit(1);
  });
