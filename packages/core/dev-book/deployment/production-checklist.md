# Production Deployment Checklist

Complete checklist for deploying Asset-Forge Elysia API server to production.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Database Setup](#database-setup)
3. [Security Configuration](#security-configuration)
4. [Performance Tuning](#performance-tuning)
5. [Monitoring Setup](#monitoring-setup)
6. [Infrastructure](#infrastructure)
7. [Pre-deployment Tests](#pre-deployment-tests)
8. [Deployment Steps](#deployment-steps)
9. [Post-deployment Verification](#post-deployment-verification)
10. [Rollback Procedure](#rollback-procedure)
11. [Common Issues](#common-issues)

---

## Environment Variables

### Required Variables

| Variable           | Description                     | Example                               | Notes                             |
| ------------------ | ------------------------------- | ------------------------------------- | --------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string    | `postgresql://user:pass@host:5432/db` | **CRITICAL** - Must be accessible |
| `PRIVY_APP_ID`     | Privy authentication app ID     | `clabcd1234efgh5678ijkl`              | Required for auth                 |
| `PRIVY_APP_SECRET` | Privy app secret                | `secret_abc123...`                    | Keep secure, never commit         |
| `NODE_ENV`         | Environment mode                | `production`                          | Disables detailed errors          |
| `PORT`             | Server port (Railway uses this) | `3004`                                | Railway sets automatically        |

### Recommended Variables

| Variable             | Description               | Example                      | Notes                          |
| -------------------- | ------------------------- | ---------------------------- | ------------------------------ |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key     | `vg_abc123...`               | Recommended over direct OpenAI |
| `OPENAI_API_KEY`     | OpenAI API key (fallback) | `sk-abc123...`               | Used if AI Gateway not set     |
| `MESHY_API_KEY`      | Meshy AI 3D generation    | `msy_abc123...`              | Required for 3D generation     |
| `ELEVENLABS_API_KEY` | ElevenLabs voice/audio    | `el_abc123...`               | Required for voice features    |
| `QDRANT_URL`         | Qdrant vector database    | `https://qdrant.example.com` | Optional - for vector search   |
| `QDRANT_API_KEY`     | Qdrant API key            | `abc123...`                  | If Qdrant requires auth        |
| `FRONTEND_URL`       | Frontend origin for CORS  | `https://app.example.com`    | Restricts CORS in production   |
| `CDN_URL`            | CDN base URL for assets   | `https://cdn.example.com`    | For stable asset delivery      |
| `IMGUR_CLIENT_ID`    | Imgur client ID           | `abc123...`                  | Optional - for image hosting   |

### CDN Configuration Variables

| Variable           | Description                | Example                            | Notes                      |
| ------------------ | -------------------------- | ---------------------------------- | -------------------------- |
| `CDN_URL`          | CDN base URL               | `https://cdn.example.com`          | Required for production    |
| `CDN_API_KEY`      | CDN API authentication key | Generate with openssl rand -hex 32 | Required for production    |
| `CDN_WS_URL`       | CDN WebSocket URL          | `wss://cdn.example.com/ws/events`  | Optional for real-time     |
| `IMAGE_SERVER_URL` | Base URL for image serving | `https://api.example.com`          | Defaults to current server |

### Verification Command

```bash
# Check all required environment variables are set
bun run ${HOME}/asset-forge/packages/core/scripts/check-env.sh
```

---

## Database Setup

### 1. Provision PostgreSQL Database

**Railway:**

```bash
# Add PostgreSQL plugin to your Railway project
# Railway automatically sets DATABASE_URL
```

**Manual Setup:**

```bash
# Create database
createdb asset_forge_production

# Set connection string
export DATABASE_URL="postgresql://user:password@host:5432/asset_forge_production"
```

### 2. Run Migrations

```bash
# Navigate to core package
cd packages/core

# Generate migrations from schema (if needed)
bun run db:generate

# Apply all pending migrations
bun run db:migrate

# Verify migration success
bun run db:studio  # Opens Drizzle Studio
```

**Expected Tables:**

- `users` - User profiles and authentication
- `assets` - Asset metadata and ownership
- `projects` - Project organization
- `activity_log` - Audit trail
- `achievements` - User achievements
- `generation_jobs` - AI generation tracking
- `media_storage` - Media file tracking
- `world_configs` - World configuration settings
- `relationships` - Entity relationships

### 3. Create Database Indexes

```sql
-- Performance indexes (run manually if needed)
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
```

### 4. Connection Pooling

Asset-Forge uses Drizzle ORM with PostgreSQL connection pooling.

**Configuration in `packages/core/server/db/db.ts`:**

```typescript
// Connection pool is managed by Drizzle
// Default pool size: 10 connections
// Adjust if needed for high traffic
```

---

## Security Configuration

### 1. CORS Configuration

Update `FRONTEND_URL` to restrict origins:

```bash
# Production - restrict to your frontend domain
FRONTEND_URL=https://app.example.com

# Development - allows all origins
FRONTEND_URL=*
```

**Code Location:** `/packages/core/server/api-elysia.ts`

```typescript
cors({
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "*"
      : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
});
```

### 2. Rate Limiting

**Current Configuration:**

- **Limit:** 100 requests per minute per IP
- **Window:** 60 seconds
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Excluded:** `/api/health` (for load balancers)

**To Adjust:**
Edit `/packages/core/server/api-elysia.ts`:

```typescript
rateLimit({
  duration: 60000, // 1 minute
  max: 100, // Adjust based on load testing
  skip: (req) => new URL(req.url).pathname === "/api/health",
});
```

### 3. Security Headers

**Current Headers (via `security-headers` plugin):**

- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (for Privy wallets)
- `Cross-Origin-Embedder-Policy: credentialless` (for Privy wallets)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

**Code Location:** `/packages/core/server/plugins/security-headers.ts`

### 4. Authentication Secrets

**CRITICAL:** Rotate secrets before production:

```bash
# Generate new Privy app in production mode
# Visit: https://dashboard.privy.io/

# Update environment variables:
PRIVY_APP_ID=your_production_app_id
PRIVY_APP_SECRET=your_production_app_secret
```

### 5. File Upload Limits

**Current Limit:** 100MB per request

```typescript
// In api-elysia.ts
.listen({
  maxRequestBodySize: 100 * 1024 * 1024, // 100MB
})
```

---

## Performance Tuning

### 1. Bun Runtime Flags

**Recommended Production Flags:**

```bash
# Enable JIT compilation (faster)
bun --jit run server/api-elysia.ts

# Increase memory limit for large uploads
bun --max-old-space-size=4096 run server/api-elysia.ts

# Combined (recommended)
bun --jit --max-old-space-size=4096 run server/api-elysia.ts
```

### 2. Database Connection Limits

**PostgreSQL Configuration:**

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Recommended settings for production
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### 3. Caching Strategy

**Current Caching:**

- **Image Proxy:** 1 year immutable cache for proxied images
- **Static Assets:** Browser cache via `Cache-Control` headers
- **API Responses:** No caching (dynamic content)

**To Add Redis Caching:**

```typescript
// Future enhancement - add Redis for session caching
import { Bun } from "bun";

const redis = await Bun.redis({
  url: process.env.REDIS_URL,
});
```

### 4. Asset Storage Optimization

**Railway Volume Setup:**

```bash
# Ensure volume is mounted (Railway does this automatically)
# Assets are stored in: $RAILWAY_VOLUME_MOUNT_PATH/gdd-assets

# Verify volume mount
echo $RAILWAY_VOLUME_MOUNT_PATH
```

**Local Development:**

```bash
# Assets stored in: packages/core/gdd-assets
```

---

## Monitoring Setup

### 1. Prometheus Metrics

**Endpoint:** `GET /metrics`

**Available Metrics:**

- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request count
- `http_request_size_bytes` - Request body size
- `http_response_size_bytes` - Response body size
- `nodejs_heap_size_used_bytes` - Memory usage
- `process_cpu_user_seconds_total` - CPU usage

**Prometheus Configuration:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "asset-forge-api"
    scrape_interval: 15s
    static_configs:
      - targets: ["api.example.com:3004"]
    metrics_path: "/metrics"
```

### 2. Health Check Endpoints

| Endpoint                | Purpose                               | Expected Response                          |
| ----------------------- | ------------------------------------- | ------------------------------------------ |
| `GET /api/health/live`  | Liveness probe (is server running?)   | `{"status": "ok"}`                         |
| `GET /api/health/ready` | Readiness probe (can handle traffic?) | `{"status": "ready", "checks": {...}}`     |
| `GET /api/health`       | Legacy health check                   | `{"status": "healthy", "services": {...}}` |

**Kubernetes Liveness Probe:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3004
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

**Kubernetes Readiness Probe:**

```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3004
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

### 3. Error Tracking

**Recommended:** Sentry, Datadog, or New Relic

**Setup Example (Sentry):**

```typescript
// Add to api-elysia.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 4. Logging

**Current Logging:**

- **Console:** Structured logs via Pino logger
- **Format:** JSON for production
- **Levels:** DEBUG, INFO, WARN, ERROR

**Log Aggregation (Recommended):**

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- Datadog Logs

---

## Infrastructure

### 1. Load Balancer

**Requirements:**

- Health check: `GET /api/health/ready`
- Session affinity: Not required (stateless API)
- SSL/TLS: Terminate at load balancer
- Timeout: 60 seconds (for long-running generation jobs)

**Railway:**

```bash
# Railway handles load balancing automatically
# SSL/TLS certificates provisioned via Railway domains
```

### 2. CDN Configuration

**For Static Assets:**

```bash
# Set CDN_URL to your CDN domain
CDN_URL=https://cdn.example.com

# Configure CDN to proxy:
# - /gdd-assets/* - 3D models and generated assets
# - /temp-images/* - Temporary images
# - /images/* - Static images
```

**CDN Headers:**

```
Cache-Control: public, max-age=31536000, immutable
```

### 3. Database Replicas

**For High Availability:**

```bash
# Set read replica URL (if needed)
DATABASE_REPLICA_URL=postgresql://user:pass@replica:5432/db

# Update Drizzle configuration to use read replicas
```

### 4. Railway Deployment

**Required Services:**

- **App:** Elysia API server
- **PostgreSQL:** Database (Railway plugin)
- **Volume:** Persistent storage for assets

**Deploy Command:**

```bash
# Railway automatically detects bun and runs:
bun install
bun run build
bun run start
```

**Custom Start Command (if needed):**

```json
{
  "scripts": {
    "start": "NODE_ENV=production bun --jit run server/api-elysia.ts"
  }
}
```

---

## Pre-deployment Tests

### 1. Run Test Suite

```bash
cd packages/core

# Run all tests
bun test

# Run with coverage
bun test --coverage

# Expected: 100% pass rate
```

### 2. Type Check

```bash
# Type check entire codebase
bun run typecheck

# Expected: No TypeScript errors
```

### 3. Build Verification

```bash
# Build frontend
bun run build

# Verify dist/ directory exists
ls -la dist/

# Check for:
# - dist/index.html
# - dist/assets/*.js
# - dist/assets/*.css
```

### 4. Database Migration Dry Run

```bash
# Generate migration without applying
bun run db:generate

# Review generated SQL
cat server/db/migrations/*.sql

# Apply to staging first
DATABASE_URL=postgresql://staging... bun run db:migrate
```

### 5. Load Testing

**Using Artillery:**

```bash
# Install Artillery
bun add -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api-staging.example.com/api/health

# Expected:
# - All requests succeed (200 OK)
# - P95 latency < 500ms
# - No rate limit errors
```

### 6. Security Scan

```bash
# Scan for vulnerabilities
bun audit

# Update vulnerable packages
bun update

# Re-run tests after updates
bun test
```

---

## Deployment Steps

### Step 1: Backup Current Production

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup asset directory (if applicable)
tar -czf assets_backup_$(date +%Y%m%d_%H%M%S).tar.gz gdd-assets/
```

### Step 2: Set Environment Variables

```bash
# In Railway dashboard or .env.production
NODE_ENV=production
DATABASE_URL=postgresql://...
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
AI_GATEWAY_API_KEY=...
FRONTEND_URL=https://app.example.com
```

### Step 3: Run Database Migrations

```bash
# Run migrations on production database
DATABASE_URL=$PRODUCTION_DATABASE_URL bun run db:migrate

# Verify migration success
DATABASE_URL=$PRODUCTION_DATABASE_URL bun run db:studio
```

### Step 4: Build Application

```bash
# Build frontend
bun run build

# Verify build output
ls -la dist/
```

### Step 5: Deploy to Railway

**Option A: Git Push (Recommended)**

```bash
git add .
git commit -m "Deploy: Production release v1.0.0"
git push railway main
```

**Option B: Railway CLI**

```bash
railway up
```

### Step 6: Verify Deployment

```bash
# Check health endpoint
curl https://api.example.com/api/health/ready

# Expected response:
# {"status":"ready","checks":{"database":true,"qdrant":true}}
```

---

## Post-deployment Verification

### 1. Health Checks

```bash
# Liveness check
curl https://api.example.com/api/health/live
# Expected: {"status":"ok"}

# Readiness check
curl https://api.example.com/api/health/ready
# Expected: {"status":"ready","checks":{...}}

# Legacy health check
curl https://api.example.com/api/health
# Expected: {"status":"healthy","services":{...}}
```

### 2. Smoke Tests

```bash
# Test asset listing (public endpoint)
curl https://api.example.com/api/assets

# Test generation pipeline (requires auth)
curl -X POST https://api.example.com/api/generation/pipeline \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"weapon","prompt":"test sword"}'

# Test Swagger documentation
curl https://api.example.com/swagger
```

### 3. Monitor Logs

```bash
# Railway CLI
railway logs

# Look for:
# - "Server ready!" message
# - No ERROR level logs
# - Database connection success
# - All services configured (✅)
```

### 4. Check Metrics

```bash
# Prometheus metrics
curl https://api.example.com/metrics

# Look for:
# - http_requests_total > 0
# - No 5xx errors
# - Response times within SLA
```

### 5. Verify Database Connectivity

```bash
# Open Drizzle Studio
bun run db:studio

# Verify:
# - All tables exist
# - Migrations applied
# - Sample data accessible
```

---

## Rollback Procedure

### If Deployment Fails

**Step 1: Identify Issue**

```bash
# Check logs
railway logs --tail 100

# Check health endpoint
curl https://api.example.com/api/health/ready
```

**Step 2: Rollback Application**

**Railway:**

```bash
# Revert to previous deployment
railway rollback

# Or deploy specific commit
git reset --hard <previous-commit-hash>
git push railway main --force
```

**Step 3: Rollback Database (if needed)**

```bash
# Restore from backup
psql $DATABASE_URL < backup_20251112_103000.sql

# Or run down migration
cd server/db/migrations
# Manually reverse migration SQL
```

**Step 4: Verify Rollback**

```bash
# Check health
curl https://api.example.com/api/health/ready

# Run smoke tests
bun test
```

---

## Common Issues

### Issue 1: Database Connection Fails

**Symptoms:**

- `/api/health/ready` returns 503
- Logs show "Database check failed"

**Solutions:**

```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Test connection directly
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules allow connection
# Check database credentials are correct
```

### Issue 2: Asset Files Not Found

**Symptoms:**

- `/gdd-assets/*` returns 404
- Logs show "File not found"

**Solutions:**

```bash
# Check ASSETS_DIR is set
echo $ASSETS_DIR

# Verify volume is mounted (Railway)
echo $RAILWAY_VOLUME_MOUNT_PATH

# Check directory exists and has files
ls -la $ASSETS_DIR

# Note: Legacy /api/admin/download-assets endpoint has been removed.
# Use CDN or manual upload for asset deployment.
```

### Issue 3: Rate Limit Too Restrictive

**Symptoms:**

- Users receiving 429 errors
- `X-RateLimit-Remaining` hits 0 frequently

**Solutions:**

```typescript
// Edit server/api-elysia.ts
rateLimit({
  duration: 60000,
  max: 200, // Increase limit
  // ...
});
```

### Issue 4: CORS Errors

**Symptoms:**

- Browser console shows CORS errors
- Preflight OPTIONS requests fail

**Solutions:**

```bash
# Update FRONTEND_URL to match your frontend domain
FRONTEND_URL=https://app.example.com

# Or allow multiple origins in code:
cors({
  origin: ["https://app.example.com", "https://staging.example.com"],
  // ...
})
```

### Issue 5: Generation Pipeline Fails

**Symptoms:**

- Pipeline status shows "failed"
- No 3D models generated

**Solutions:**

```bash
# Check AI service API keys
echo $MESHY_API_KEY
echo $OPENAI_API_KEY
echo $AI_GATEWAY_API_KEY

# Verify keys are valid
curl -H "Authorization: Bearer $MESHY_API_KEY" \
  https://api.meshy.ai/v1/health

# Check generation job logs
railway logs | grep "Pipeline"
```

### Issue 6: High Memory Usage

**Symptoms:**

- Process killed (OOM)
- Slow response times

**Solutions:**

```bash
# Increase memory limit
bun --max-old-space-size=4096 run server/api-elysia.ts

# Or in Railway settings:
# Plan: Scale to higher tier with more RAM

# Monitor memory usage
curl https://api.example.com/metrics | grep nodejs_heap
```

---

## Deployment Checklist Summary

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] CORS restricted to production domain
- [ ] Rate limits configured appropriately
- [ ] Security headers enabled
- [ ] Privy production credentials set
- [ ] All tests passing (100%)
- [ ] Type check clean
- [ ] Frontend built successfully
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Backup taken
- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Logs reviewed (no errors)
- [ ] Metrics endpoint responding
- [ ] Database connectivity verified
- [ ] Asset storage working
- [ ] Monitoring configured
- [ ] Error tracking setup
- [ ] CDN configured (if applicable)
- [ ] Load balancer health checks working
- [ ] Documentation updated

---

## Additional Resources

- [Elysia Documentation](https://elysiajs.com/)
- [Bun Runtime Guide](https://bun.sh/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Privy Authentication](https://docs.privy.io/)
- [Railway Deployment Guide](https://docs.railway.app/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Last Updated:** 2025-11-12

**Maintained By:** Asset-Forge DevOps Team

**Questions?** Open an issue or contact the team.
