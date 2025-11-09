# Railway Deployment Guide

**Last Updated**: January 2025
**Builder**: Railpack (Nixpacks is deprecated)

## Overview

This guide covers deploying the Asset-Forge monorepo to Railway using **Railpack**, Railway's modern builder that replaced Nixpacks in March 2025.

## Why Railpack?

- **38-77% smaller images** than Nixpacks
- **Better caching** with BuildKit integration
- **First-class Bun support** with latest versions always available
- **Native Vite + SPA support**
- **Granular versioning** (major.minor.patch)

## Architecture

**Deployment Model**: Single Railway Service

- **Frontend**: Vite + React 19 (built to `packages/core/dist/`)
- **Backend**: Elysia API server (serves both API + built frontend)
- **Database**: Railway PostgreSQL (connected via plugin)
- **Runtime**: Bun 1.1.38
- **Package Manager**: Bun

## Prerequisites

1. **GitHub Account** (Railway connects to GitHub repos)
2. **Railway Account** (sign up at railway.app)
3. **Environment Variables** (see section below)

## Step 1: Connect GitHub Repository

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `asset-forge` repository
6. Railway will automatically detect:
   - Bun monorepo structure
   - `packages/core` as deployable service
   - Railpack as the builder

## Step 2: Configure Environment Variables

In Railway Dashboard → Your Project → Variables tab, add:

### Required Variables

```bash
# Database (auto-provided by Railway PostgreSQL plugin)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Authentication
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# AI Services
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
# OR if not using AI Gateway:
# OPENAI_API_KEY=your_openai_key

# 3D Generation
MESHY_API_KEY=your_meshy_api_key

# Audio Generation
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Admin (for asset uploads)
ADMIN_UPLOAD_TOKEN=your_secure_token

# Environment
NODE_ENV=production
```

### Auto-Provided Variables

Railway automatically sets:
- `PORT` - Your app uses this in `api-elysia.ts`
- `DATABASE_URL` - When PostgreSQL plugin is added

## Step 3: Add PostgreSQL Database

1. In Railway Dashboard → **New** → **Database** → **Add PostgreSQL**
2. Railway automatically:
   - Creates a PostgreSQL instance
   - Sets `DATABASE_URL` environment variable
   - Links it to your service

Your `start:api` script automatically runs migrations:
```bash
bun run db:migrate
```

## Step 4: Configure Asset Storage

Your app uses `gdd-assets/` directory for 3D models. Choose one option:

### Option A: Railway Volume (Recommended)

1. In Railway Dashboard → **New** → **Volume**
2. **Name**: `asset-storage`
3. **Mount Path**: `/app/packages/core/gdd-assets`
4. Link to your service

**Populate Assets**:
```bash
# After deployment, use the admin endpoint:
POST https://your-app.railway.app/api/admin/download-assets
Headers:
  Authorization: Bearer your_admin_upload_token
Body:
  {
    "url": "https://your-assets-url.com/gdd-assets.tar.gz"
  }
```

### Option B: Cloud Storage (Future)

Migrate to S3/Cloudflare R2 for better scalability (requires code changes).

## Step 5: Deploy

### Automatic Deployment

Railway auto-deploys when you push to your connected branch:

```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

### Manual Deployment

In Railway Dashboard → **Deployments** → **Deploy Now**

## Step 6: Verify Deployment

After deployment completes:

1. **Check Health**:
   ```bash
   curl https://your-app.railway.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-09T..."
   }
   ```

2. **Check Frontend**: Visit `https://your-app.railway.app/`
3. **Check API Docs**: Visit `https://your-app.railway.app/swagger`
4. **Check Logs**: Railway Dashboard → **Logs** tab

## Build Process

Railway uses the configuration in `railway.toml`:

```toml
[build]
builder = "RAILPACK"
buildCommand = "cd packages/core && bun run build"

[deploy]
startCommand = "cd packages/core && bun run start:api"
healthcheckPath = "/api/health"
```

**What happens during build**:
1. Railway detects Bun monorepo
2. Installs dependencies with `bun install`
3. Runs `cd packages/core && bun run build` (Vite builds frontend to `dist/`)
4. Creates optimized container image with Railpack

**What happens during start**:
1. `bun run build:services` - Builds server services
2. `bun run db:migrate` - Runs database migrations
3. `NODE_ENV=production bun server/api-elysia.ts` - Starts Elysia server
4. Elysia serves:
   - API routes at `/api/*`
   - Built frontend from `dist/`
   - Static assets from `gdd-assets/`, `public/`, etc.

## Configuration Files

### `railway.toml`

Root-level Railway configuration:
- Build command
- Start command
- Health check path
- Restart policy
- Watch paths for rebuilds

### `.railpackignore`

Excludes unnecessary files from build (like `.dockerignore`):
- Development files
- Tests
- Documentation
- Local env files
- IDE configs

## Custom Domain (Optional)

1. Railway Dashboard → **Settings** → **Domains**
2. Click **Generate Domain** for Railway subdomain
3. Or click **Custom Domain** to add your own:
   - Enter your domain (e.g., `app.yoursite.com`)
   - Add CNAME record in your DNS:
     ```
     CNAME app.yoursite.com -> your-project.up.railway.app
     ```

## Troubleshooting

### Build Fails

**Check Logs**:
```bash
# Railway Dashboard → Logs tab
# Look for errors in build phase
```

**Common Issues**:
- Missing environment variables
- Node version mismatch (ensure using Bun, not Node)
- TypeScript errors (run `bun run typecheck` locally first)

### App Crashes on Start

**Check**:
1. `DATABASE_URL` is set correctly
2. All required env vars are present
3. Health check endpoint returns 200
4. Port is `process.env.PORT` (Railway sets this)

**Logs**:
```bash
# Railway Dashboard → Logs tab
# Look for startup errors
```

### Database Connection Fails

**Verify**:
1. PostgreSQL plugin is added
2. Database is linked to service
3. `DATABASE_URL` is in environment variables
4. Migrations ran successfully

**Test Connection**:
```bash
# Railway Dashboard → PostgreSQL → Data tab
# Or use `psql` with the connection string
```

### Assets Not Loading

**Check**:
1. Volume is created and mounted at `/app/packages/core/gdd-assets`
2. Assets were uploaded via `/api/admin/download-assets`
3. Static plugin paths are correct in `api-elysia.ts`

**Debug**:
```bash
# Check asset files exist:
GET https://your-app.railway.app/api/admin/debug-paths
```

## Performance Optimization

### Image Size

Railpack automatically creates optimized images:
- **Node apps**: ~38% smaller than Nixpacks
- **Python apps**: ~77% smaller than Nixpacks
- **Bun apps**: First-class optimization

### Caching

Railway caches:
- Bun dependencies (`bun.lockb`)
- Build artifacts
- Layer cache with BuildKit

**Faster Rebuilds**:
- Update `railway.toml` watch paths to rebuild only when needed
- Use `.railpackignore` to exclude unnecessary files

### Scaling

**Horizontal Scaling**:
- Railway Dashboard → **Settings** → **Replicas**
- Set replica count (costs more)

**Vertical Scaling**:
- Railway automatically provisions resources
- Upgrade plan for more memory/CPU

## Monitoring

### Logs

```bash
# Railway Dashboard → Logs tab
# Real-time streaming logs
# Filter by severity (info, warn, error)
```

### Metrics

```bash
# Railway Dashboard → Metrics tab
# CPU usage
# Memory usage
# Network traffic
```

### Alerts

Configure in Railway Dashboard → **Settings** → **Alerts**:
- Deploy failures
- High error rates
- Resource limits

## CI/CD

Railway auto-deploys on git push. **No additional CI/CD needed.**

**Branch Deployments**:
1. Railway Dashboard → **Settings** → **Branch Deployments**
2. Enable for staging/preview environments

## Costs

Railway pricing (as of 2025):
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (usage-based)
- **PostgreSQL**: Included in plan

**Estimate Your Costs**:
- 1 service (frontend + backend)
- 1 PostgreSQL database
- 1 volume (if using)
= ~$5-20/month depending on traffic

## Support

- **Railway Docs**: [docs.railway.com](https://docs.railway.com)
- **Railway Discord**: Community support
- **Help Station**: [station.railway.com](https://station.railway.com)

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Railway project
3. ✅ Add PostgreSQL plugin
4. ✅ Set environment variables
5. ✅ Add Volume for assets (optional)
6. ✅ Deploy!
7. ✅ Verify health check
8. ✅ Test frontend and API
9. ✅ Configure custom domain (optional)
10. ✅ Monitor logs and metrics

**Happy Deploying! 🚀**
