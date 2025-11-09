# Asset Loading Issue - Diagnosis & Fix

## Problem Summary

Assets are failing to load in the deployed Railway application. When trying to view assets, errors occur immediately upon loading.

## Root Cause

The `gdd-assets` directory is **not present** on the Railway deployment. This directory contains all the 3D model files (`.glb` files) and metadata that the application needs to serve assets.

## Why This Happens

1. **Git Ignore**: The `gdd-assets` directory is likely in `.gitignore` (it contains large binary files)
2. **Build Process**: Railway's build process only includes files that are:
   - In the git repository
   - Built during the build step (like `dist/`)
   - Mounted as volumes
3. **No Volume Mount**: If no Railway Volume is configured, the directory doesn't exist

## Diagnosis Steps

### 1. Check Railway Logs

After deploying, check the startup logs. You should now see one of these messages:

**If assets directory exists:**
```
✅ gdd-assets directory found with X asset directories
   Sample assets: bow-base, sword-base, ...
```

**If assets directory is missing:**
```
⚠️  gdd-assets directory NOT FOUND at /app/packages/core/gdd-assets
   Assets will not be available until gdd-assets is populated.
   Options:
   1. Mount a Railway Volume at /app/packages/core/gdd-assets
   2. Use /api/admin/download-assets endpoint to download assets
```

### 2. Use Debug Endpoint

Visit your Railway deployment's debug endpoint:
```
GET https://your-app.railway.app/api/admin/debug-paths
```

This will show:
- Whether `gdd-assets` directory exists
- How many assets are found
- Sample asset names
- File system paths

### 3. Check Asset Listing

Try listing assets:
```
GET https://your-app.railway.app/api/assets
```

If the directory is missing, this will return an empty array `[]`.

## Solutions

### Solution 1: Railway Volume (Recommended for Production)

**Best for**: Persistent storage that survives deployments

1. **Create Volume**:
   - Railway Dashboard → Your Project → **New** → **Volume**
   - Name: `asset-storage`
   - Mount Path: `/app/packages/core/gdd-assets`

2. **Populate Assets**:
   After deployment, use the admin endpoint to download assets:
   ```bash
   POST https://your-app.railway.app/api/admin/download-assets
   Headers:
     Authorization: Bearer YOUR_ADMIN_UPLOAD_TOKEN
   Body:
     {
       "url": "https://your-assets-url.com/gdd-assets.tar.gz"
     }
   ```

   Or manually upload assets via Railway's file system access.

### Solution 2: Include Assets in Build (Not Recommended)

**Best for**: Small asset sets, development

⚠️ **Warning**: This will significantly increase build time and image size.

1. Remove `gdd-assets` from `.gitignore` (if present)
2. Commit assets to git repository
3. Redeploy

**Downsides**:
- Large git repository
- Slow builds
- Not scalable

### Solution 3: Cloud Storage (Future)

**Best for**: Large-scale production

Migrate to S3/Cloudflare R2/Google Cloud Storage:
- Upload assets to cloud storage
- Update code to fetch from cloud URLs
- Update `AssetService` to use cloud storage paths

## What Was Fixed

### 1. Improved Error Handling

- Asset routes now catch errors and return helpful error messages
- Errors include asset ID and path information for debugging

### 2. Better Logging

- Startup check for `gdd-assets` directory
- Logs asset count and sample assets on startup
- Error logs include full context

### 3. Enhanced Debug Endpoint

- `/api/admin/debug-paths` now shows:
  - Asset count
  - Sample asset names
  - Environment variables
  - File system paths

## Verification

After applying a solution:

1. **Check Logs**: Should see `✅ gdd-assets directory found with X asset directories`
2. **Test Debug Endpoint**: `GET /api/admin/debug-paths` should show `gddAssetsExists: true` and `assetCount > 0`
3. **List Assets**: `GET /api/assets` should return asset array
4. **Load Model**: `GET /api/assets/{id}/model` should return GLB file

## Quick Fix Checklist

- [ ] Check Railway logs for `gdd-assets` status
- [ ] Visit `/api/admin/debug-paths` to confirm issue
- [ ] Create Railway Volume if needed
- [ ] Populate assets via `/api/admin/download-assets` or manual upload
- [ ] Verify assets load correctly
- [ ] Test asset viewing in frontend

## Need Help?

If assets still don't load after following these steps:

1. Check Railway logs for specific error messages
2. Verify volume mount path matches: `/app/packages/core/gdd-assets`
3. Ensure `ADMIN_UPLOAD_TOKEN` is set if using download endpoint
4. Check file permissions on uploaded assets

