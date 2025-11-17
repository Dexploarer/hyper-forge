# Repository Layer

**Created**: 2025-11-16
**Status**: Complete
**Phase**: Elysia 2025 Refactoring - Phase 4

## Overview

This directory contains repository classes that provide a clean abstraction layer between the application services and the database. Repositories encapsulate all database queries and operations for their respective domain entities.

## Repository Pattern

All repositories follow a consistent pattern:

1. **Single Responsibility**: Each repository handles one primary database table
2. **Type Safety**: All methods are fully typed with TypeScript
3. **Error Handling**: Comprehensive error logging with context
4. **Singleton Pattern**: Each repository exports a singleton instance
5. **Transaction Support**: Complex operations use database transactions

## Available Repositories

### ApiErrorRepository

**File**: `ApiErrorRepository.ts`
**Schema**: `server/db/schema/api-errors.schema.ts`
**Purpose**: Track and monitor API errors

**Key Methods**:

- `logError(data)` - Log a new error
- `getErrors(filters)` - Query errors with filtering and pagination
- `getErrorById(id)` - Get a specific error
- `resolveError(id, resolvedBy, resolution)` - Mark error as resolved
- `getErrorStats(filters)` - Get aggregated error statistics
- `getAggregations(filters)` - Get hourly error aggregations
- `deleteOldErrors(olderThan)` - Cleanup old resolved errors

**Usage**:

```typescript
import { apiErrorRepository } from "../repositories/ApiErrorRepository";

// Log an error
await apiErrorRepository.logError({
  endpoint: "/api/generation",
  method: "POST",
  errorMessage: "Failed to start pipeline",
  severity: "error",
  category: "application",
  userId: user.id,
});

// Get recent errors
const errors = await apiErrorRepository.getErrors({
  severity: "error",
  limit: 50,
  offset: 0,
});
```

### GenerationPipelineRepository

**File**: `GenerationPipelineRepository.ts`
**Schema**: `server/db/schema/generation-pipelines.schema.ts`
**Purpose**: Manage AI generation pipeline state

**Key Methods**:

- `create(data)` - Create a new pipeline
- `findById(id)` - Find pipeline by ID
- `findByUserId(userId, options)` - Get user's pipelines
- `findByStatus(status)` - Filter by status
- `findByMeshyTaskId(taskId)` - Lookup by Meshy task ID
- `update(id, data)` - Update pipeline
- `updateProgress(id, progress, stage)` - Update progress
- `updateStatus(id, status, error)` - Update status
- `delete(id)` - Delete pipeline
- `cleanupOldPipelines(olderThan)` - Cleanup completed pipelines
- `getStatistics(userId)` - Get pipeline statistics

**Usage**:

```typescript
import { generationPipelineRepository } from "../repositories/GenerationPipelineRepository";

// Create a pipeline
const pipeline = await generationPipelineRepository.create({
  id: "pipeline-123",
  userId: user.id,
  config: { type: "character", style: "low-poly" },
  status: "initializing",
  progress: 0,
  results: {},
});

// Update progress
await generationPipelineRepository.updateProgress(
  pipeline.id,
  50,
  "image-generation",
);

// Get statistics
const stats = await generationPipelineRepository.getStatistics(user.id);
console.log(`Success rate: ${stats.successRate}%`);
```

## Database Schema

The repositories use the following database tables:

### api_errors

- Comprehensive error tracking
- Foreign key to users table
- Indexes on endpoint, severity, category, status
- Resolution tracking

### error_aggregations

- Pre-computed hourly statistics
- Denormalized for dashboard performance
- Grouped by endpoint, severity, category

### generation_pipelines

- Pipeline state storage
- Foreign keys to users and assets
- Status tracking (initializing, processing, completed, failed, cancelled)
- External service ID tracking (Meshy, rigging)

### pipeline_stages

- Normalized stage tracking
- Linked to generation_pipelines
- Detailed timing and progress
- Stage-specific error tracking

## Migration Status

**Migration File**: `server/db/migrations/0023_loud_shen.sql`
**Status**: Applied (part of Phase 4)

The migration created:

- `api_errors` table
- `error_aggregations` table
- `generation_pipelines` table
- `pipeline_stages` table
- 4 enums (pipeline_status, stage_status, error_severity, error_category)
- 40+ indexes for query performance

## Best Practices

### 1. Use Repositories in Services

**Good**:

```typescript
import { apiErrorRepository } from "../repositories/ApiErrorRepository";

export class MyService {
  async doSomething() {
    try {
      // ... logic
    } catch (error) {
      await apiErrorRepository.logError({
        endpoint: "/api/my-endpoint",
        errorMessage: error.message,
        severity: "error",
      });
    }
  }
}
```

**Bad** (direct database access):

```typescript
import { db } from "../db/db";
import { apiErrors } from "../db/schema";

export class MyService {
  async doSomething() {
    // Don't do this - use repository instead
    await db.insert(apiErrors).values({ ... });
  }
}
```

### 2. Handle Errors Properly

All repository methods can throw errors. Always wrap in try-catch:

```typescript
try {
  const pipeline = await generationPipelineRepository.findById(id);
  if (!pipeline) {
    throw new Error("Pipeline not found");
  }
  // ... use pipeline
} catch (error) {
  logger.error({ err: error }, "Failed to process pipeline");
  throw error;
}
```

### 3. Use Filters for Queries

Most `find*` methods accept filter objects:

```typescript
const errors = await apiErrorRepository.getErrors({
  userId: user.id,
  severity: "error",
  resolved: false,
  limit: 50,
  offset: 0,
});
```

### 4. Cleanup Old Data

Use cleanup methods to prevent unbounded table growth:

```typescript
// Cleanup old errors (daily cron job)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await apiErrorRepository.deleteOldErrors(thirtyDaysAgo);

// Cleanup old pipelines (hourly cron job)
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
await generationPipelineRepository.cleanupOldPipelines(oneDayAgo);
```

## Testing

When testing services that use repositories:

1. **Integration Tests**: Use real database with test data isolation
2. **Mock External APIs**: Mock Meshy, OpenAI, etc. to avoid costs
3. **No Repository Mocks**: Use real database operations for internal code

Example:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { generationPipelineRepository } from "../repositories/GenerationPipelineRepository";

describe("GenerationService", () => {
  beforeEach(async () => {
    // Clean up test data
    await generationPipelineRepository.cleanupOldPipelines(new Date());
  });

  test("creates pipeline", async () => {
    const pipeline = await generationPipelineRepository.create({
      userId: "test-user",
      config: { type: "character" },
      status: "initializing",
      progress: 0,
      results: {},
    });

    expect(pipeline.id).toBeDefined();
    expect(pipeline.status).toBe("initializing");
  });
});
```

## Performance Considerations

### Indexes

All repositories use properly indexed queries:

- Foreign keys are indexed
- Status fields are indexed
- Composite indexes for common queries
- Created/updated timestamps use descending indexes

### Pagination

Always use pagination for list queries:

```typescript
const errors = await apiErrorRepository.getErrors({
  limit: 50,
  offset: page * 50,
});
```

### Aggregations

Use pre-computed aggregations when available:

```typescript
// Use aggregations table (fast)
const aggregations = await apiErrorRepository.getAggregations({
  startDate,
  endDate,
});

// Instead of real-time aggregation (slow)
const stats = await apiErrorRepository.getErrorStats({ startDate, endDate });
```

## Future Enhancements

Potential improvements for future iterations:

1. **BaseRepository**: Create a generic base class to reduce duplication
2. **Batch Operations**: Add bulk insert/update methods
3. **Caching**: Add Redis caching layer for frequently accessed data
4. **Soft Deletes**: Implement soft delete pattern for audit trails
5. **Audit Logging**: Track all data modifications with user attribution

## Related Documentation

- [Database Schema](../db/schema/README.md)
- [Migration Guide](../db/migrations/ROLLBACK_GUIDE.md)
- [Repository Implementation](../db/REPOSITORY_IMPLEMENTATION.md)
- [API Documentation](../routes/README.md)

## Support

For issues or questions about repositories:

1. Check the schema files in `server/db/schema/`
2. Review existing usage in `server/routes/` and `server/services/`
3. Check migration files in `server/db/migrations/`
4. Refer to Drizzle ORM documentation: https://orm.drizzle.team/
