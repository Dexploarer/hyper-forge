# API Versioning Strategy

Asset-Forge API versioning strategy and migration guide for maintaining backward compatibility.

## Table of Contents

1. [Current Versioning Approach](#current-versioning-approach)
2. [Versioning Strategy](#versioning-strategy)
3. [Breaking Changes](#breaking-changes)
4. [Deprecation Policy](#deprecation-policy)
5. [Version Migration](#version-migration)
6. [Backwards Compatibility](#backwards-compatibility)
7. [Version Negotiation](#version-negotiation)
8. [Implementation Examples](#implementation-examples)
9. [API Lifecycle](#api-lifecycle)
10. [Best Practices](#best-practices)

---

## Current Versioning Approach

### Current Status: V1 (Implicit)

Asset-Forge currently uses **implicit versioning** with no version prefix in URLs:

- **Current:** `https://api.example.com/api/assets`
- **Versioned:** `https://api.example.com/api/v1/assets` (future)

### When to Add Explicit Versioning

Add explicit versioning (`/api/v1/`) when:

- Making breaking changes to existing endpoints
- Changing response formats significantly
- Removing or renaming fields
- Changing authentication mechanisms
- Modifying rate limiting significantly

### Current API Version

- **Version:** 1.0 (implicit)
- **Status:** Stable
- **Base URL:** `/api/*`
- **OpenAPI Version:** Documented via Swagger at `/swagger`
- **Last Updated:** 2025-11-12

---

## Versioning Strategy

Asset-Forge uses **URL Path Versioning** for explicit, clear version communication.

### Why URL Path Versioning?

**Advantages:**

- ✅ **Explicit**: Version is clear in the URL
- ✅ **Cacheable**: Different versions cached separately
- ✅ **Browser-friendly**: Works in browsers without headers
- ✅ **Developer-friendly**: Easy to test and debug
- ✅ **Documentation**: Clear Swagger docs per version

**Disadvantages:**

- ❌ **URL Proliferation**: More URLs to maintain
- ❌ **Code Duplication**: May require duplicate routes

### Alternative: Header Versioning (Not Recommended)

Header versioning (`Accept: application/vnd.asset-forge.v1+json`) was considered but rejected because:

- ❌ Not browser-friendly (can't test in browser directly)
- ❌ Harder to cache (cache key needs header)
- ❌ Less discoverable (version hidden)
- ❌ Swagger documentation complexity

### Version Format

**Major Version Only:**

- Format: `vN` where N is the major version number
- Example: `v1`, `v2`, `v3`
- **No** minor versions in URL (`v1.2` ❌)
- Minor/patch changes handled via backwards-compatible updates

**URL Structure:**

```
https://api.example.com/api/v1/assets
https://api.example.com/api/v2/assets
```

**Current (V1 Implicit):**

```
https://api.example.com/api/assets  # Currently V1
```

---

## Breaking Changes

### What Constitutes a Breaking Change?

Breaking changes require a new major version:

| Change Type                        | Breaking? | New Version Required? | Example                             |
| ---------------------------------- | --------- | --------------------- | ----------------------------------- |
| Remove field from response         | ✅ Yes    | ✅ Yes                | Remove `metadata.tier`              |
| Rename field                       | ✅ Yes    | ✅ Yes                | `userId` → `user_id`                |
| Change field type                  | ✅ Yes    | ✅ Yes                | `tier: string` → `tier: number`     |
| Change response format             | ✅ Yes    | ✅ Yes                | Array → Paginated object            |
| Remove endpoint                    | ✅ Yes    | ✅ Yes                | Delete `/api/old-endpoint`          |
| Change authentication              | ✅ Yes    | ✅ Yes                | API key → OAuth 2.0                 |
| **Add new field**                  | ❌ No     | ❌ No                 | Add `metadata.rarity`               |
| **Add new endpoint**               | ❌ No     | ❌ No                 | Add `/api/achievements`             |
| **Add optional parameter**         | ❌ No     | ❌ No                 | Add `?includeArchived=true`         |
| **Deprecate field (keep support)** | ❌ No     | ❌ No                 | Mark `old_field` as deprecated      |
| Make required field optional       | ❌ No     | ❌ No                 | `name: required` → `name: optional` |
| Add new response code              | ❌ No     | ❌ No                 | Add `422 Unprocessable Entity`      |

### Non-Breaking Changes (Safe)

**Can be added without version change:**

1. **New Fields** (additive):

   ```typescript
   // V1 Response (before)
   {
     id: "asset_123",
     name: "Dragon Sword"
   }

   // V1 Response (after - non-breaking)
   {
     id: "asset_123",
     name: "Dragon Sword",
     rarity: "legendary"  // ✅ New field OK
   }
   ```

2. **New Endpoints**:

   ```typescript
   // ✅ OK to add without version change
   POST / api / achievements;
   GET / api / world - config;
   ```

3. **New Query Parameters** (optional):

   ```typescript
   // ✅ OK to add optional parameter
   GET /api/assets?includeArchived=true  // New optional param
   ```

4. **New Response Status Codes**:
   ```typescript
   // ✅ OK to add new error codes
   // Before: 200, 400, 401, 404
   // After:  200, 400, 401, 403, 404, 422  // Added 403 and 422
   ```

---

## Deprecation Policy

### Deprecation Timeline

**Standard Timeline:** 6 months

1. **Month 0:** Announce deprecation, add warnings
2. **Month 3:** Send emails to active API users
3. **Month 6:** Remove deprecated version

**Critical Security:** Immediate removal (with communication)

### Deprecation Process

#### Step 1: Announce Deprecation

**Update OpenAPI Documentation:**

```typescript
.get("/api/assets", async ({ query }) => {
  // Add deprecation warning to response headers
  set.headers["X-API-Warn"] = "This endpoint is deprecated. Use /api/v2/assets instead.";
  set.headers["X-API-Deprecation-Date"] = "2025-06-01";
  set.headers["X-API-Sunset-Date"] = "2025-12-01";

  // ... handler code
}, {
  detail: {
    tags: ["Assets"],
    summary: "List assets [DEPRECATED]",
    description: "**DEPRECATED:** This endpoint will be removed on 2025-12-01. Use `/api/v2/assets` instead.\n\nDeprecation reason: Response format changed to support pagination.",
    deprecated: true,
    // ...
  }
})
```

#### Step 2: Add Runtime Warnings

**Log Deprecation Usage:**

```typescript
// In route handler
logger.warn({
  endpoint: "/api/assets",
  version: "v1",
  userId: user?.id,
  message: "Deprecated endpoint accessed",
  sunsetDate: "2025-12-01",
});
```

#### Step 3: Monitor Usage

**Track Metrics:**

```sql
-- Query activity log for deprecated endpoint usage
SELECT
  COUNT(*) as usage_count,
  user_id,
  DATE(created_at) as date
FROM activity_log
WHERE action = 'deprecated_api_call'
  AND entity_id = '/api/assets'
GROUP BY user_id, DATE(created_at)
ORDER BY usage_count DESC;
```

#### Step 4: Notify Users

**Email Template:**

```
Subject: Action Required: API Endpoint Deprecation

Dear Asset-Forge API User,

We're writing to inform you that the following API endpoint will be deprecated:

Endpoint: GET /api/assets
Deprecation Date: 2025-06-01
Sunset Date: 2025-12-01

Replacement: GET /api/v2/assets
Migration Guide: https://docs.asset-forge.com/api/v2/migration

What this means:
- The endpoint will continue to work until 2025-12-01
- After this date, requests will return 410 Gone
- Please migrate to v2 before the sunset date

Your current usage:
- Last 30 days: 1,234 requests
- Endpoints affected: GET /api/assets

Need help? Contact support@asset-forge.com

Best regards,
Asset-Forge Team
```

#### Step 5: Return 410 Gone

**After Sunset Date:**

```typescript
.get("/api/assets", async ({ set }) => {
  set.status = 410;
  return {
    error: "ENDPOINT_GONE",
    message: "This endpoint was removed on 2025-12-01. Use /api/v2/assets instead.",
    migrationGuide: "https://docs.asset-forge.com/api/v2/migration",
    sunsetDate: "2025-12-01"
  };
})
```

---

## Version Migration

### Migration Guide Template

**For each major version, create a migration guide:**

#### V1 → V2 Migration Guide

**Overview:**

- **Release Date:** 2026-01-15
- **V1 Deprecation:** 2026-06-01
- **V1 Sunset:** 2026-12-01

**Key Changes:**

1. **Pagination Added**

   ```diff
   # V1 Response (array)
   - GET /api/v1/assets
   - Response: Asset[]

   # V2 Response (paginated)
   + GET /api/v2/assets?page=1&limit=20
   + Response: {
   +   data: Asset[],
   +   pagination: { page, limit, total, hasNext }
   + }
   ```

2. **Field Renaming**

   ```diff
   # V1 Field Names
   - userId
   - createdAt
   - updatedAt

   # V2 Field Names (snake_case)
   + user_id
   + created_at
   + updated_at
   ```

3. **Authentication Changes**

   ```diff
   # V1 Header
   - Authorization: Bearer privy_token

   # V2 Header (same, no change)
   + Authorization: Bearer privy_token
   ```

**Migration Steps:**

**Step 1: Update Base URL**

```typescript
// Before (V1)
const baseURL = "https://api.asset-forge.com/api";

// After (V2)
const baseURL = "https://api.asset-forge.com/api/v2";
```

**Step 2: Handle Pagination**

```typescript
// V1 Code (array response)
const response = await fetch("/api/assets");
const assets = await response.json(); // Asset[]

// V2 Code (paginated response)
const response = await fetch("/api/v2/assets?page=1&limit=20");
const { data: assets, pagination } = await response.json();

// Handle pagination
if (pagination.hasNext) {
  // Load more...
}
```

**Step 3: Update Field Names**

```typescript
// V1 Code
const userId = asset.userId;
const createdAt = asset.createdAt;

// V2 Code
const userId = asset.user_id;
const createdAt = asset.created_at;

// Or use adapter function
function adaptV1ToV2(v1Asset) {
  return {
    ...v1Asset,
    user_id: v1Asset.userId,
    created_at: v1Asset.createdAt,
    updated_at: v1Asset.updatedAt,
  };
}
```

**Step 4: Test & Deploy**

```bash
# Test V2 endpoints in staging
curl https://api-staging.asset-forge.com/api/v2/assets

# Update production code
git commit -m "Migrate to API v2"
git push origin main

# Monitor for errors
railway logs --tail 100
```

---

## Backwards Compatibility

### Maintaining Compatibility Within a Version

**Guidelines for V1 (or any major version):**

1. **Always Add, Never Remove**

   ```typescript
   // ✅ Good: Add new optional field
   type Asset = {
     id: string;
     name: string;
     rarity?: "common" | "rare" | "legendary"; // NEW optional field
   };

   // ❌ Bad: Remove existing field
   type Asset = {
     id: string;
     // name: string;  // ❌ REMOVED - breaks clients!
   };
   ```

2. **Make Required Fields Optional (Safe)**

   ```typescript
   // ✅ Safe: Make required field optional
   // Before
   type CreateAssetRequest = {
     name: string; // required
     type: string; // required
     prompt: string; // required
   };

   // After (safe change)
   type CreateAssetRequest = {
     name: string; // required
     type: string; // required
     prompt?: string; // now optional (with default)
   };
   ```

3. **Add New Enum Values (Safe)**

   ```typescript
   // ✅ Safe: Add new enum values
   // Before
   type AssetType = "weapon" | "armor";

   // After (safe)
   type AssetType = "weapon" | "armor" | "consumable"; // NEW value
   ```

4. **Never Change Types**

   ```typescript
   // ❌ Bad: Change field type
   type Asset = {
     tier: string; // "1", "2", "3" (V1)
   };

   // ❌ BREAKING: Change type
   type Asset = {
     tier: number; // 1, 2, 3 (requires V2!)
   };
   ```

### Compatibility Testing

**Test Matrix:**

| Client Version     | API V1              | API V2                 | Expected Result |
| ------------------ | ------------------- | ---------------------- | --------------- |
| Old Client (V1)    | ✅ Works            | ❌ 404 (not available) | Use V1          |
| New Client (V2)    | ✅ Works (fallback) | ✅ Works               | Use V2          |
| Future Client (V3) | ✅ Works (fallback) | ✅ Works (fallback)    | Use V3          |

---

## Version Negotiation

### Strategy: Explicit Version Selection

**Clients explicitly select version in URL:**

```typescript
// Client specifies version in URL
const response = await fetch("https://api.asset-forge.com/api/v1/assets");

// No default version (forces explicit choice)
const response = await fetch("https://api.asset-forge.com/api/assets");
// → Redirects to latest stable version (v1 currently)
```

### Version Selection Logic

**Server-side routing:**

```typescript
// api-elysia.ts

// V1 Routes (current - no prefix)
.use(healthRoutes)                    // /api/health
.use(createAssetRoutes(...))          // /api/assets

// Future V2 Routes (when needed)
.group("/v2", (app) => app
  .use(healthRoutesV2)                // /api/v2/health
  .use(createAssetRoutesV2(...))      // /api/v2/assets
)

// Fallback: redirect unversioned to V1
.get("/api/assets", async ({ redirect }) => {
  return redirect("/api/v1/assets", 301);  // Permanent redirect
})
```

### Version Discovery

**OpenAPI Endpoint:**

```typescript
.get("/api/versions", () => ({
  current: "v1",
  supported: ["v1"],
  deprecated: [],
  beta: [],
  links: {
    v1: {
      baseUrl: "/api/v1",
      swagger: "/swagger",
      status: "stable",
      sunsetDate: null,
    },
  },
}))
```

---

## Implementation Examples

### Example 1: Adding Pagination (V1 → V2)

**V1 Implementation (Current):**

```typescript
// routes/assets.ts (V1)
.get("/api/assets", async () => {
  const assets = await assetService.listAssets();
  return assets;  // Array response
})
```

**V2 Implementation (Future):**

```typescript
// routes/assets-v2.ts (V2)
.get("/api/v2/assets", async ({ query }) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;

  const { assets, total } = await assetService.listAssetsPaginated({
    page,
    limit,
  });

  return {
    data: assets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}, {
  query: t.Ref("pagination.query"),  // Shared model
  response: {
    200: t.Object({
      data: t.Array(t.Ref("Asset")),
      pagination: t.Ref("pagination.meta"),
    }),
  },
  detail: {
    tags: ["Assets"],
    summary: "List assets (V2 - Paginated)",
    description: "Returns a paginated list of assets. This is the V2 endpoint with improved pagination support.",
    // ... examples
  }
})
```

### Example 2: Field Renaming (snake_case)

**V1 Response:**

```json
{
  "id": "asset_123",
  "userId": "user_456",
  "createdAt": "2025-11-12T10:30:00Z",
  "updatedAt": "2025-11-12T10:35:00Z"
}
```

**V2 Response:**

```json
{
  "id": "asset_123",
  "user_id": "user_456",
  "created_at": "2025-11-12T10:30:00Z",
  "updated_at": "2025-11-12T10:35:00Z"
}
```

**Implementation:**

```typescript
// utils/response-transformer.ts
export function transformToV2(v1Response: any) {
  return {
    ...v1Response,
    user_id: v1Response.userId,
    created_at: v1Response.createdAt,
    updated_at: v1Response.updatedAt,
    // Remove old fields
    userId: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

// routes/assets-v2.ts
.get("/api/v2/assets/:id", async ({ params }) => {
  const asset = await assetService.getAsset(params.id);
  return transformToV2(asset);  // Transform response
})
```

### Example 3: Versioned OpenAPI Docs

**Multiple Swagger Instances:**

```typescript
// api-elysia.ts

import { swagger } from "@elysiajs/swagger";

// V1 Swagger (current)
.use(swagger({
  documentation: {
    info: {
      title: "Asset-Forge API",
      version: "1.0.0",
      description: "AI-powered 3D asset generation API",
    },
    servers: [
      { url: "/api", description: "V1 (current)" }
    ],
    // ... V1 tags and components
  },
  path: "/swagger",  // Main Swagger UI
}))

// V2 Swagger (future)
.use(swagger({
  documentation: {
    info: {
      title: "Asset-Forge API V2",
      version: "2.0.0",
      description: "AI-powered 3D asset generation API (V2 with pagination)",
    },
    servers: [
      { url: "/api/v2", description: "V2" }
    ],
    // ... V2 tags and components
  },
  path: "/swagger/v2",  // V2 Swagger UI
}))
```

---

## API Lifecycle

### Version Lifecycle States

| State          | Description           | Support Level               | Example                 |
| -------------- | --------------------- | --------------------------- | ----------------------- |
| **Beta**       | Testing new features  | Limited support, may change | `/api/beta/new-feature` |
| **Stable**     | Production-ready      | Full support                | `/api/v1/assets`        |
| **Deprecated** | Scheduled for removal | Maintenance only            | `/api/v0/old-endpoint`  |
| **Sunset**     | No longer available   | Not supported               | `/api/v0/*` → 410 Gone  |

### Version Support Matrix

| Version | State   | Release Date | Deprecation Date | Sunset Date | Notes              |
| ------- | ------- | ------------ | ---------------- | ----------- | ------------------ |
| V1      | Stable  | 2024-01-01   | TBD              | TBD         | Current version    |
| V2      | Planned | 2026-Q1      | TBD              | TBD         | Pagination support |

---

## Best Practices

### For API Developers

1. **Document Everything**
   - Add OpenAPI examples for all responses
   - Document breaking changes in migration guides
   - Use clear deprecation warnings

2. **Version Shared Models**

   ```typescript
   // models/v1.ts
   export const AssetV1 = t.Object({
     userId: t.String(),
     createdAt: t.String(),
   });

   // models/v2.ts
   export const AssetV2 = t.Object({
     user_id: t.String(),
     created_at: t.String(),
   });
   ```

3. **Test Across Versions**

   ```bash
   # Test V1
   bun test --testNamePattern="V1 API"

   # Test V2
   bun test --testNamePattern="V2 API"
   ```

4. **Monitor Deprecation Usage**
   ```typescript
   // Track deprecated endpoint usage
   await db.insert(activityLog).values({
     userId: user.id,
     action: "deprecated_api_call",
     entityType: "api_endpoint",
     entityId: "/api/assets",
     details: {
       version: "v1",
       deprecationDate: "2025-06-01",
       sunsetDate: "2025-12-01",
     },
   });
   ```

### For API Consumers

1. **Always Specify Version**

   ```typescript
   // ✅ Good: Explicit version
   const response = await fetch("/api/v1/assets");

   // ❌ Bad: Relies on default
   const response = await fetch("/api/assets");
   ```

2. **Handle New Fields Gracefully**

   ```typescript
   // ✅ Good: Ignore unknown fields
   type Asset = {
     id: string;
     name: string;
     [key: string]: any; // Allow unknown fields
   };
   ```

3. **Watch for Deprecation Headers**

   ```typescript
   const response = await fetch("/api/v1/assets");

   if (response.headers.get("X-API-Warn")) {
     console.warn("API deprecation:", response.headers.get("X-API-Warn"));
     console.warn("Sunset date:", response.headers.get("X-API-Sunset-Date"));
   }
   ```

4. **Test in Staging First**
   ```bash
   # Test migration in staging before production
   export API_BASE_URL="https://api-staging.asset-forge.com/api/v2"
   bun test
   ```

---

## Summary

### Key Takeaways

- **Current Version:** V1 (implicit, no URL prefix)
- **Strategy:** URL path versioning (`/api/v1/`, `/api/v2/`)
- **Breaking Changes:** Require new major version
- **Deprecation:** 6-month timeline with warnings
- **Migration:** Provide detailed guides and code examples
- **Compatibility:** Always additive within a version

### Next Steps

1. **Before V2 Launch:**
   - Complete V1 OpenAPI documentation (in progress)
   - Create V2 migration guide template
   - Set up deprecation warning infrastructure
   - Add version discovery endpoint

2. **When V2 Needed:**
   - Create `/api/v2` route group
   - Duplicate and modify V1 routes
   - Add V2 Swagger documentation
   - Update client libraries
   - Announce V1 deprecation (6-month timeline)

3. **Ongoing:**
   - Monitor deprecated endpoint usage
   - Keep migration guides updated
   - Communicate with API users
   - Track version adoption metrics

---

**Last Updated:** 2025-11-12

**Maintained By:** Asset-Forge API Team

**Questions?** Open an issue or contact api@asset-forge.com
