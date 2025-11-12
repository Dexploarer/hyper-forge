# Railway Volume Setup for Media Storage

## Problem

Media files (portraits, banners, voices) are saved to `gdd-assets/media/` but are lost on deployment because they're stored in ephemeral container storage.

## Solution: Add Railway Volume

### Step 1: Create Volume in Railway Dashboard

1. Go to your Railway project
2. Click on your service (asset-forge)
3. Go to **"Variables"** tab
4. Scroll down to **"Volumes"** section
5. Click **"+ New Volume"**
6. Configure:
   - **Mount Path**: `/app/packages/core/gdd-assets`
   - **Name**: `asset-forge-media-storage` (or your preferred name)
   - **Size**: Start with 5GB, increase as needed

### Step 2: Update railway.toml (Optional Documentation)

Add volume documentation to `railway.toml`:

```toml
# Railway Deployment Configuration

[build]
builder = "RAILPACK"
buildCommand = "cd packages/core && bun run clean && bunx vite build"

[deploy]
startCommand = "cd packages/core && bun run start:api"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

# IMPORTANT: Volume Configuration
# A persistent volume MUST be mounted at /app/packages/core/gdd-assets
# Configure this in Railway Dashboard -> Service -> Volumes
# Without this volume, all media files will be lost on deployment!

[[deploy.watchPaths]]
paths = ["packages/core/**"]
```

### Step 3: Verify Volume is Working

After deploying with the volume:

1. Generate a test NPC with a portrait
2. Check Railway logs to see the file path: `[MediaStorage] Saved portrait file: /app/packages/core/gdd-assets/media/portrait/npc/{id}/portrait_{timestamp}.png`
3. Redeploy your service
4. The portrait should still be accessible after redeployment

### Step 4: Cleanup Script (Already Done Locally)

The orphaned database records have been cleaned up locally. After setting up the volume and deploying, monitor for new orphaned records.

You can add this periodic cleanup to prevent future issues:

```typescript
// In server/services/MediaStorageService.ts or a cron job
async cleanupOrphanedRecords(): Promise<number> {
  const allAssets = await db.select().from(mediaAssets);
  let orphanedCount = 0;

  for (const asset of allAssets) {
    const filePath = path.join(ROOT_DIR, asset.fileUrl);
    try {
      await fs.promises.access(filePath);
    } catch {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, asset.id));
      orphanedCount++;
    }
  }

  return orphanedCount;
}
```

## Important Notes

1. **Volume Persistence**: Railway volumes persist across deployments and restarts
2. **Backup Strategy**: Consider backing up the volume periodically
3. **Volume Size**: Monitor usage and increase size as needed in Railway dashboard
4. **File Organization**: Current structure is good:
   ```
   gdd-assets/
   └── media/
       ├── portrait/
       │   └── npc/
       │       └── {npc-id}/
       │           └── portrait_{timestamp}.png
       ├── banner/
       │   └── quest/
       │       └── {quest-id}/
       │           └── banner_{timestamp}.png
       └── voice/
           └── npc/
               └── {npc-id}/
                   └── voice_{timestamp}.mp3
   ```

## Testing Locally

The media storage is working correctly in local development. The issue only affects Railway deployment without a volume.

## Monitoring

Add this to your health check or admin dashboard:

```typescript
// Check media storage health
const mediaCount = await db.select({ count: sql`count(*)` }).from(mediaAssets);
const mediaDir = path.join(ROOT_DIR, "gdd-assets", "media");
const diskSpace = (await fs.promises.statfs?.(mediaDir)) || null;

console.log(`Media Assets: ${mediaCount} records`);
console.log(`Disk Space: ${diskSpace?.available} bytes available`);
```
