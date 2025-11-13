# Railway Deployment Guide

## Port Configuration (November 2025 Standards)

### Main API Service

Railway automatically provides a `PORT` environment variable that your application MUST listen on:

```typescript
// ✅ CORRECT - Our implementation (api-elysia.ts:97)
const API_PORT = process.env.PORT || process.env.API_PORT || 3004;

app.listen({
  port: Number(API_PORT),
  hostname: "0.0.0.0", // ✅ Must bind to all interfaces for Railway
});
```

**Key Rules:**
- ✅ Always use `process.env.PORT` as the primary port source
- ✅ Bind to `0.0.0.0` (not `localhost` or `127.0.0.1`)
- ✅ Never hardcode ports in production
- ✅ Railway assigns the port dynamically

### Worker Service

Workers that only process Redis queue jobs **DO NOT need a PORT**:

```typescript
// ✅ CORRECT - Workers are HTTP-free (generation-worker.ts)
// Workers poll Redis queue and process jobs in background
// No HTTP server needed
```

**Worker Architecture:**
- Workers process jobs from Redis queue (no HTTP endpoints)
- No health checks exposed (Railway monitors process directly)
- Graceful shutdown via SIGTERM/SIGINT signals
- Status updates via Redis pub/sub, not HTTP

**When would workers need PORT?**
- If exposing health check HTTP endpoints
- If exposing metrics HTTP endpoints
- Currently: ❌ Not needed - pure queue processing

## Required Environment Variables

These environment variables **MUST** be set in Railway for production deployment:

### Critical Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# CDN Configuration (REQUIRED in production)
CDN_URL=https://your-cdn-url.com
# Example: https://cdn.asset-forge.com

# Image Server for Meshy AI Callbacks (REQUIRED in production)
IMAGE_SERVER_URL=https://your-api-url.com
# Example: https://api.asset-forge.com
# This must be the publicly accessible URL of your API server

# Authentication (Privy)
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# AI Services
AI_GATEWAY_API_KEY=your-ai-gateway-key
# OR
OPENAI_API_KEY=your-openai-key

# 3D Generation
MESHY_API_KEY=your-meshy-api-key
```

### Optional Variables

```bash
# CDN Publishing (optional but recommended)
CDN_API_KEY=your-cdn-api-key

# Voice/Audio Generation
ELEVENLABS_API_KEY=your-elevenlabs-key

# Vector Search
QDRANT_URL=your-qdrant-url

# Image Hosting
IMGUR_CLIENT_ID=your-imgur-client-id

# Assets Directory (defaults to gdd-assets in project root)
ASSETS_DIR=/path/to/assets

# API Port (Railway sets PORT automatically)
# NOTE: Do NOT set this manually - Railway auto-assigns it
# PORT=<auto-assigned-by-railway>
```

## Deployment Checklist

- [ ] Set `DATABASE_URL` with Railway PostgreSQL connection string
- [ ] Set `CDN_URL` to your CDN's public URL
- [ ] Set `IMAGE_SERVER_URL` to your Railway app's public URL
- [ ] Set `PRIVY_APP_ID` and `PRIVY_APP_SECRET` from Privy dashboard
- [ ] Set `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` for AI features
- [ ] Set `MESHY_API_KEY` for 3D generation
- [ ] (Optional) Set `CDN_API_KEY` for CDN publishing
- [ ] (Optional) Set `ELEVENLABS_API_KEY` for voice/music generation
- [ ] (Optional) Set `QDRANT_URL` for vector search

## Common Issues

### Error: "CDN_URL must be set in production environment"

**Cause:** Missing `CDN_URL` environment variable in Railway.

**Fix:** Add `CDN_URL` to your Railway environment variables pointing to your CDN.

### Error: "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks"

**Cause:** Missing `IMAGE_SERVER_URL` environment variable in Railway.

**Fix:** Add `IMAGE_SERVER_URL` to your Railway environment variables. This should be your Railway app's public URL (e.g., `https://your-app.up.railway.app`).

### Warning: "[CDNPublishService] No API key provided - uploads may fail!"

**Cause:** Missing optional `CDN_API_KEY` environment variable.

**Impact:** Non-critical - CDN uploads will work without authentication, but are less secure.

**Fix:** Add `CDN_API_KEY` to your Railway environment variables if your CDN requires authentication.

### Database Migration Warnings: "relation already exists"

**Status:** Normal - handled gracefully by migration script.

**Cause:** Database tables already exist from previous deployment.

**Action:** No action needed - migrations will skip existing tables.

### Warning: "[Static Files] Asset X not found in database"

**Status:** Normal - backward compatibility mode.

**Cause:** Assets not yet indexed in database.

**Action:** Assets will still be served without authentication checks.

## Monitoring

Check these endpoints after deployment:

- **Health Check:** `https://your-app.up.railway.app/api/health`
- **API Docs:** `https://your-app.up.railway.app/swagger`
- **Metrics:** `https://your-app.up.railway.app/metrics`
- **Business Metrics:** `https://your-app.up.railway.app/metrics/business`

## Logs

Monitor Railway logs for:

- Server startup confirmation: "Server ready! Environment: production"
- Configuration status showing all enabled features
- No `TypeError: undefined is not an object` errors
- Successful database migrations

## Performance

Expected performance with Elysia + Bun:

- 22x faster than Express
- 2.4M requests/second throughput
- Sub-millisecond response times for static files

## Railway Best Practices (November 2025)

### Using Railpack (Not Nixpacks)

✅ **We're using Railpack** (the modern builder that replaced deprecated Nixpacks)

Configuration: `packages/core/railpack.json`

```json
{
  "packages": {
    "node": "22.12.0",
    "bun": "latest"
  },
  "deploy": {
    "cmd": "bun run start:workers"
  }
}
```

### Port Binding Summary

| Service | Needs PORT? | Binding | Config File |
|---------|-------------|---------|-------------|
| **Main API** | ✅ Yes | `0.0.0.0:$PORT` | `api-elysia.ts:97` |
| **Workers** | ❌ No | N/A (no HTTP) | `generation-worker.ts` |
| **CDN** | ✅ Yes | `0.0.0.0:$PORT` | `asset-forge-cdn` repo |

### Environment Variables Railway Auto-Provides

These are automatically set by Railway (don't set them manually):

```bash
PORT                        # Dynamically assigned port (main API only)
RAILWAY_ENVIRONMENT         # production/staging/development
RAILWAY_SERVICE_NAME        # Service name
RAILWAY_PUBLIC_DOMAIN       # Public domain (if custom domain)
RAILWAY_STATIC_URL          # Generated Railway URL
RAILWAY_VOLUME_MOUNT_PATH   # Volume mount point (if volume attached)
```

### Service Architecture

**Main API Service** (`railway.toml` at project root):
- Exposes HTTP API endpoints
- Listens on Railway-assigned `PORT`
- Health check at `/api/health`
- Serves frontend SPA

**Worker Service** (`railway.toml` in `packages/core`):
- No HTTP endpoints
- Processes Redis queue jobs
- No health checks (Railway monitors process)
- Communicates via Redis pub/sub

### Troubleshooting Port Issues

**Problem:** Application not receiving traffic

**Solution:**
1. ✅ Verify using `process.env.PORT` (not hardcoded)
2. ✅ Verify binding to `0.0.0.0` (not `localhost`)
3. ✅ Check Railway logs for port assignment
4. ✅ Verify health check path is correct

**Problem:** Workers failing to start

**Solution:**
1. ✅ Workers don't need PORT - check if accidentally trying to bind
2. ✅ Verify Redis connection via `REDIS_URL`
3. ✅ Check Railway logs for connection errors
4. ✅ Verify `WORKER_CONCURRENCY` is set appropriately

### Troubleshooting Qdrant Connection Issues

**Problem:** `Failed to obtain server version` or `Unable to connect` to Qdrant

**Common Causes:**
1. **Wrong URL protocol**:
   - ❌ Bad: `https://qdrant.railway.internal:6333`
   - ✅ Good: `http://qdrant.railway.internal:6333` (internal)
   - ✅ Good: `https://qdrant-production-xxx.up.railway.app` (external)

2. **Using internal URL from workers**:
   - Workers might not have access to Railway internal networking
   - Use external (public) URL for worker services

3. **Qdrant not deployed**:
   - Qdrant is optional - services gracefully degrade if unavailable
   - Vector search features will be disabled

**Solutions:**

**For Main API Service** (railway.toml at project root):
```bash
# Use internal URL for lower latency (if working)
QDRANT_URL=http://qdrant.railway.internal:6333
# OR use external URL
QDRANT_URL=https://qdrant-production-xxx.up.railway.app
```

**For Worker Service** (packages/core/railway.toml):
```bash
# Workers should use external URL
QDRANT_URL=https://qdrant-production-xxx.up.railway.app
```

**To verify Qdrant is working:**
```bash
# From Railway shell
railway run curl http://qdrant.railway.internal:6333/collections
# OR
curl https://qdrant-production-xxx.up.railway.app/collections
```

**Graceful Degradation:**
- If `QDRANT_URL` is not set, services start without vector search
- Warnings appear in logs but services remain functional
- Vector search endpoints return 503 Service Unavailable
