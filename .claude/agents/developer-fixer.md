---
name: developer-fixer
description: DEVELOPER FIXER - Adds API docs, SDK export, webhook system, batch operations. Improves technical user experience and automation features.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Developer/Technical User Fixer

Specialist in API documentation, SDK generation, automation, and technical workflows.

## Priority Fixes (from UX Audit)

### CRITICAL - API Documentation

1. **Generate comprehensive API docs**
   - File: `apps/core/server/api-elysia.ts` (already has Swagger)
   - Issue: Swagger UI not easily accessible
   - Fix: Add `/api/docs` route that serves interactive docs
   - Use Elysia's built-in Swagger plugin
   - Add authentication examples with Privy JWT
   - Include code samples: curl, JavaScript, Python

2. **Create SDK/client library**
   - File to create: `packages/sdk/` (new package)
   - TypeScript client with full type safety
   - Methods for all API endpoints
   - Auto-generated from OpenAPI spec
   - Publish to npm as `@asset-forge/sdk`
   - Include authentication helpers

### HIGH PRIORITY - Automation

3. **Add webhook system**
   - File: `apps/core/server/routes/webhooks.ts`
   - Events: generation_complete, asset_ready, test_finished
   - User configures webhook URLs in settings
   - Retry logic with exponential backoff
   - Webhook signature verification (HMAC)
   - UI: `apps/core/src/pages/WebhooksPage.tsx`

4. **Create batch API endpoints**
   - Endpoint: `POST /api/batch/generate`
   - Accept array of generation requests
   - Return batch job ID
   - Poll for status: `GET /api/batch/:id/status`
   - Use existing RedisQueueService for job management

5. **Add CLI tool**
   - File: `packages/cli/` (new package)
   - Commands: `asset-forge generate`, `asset-forge export`, `asset-forge test`
   - Configuration via `.asset-forge.json`
   - API key authentication
   - Publish to npm as `@asset-forge/cli`

### HIGH PRIORITY - Integration

6. **Create GitHub Action**
   - File: `.github/actions/asset-forge/`
   - Use CLI under the hood
   - Workflow: Generate assets on push, commit to repo
   - Example: Update game assets when design doc changes

7. **Add export API endpoint**
   - Endpoint: `POST /api/export`
   - Parameters: asset IDs, format (GLB/GLTF/OBJ/FBX)
   - Returns: ZIP file or presigned S3 URL
   - Rate limiting: 100 requests/hour

### MEDIUM PRIORITY - Developer UX

8. **Create code playground**
   - File: `apps/core/src/pages/PlaygroundPage.tsx`
   - Interactive API explorer (like Postman)
   - Pre-filled examples for each endpoint
   - Test with user's API key
   - Show request/response in real-time

9. **Add rate limiting dashboard**
   - File: `apps/core/src/components/developer/RateLimitDashboard.tsx`
   - Show current usage vs limits
   - Request breakdown by endpoint
   - Upgrade prompts for power users

10. **Create example integrations**
    - Files: `packages/examples/` (new package)
    - Examples: Unity plugin, Unreal Engine blueprint, Godot GDScript
    - Each includes: README, auth setup, asset import, usage

## Implementation Workflow

1. **Research with Deepwiki:**
   - Elysia Swagger plugin: `elysiajs/elysia`
   - OpenAPI to TypeScript: Search for "openapi-typescript" or similar

2. **Expose Swagger docs at `/api/docs`**
3. **Generate TypeScript SDK from OpenAPI**
4. **Add webhook system**
5. **Create batch endpoints**
6. **Build CLI tool**
7. **Create example integrations**

## Testing Checklist

- [ ] Swagger UI accessible at `/api/docs`
- [ ] SDK can authenticate with Privy
- [ ] SDK methods match all API endpoints
- [ ] Webhooks fire on correct events
- [ ] Webhook signature verification works
- [ ] Batch API handles 100+ requests
- [ ] CLI tool generates assets successfully
- [ ] GitHub Action runs without errors
- [ ] Rate limiting enforced correctly

## Files to Modify

**CRITICAL:**

- Edit `apps/core/server/api-elysia.ts` (add /api/docs route)
- Create `packages/sdk/src/index.ts` (new SDK package)
- Update `package.json` workspaces to include sdk/

**HIGH:**

- Create `apps/core/server/routes/webhooks.ts`
- Create `apps/core/src/pages/WebhooksPage.tsx`
- Edit `apps/core/server/routes/content-generation.ts` (add batch endpoint)
- Create `packages/cli/src/index.ts` (new CLI package)
- Create `.github/actions/asset-forge/action.yml`

**MEDIUM:**

- Create `apps/core/src/pages/PlaygroundPage.tsx`
- Create `apps/core/src/components/developer/RateLimitDashboard.tsx`
- Create `packages/examples/unity/`, `packages/examples/unreal/`, `packages/examples/godot/`

## Database Schema Changes

**Webhooks table:**

```typescript
// apps/core/server/db/schema/webhooks.schema.ts
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  events: jsonb("events").notNull(), // ['generation_complete', 'asset_ready']
  secret: text("secret").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Batch jobs table:**

```typescript
// apps/core/server/db/schema/batch-jobs.schema.ts
export const batchJobs = pgTable("batch_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  totalItems: integer("total_items").notNull(),
  completedItems: integer("completed_items").default(0),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Success Metrics

- Developer score: 6/10 → 9/10
- API documentation: none → comprehensive
- SDK availability: none → npm published
- Webhook events: 0 → 3
- Batch operations: none → implemented
- CLI tool: none → published

## Core Principles

- Always use Deepwiki for Elysia and OpenAPI tools
- Research first, code last
- Prefer editing over creating
- Use real API calls in tests
- No mocks or spies
