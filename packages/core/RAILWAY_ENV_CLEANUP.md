# Railway Environment Variable Cleanup Checklist

This checklist documents deprecated environment variables that should be removed from your Railway dashboard.

## Deprecated Variables to Remove

### ADMIN_UPLOAD_TOKEN

- **Status**: DEPRECATED - Fully removed from codebase
- **Reason**: Legacy admin upload token is no longer used after removal of `/api/admin/download-assets` endpoint
- **Action**: Delete from Railway dashboard environment variables

### ASSETS_DIR

- **Status**: DEPRECATED - No longer used in CDN-first architecture
- **Reason**: Asset-Forge now uses CDN-first architecture. All assets are stored on CDN, not locally
- **Action**: Delete from Railway dashboard environment variables

### CDN_WEBHOOK_ENABLED

- **Status**: DEPRECATED - WebSocket integration preferred
- **Reason**: WebSocket integration is now the recommended approach for real-time CDN events
- **Action**: Delete from Railway dashboard environment variables (unless you specifically need webhooks)

### WEBHOOK_SECRET

- **Status**: DEPRECATED - WebSocket integration preferred
- **Reason**: Only needed if using webhook-based CDN integration (deprecated)
- **Action**: Delete from Railway dashboard environment variables (unless you specifically need webhooks)

### WEBHOOK_SYSTEM_USER_ID

- **Status**: DEPRECATED - WebSocket integration preferred
- **Reason**: Only needed if using webhook-based CDN integration (deprecated)
- **Action**: Delete from Railway dashboard environment variables (unless you specifically need webhooks)

## How to Remove Variables from Railway

### Via Railway Dashboard

1. Go to your Railway project: https://railway.app/dashboard
2. Select your **asset-forge** service
3. Click on the **Variables** tab
4. For each deprecated variable:
   - Click the **...** menu next to the variable
   - Select **Remove**
   - Confirm deletion

### After Cleanup

After removing deprecated variables, redeploy your service:

```bash
# Trigger a new deployment
railway up

# Or via git push
git push railway main
```

### Verify Cleanup

Check that your service starts successfully without the deprecated variables:

```bash
# Check deployment logs
railway logs

# Test health endpoint
curl https://your-service.up.railway.app/api/health/ready
```

## Current Required Variables

For reference, here are the environment variables that SHOULD remain in production:

### Required (Critical)

- `DATABASE_URL` - PostgreSQL connection string
- `PRIVY_APP_ID` - Privy authentication app ID
- `PRIVY_APP_SECRET` - Privy app secret
- `NODE_ENV` - Should be "production"
- `PORT` - Server port (Railway sets automatically)

### Required for Full Functionality

- `AI_GATEWAY_API_KEY` - Vercel AI Gateway (recommended)
- `OPENAI_API_KEY` - OpenAI API key (fallback if no AI Gateway)
- `MESHY_API_KEY` - Meshy AI for 3D generation
- `CDN_URL` - CDN base URL (e.g., https://hyperforge-cdn.up.railway.app)
- `CDN_API_KEY` - CDN authentication key
- `IMAGE_SERVER_URL` - Public URL for Meshy callbacks

### Optional but Recommended

- `CDN_WS_URL` - CDN WebSocket URL for real-time events
- `FRONTEND_URL` - Frontend origin for CORS
- `ELEVENLABS_API_KEY` - Voice generation
- `QDRANT_URL` - Vector database
- `QDRANT_API_KEY` - Qdrant authentication
- `REDIS_URL` - Job queue
- `API_KEY_ENCRYPTION_SECRET` - For encrypting user API keys

## Verification After Cleanup

Run these checks to ensure everything works correctly:

```bash
# 1. Check health endpoint
curl https://your-service.up.railway.app/api/health/ready

# Expected response:
# {"status":"ready","checks":{"database":true}}

# 2. Check CDN health
curl https://your-service.up.railway.app/api/debug/cdn-health

# Expected: CDN healthy, no deprecated variables mentioned

# 3. Test asset generation
# Use your frontend or API client to create a test asset
# Verify it uploads to CDN successfully
```

## Questions?

If you encounter issues after cleanup:

1. Check Railway deployment logs: `railway logs`
2. Verify all required variables are still set
3. Test with `/api/health/ready` endpoint
4. Check CDN connectivity with `/api/debug/cdn-health`

## Cleanup Completed

Mark this checklist when done:

- [ ] Removed `ADMIN_UPLOAD_TOKEN` from Railway
- [ ] Removed `ASSETS_DIR` from Railway
- [ ] Removed `CDN_WEBHOOK_ENABLED` from Railway (if not using webhooks)
- [ ] Removed `WEBHOOK_SECRET` from Railway (if not using webhooks)
- [ ] Removed `WEBHOOK_SYSTEM_USER_ID` from Railway (if not using webhooks)
- [ ] Redeployed service
- [ ] Verified health endpoints
- [ ] Tested asset generation
- [ ] Confirmed CDN integration working

---

**Last Updated**: 2025-11-16
**Related**: See `dev-book/deployment/production-checklist.md` for full deployment guide
