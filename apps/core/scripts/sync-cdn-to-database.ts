#!/usr/bin/env bun
/**
 * Sync CDN Assets to Database
 * Creates database records for assets that exist on CDN but not in database
 */

import { db } from "../server/db/db";
import { assets } from "../server/db/schema";
import { eq } from "drizzle-orm";

const CDN_URL = process.env.CDN_URL || "https://hyperforge-cdn.up.railway.app";
const CDN_API_KEY = process.env.CDN_API_KEY;

if (!CDN_API_KEY) {
  console.error("❌ CDN_API_KEY not set in environment");
  process.exit(1);
}

interface CDNFile {
  path: string;
  name: string;
  size: number;
  modified: string;
  type: string;
}

async function getCDNFiles(): Promise<CDNFile[]> {
  console.log("📡 Fetching files from CDN...\n");
  
  const response = await fetch(`${CDN_URL}/api/files`, {
    headers: {
      Authorization: `Bearer ${CDN_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`CDN request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.files;
}

function extractAssetIdFromPath(path: string): string | null {
  // Extract asset ID from paths like:
  // - models/sword-base/sword-base.glb -> sword-base
  // - models/human/human_rigged.glb -> human
  // - models/test-cdn-upload-1763129623532/test-cdn-upload-1763129623532.glb -> test-cdn-upload-1763129623532
  
  const match = path.match(/^models\/([^\/]+)\//);
  if (match) {
    return match[1];
  }
  
  // Handle root-level model files
  const rootMatch = path.match(/^models\/([^\/]+)\.glb$/);
  if (rootMatch) {
    return rootMatch[1];
  }
  
  return null;
}

function inferAssetType(assetId: string): string {
  const id = assetId.toLowerCase();
  
  if (id.includes('sword') || id.includes('axe') || id.includes('bow') || 
      id.includes('mace') || id.includes('pickaxe') || id.includes('hatchet')) {
    return 'weapon';
  }
  
  if (id.includes('helmet') || id.includes('chainbody') || id.includes('shield')) {
    return 'armor';
  }
  
  if (id.includes('human') || id.includes('goblin') || id.includes('troll') || 
      id.includes('imp') || id.includes('thug')) {
    return 'character';
  }
  
  if (id.includes('tree') || id.includes('tower') || id.includes('logs')) {
    return 'environment';
  }
  
  return 'prop';
}

async function syncCDNToDatabase() {
  console.log("🔄 Starting CDN to Database Sync\n");
  
  // Get all CDN files
  const cdnFiles = await getCDNFiles();
  console.log(`📦 Found ${cdnFiles.length} total files on CDN\n`);
  
  // Get ALL .glb model files
  const modelFiles = cdnFiles.filter(file => {
    return file.path.startsWith('models/') && file.path.endsWith('.glb');
  });
  
  console.log(`🎯 Found ${modelFiles.length} main model files\n`);
  
  // Get existing assets from database
  const existingAssets = await db.select({ id: assets.id, name: assets.name }).from(assets);
  const existingIds = new Set(existingAssets.map(a => a.id));
  const existingNames = new Set(existingAssets.map(a => a.name.toLowerCase()));
  
  console.log(`💾 Existing assets in database: ${existingAssets.length}\n`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const file of modelFiles) {
    const assetId = extractAssetIdFromPath(file.path);
    
    if (!assetId) {
      console.log(`⚠️  Skipping ${file.path} - couldn't extract asset ID`);
      skipped++;
      continue;
    }
    
    // Check if asset already exists by ID or name
    if (existingIds.has(assetId) || existingNames.has(assetId.toLowerCase())) {
      console.log(`⏭️  Skipping ${assetId} - already exists in database`);
      skipped++;
      continue;
    }
    
    try {
      const assetType = inferAssetType(assetId);
      const assetName = assetId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const cdnUrl = `${CDN_URL}/${file.path}`;
      
      await db.insert(assets).values({
        // Don't set id - let database generate UUID
        name: assetName,
        description: `Imported from CDN: ${file.path}`,
        type: assetType,
        ownerId: null, // CRITICAL: Explicitly null - CDN assets have no owner to prevent cascade deletes
        tags: [],
        metadata: {
          source: 'cdn-sync',
          originalPath: file.path,
          importedAt: new Date().toISOString(),
        },
        generationParams: {},
        cdnUrl,
        fileSize: file.size,
        status: 'completed',
        visibility: 'public',
        generatedAt: new Date(file.modified),
      });
      
      console.log(`✅ Created asset: ${assetName} (${assetType})`);
      console.log(`   CDN URL: ${cdnUrl}`);
      created++;
      
    } catch (error: any) {
      console.error(`❌ Error creating asset ${assetId}:`);
      console.error(error);
      errors++;
      if (errors >= 3) {
        console.log("\n⚠️  Stopping after 3 errors to investigate...\n");
        break;
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Sync Summary:");
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("=".repeat(60));
  
  if (created > 0) {
    console.log("\n🎉 Assets synced! Check your assets page now!");
  }
  
  process.exit(0);
}

syncCDNToDatabase().catch((error) => {
  console.error("❌ Sync failed:", error);
  process.exit(1);
});
