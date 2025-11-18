#!/usr/bin/env bun
/**
 * Populate database with existing audio files from CDN
 * Scans CDN for MP3 files and creates media_assets records
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL!;
const CDN_URL = process.env.CDN_URL || "https://hyperforge-cdn.up.railway.app";
const client = postgres(DATABASE_URL);

console.log("\n🎵 POPULATING DATABASE WITH EXISTING AUDIO FILES");
console.log("=".repeat(80));

try {
  // Fetch all assets from CDN
  console.log("\n1. Fetching all assets from CDN...");
  const response = await fetch(`${CDN_URL}/api/assets`);

  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.status}`);
  }

  const data = await response.json();
  const allFiles = data.files || [];

  console.log(`   Total files on CDN: ${allFiles.length}`);

  // Filter for audio files (MP3, WAV, OGG, M4A)
  const audioFiles = allFiles.filter((file: any) => {
    const ext = file.type?.toLowerCase();
    return ext === ".mp3" || ext === ".wav" || ext === ".ogg" || ext === ".m4a";
  });

  console.log(`   Audio files found: ${audioFiles.length}`);

  if (audioFiles.length === 0) {
    console.log("   No audio files to process");
    await client.end();
    process.exit(0);
  }

  // Process each audio file
  console.log("\n2. Creating database records for audio files:");
  let created = 0;
  let skipped = 0;

  for (const file of audioFiles) {
    const cdnUrl = `${CDN_URL}/${file.path}`;

    // Check if record already exists
    const [existing] = await client`
      SELECT id FROM media_assets WHERE cdn_url = ${cdnUrl}
    `;

    if (existing) {
      console.log(`   ⏭️  ${file.name} - already exists`);
      skipped++;
      continue;
    }

    // Determine media type
    let mediaType = "music";
    if (file.path.includes("/voice/")) {
      mediaType = "voice";
    } else if (file.path.includes("sound") || file.path.includes("sfx")) {
      mediaType = "sound_effect";
    }

    // Extract entity info from path if possible
    let entityType = null;
    let entityId = null;
    const npcMatch = file.path.match(/npc_([^/]+)/);
    if (npcMatch && mediaType === "voice") {
      entityType = "npc";
      // Try to find NPC ID by name (this is best effort)
    }

    // Create database record
    await client`
      INSERT INTO media_assets (
        type,
        entity_type,
        entity_id,
        file_name,
        cdn_url,
        metadata,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${mediaType},
        ${entityType},
        ${entityId},
        ${file.name},
        ${cdnUrl},
        ${JSON.stringify({
          fileSize: file.size,
          mimeType: file.type === ".mp3" ? "audio/mpeg" : "audio/wav",
          source: "legacy_cdn_import",
          originalPath: file.path,
        })},
        NULL,
        NOW(),
        NOW()
      )
    `;

    console.log(`   ✅ ${file.name} (${mediaType}) - created`);
    created++;
  }

  console.log("\n3. Summary:");
  console.log(`   ✅ Created: ${created} records`);
  console.log(`   ⏭️  Skipped: ${skipped} existing records`);

  // Verify
  console.log("\n4. Verification - Audio assets in database:");
  const audioAssets = await client`
    SELECT type, COUNT(*)::int as count
    FROM media_assets
    WHERE type IN ('music', 'voice', 'sound_effect')
    GROUP BY type
  `;

  audioAssets.forEach((row: any) => {
    console.log(`   ${row.type}: ${row.count} assets`);
  });
} catch (error) {
  console.error("\n❌ ERROR:", error);
  if (error instanceof Error) {
    console.error(`   Message: ${error.message}`);
  }
}

await client.end();
console.log("\n" + "=".repeat(80));
console.log("✅ POPULATION COMPLETE\n");
