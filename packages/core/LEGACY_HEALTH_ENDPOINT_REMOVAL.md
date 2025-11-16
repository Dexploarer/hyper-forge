# Legacy Health Endpoint Removal - Migration Summary

**Date**: 2025-11-16
**Status**: COMPLETED
**Breaking Change**: YES

## Overview

Removed the legacy `/api/health` endpoint from the codebase and migrated all consumers to use the new Kubernetes-style health check endpoints.

## What Changed

### Removed Endpoint
- **Endpoint**: `GET /api/health`
- **Location**: `packages/core/server/routes/health.ts` (lines 618-670)
- **Reason**: Replaced by Kubernetes-compliant health check endpoints

### New Endpoints (Already Existing)
Use these endpoints instead:

| Endpoint | Purpose | Use Case | Response Time |
|----------|---------|----------|---------------|
| `/api/health/live` | Liveness probe | Kubernetes liveness checks | ~10ms |
| `/api/health/ready` | Readiness probe | Kubernetes readiness checks, general health | ~100ms |
| `/api/health/deep` | Deep health check | Monitoring dashboards, detailed diagnostics | ~500ms |

## Migration Guide

### For External Monitoring Tools

**Before**:
```bash
curl http://localhost:3004/api/health
```

**After**:
```bash
# For basic health check (recommended for most use cases)
curl http://localhost:3004/api/health/ready

# For liveness probe (Kubernetes, Docker health checks)
curl http://localhost:3004/api/health/live

# For detailed diagnostics
curl http://localhost:3004/api/health/deep
```

### For Kubernetes Deployments

Update your Kubernetes manifests:

**Before**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3004
```

**After**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3004
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3004
  initialDelaySeconds: 5
  periodSeconds: 10
```

### For Load Balancers

Update health check configuration to use `/api/health/ready`:

**AWS ALB/NLB**:
```terraform
health_check {
  enabled             = true
  healthy_threshold   = 2
  interval            = 30
  path                = "/api/health/ready"
  port                = "traffic-port"
  protocol            = "HTTP"
  timeout             = 5
  unhealthy_threshold = 2
}
```

**Railway**:
Railway automatically uses the new endpoints - no changes needed.

### For Monitoring Dashboards

If you're using Grafana, Prometheus, or other monitoring tools:

1. Update health check URL to `/api/health/ready`
2. For detailed metrics, use `/api/health/deep`

## Files Modified

### Server Code
1. **`server/routes/health.ts`**
   - Removed legacy `/api/health` endpoint (lines 618-670)
   - Updated file header comment

2. **`server/routes/cdn.ts`**
   - Updated CDN health check to use `/health/ready` instead of `/api/health`

3. **`server/routes/debug-storage.ts`**
   - Updated CDN health check to use `/health/ready` instead of `/api/health`

4. **`server/plugins/rate-limiting.plugin.ts`**
   - Updated skip logic to exclude all new health endpoints from rate limiting:
     - `/api/health/live`
     - `/api/health/ready`
     - `/api/health/deep`

### Test Files
1. **`__tests__/integration/api/routes/health.test.ts`**
   - Completely rewritten to test `/api/health/ready` and `/api/health/live`
   - Added new tests for readiness and liveness probes

2. **`__tests__/integration/load.test.ts`**
   - All 19 occurrences replaced with `/api/health/ready`

3. **`__tests__/integration/rate-limiting.test.ts`**
   - All 6 occurrences replaced with `/api/health/ready`
   - Updated comments to reflect new endpoint

4. **`__tests__/integration/plugins/production-hardening.test.ts`**
   - All 29 occurrences replaced with `/api/health/ready`

5. **`__tests__/e2e/security/security.spec.ts`**
   - Updated CORS test to use `/api/health/ready`

6. **`server/plugins/__tests__/rate-limiting.plugin.test.ts`**
   - Updated to test all three health endpoints
   - Improved test coverage for rate limit bypass

## Response Format Changes

### Old Endpoint Response
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "services": {
    "meshy": true,
    "openai": true
  }
}
```

### New Endpoint Responses

**`/api/health/ready`**:
```json
{
  "status": "ready",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "checks": {
    "database": true,
    "qdrant": true
  }
}
```

**`/api/health/live`**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T10:30:00.000Z"
}
```

**`/api/health/deep`**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:30:00.000Z",
  "latency": 45,
  "checks": {
    "database": { "status": "healthy", "latency": 15 },
    "qdrant": { "status": "healthy", "latency": 10 },
    "disk": { "status": "healthy", "details": {...} },
    "memory": { "status": "healthy", "details": {...} },
    "externalAPIs": { "status": "healthy", "details": {...} }
  },
  "system": {
    "uptime": 3600,
    "nodeVersion": "v21.0.0",
    "platform": "linux",
    "arch": "x64",
    "environment": "production"
  }
}
```

## Benefits of New Endpoints

1. **Kubernetes Compliance**: Proper separation of liveness and readiness checks
2. **Better Performance**: `/api/health/live` is ultra-fast (~10ms) for liveness checks
3. **More Informative**: `/api/health/deep` provides comprehensive system diagnostics
4. **Industry Standard**: Follows best practices for container health checks
5. **Rate Limit Exemption**: All health endpoints are exempt from rate limiting

## Verification

### Test the Migration

```bash
# Start the server
cd packages/core
bun run dev

# Test liveness (should be very fast)
time curl http://localhost:3004/api/health/live

# Test readiness (checks database)
curl http://localhost:3004/api/health/ready

# Test deep health check
curl http://localhost:3004/api/health/deep | jq

# Verify old endpoint is gone (should 404)
curl http://localhost:3004/api/health
# Expected: 404 Not Found
```

### Run Tests

```bash
# Run health endpoint tests
bun test __tests__/integration/api/routes/health.test.ts

# Run rate limiting tests
bun test __tests__/integration/rate-limiting.test.ts

# Run all integration tests
bun test __tests__/integration/
```

## Rollback Plan

If you need to temporarily restore the old endpoint:

1. Restore the endpoint from git history:
   ```bash
   git show HEAD~1:packages/core/server/routes/health.ts > temp-health.ts
   ```

2. Extract lines 618-670 and add back to `health.ts`

3. Restart the server

**Note**: This is only a temporary measure. All new deployments should use the new endpoints.

## Impact Assessment

### Breaking Changes
- ✅ Any external monitoring tools using `/api/health` must be updated
- ✅ Kubernetes/Docker health checks using `/api/health` must be updated
- ✅ Load balancer health checks must be updated

### No Breaking Changes
- ✅ Internal application code (already updated)
- ✅ Test suite (already updated)
- ✅ Rate limiting configuration (already updated)
- ✅ CDN health checks (already updated)

## Deployment Checklist

Before deploying this change to production:

- [ ] Update Kubernetes manifests with new health check paths
- [ ] Update load balancer health check configuration
- [ ] Update monitoring dashboard configurations
- [ ] Notify DevOps team of endpoint change
- [ ] Update runbooks and documentation
- [ ] Test all health endpoints in staging
- [ ] Verify monitoring alerts still work
- [ ] Update API documentation (Swagger/OpenAPI)

## Support

For questions or issues:
- Review this document
- Check `packages/core/server/routes/health.ts` for endpoint implementation
- See `packages/core/dev-book/deployment/observability.md` for detailed health check docs

## Related Documentation

- `packages/core/dev-book/deployment/observability.md` - Health check documentation
- `packages/core/dev-book/deployment/production-checklist.md` - Production deployment guide
- `packages/core/server/PHASE_7_SUMMARY.md` - Ultra-fast health endpoints implementation
