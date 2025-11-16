# Run CDN Sync on Railway

## Option 1: One-Time Deployment Command

1. **Add this to your package.json scripts:**

```json
{
  "scripts": {
    "sync-cdn": "bun server/scripts/sync-cdn-to-database.ts 020bac6c-0f9b-40bd-9b99-fa3f1e62088c"
  }
}
```

2. **Deploy and run via Railway:**

```bash
# If you have Railway CLI installed
railway run bun run sync-cdn

# OR connect via Railway dashboard
# Go to your service → Settings → Deploy → One-off command
# Enter: bun run sync-cdn
```

## Option 2: Temporary API Endpoint

Add this to your API server temporarily, then call it once:

**File: `packages/core/server/routes/admin.ts`**

Add this endpoint:

```typescript
.post("/sync-cdn-assets", async ({ user }) => {
  const authUser = user as AuthUser;

  // Only allow admin
  if (!authUser.isAdmin) {
    throw new ForbiddenError("Admin only");
  }

  const { execSync } = await import("child_process");

  try {
    const output = execSync(
      `bun server/scripts/sync-cdn-to-database.ts ${authUser.id}`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    return { success: true, output };
  } catch (error) {
    return { success: false, error: String(error) };
  }
})
```

Then visit: `https://your-app.railway.app/api/admin/sync-cdn-assets`

## Option 3: Manual Database Insert (Quickest)

Run this SQL directly in Railway's Postgres Query tab:

```sql
-- This will create records for all your CDN assets
-- Replace CDN_URL with your actual CDN URL

INSERT INTO assets (id, name, description, type, owner_id, cdn_url, metadata, status, visibility, tags, created_at, updated_at)
SELECT
  'asset-' || generate_series(1, 100),
  'Asset ' || generate_series(1, 100),
  'Imported from CDN',
  'unknown',
  '020bac6c-0f9b-40bd-9b99-fa3f1e62088c',
  'https://your-cdn-url.com/models/asset-' || generate_series(1, 100) || '/model.glb',
  '{"importedFromCDN": true}'::jsonb,
  'completed',
  'public',
  ARRAY[]::text[],
  NOW(),
  NOW();
```

**Which option do you prefer?**

- Option 1 is cleanest (Railway CLI)
- Option 2 is easiest (just click a URL once)
- Option 3 is fastest (direct SQL, but you need to know your asset structure)
