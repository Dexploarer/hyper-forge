# Error Handling & Logging Architecture

## Overview

Centralized error handling with structured logging, database tracking, and monitoring dashboard.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Request                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Elysia Route Handler                         │
│  • User code throws error                                        │
│  • Business logic fails                                          │
│  • Validation fails                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               Global .onError() Hook (api-elysia.ts)            │
│  1. Extract request metadata (path, method, user ID)            │
│  2. Log to Pino with structured data                            │
│  3. Log to database (non-blocking)                              │
│  4. Return standardized JSON response                           │
└─────────────┬─────────────────────────┬─────────────────────────┘
              │                         │
              ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│   Structured Logging     │  │   Database Tracking               │
│   (Pino Logger)          │  │   (ApiErrorRepository)            │
│                          │  │                                   │
│ • Console (dev)          │  │ api_errors table:                 │
│ • JSON logs (prod)       │  │ • Request metadata                │
│ • Railway aggregation    │  │ • Error details                   │
│ • Request correlation    │  │ • User context                    │
└──────────────────────────┘  │ • External service tracking       │
                               │ • Resolution workflow             │
                               └────────────┬──────────────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────────────┐
                               │   Hourly Aggregation             │
                               │   (Cron: 5 * * * *)              │
                               │                                  │
                               │ error_aggregations table:        │
                               │ • Group by endpoint/severity     │
                               │ • Count total errors             │
                               │ • Count unique users             │
                               │ • Pre-compute metrics            │
                               └────────────┬─────────────────────┘
                                            │
                                            ▼
                               ┌──────────────────────────────────┐
                               │   Monitoring Dashboard           │
                               │   (/api/errors routes)           │
                               │                                  │
                               │ • List errors with filtering     │
                               │ • View statistics                │
                               │ • Error trends                   │
                               │ • Resolution tracking            │
                               └──────────────────────────────────┘
```

## Components

### 1. Error Types (`server/errors/index.ts`)

```typescript
ApiError (base class)
├── ValidationError (422)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── InternalServerError (500)
├── ExternalServiceError (502)  // NEW
└── ServiceUnavailableError (503)
```

### 2. Error Repository (`server/repositories/ApiErrorRepository.ts`)

```typescript
class ApiErrorRepository {
  logError(); // Insert error
  getErrors(); // Query with filters
  getErrorById(); // Fetch single error
  resolveError(); // Mark as resolved
  getAggregations(); // Hourly stats
  upsertAggregation(); // Create/update aggregation
  deleteOldErrors(); // Data retention (90 days)
  getErrorStats(); // Dashboard metrics
}
```

### 3. Global Error Handler (`server/api-elysia.ts`)

```typescript
.onError(async ({ code, error, set, request }) => {
  // 1. Extract metadata
  const requestId = request.headers.get("x-request-id");
  const pathname = new URL(request.url).pathname;
  const userId = extractUserIdFromJWT(request);

  // 2. Structured logging
  logger.error({ err: error, requestId, path: pathname }, "Request error");

  // 3. Database tracking (non-blocking)
  apiErrorRepository.logError({...}).catch(handleLoggingError);

  // 4. Standardized response
  return { error: error.code, message: error.message, requestId };
})
```

### 4. Cron Jobs (`server/cron/error-aggregation.ts`)

```typescript
// Hourly aggregation (5 * * * *)
aggregateErrors()
  → Group errors by endpoint/severity/category
  → Insert into error_aggregations table
  → Pre-compute metrics for dashboard

// Daily cleanup (0 2 * * *)
cleanupOldErrors()
  → Delete errors older than 90 days
  → Delete aggregations older than 1 year
```

### 5. Monitoring Dashboard (`server/routes/error-monitoring.ts`)

```typescript
GET    /api/errors                  // List errors with filtering
GET    /api/errors/stats            // Time period statistics
GET    /api/errors/aggregations     // Hourly aggregations
GET    /api/errors/:id              // Get error details
PATCH  /api/errors/:id/resolve      // Mark resolved
```

## Database Schema

### api_errors table

```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
request_id      VARCHAR(255)
endpoint        VARCHAR(512) NOT NULL
method          VARCHAR(10) NOT NULL
error_code      VARCHAR(100)
error_message   TEXT NOT NULL
error_stack     TEXT
severity        ENUM (debug, info, warning, error, critical)
category        ENUM (validation, auth, external_api, database, ...)
status_code     INTEGER
context         JSONB
tags            JSONB
resolved        BOOLEAN DEFAULT false
created_at      TIMESTAMP NOT NULL
```

### error_aggregations table

```sql
id                UUID PRIMARY KEY
hour_bucket       TIMESTAMP NOT NULL
endpoint          VARCHAR(512)
severity          ENUM
category          ENUM
status_code       INTEGER
total_errors      INTEGER NOT NULL
unique_users      INTEGER NOT NULL
first_occurrence  TIMESTAMP
last_occurrence   TIMESTAMP
updated_at        TIMESTAMP NOT NULL
```

## Error Categories

Automatic categorization based on error type:

- **validation**: ValidationError, invalid input
- **authentication**: UnauthorizedError, missing auth
- **authorization**: ForbiddenError, insufficient permissions
- **external_api**: ExternalServiceError, 3rd party failures
- **database**: Database connection, query errors
- **file_system**: File I/O errors, ENOENT, EACCES
- **network**: Network timeouts, ECONNREFUSED
- **application**: General application errors
- **unknown**: Uncategorized errors

## Logging Patterns

### Before (console.log)

```typescript
console.log(`[Upload] Saved file: ${filename}`);
console.error("Upload failed:", error);
```

### After (Pino structured logging)

```typescript
logger.info({ filename, size: file.size }, "File saved");
logger.error({ err: error }, "Upload failed");
```

## Benefits

### Structured Logging

- Request correlation IDs for tracing
- Automatic context enrichment
- JSON output for log aggregation
- Production-safe (no sensitive data leaks)

### Error Tracking

- Database persistence for audit trail
- Hourly aggregations for performance
- Data retention policies (90 days)
- Admin dashboard for monitoring

### Observability

- Error trends by endpoint
- Severity and category grouping
- External service tracking
- Resolution workflow

### Performance

- Non-blocking error logging
- Pre-computed aggregations
- Efficient dashboard queries
- Cron-based cleanup

## Usage Examples

### Throwing Errors in Routes

```typescript
import { NotFoundError, ValidationError } from '../errors';

// Not found
if (!user) {
  throw new NotFoundError('User', userId);
}

// Validation error
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', { email });
}

// External service error
catch (error) {
  throw new ExternalServiceError('Meshy', 'API request failed', error);
}
```

### Error Monitoring Dashboard

```typescript
// List recent errors
GET /api/errors?severity=error&limit=50

// Get statistics
GET /api/errors/stats?startDate=2025-01-01&endDate=2025-01-31

// Get hourly aggregations
GET /api/errors/aggregations?endpoint=/api/assets

// Resolve error
PATCH /api/errors/:id/resolve
{
  "resolution": "Fixed by updating API key"
}
```

## Migration Status

- ✅ Error types hierarchy
- ✅ API error repository
- ✅ Global error handler
- ✅ Console.log migration script (52% automated)
- ✅ Error aggregation cron jobs
- ✅ Error monitoring dashboard
- ⚠️ TypeScript errors (need manual fixes)
- ⚠️ 304 console calls remaining (manual review needed)

## Next Steps

1. **Fix TypeScript errors** - Run `bun run typecheck` and fix syntax errors
2. **Apply database migration** - Run `bun run db:generate && bun run db:migrate`
3. **Manual console.log review** - Convert remaining 304 calls
4. **Testing** - Test error handler, dashboard, cron jobs
5. **Monitoring setup** - Configure Railway log aggregation, alerts
