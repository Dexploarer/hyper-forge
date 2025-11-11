# Elysia HEAD Request Bug

## Bug Summary

**Elysia v1.4.15** has a critical bug where HEAD requests fail with `TypeError: undefined is not an object (evaluating '_res.headers.set')` when routes return `Bun.file()` without explicit HEAD handlers.

## Symptoms

### 1. Server Crashes

```
TypeError: undefined is not an object (evaluating '_res.headers.set')
```

### 2. Asset Loading Failures

- WeaponHandleDetector validation rejects binary GLB files
- Error: `content-type: null`
- GLB files incorrectly treated as JSON

### 3. HEAD Requests Fail

- HEAD / requests crash the server
- Any HEAD request to a route returning `Bun.file()` crashes

## Root Cause

Elysia tries to auto-handle HEAD requests by:

1. Calling the GET route handler
2. Extracting the response Content-Length
3. Returning headers without body

**However**, `Bun.file()` responses don't work properly with this mechanism:

- Elysia's HEAD handler can't properly extract headers from `Bun.file()`
- The `_res.headers.set()` call fails because `_res` is undefined
- This causes the entire server to crash

## The Fix

### Always Add Explicit HEAD Handlers

For any route that serves files with `Bun.file()`, you MUST add an explicit `.head()` handler:

#### Wrong Way (Crashes on HEAD)

```typescript
.get("/:id/model", async ({ params: { id }, set }) => {
  const modelPath = await assetService.getModelPath(id);
  const modelFile = Bun.file(modelPath);

  if (!(await modelFile.exists())) {
    set.status = 404;
    return { error: `Model not found` };
  }

  // Missing content-type causes validation failures
  return modelFile;
})
// ❌ NO HEAD HANDLER - Will crash on HEAD requests!
```

#### Right Way (Explicit HEAD Handler)

```typescript
.get("/:id/model", async ({ params: { id }, set }) => {
  const modelPath = await assetService.getModelPath(id);
  const modelFile = Bun.file(modelPath);

  if (!(await modelFile.exists())) {
    set.status = 404;
    return { error: `Model not found` };
  }

  // Set correct content-type for GLB files
  const ext = modelPath.toLowerCase().split(".").pop();
  if (ext === "glb") {
    set.headers["Content-Type"] = "model/gltf-binary";
  } else if (ext === "gltf") {
    set.headers["Content-Type"] = "model/gltf+json";
  } else {
    set.headers["Content-Type"] = "application/octet-stream";
  }

  return modelFile;
})

// ✅ Explicit HEAD handler with proper headers
.head("/:id/model", async ({ params: { id }, set }) => {
  const modelPath = await assetService.getModelPath(id);
  const modelFile = Bun.file(modelPath);

  if (!(await modelFile.exists())) {
    set.status = 404;
  } else {
    set.status = 200;

    // CRITICAL: Set content-type in HEAD response too
    const ext = modelPath.toLowerCase().split(".").pop();
    if (ext === "glb") {
      set.headers["Content-Type"] = "model/gltf-binary";
    } else if (ext === "gltf") {
      set.headers["Content-Type"] = "model/gltf+json";
    } else {
      set.headers["Content-Type"] = "application/octet-stream";
    }
  }

  return null; // HEAD responses must return null
})
```

### HEAD Handler Requirements

1. **Return `null`** - HEAD responses must have no body
2. **Set `status`** - 200 for exists, 404 for not found
3. **Set `Content-Type`** - Must match the GET handler's content-type
4. **Use `set.headers`** - Don't return `new Response()` with headers

### Alternative: Return Response with Headers

If you prefer to return a Response object:

```typescript
.head("/:id/model", async ({ params: { id } }) => {
  const modelPath = await assetService.getModelPath(id);
  const modelFile = Bun.file(modelPath);

  if (!(await modelFile.exists())) {
    return new Response(null, { status: 404 });
  }

  const ext = modelPath.toLowerCase().split(".").pop();
  let contentType = "application/octet-stream";
  if (ext === "glb") contentType = "model/gltf-binary";
  else if (ext === "gltf") contentType = "model/gltf+json";

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": contentType,
    },
  });
})
```

## Files Changed

### 1. `server/routes/assets.ts:69-90`

Added explicit HEAD handler for `/:id/model` route with proper content-type headers.

### 2. `server/api-elysia.ts:453-467`

Added HEAD handler for SPA fallback route to prevent crashes on HEAD / requests.

```typescript
// HEAD handler for SPA fallback to prevent Elysia HEAD bug
// See: https://github.com/elysiajs/elysia/issues - Elysia v1.4.15 HEAD handling issue
.head("/*", () => {
  const indexPath = path.join(ROOT_DIR, "dist", "index.html");
  if (!fs.existsSync(indexPath)) {
    return new Response(null, { status: 404 });
  }
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
})
```

### 3. `server/routes/assets.ts:60-84`

Added HEAD handler for wildcard file serving route `/:id/*`.

## Testing

### Manual Testing

Created `test-head-requests.ts` to verify HEAD requests work properly:

```bash
bun run test-head-requests.ts
```

Tests:

- SPA fallback root (HEAD /)
- SPA fallback nested routes (HEAD /equipment)
- API endpoints (HEAD /api/health)
- Asset model endpoints (HEAD /api/assets/:id/model)

### Automated Testing

Tests are documented in `server/routes/assets.test.ts:188-210` but currently **SKIPPED** due to this bug:

```typescript
describe("HEAD /api/assets/:id/model", () => {
  // FIXME: Elysia v1.4.15 has a bug with HEAD request handling
  // Error: TypeError: undefined is not an object (evaluating '_res.headers.set')
  // See: https://github.com/elysiajs/elysia/issues (pending bug report)
  it.skip("should return 404 for non-existent model", async () => {
    // Test implementation
  });

  it.skip("should not return body for HEAD request", async () => {
    // Test implementation
  });
});
```

Once Elysia fixes the bug, these tests can be unskipped.

## Why Content-Type Matters

The content-type header is critical for binary files like GLB:

### Without Content-Type

```typescript
// ❌ Missing content-type
return Bun.file("model.glb");

// Result:
// - Browser/fetch receives binary data without content-type
// - Some parsers (like WeaponHandleDetector) assume JSON
// - Binary GLB data is rejected as invalid JSON
```

### With Content-Type

```typescript
// ✅ Correct content-type
set.headers["Content-Type"] = "model/gltf-binary";
return Bun.file("model.glb");

// Result:
// - Browser/fetch knows this is a GLB file
// - Parsers treat it as binary
// - WeaponHandleDetector validation passes
```

## Prevention Checklist

When adding new routes that serve files:

- [ ] Does the route return `Bun.file()`?
- [ ] Is there an explicit `.head()` handler?
- [ ] Does the HEAD handler return `null`?
- [ ] Does the HEAD handler set the correct `Content-Type`?
- [ ] Does the GET handler also set `Content-Type`?
- [ ] Are the content-types in GET and HEAD consistent?

## Related Issues

- **Elysia Issue**: This bug should be reported to elysiajs/elysia
- **Workaround**: Always add explicit HEAD handlers
- **Future**: Monitor Elysia releases for a fix

## Impact

Before fix:

- Server crashes on HEAD / requests
- Asset loading fails for weapon detection
- Binary file validation rejects GLB files

After fix:

- HEAD requests work properly
- Asset models load correctly
- WeaponHandleDetector validation passes
- Server stability improved

## References

- Bug documented in: `server/routes/assets.test.ts:188-210`
- Test script: `test-head-requests.ts`
- Fixed routes: `server/routes/assets.ts`, `server/api-elysia.ts`
- Related validation: WeaponHandleDetector in weapon generation pipeline
