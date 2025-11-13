# CDN Database Integration Guide

## Overview

The Asset-Forge database now stores CDN URLs directly in the `assets` table, enabling fast access to published CDN assets without reconstructing URLs or checking file system paths.

## Database Schema Changes

### New Fields Added to `assets` Table

```sql
-- Migration: 0019_cool_madame_masque.sql

ALTER TABLE "assets" ADD COLUMN "cdn_url" varchar(1024);
ALTER TABLE "assets" ADD COLUMN "cdn_thumbnail_url" varchar(1024);
ALTER TABLE "assets" ADD COLUMN "cdn_concept_art_url" varchar(1024);
ALTER TABLE "assets" ADD COLUMN "published_to_cdn" boolean DEFAULT false;
ALTER TABLE "assets" ADD COLUMN "cdn_published_at" timestamp with time zone;
ALTER TABLE "assets" ADD COLUMN "cdn_files" jsonb DEFAULT '[]'::jsonb;
CREATE INDEX "idx_assets_published_to_cdn" ON "assets" USING btree ("published_to_cdn");
```

### Field Descriptions

| Field                 | Type          | Description                                           |
| --------------------- | ------------- | ----------------------------------------------------- |
| `cdn_url`             | varchar(1024) | Primary CDN URL for the asset (usually the .glb file) |
| `cdn_thumbnail_url`   | varchar(1024) | CDN URL for the asset thumbnail (PNG/JPG)             |
| `cdn_concept_art_url` | varchar(1024) | CDN URL for generated concept art                     |
| `published_to_cdn`    | boolean       | Whether the asset has been published to CDN           |
| `cdn_published_at`    | timestamp     | When the asset was published to CDN                   |
| `cdn_files`           | jsonb         | Array of all CDN file URLs for this asset             |

### TypeScript Types

```typescript
export type Asset = {
  id: string;
  name: string;
  // ... existing fields ...

  // CDN fields
  cdnUrl: string | null;
  cdnThumbnailUrl: string | null;
  cdnConceptArtUrl: string | null;
  publishedToCdn: boolean;
  cdnPublishedAt: Date | null;
  cdnFiles: string[];
};
```

## CDNPublishService API

### Enhanced Methods

#### `publishAndUpdateAsset(assetId: string): Promise<PublishResult>`

**Recommended method** - Publishes asset to CDN **and** updates database in one operation.

```typescript
import { CDNPublishService } from "../services/CDNPublishService";

const cdnService = CDNPublishService.fromEnv("gdd-assets");

// Publish and automatically update database
const result = await cdnService.publishAndUpdateAsset("pickaxe-steel-uuid");

if (result.success) {
  console.log("Main URL:", result.mainCdnUrl);
  // http://localhost:3005/models/pickaxe-steel/pickaxe-steel.glb

  console.log("Thumbnail:", result.thumbnailCdnUrl);
  // http://localhost:3005/models/pickaxe-steel/thumbnail.png

  console.log("All files:", result.cdnFiles);
  // Database automatically updated with these URLs
}
```

#### `publishAsset(assetId: string): Promise<PublishResult>`

Publishes asset to CDN **without** updating database (manual control).

```typescript
const result = await cdnService.publishAsset("pickaxe-steel-uuid");
// Database NOT updated - you must call updateAssetCDNUrls() manually
```

#### `updateAssetCDNUrls(assetId: string, publishResult: PublishResult): Promise<void>`

Updates database with CDN URLs from a publish result.

```typescript
const result = await cdnService.publishAsset("pickaxe-steel-uuid");

if (result.success) {
  // Manually update database
  await cdnService.updateAssetCDNUrls("pickaxe-steel-uuid", result);
}
```

### PublishResult Interface

```typescript
interface PublishResult {
  success: boolean;
  assetId: string;
  filesPublished: string[]; // ["pickaxe-steel.glb", "thumbnail.png"]
  error?: string;
  cdnUrls?: string[]; // All CDN URLs
  mainCdnUrl?: string; // Primary asset URL (.glb file)
  thumbnailCdnUrl?: string; // Thumbnail URL
  conceptArtCdnUrl?: string; // Concept art URL
}
```

## Usage Examples

### Example 1: Publishing After Asset Generation

```typescript
// packages/core/server/routes/generation.ts

import { CDNPublishService } from "../services/CDNPublishService";
import { db } from "../db/db";
import { assets } from "../db/schema";

export async function onAssetGenerated(assetId: string) {
  // Asset generation completed, publish to CDN
  const cdnService = CDNPublishService.fromEnv("gdd-assets");

  const result = await cdnService.publishAndUpdateAsset(assetId);

  if (result.success) {
    console.log(`✅ Asset ${assetId} published to CDN`);
    console.log(`   Main URL: ${result.mainCdnUrl}`);
    console.log(`   Published ${result.filesPublished.length} files`);

    // Database is automatically updated with:
    // - cdnUrl: result.mainCdnUrl
    // - cdnThumbnailUrl: result.thumbnailCdnUrl
    // - cdnConceptArtUrl: result.conceptArtCdnUrl
    // - cdnFiles: result.cdnUrls
    // - publishedToCdn: true
    // - cdnPublishedAt: current timestamp
  } else {
    console.error(`❌ Failed to publish ${assetId}:`, result.error);
  }
}
```

### Example 2: Querying CDN Assets

```typescript
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

// Get all assets published to CDN
const cdnAssets = await db
  .select()
  .from(assets)
  .where(eq(assets.publishedToCdn, true));

for (const asset of cdnAssets) {
  console.log(`${asset.name}: ${asset.cdnUrl}`);
  // Steel Pickaxe: http://localhost:3005/models/pickaxe-steel/pickaxe-steel.glb
}

// Get a specific asset with CDN URL
const asset = await db.query.assets.findFirst({
  where: eq(assets.id, "pickaxe-steel-uuid"),
});

if (asset && asset.cdnUrl) {
  console.log(`Asset available at: ${asset.cdnUrl}`);
  console.log(`Published on: ${asset.cdnPublishedAt}`);
  console.log(`All files:`, asset.cdnFiles);
}
```

### Example 3: Frontend Integration

```typescript
// packages/core/src/components/AssetViewer.tsx

import { useQuery } from "@tanstack/react-query";
import { ThreeViewer } from "./shared/ThreeViewer";

interface Asset {
  id: string;
  name: string;
  cdnUrl: string;
  cdnThumbnailUrl?: string;
  publishedToCdn: boolean;
}

export function AssetViewer({ assetId }: { assetId: string }) {
  const { data: asset } = useQuery<Asset>({
    queryKey: ["asset", assetId],
    queryFn: () => fetch(`/api/assets/${assetId}`).then(r => r.json()),
  });

  if (!asset) return <div>Loading...</div>;

  if (!asset.publishedToCdn) {
    return <div>Asset not yet published to CDN</div>;
  }

  return (
    <div>
      <h2>{asset.name}</h2>

      {/* Use CDN URL directly from database */}
      <ThreeViewer modelUrl={asset.cdnUrl} />

      {asset.cdnThumbnailUrl && (
        <img src={asset.cdnThumbnailUrl} alt={`${asset.name} thumbnail`} />
      )}

      <p>CDN URL: <a href={asset.cdnUrl}>{asset.cdnUrl}</a></p>
    </div>
  );
}
```

### Example 4: Batch Publishing

```typescript
import { CDNPublishService } from "../services/CDNPublishService";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

const cdnService = CDNPublishService.fromEnv("gdd-assets");

// Get all unpublished assets
const unpublished = await db
  .select()
  .from(assets)
  .where(eq(assets.publishedToCdn, false));

console.log(`Publishing ${unpublished.length} assets to CDN...`);

for (const asset of unpublished) {
  const result = await cdnService.publishAndUpdateAsset(asset.id);

  if (result.success) {
    console.log(`✅ Published ${asset.name}`);
  } else {
    console.error(`❌ Failed ${asset.name}: ${result.error}`);
  }
}
```

### Example 5: API Endpoint with CDN URLs

```typescript
// packages/core/server/routes/assets.ts

import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

export const assetsRoute = new Elysia({ prefix: "/api/assets" }).get(
  "/:id",
  async ({ params }) => {
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, params.id),
    });

    if (!asset) {
      return { error: "Asset not found" };
    }

    // Return asset with CDN URLs
    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      type: asset.type,

      // CDN information
      cdnUrl: asset.cdnUrl,
      cdnThumbnailUrl: asset.cdnThumbnailUrl,
      cdnConceptArtUrl: asset.cdnConceptArtUrl,
      cdnFiles: asset.cdnFiles,
      publishedToCdn: asset.publishedToCdn,
      cdnPublishedAt: asset.cdnPublishedAt,

      // Local paths (for fallback)
      filePath: asset.filePath,
      thumbnailPath: asset.thumbnailPath,
    };
  },
);
```

## Migration Guide

### Step 1: Apply Database Migration

The migration was generated as `0019_cool_madame_masque.sql`.

To apply it:

```bash
# Development
cd /Users/home/asset-forge
bunx drizzle-kit push

# Or use the migration script
bun run db:migrate
```

This will add the 6 new columns and create the index.

### Step 2: Update Existing Code

**Before** (old approach):

```typescript
// Manual URL construction
const cdnService = CDNPublishService.fromEnv("gdd-assets");
const result = await cdnService.publishAsset(assetId);

if (result.success) {
  // Manually construct URL
  const cdnUrl = `${process.env.CDN_URL}/models/${assetId}/${assetId}.glb`;

  // Manually update database
  await db
    .update(assets)
    .set({
      // No CDN fields existed
    })
    .where(eq(assets.id, assetId));
}
```

**After** (new approach):

```typescript
// Automatic database update
const cdnService = CDNPublishService.fromEnv("gdd-assets");
const result = await cdnService.publishAndUpdateAsset(assetId);

// Database automatically updated with all CDN URLs
// Access via: asset.cdnUrl, asset.cdnThumbnailUrl, etc.
```

### Step 3: Backfill Existing Assets (Optional)

If you have assets already published to CDN before this migration:

```typescript
import { CDNPublishService } from "../services/CDNPublishService";
import { db } from "../db/db";
import { assets } from "../db/schema";

const cdnService = CDNPublishService.fromEnv("gdd-assets");

// Find assets with files but no CDN URL
const assetsToBackfill = await db
  .select()
  .from(assets)
  .where(and(isNotNull(assets.filePath), isNull(assets.cdnUrl)));

for (const asset of assetsToBackfill) {
  // Re-publish to update database
  await cdnService.publishAndUpdateAsset(asset.id);
}
```

## Performance Benefits

### Before (Manual URL Construction)

```typescript
// Every request reconstructs URLs
function getAssetCDNUrl(assetId: string, fileName: string) {
  return `${process.env.CDN_URL}/models/${assetId}/${fileName}`;
}

// No way to query which assets are on CDN
// No timestamp of when published
```

### After (Database-Backed URLs)

```typescript
// Single query returns all CDN info
const asset = await db.query.assets.findFirst({
  where: eq(assets.id, assetId),
});

// URLs ready to use: asset.cdnUrl
// Query CDN assets: WHERE publishedToCdn = true
// Track publish time: asset.cdnPublishedAt
// Indexed queries for fast filtering
```

**Performance Improvements**:

- ✅ No URL reconstruction overhead
- ✅ Fast queries for CDN-published assets (indexed)
- ✅ Single source of truth for CDN status
- ✅ Audit trail via `cdnPublishedAt` timestamp

## OpenAPI/Swagger Documentation

The CDN provides **OpenAPI 3.0 compatible** documentation:

**Access**: `http://localhost:3005/swagger`

**Endpoints documented**:

- `GET /api/health` - Health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe
- `GET /api/assets` - List assets
- `POST /api/upload` - Upload files (requires API key)
- `GET /models/*` - Serve 3D models
- `GET /emotes/*` - Serve animations
- `GET /music/*` - Serve audio

All routes use TypeBox schemas for automatic OpenAPI generation.

## Querying Assets by CDN Status

### Get all CDN-published assets

```typescript
const published = await db
  .select()
  .from(assets)
  .where(eq(assets.publishedToCdn, true));
```

### Get assets published in the last 24 hours

```typescript
import { gte } from "drizzle-orm";

const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentlyPublished = await db
  .select()
  .from(assets)
  .where(gte(assets.cdnPublishedAt, yesterday));
```

### Get unpublished assets

```typescript
const unpublished = await db
  .select()
  .from(assets)
  .where(eq(assets.publishedToCdn, false));
```

### Get assets with thumbnails on CDN

```typescript
import { isNotNull } from "drizzle-orm";

const withThumbnails = await db
  .select()
  .from(assets)
  .where(isNotNull(assets.cdnThumbnailUrl));
```

## Best Practices

### 1. Always Use `publishAndUpdateAsset()`

```typescript
// ✅ Recommended - atomic operation
await cdnService.publishAndUpdateAsset(assetId);

// ❌ Avoid - manual coordination
const result = await cdnService.publishAsset(assetId);
await cdnService.updateAssetCDNUrls(assetId, result);
```

### 2. Check `publishedToCdn` Before Using CDN URL

```typescript
// ✅ Safe
if (asset.publishedToCdn && asset.cdnUrl) {
  return <ThreeViewer modelUrl={asset.cdnUrl} />;
} else {
  return <div>Publishing asset to CDN...</div>;
}

// ❌ Unsafe - may be null
return <ThreeViewer modelUrl={asset.cdnUrl} />;
```

### 3. Use Database Queries for CDN Status

```typescript
// ✅ Efficient - indexed query
const cdnAssets = await db
  .select()
  .from(assets)
  .where(eq(assets.publishedToCdn, true));

// ❌ Inefficient - filter in application code
const allAssets = await db.select().from(assets);
const cdnAssets = allAssets.filter((a) => a.cdnUrl);
```

### 4. Handle CDN Republishing

```typescript
// Asset already on CDN, need to update it
const asset = await db.query.assets.findFirst({
  where: eq(assets.id, assetId),
});

if (asset.publishedToCdn) {
  console.log(`⚠️  Asset already on CDN (published ${asset.cdnPublishedAt})`);
  console.log(`   Re-publishing will update CDN and database`);
}

// Republish (overwrites existing CDN files and updates database)
await cdnService.publishAndUpdateAsset(assetId);
```

## Summary

✅ **Database Integration Complete**:

- 6 new CDN fields added to `assets` table
- Migration generated and ready to apply
- CDNPublishService enhanced with database updates
- Indexed queries for fast CDN asset filtering
- OpenAPI/Swagger documentation available

✅ **Key Benefits**:

- Single source of truth for CDN URLs
- No URL reconstruction overhead
- Fast queries for CDN-published assets
- Audit trail via timestamps
- Type-safe access via Drizzle ORM

✅ **Recommended Usage**:

```typescript
const cdnService = CDNPublishService.fromEnv("gdd-assets");
await cdnService.publishAndUpdateAsset(assetId);
```

**Ready to use!** The database now fully tracks CDN URLs and publication status.
