# Railway Deployment Guide

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
PORT=3004  # Set by Railway automatically
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
