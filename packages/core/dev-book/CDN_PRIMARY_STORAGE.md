# CDN-Primary Storage Architecture

## Overview

Asset-Forge uses the CDN as the **primary storage location** for all generated 3D assets. All asset files are uploaded directly to the CDN, which fires webhooks to create database records. The local `gdd-assets/` directory is no longer used for serving assets in production.

## Architecture Flow

```
Asset Generation → CDN Upload → Webhook → Database Record → Frontend Display
```

### Step-by-Step Process

1. **GenerationService** creates asset files in memory (GLB, thumbnails, concept art)
2. Files are uploaded to CDN via `/api/upload` endpoint
3. CDN stores files and fires webhook to main app at `/api/cdn/webhook/upload`
4. Main app's webhook handler creates database record with:
   - Asset metadata extracted from filename/path
   - CDN URLs for all uploaded files
   - `publishedToCdn: true` flag
5. Frontend fetches asset list from database
6. Frontend loads 3D models directly from CDN URLs

## Benefits

- **Single Source of Truth**: CDN is the authoritative storage location
- **No Duplicate Storage**: Eliminates filesystem/database sync issues
- **Railway Volume Efficiency**: Only CDN service needs persistent volume
- **Faster Development**: Simplified local development workflow
- **Cleaner Architecture**: Database-driven asset management

## Database Schema

Assets table includes CDN-specific fields:

```typescript
{
  cdnUrl: string;              // Full URL: https://cdn.example.com/models/asset-id/model.glb
  cdnThumbnailUrl: string;     // CDN URL for thumbnail
  cdnConceptArtUrl: string;    // CDN URL for concept art
  publishedToCdn: boolean;     // Whether asset is on CDN
  cdnPublishedAt: timestamp;   // When published to CDN
  cdnFiles: string[];          // Array of all CDN file URLs
}
```

## Configuration

### Required Environment Variables

**Main Application** (`packages/core/.env`):

```env
# CDN Service URL (required in production)
CDN_URL=https://your-cdn-service.railway.app

# CDN API Key (required in production)
CDN_API_KEY=your-secret-api-key

# Webhook Secret (must match CDN service)
WEBHOOK_SECRET=your-webhook-secret

# Enable CDN webhook processing (required in production)
CDN_WEBHOOK_ENABLED=true
```

**CDN Service** (`asset-forge-cdn/.env`):

```env
# Main application URL for webhooks
ASSET_FORGE_API_URL=https://your-main-app.railway.app

# Webhook Secret (must match main app)
WEBHOOK_SECRET=your-webhook-secret

# API Key for upload authentication
API_KEY=your-secret-api-key
```

## Local Development

### Setup

1. **Start CDN Service:**

   ```bash
   cd asset-forge-cdn
   bun run dev
   ```

   CDN runs on `http://localhost:3005`

2. **Start Main Application:**

   ```bash
   cd asset-forge/packages/core
   bun run dev:backend
   ```

   Main app runs on `http://localhost:3000`

3. **Ensure Environment Variables:**

   In `packages/core/.env`:

   ```env
   CDN_URL=http://localhost:3005
   CDN_API_KEY=dev-api-key-12345
   CDN_WEBHOOK_ENABLED=true
   WEBHOOK_SECRET=dev-webhook-secret
   ```

   In `asset-forge-cdn/.env`:

   ```env
   ASSET_FORGE_API_URL=http://localhost:3000
   WEBHOOK_SECRET=dev-webhook-secret
   API_KEY=dev-api-key-12345
   ```

### Testing CDN Upload

1. Generate an asset through the UI or API
2. Check CDN logs for upload confirmation:
   ```
   [CDN] File uploaded: models/asset-id/model.glb
   [CDN] Webhook sent to http://localhost:3000/api/cdn/webhook/upload
   ```
3. Check main app logs for webhook processing:
   ```
   [CDN Webhook] Received upload notification
   [CDN Webhook] Created database record for asset-id
   ```
4. Verify database record:
   ```sql
   SELECT * FROM assets WHERE published_to_cdn = true;
   ```

## Code Changes Summary

### Removed Routes (packages/core/server/routes/assets.ts)

- `GET /api/assets/:id/model` - Removed (assets served from CDN)
- `HEAD /api/assets/:id/model` - Removed
- `GET /api/assets/:id/*` - Removed (all files served from CDN)
- `HEAD /api/assets/:id/*` - Removed

### Updated Services (packages/core/server/services/AssetService.ts)

**Removed Methods:**

- `getModelPath()` - No longer reads from filesystem
- `loadAsset()` - Replaced by database queries
- `deleteAssetDirectory()` - Assets persist on CDN after deletion
- `updateDependenciesAfterDelete()` - Dependencies tracked in database

**Updated Methods:**

- `listAssets()` - Now queries database only (no filesystem scan)
- `deleteAsset()` - Deletes database record only (CDN files persist)

### New Webhook Handler (packages/core/server/routes/cdn.ts)

- `POST /api/cdn/webhook/upload` - Creates database records from CDN uploads

## Troubleshooting

### Assets Not Appearing in UI

**Symptoms:** Assets generated but not showing in asset list

**Debugging Steps:**

1. Check CDN upload succeeded:

   ```bash
   # CDN logs should show:
   [CDN] File uploaded: models/asset-id/model.glb
   ```

2. Check webhook fired:

   ```bash
   # CDN logs should show:
   [CDN] Webhook sent successfully
   ```

3. Check webhook received:

   ```bash
   # Main app logs should show:
   [CDN Webhook] Received upload notification
   [CDN Webhook] Created database record
   ```

4. Check database:
   ```sql
   SELECT id, name, cdn_url, published_to_cdn
   FROM assets
   WHERE published_to_cdn = true
   ORDER BY created_at DESC;
   ```

### Webhook Failures

**Symptoms:** CDN uploads succeed but no database records created

**Common Causes:**

1. **Mismatched Webhook Secret:**

   - Verify `WEBHOOK_SECRET` matches in both services
   - Check main app logs for "Invalid webhook signature"

2. **Wrong Main App URL:**

   - Verify `ASSET_FORGE_API_URL` in CDN service
   - Test webhook endpoint manually:
     ```bash
     curl -X POST http://localhost:3000/api/cdn/webhook/upload \
       -H "Content-Type: application/json" \
       -H "X-Webhook-Signature: your-secret" \
       -d '{"event":"upload.completed","filePath":"models/test/test.glb"}'
     ```

3. **CDN_WEBHOOK_ENABLED Not Set:**
   - Ensure `CDN_WEBHOOK_ENABLED=true` in main app

### Database Record Missing CDN URLs

**Symptoms:** Database records exist but `cdnUrl` is null

**Causes:**

- Webhook metadata extraction failed
- Check `cdn-metadata-extractor.ts` for parsing errors
- Verify file path format: `models/asset-id/filename.glb`

## Migration Notes

### From Filesystem to CDN-Primary

If migrating existing assets:

1. **Upload to CDN:**

   ```bash
   # Upload all files in gdd-assets/ to CDN
   for dir in gdd-assets/*/; do
     asset_id=$(basename "$dir")
     curl -X POST http://localhost:3005/api/upload \
       -H "X-API-Key: $CDN_API_KEY" \
       -F "files=@$dir/$asset_id.glb" \
       -F "directory=models"
   done
   ```

2. **Update Database:**

   ```sql
   -- Update existing records with CDN URLs
   UPDATE assets
   SET cdn_url = 'https://cdn.example.com/models/' || id || '/' || id || '.glb',
       published_to_cdn = true,
       cdn_published_at = NOW()
   WHERE cdn_url IS NULL;
   ```

3. **Verify Migration:**
   ```sql
   SELECT COUNT(*) as total,
          COUNT(cdn_url) as with_cdn,
          COUNT(CASE WHEN published_to_cdn THEN 1 END) as published
   FROM assets;
   ```

## Testing

Integration test validates complete CDN workflow:

```bash
bun test __tests__/integration/cdn-upload.test.ts
```

Test covers:

1. Upload file to CDN
2. Webhook fires to main app
3. Database record created
4. CDN URLs populated correctly

## Production Deployment

### Railway Configuration

**CDN Service:**

- Deploy `asset-forge-cdn` with persistent volume mounted at `/app/data`
- Set environment variables: `API_KEY`, `WEBHOOK_SECRET`, `ASSET_FORGE_API_URL`

**Main Application:**

- Deploy `asset-forge/packages/core` without volume (stateless)
- Set environment variables: `CDN_URL`, `CDN_API_KEY`, `WEBHOOK_SECRET`

### Verification

After deployment:

1. Generate test asset via UI
2. Check Railway logs for both services
3. Verify database record created
4. Verify asset loads in UI from CDN URL

## Related Documentation

- [CDN Service README](/asset-forge-cdn/README.md)
- [Webhook Handler Implementation](/packages/core/server/routes/cdn.ts)
- [Asset Database Schema](/packages/core/server/db/schema/assets.schema.ts)
- [Integration Tests](/packages/core/__tests__/integration/cdn-upload.test.ts)
