# CDN Service Railway Deployment

## Overview

The CDN service (`hyperforge-cdn.up.railway.app`) stores all generated assets (3D models, emotes, audio) in persistent storage. The main API service uploads files to the CDN during generation, and the CDN broadcasts WebSocket events to update the database with CDN URLs.

## Architecture

```
GenerationService generates asset
    ↓
Calls uploadToCDN() → Uploads to hyperforge-cdn.up.railway.app/api/upload
    ↓
CDN saves files to /data/models/{assetId}/
    ↓
CDN broadcasts WebSocket event to "cdn-uploads" topic
    ↓
CDNWebSocketService (on API service) receives event
    ↓
Database updated with cdnUrl and cdnFiles
    ↓
UI fetches assets → Gets CDN URLs from database
    ↓
UI displays 3D models from CDN URLs
```

## Railway Services Configuration

### CDN Service (hyperforge-cdn)

**Repository:** `asset-forge-cdn` (separate repository)

**Volume Mount:**

- Mount path: `/data`
- Required for persistent storage of all assets

**Environment Variables:**

```bash
# CDN Service Configuration
PORT=3005
NODE_ENV=production

# API key for upload authentication (MUST match API service)
CDN_API_KEY=<shared-secret-key>

# Base URL for CDN (used in WebSocket events)
CDN_URL=https://hyperforge-cdn.up.railway.app

# WebSocket configuration (optional but recommended)
WS_HEARTBEAT_INTERVAL=30000  # 30 seconds
WS_MAX_CONNECTIONS=1000
```

**Deployment Notes:**

- **Volume is REQUIRED** - Without volume, files will be lost on deployment
- Volume persists across deployments
- Files are stored in `/data/models/`, `/data/sprites/`, `/data/audio/`, etc.

### API Service (asset-forge)

**Repository:** `asset-forge`

**Volume Mount:**

- **NO volume needed** - API service is stateless
- Uses temp storage only for generation, then uploads to CDN
- After upload, temp files are cleaned up

**Environment Variables:**

```bash
# CDN Integration (REQUIRED)
CDN_URL=https://hyperforge-cdn.up.railway.app
CDN_WS_URL=wss://hyperforge-cdn.up.railway.app/ws/events
CDN_API_KEY=<shared-secret-key>  # MUST match CDN service

# Auto-publish configuration (optional)
AUTO_PUBLISH_TO_CDN=true
```

**Critical Configuration:**

- `CDN_URL` - HTTP/HTTPS URL for file uploads
- `CDN_WS_URL` - WebSocket URL for real-time event notifications
- `CDN_API_KEY` - **MUST** match the CDN service's `CDN_API_KEY`

### Worker Service (asset-forge-workers)

**Environment Variables:**

```bash
# Workers DON'T need CDN configuration
# They only process Redis queue jobs

# Required for workers:
DATABASE_URL=<postgres-url>
REDIS_URL=<redis-url>
WORKER_CONCURRENCY=3

# NOT NEEDED for workers:
# CDN_URL (not used)
# CDN_WS_URL (not used)
# CDN_API_KEY (not used)
```

**Volume Mount:**

- **NO volume needed** - Workers are stateless

## CDN API Key Setup

Generate a strong API key for production:

```bash
openssl rand -hex 32
```

Then set **the same key** on both services:

- CDN service: `CDN_API_KEY=<generated-key>`
- API service: `CDN_API_KEY=<generated-key>`

## Testing CDN Integration

### 1. Verify CDN is accessible

```bash
curl https://hyperforge-cdn.up.railway.app/health
```

Should return: `{"status":"ok"}`

### 2. Verify WebSocket connection

Check API service logs for:

```
[CDN WebSocket] Initializing connection to CDN...
[CDN WebSocket] Connected successfully
```

### 3. Test file upload

Generate an asset through the API. Check:

1. API service logs: `[CDN Upload] Uploading X files for asset {id}`
2. CDN service logs: `Uploaded X files to /data/models/{id}/`
3. API service logs: `[CDN WebSocket] Updated asset {id} with CDN URL`
4. Database: `SELECT cdnUrl, cdnFiles FROM assets WHERE id = '{id}'`

## Troubleshooting

### CDN WebSocket won't connect

**Symptoms:** API logs show `[CDN WebSocket] Failed to connect`

**Solutions:**

1. Verify `CDN_WS_URL` uses `wss://` (not `ws://`) in production
2. Verify `CDN_API_KEY` matches on both services
3. Check CDN service is running and accessible

### Files not persisting

**Symptoms:** Files disappear after CDN service redeployment

**Solutions:**

1. Verify volume is mounted at `/data` on CDN service
2. Check Railway dashboard shows volume attached to CDN service
3. Volume should show size > 0 MB if files exist

### Database not updating with CDN URLs

**Symptoms:** `cdnUrl` and `cdnFiles` are NULL in database

**Solutions:**

1. Check CDN WebSocket is connected (see logs)
2. Verify CDN service is broadcasting upload events
3. Check API service `CDNWebSocketService` is subscribed to `cdn-uploads` topic
4. Verify asset exists in database before upload

## Environment Variable Reference

### Required on CDN Service

- `CDN_API_KEY` - API key for upload authentication
- `CDN_URL` - Base URL for CDN (used in WebSocket events)

### Required on API Service

- `CDN_URL` - HTTP/HTTPS URL for file uploads
- `CDN_WS_URL` - WebSocket URL for event notifications
- `CDN_API_KEY` - **MUST** match CDN service

### Optional

- `AUTO_PUBLISH_TO_CDN` - Default: true

## Volume Configuration

### CDN Service Volume

Railway automatically creates and manages the volume. Verify in Railway dashboard:

1. Go to CDN service settings
2. Click "Volumes" tab
3. Should show:
   - Mount path: `/data`
   - Size: Growing as assets are uploaded
   - Status: Mounted

### What's stored in /data

```
/data/
├── models/
│   ├── {assetId}/
│   │   ├── {assetId}.glb          # Main model
│   │   ├── {assetId}_raw.glb      # Pre-normalized model
│   │   ├── {assetId}_rigged.glb   # Rigged model (if avatar)
│   │   ├── concept-art.png         # Concept art
│   │   ├── metadata.json           # Asset metadata
│   │   ├── rigging-metadata.json   # Rigging info (if avatar)
│   │   └── animations/             # Animation files
│   │       ├── walking.glb
│   │       └── running.glb
│   └── {assetId}-{variantId}/     # Material variants
│       ├── {assetId}-{variantId}.glb
│       └── metadata.json
├── sprites/
│   └── {assetId}/
│       └── sprites/
│           ├── 0deg.png
│           ├── 45deg.png
│           └── sprite-metadata.json
└── audio/
    └── {assetId}/
        └── ...
```

## Security Notes

1. **CDN_API_KEY** should be a strong random key (32+ characters)
2. Never commit `CDN_API_KEY` to git
3. Rotate `CDN_API_KEY` if compromised (update both services)
4. CDN service should NOT be publicly writable without authentication

## Migration from Local Storage

If migrating from local file storage to CDN:

1. Deploy CDN service with volume
2. Set environment variables on API service
3. New assets automatically upload to CDN
4. Old assets remain in local storage (backward compatible)
5. Database tracks both: `filePath` (deprecated) and `cdnUrl` (new)
6. UI prefers `cdnUrl` when available, falls back to `filePath`
