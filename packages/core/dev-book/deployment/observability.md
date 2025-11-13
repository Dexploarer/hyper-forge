# Observability & Monitoring

Comprehensive guide to monitoring, metrics, logging, and error tracking for Asset-Forge in production.

## Table of Contents

1. [Overview](#overview)
2. [Metrics](#metrics)
3. [Health Checks](#health-checks)
4. [Error Tracking](#error-tracking)
5. [Grafana Dashboards](#grafana-dashboards)
6. [Alerts & SLOs](#alerts--slos)
7. [Troubleshooting](#troubleshooting)

## Overview

Asset-Forge uses a comprehensive observability stack:

- **Metrics**: Prometheus for time-series metrics
- **Logging**: Pino for structured JSON logs
- **Error Tracking**: Sentry for error monitoring
- **Health Checks**: Kubernetes-ready liveness and readiness probes
- **Tracing**: Elysia's native performance tracing

## Metrics

### Prometheus Endpoints

#### `/metrics` - System Metrics

Default Prometheus metrics provided by `elysia-prometheus`:

- HTTP request duration
- Request count by status code
- Active connections
- Event loop lag

**PromQL Example:**

```promql
# Request rate by status code
rate(http_request_duration_seconds_count[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate (5xx responses)
sum(rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])) /
sum(rate(http_request_duration_seconds_count[5m]))
```

#### `/metrics/business` - Business Metrics

Custom application-level metrics for monitoring business events:

### Asset Generation Metrics

**`asset_generations_total`** (Counter)

- Total asset generations by type and status
- Labels: `type`, `status`

```promql
# Total asset generations in last hour
increase(asset_generations_total[1h])

# Success rate by type
sum(rate(asset_generations_total{status="success"}[5m])) by (type) /
sum(rate(asset_generations_total[5m])) by (type)

# Failed generations by type
sum(rate(asset_generations_total{status="failure"}[5m])) by (type)
```

**`asset_generation_duration_seconds`** (Histogram)

- Time taken to generate assets
- Labels: `type`
- Buckets: 5s, 10s, 30s, 60s, 120s, 180s, 300s

```promql
# 95th percentile generation time by type
histogram_quantile(0.95,
  sum(rate(asset_generation_duration_seconds_bucket[5m])) by (le, type)
)

# Average generation time
rate(asset_generation_duration_seconds_sum[5m]) /
rate(asset_generation_duration_seconds_count[5m])

# Slow generations (> 2 minutes)
sum(rate(asset_generation_duration_seconds_bucket{le="120"}[5m])) -
sum(rate(asset_generation_duration_seconds_bucket{le="180"}[5m]))
```

**`asset_generation_errors_total`** (Counter)

- Failed generations by error type
- Labels: `type`, `error_type`

```promql
# Top error types
topk(5, sum(rate(asset_generation_errors_total[5m])) by (error_type))

# Error rate by asset type
sum(rate(asset_generation_errors_total[5m])) by (type)
```

### User Activity Metrics

**`user_logins_total`** (Counter)

- Total logins by provider
- Labels: `provider`

```promql
# Login rate
rate(user_logins_total[5m])

# Logins by provider
sum(rate(user_logins_total[5m])) by (provider)
```

**`user_active_sessions`** (Gauge)

- Currently active user sessions

```promql
# Current active sessions
user_active_sessions

# Peak sessions today
max_over_time(user_active_sessions[24h])
```

**`user_actions_total`** (Counter)

- User actions by type
- Labels: `action`, `resource_type`

```promql
# Most common actions
topk(10, sum(rate(user_actions_total[5m])) by (action, resource_type))

# Create vs Update vs Delete ratio
sum(rate(user_actions_total{action="create"}[5m])) /
sum(rate(user_actions_total[5m]))
```

### Storage Metrics

**`storage_used_bytes`** (Gauge)

- Total storage used
- Labels: `context` (user, project, system)

```promql
# Total storage in GB
storage_used_bytes / (1024^3)

# Storage growth rate
deriv(storage_used_bytes[1h])
```

**`file_uploads_total`** / **`file_downloads_total`** (Counter)

- File operations by type
- Labels: `file_type`

```promql
# Upload rate by file type
sum(rate(file_uploads_total[5m])) by (file_type)

# Download to upload ratio
sum(rate(file_downloads_total[5m])) /
sum(rate(file_uploads_total[5m]))
```

### API Usage Metrics

**`api_requests_by_endpoint_total`** (Counter)

- API requests per endpoint
- Labels: `endpoint`, `method`, `status_code`

```promql
# Top endpoints by request count
topk(10, sum(rate(api_requests_by_endpoint_total[5m])) by (endpoint))

# Error rate by endpoint
sum(rate(api_requests_by_endpoint_total{status_code=~"5.."}[5m])) by (endpoint) /
sum(rate(api_requests_by_endpoint_total[5m])) by (endpoint)

# 4xx rate (client errors)
sum(rate(api_requests_by_endpoint_total{status_code=~"4.."}[5m])) /
sum(rate(api_requests_by_endpoint_total[5m]))
```

**`api_response_time_by_endpoint_seconds`** (Histogram)

- API latency per endpoint
- Labels: `endpoint`, `method`
- Buckets: 10ms, 50ms, 100ms, 500ms, 1s, 5s, 10s, 30s

```promql
# 99th percentile latency by endpoint
histogram_quantile(0.99,
  sum(rate(api_response_time_by_endpoint_seconds_bucket[5m])) by (le, endpoint)
)

# Slow endpoints (>1s p95)
histogram_quantile(0.95,
  sum(rate(api_response_time_by_endpoint_seconds_bucket[5m])) by (le, endpoint)
) > 1

# Average latency
rate(api_response_time_by_endpoint_seconds_sum[5m]) /
rate(api_response_time_by_endpoint_seconds_count[5m])
```

### AI/LLM Metrics

**`ai_api_calls_total`** (Counter)

- AI API calls by provider and model
- Labels: `provider`, `model`, `status`

```promql
# AI API call rate
sum(rate(ai_api_calls_total[5m])) by (provider)

# AI API error rate
sum(rate(ai_api_calls_total{status="failure"}[5m])) /
sum(rate(ai_api_calls_total[5m]))
```

**`ai_api_latency_seconds`** (Histogram)

- AI API latency
- Labels: `provider`, `model`

```promql
# AI API p95 latency
histogram_quantile(0.95,
  sum(rate(ai_api_latency_seconds_bucket[5m])) by (le, provider)
)
```

**`ai_tokens_used_total`** (Counter)

- Token usage by provider and type
- Labels: `provider`, `model`, `type` (prompt, completion)

```promql
# Token usage rate
sum(rate(ai_tokens_used_total[5m])) by (provider, type)

# Cost estimation (approximate, adjust rates)
sum(rate(ai_tokens_used_total{provider="openai",type="prompt"}[5m])) * 0.00001 +
sum(rate(ai_tokens_used_total{provider="openai",type="completion"}[5m])) * 0.00003
```

### Database Metrics

**`db_query_duration_seconds`** (Histogram)

- Database query duration
- Labels: `operation`, `table`

```promql
# Slow queries (>100ms p95)
histogram_quantile(0.95,
  sum(rate(db_query_duration_seconds_bucket[5m])) by (le, table)
) > 0.1

# Query rate by operation
sum(rate(db_query_duration_seconds_count[5m])) by (operation)
```

**`db_connections_active`** / **`db_connections_idle`** (Gauge)

- Database connection pool stats

```promql
# Connection pool utilization
db_connections_active / (db_connections_active + db_connections_idle)

# Connection pool exhaustion risk
db_connections_active > 18  # Alert if > 90% of max (20)
```

## Health Checks

Asset-Forge provides Kubernetes-ready health check endpoints:

### `/api/health/live` - Liveness Probe

**Purpose**: Is the server process running?

**Use Case**: Kubernetes liveness probe - restart container if unhealthy

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

**Kubernetes Config**:

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3004
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### `/api/health/ready` - Readiness Probe

**Purpose**: Can the server handle traffic?

**Use Case**: Kubernetes readiness probe - route traffic only when ready

**Checks**:

- ✅ Database connectivity (REQUIRED)
- ✅ Qdrant availability (OPTIONAL)

**Response**:

```json
{
  "status": "ready",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "checks": {
    "database": true,
    "qdrant": true
  }
}
```

**Kubernetes Config**:

```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3004
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### `/api/health/deep` - Deep Health Check

**Purpose**: Comprehensive dependency health status

**Use Case**: Monitoring dashboards, detailed system status

**Checks**:

- 🔍 Database (latency & connectivity)
- 🔍 Qdrant (vector database)
- 🔍 Disk space (available storage)
- 🔍 Memory (system & process)
- 🔍 External APIs (configuration status)

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "latency": 45,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 15,
      "details": { "connected": true }
    },
    "qdrant": {
      "status": "healthy",
      "latency": 10
    },
    "disk": {
      "status": "healthy",
      "details": {
        "freeGB": 50.5,
        "usedPercent": 45.2,
        "tmpDirExists": true,
        "assetsDirExists": true
      }
    },
    "memory": {
      "status": "healthy",
      "details": {
        "system": {
          "freeMB": 2048,
          "totalMB": 8192,
          "usedPercent": 75
        },
        "process": {
          "heapUsedMB": 150,
          "heapTotalMB": 200,
          "rssMB": 250
        }
      }
    },
    "externalAPIs": {
      "status": "healthy",
      "details": {
        "configured": {
          "meshy": true,
          "openai": true,
          "elevenlabs": true,
          "privy": true
        },
        "count": 4
      }
    }
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

**Status Levels**:

- `healthy` - All systems operating normally
- `degraded` - Some non-critical issues (e.g., slow responses, low disk space)
- `unhealthy` - Critical failure (e.g., database down)

**HTTP Status Codes**:

- `200` - healthy or degraded (still serving traffic)
- `503` - unhealthy (critical service unavailable)

## Error Tracking

### Sentry Integration

Asset-Forge integrates with Sentry for comprehensive error tracking.

**Configuration**:

```bash
# Required
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional
NODE_ENV=production  # Controls error filtering
RAILWAY_DEPLOYMENT_ID=...  # Used for release tracking
```

**Features**:

- ✅ Automatic error capture for 5xx responses
- ✅ Request context (user, endpoint, params)
- ✅ Stack traces and breadcrumbs
- ✅ Error fingerprinting for grouping
- ✅ Severity levels (critical, error, warning)
- ✅ Sensitive data filtering

**Captured Errors**:

- Internal server errors (500)
- Unhandled exceptions
- API errors with status >= 500

**Filtered Out**:

- Validation errors (too noisy)
- Client errors (4xx)
- Sensitive data (passwords, tokens, secrets)

**Manual Error Tracking**:

```typescript
import { errorTrackingService } from "./services/ErrorTrackingService";

try {
  // Your code
} catch (error) {
  errorTrackingService.captureError(error as Error, {
    userId: user.id,
    endpoint: "/api/assets",
    method: "POST",
    errorType: "asset_generation_failed",
    severity: "error",
    tags: { assetType: "character" },
    extra: { generationParams: params },
  });
}
```

**Breadcrumbs**:

```typescript
errorTrackingService.addBreadcrumb({
  message: "Starting asset generation",
  category: "generation",
  level: "info",
  data: { assetType: "character", prompt: "..." },
});
```

## Grafana Dashboards

### Dashboard: Asset-Forge Overview

```json
{
  "title": "Asset-Forge Overview",
  "panels": [
    {
      "title": "Request Rate",
      "targets": ["sum(rate(api_requests_by_endpoint_total[5m]))"]
    },
    {
      "title": "Error Rate",
      "targets": [
        "sum(rate(api_requests_by_endpoint_total{status_code=~\"5..\"}[5m])) / sum(rate(api_requests_by_endpoint_total[5m]))"
      ]
    },
    {
      "title": "P95 Latency",
      "targets": [
        "histogram_quantile(0.95, sum(rate(api_response_time_by_endpoint_seconds_bucket[5m])) by (le))"
      ]
    },
    {
      "title": "Active Sessions",
      "targets": ["user_active_sessions"]
    },
    {
      "title": "Asset Generations",
      "targets": ["sum(rate(asset_generations_total[5m])) by (type, status)"]
    },
    {
      "title": "Database Health",
      "targets": [
        "histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, operation))"
      ]
    }
  ]
}
```

### Dashboard: Asset Generation Performance

**Panels**:

1. **Generation Rate** - `rate(asset_generations_total[5m])`
2. **Success Rate** - Success vs failure ratio
3. **Generation Duration** - P50, P95, P99 by type
4. **Error Breakdown** - Top error types
5. **AI API Latency** - Meshy, OpenAI, Anthropic response times
6. **Token Usage** - AI token consumption over time

### Dashboard: Infrastructure Health

**Panels**:

1. **CPU Usage** - Process CPU utilization
2. **Memory Usage** - Heap, RSS, system memory
3. **Database Connections** - Active vs idle
4. **Disk Space** - Available storage
5. **Network I/O** - Request/response sizes
6. **Event Loop Lag** - Node.js event loop delays

## Alerts & SLOs

### Recommended Alerts

#### Critical (PagerDuty)

**High Error Rate**

```promql
sum(rate(api_requests_by_endpoint_total{status_code=~"5.."}[5m])) /
sum(rate(api_requests_by_endpoint_total[5m])) > 0.05
```

- **Threshold**: >5% error rate for 5 minutes
- **Action**: Page on-call engineer

**Database Down**

```promql
up{job="asset-forge"} == 0
```

- **Threshold**: Service down for 1 minute
- **Action**: Page on-call engineer

**High Latency**

```promql
histogram_quantile(0.95,
  sum(rate(api_response_time_by_endpoint_seconds_bucket[5m])) by (le)
) > 5
```

- **Threshold**: P95 > 5s for 5 minutes
- **Action**: Page on-call engineer

#### Warning (Slack)

**Increased Error Rate**

```promql
sum(rate(asset_generation_errors_total[5m])) /
sum(rate(asset_generations_total[5m])) > 0.1
```

- **Threshold**: >10% generation failures for 10 minutes
- **Action**: Notify team channel

**Low Disk Space**

```promql
storage_used_bytes / storage_total_bytes > 0.8
```

- **Threshold**: >80% disk usage
- **Action**: Notify ops channel

**High Memory Usage**

```promql
process_resident_memory_bytes / system_memory_total_bytes > 0.9
```

- **Threshold**: >90% memory usage for 5 minutes
- **Action**: Notify ops channel

### Service Level Objectives (SLOs)

#### Availability SLO: 99.9% (43 minutes downtime/month)

**Error Budget**: 0.1% (43 minutes/month)

**Measurement**:

```promql
1 - (sum(rate(api_requests_by_endpoint_total{status_code=~"5.."}[30d])) /
     sum(rate(api_requests_by_endpoint_total[30d])))
```

#### Latency SLO: 95% of requests < 1s

**Measurement**:

```promql
histogram_quantile(0.95,
  sum(rate(api_response_time_by_endpoint_seconds_bucket[30d])) by (le)
) < 1
```

#### Asset Generation SLO: 90% success rate

**Measurement**:

```promql
sum(rate(asset_generations_total{status="success"}[30d])) /
sum(rate(asset_generations_total[30d])) > 0.9
```

## Troubleshooting

### High Error Rate

1. Check `/metrics/business` for error breakdown by endpoint
2. Check Sentry for recent errors and stack traces
3. Review logs with `kubectl logs <pod> | grep ERROR`
4. Check `/api/health/deep` for dependency issues

### Slow Response Times

1. Check slow endpoints:
   ```promql
   histogram_quantile(0.95,
     sum(rate(api_response_time_by_endpoint_seconds_bucket[5m])) by (le, endpoint)
   ) > 1
   ```
2. Check database query performance:
   ```promql
   topk(10, histogram_quantile(0.95,
     sum(rate(db_query_duration_seconds_bucket[5m])) by (le, table)
   ))
   ```
3. Check AI API latency:
   ```promql
   histogram_quantile(0.95,
     sum(rate(ai_api_latency_seconds_bucket[5m])) by (le, provider)
   )
   ```

### Memory Leaks

1. Monitor process memory over time:
   ```promql
   process_resident_memory_bytes
   ```
2. Check heap usage:
   ```promql
   nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes
   ```
3. Review database connection pool leaks:
   ```promql
   db_connections_active
   ```

### Disk Space Issues

1. Check current usage:
   ```bash
   curl http://localhost:3004/api/health/deep | jq '.checks.disk'
   ```
2. Find large files:
   ```bash
   kubectl exec <pod> -- du -h /app | sort -hr | head -20
   ```
3. Clean up temp files:
   ```bash
   kubectl exec <pod> -- rm -rf /tmp/*
   ```

---

**Related Documentation**:

- [Deployment Guide](./deployment.md)
- [Production Hardening](./production.md)
- [Performance Optimization](./performance.md)
