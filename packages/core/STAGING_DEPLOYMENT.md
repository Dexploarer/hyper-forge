# Staging Deployment Guide - Railway

This guide explains how to deploy Asset-Forge to Railway staging environment using November 2025 best practices.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Workflow](#deployment-workflow)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Railway CLI installed: `npm install -g @railway/cli`
- Git repository connected to Railway
- Access to environment secrets (Privy, API keys, etc.)

---

## Initial Setup

### 1. Create Railway Project

```bash
# Login to Railway CLI
railway login

# Link your project (from packages/core directory)
cd ${HOME}/asset-forge/packages/core
railway link

# Or create a new project
railway init
```

### 2. Create Staging Environment

**Option A: Via Railway Dashboard**

1. Go to your project in Railway Dashboard
2. Click **Settings** → **Environments**
3. Click **New Environment**
4. Name it "staging"
5. Link to branch: "staging"
6. Enable **Auto-Deploy** from staging branch

**Option B: Via Railway CLI**

```bash
# Create staging environment
railway environment create staging

# Link to staging branch
railway environment link staging --branch staging
```

### 3. Provision Database

**PostgreSQL:**

```bash
# Add PostgreSQL plugin to staging environment
railway add --environment staging postgresql

# Get database URL
railway variables --environment staging
```

**Qdrant Vector Database:**

```bash
# Add Qdrant plugin (if available) or configure external Qdrant
railway add --environment staging qdrant

# Or use external Qdrant cloud
# Get URL from https://cloud.qdrant.io/
```

---

## Environment Configuration

### Required Environment Variables

Set these in Railway Dashboard → Staging Environment → Variables:

```bash
# Database
DATABASE_URL=<railway-provided-postgres-url>

# Privy Authentication
PRIVY_APP_ID=<your-staging-privy-app-id>
PRIVY_APP_SECRET=<your-staging-privy-secret>

# AI Services
AI_GATEWAY_API_KEY=<your-ai-gateway-key>
MESHY_API_KEY=<your-meshy-key>

# Vector Database
QDRANT_URL=<staging-qdrant-url>
QDRANT_API_KEY=<staging-qdrant-key>

# Environment
NODE_ENV=staging
LOG_LEVEL=debug

# Optional: Error Tracking
SENTRY_DSN=<optional-staging-sentry-dsn>

# Optional: Feature Flags
ENABLE_FEATURE_X=true
```

### Setting Variables via CLI

```bash
# Set individual variables
railway variables set DATABASE_URL="postgresql://..." --environment staging
railway variables set NODE_ENV="staging" --environment staging

# Or use .env file
railway variables set -f .env.staging --environment staging
```

---

## Deployment Workflow

### Create Staging Branch

```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### Deploy to Staging

**Automatic Deployment (Recommended):**

```bash
# Simply push to staging branch - Railway auto-deploys
git checkout staging
git merge main  # Or cherry-pick specific commits
git push origin staging

# Railway will automatically:
# 1. Detect push to staging branch
# 2. Run build command (bun install && bun run build)
# 3. Run migrations (bun run start:api includes db:migrate)
# 4. Start server
# 5. Run health checks
```

**Manual Deployment:**

```bash
# Deploy specific branch to staging environment
railway up --environment staging

# Or deploy from current directory
railway deploy --environment staging
```

### Monitor Deployment

```bash
# Watch deployment logs in real-time
railway logs --environment staging --follow

# Check deployment status
railway status --environment staging

# View recent deployments
railway deployments --environment staging
```

---

## Verification

### 1. Health Check

```bash
# Get your staging URL
STAGING_URL=$(railway domain --environment staging)

# Check liveness probe
curl https://$STAGING_URL/api/health/live

# Expected response:
# {"status":"healthy","timestamp":"2025-11-12T...","uptime":123.45}

# Check deep health check
curl https://$STAGING_URL/api/health/deep

# Expected response includes database, qdrant, disk, memory checks
```

### 2. API Endpoints

```bash
# Test Swagger documentation
curl https://$STAGING_URL/swagger

# Test achievements endpoint
curl https://$STAGING_URL/api/achievements

# Test metrics endpoint
curl https://$STAGING_URL/metrics/business
```

### 3. Run Load Tests Against Staging

```bash
# From local environment
API_URL=https://$STAGING_URL bun run test:load

# Should pass all performance benchmarks
```

### 4. Database Verification

```bash
# Connect to staging database
railway connect postgres --environment staging

# Verify migrations ran
\dt  # List tables
SELECT * FROM achievements;  # Should show 7 default achievements

# Exit
\q
```

---

## PR Preview Environments

**Enable PR Previews:**

1. Railway Dashboard → Settings → Environments
2. Enable **PR Environments**
3. Configure:
   - Base environment: staging
   - Auto-delete on PR merge: ✓
   - Auto-delete on PR close: ✓

**Usage:**

```bash
# Create PR from feature branch
git checkout -b feature/new-feature
git push origin feature/new-feature

# Railway automatically creates preview environment
# URL: https://pr-123-asset-forge.up.railway.app

# Test your changes in isolation
# Merge PR → Environment auto-deletes
```

---

## Deployment Checklist

Before deploying to staging:

- [ ] All tests passing locally (`bun test`)
- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] Environment variables configured in Railway
- [ ] Database migrations tested locally
- [ ] Staging branch created and pushed
- [ ] Railway environment linked to staging branch
- [ ] Auto-deploy enabled

After deployment:

- [ ] Health check endpoint returns 200
- [ ] Swagger UI accessible
- [ ] Database has default achievements
- [ ] Metrics endpoint working
- [ ] Load tests pass against staging
- [ ] Logs show no errors
- [ ] Sentry (if configured) receiving events

---

## Troubleshooting

### Deployment Fails

**Check build logs:**

```bash
railway logs --environment staging | grep ERROR
```

**Common issues:**

- Missing environment variables → Set in Railway dashboard
- Build timeout → Increase build timeout in Railway settings
- Database not ready → Add retry logic to migration script
- Bun not detected → Railway uses Railpack (not deprecated Nixpacks) to auto-detect Bun from package.json

### Application Crashes

**Check application logs:**

```bash
railway logs --environment staging --tail 100
```

**Common issues:**

- Database connection failed → Check `DATABASE_URL`
- Missing API keys → Verify all secrets are set
- Port binding issue → Ensure server listens on `PORT` env var

### Database Migration Issues

**Manual migration:**

```bash
# Connect to staging environment
railway shell --environment staging

# Run migrations manually
bun run db:migrate

# Exit
exit
```

### Rollback Deployment

**Rollback to previous deployment:**

```bash
# List recent deployments
railway deployments --environment staging

# Rollback to specific deployment
railway rollback <deployment-id> --environment staging
```

---

## Best Practices

1. **Always test locally first** - Run full test suite before pushing
2. **Use feature branches** - Deploy features to PR previews before merging to staging
3. **Monitor staging closely** - Watch logs after each deployment
4. **Keep staging in sync** - Regularly merge main into staging to catch integration issues
5. **Use staging for QA** - Test new features thoroughly in staging before production
6. **Separate databases** - Never use production database in staging
7. **Enable error tracking** - Use Sentry or similar for staging to catch issues early
8. **Set realistic limits** - Configure rate limiting to match expected staging traffic

---

## Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Environments Guide](https://docs.railway.app/reference/environments)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Bun Documentation](https://bun.sh/docs)
- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations)

---

## Support

For Railway-specific issues:

- Railway Discord: https://discord.gg/railway
- Railway GitHub Discussions: https://github.com/railwayapp/railway/discussions

For Asset-Forge issues:

- GitHub Issues: https://github.com/your-org/asset-forge/issues
- Documentation: `packages/core/dev-book/`
