# Railway Workers Service Configuration Guide

## Critical Dashboard Configuration

**IMPORTANT**: The Workers service MUST be configured in Railway dashboard with the following settings:

### 1. Root Directory
- **Setting**: Root Directory
- **Value**: `packages/core`
- **Location**: Railway Dashboard → Workers Service → Settings → Root Directory

This tells Railway to:
- Look for `railway.toml` in `packages/core/` (not root)
- Use `packages/core/railpack.json` for Railpack configuration
- Set working directory to `packages/core` during deployment

### 2. Service Configuration File
Railway should automatically detect `packages/core/railway.toml` when Root Directory is set to `packages/core`.

If Railway is still using the root `railway.toml`, verify:
- Root Directory is set correctly in dashboard
- Service is linked to the correct repository
- Service is using the correct branch (main)

## Configuration Files

### `packages/core/railway.toml`
This file configures the Workers service:
- **Build Command**: `cd packages/core && bun install --frozen-lockfile`
- **Start Command**: `cd packages/core && bun run start:workers`
- **Watch Patterns**: Absolute paths from repo root (`packages/core/...`)

### `packages/core/railpack.json`
Railpack configuration:
- **Packages**: Bun (latest) + Node.js (22.12.0)
- **Deploy Command**: `cd packages/core && bun run start:workers`

## Why `cd packages/core` is Needed

Even with Root Directory set to `packages/core`, Railway may still run commands from the repo root during:
- Build phase (before rootDirectory takes effect)
- Deploy phase (if rootDirectory isn't fully respected)

The `cd packages/core` ensures commands run from the correct directory regardless.

## Watch Patterns

Watch patterns are **absolute from repo root**:
```toml
watchPatterns = [
  "packages/core/server/workers/**",
  "packages/core/server/services/**",
  "packages/core/server/db/**",
  "packages/core/package.json",
  "packages/core/bun.lock",
  "packages/core/railpack.json",
  "packages/core/railway.toml"
]
```

These patterns ensure:
- Only changes in `packages/core` trigger Workers deployments
- Changes in root or other packages don't trigger Workers redeployments
- Changes to worker-specific files trigger deployments

## Verification Checklist

After configuring in Railway dashboard:

- [ ] Root Directory set to `packages/core`
- [ ] Service linked to correct repository
- [ ] Service using correct branch (main)
- [ ] Build command shows: `cd packages/core && bun install --frozen-lockfile`
- [ ] Start command shows: `cd packages/core && bun run start:workers`
- [ ] Watch patterns include `packages/core/**`

## Troubleshooting

### Issue: Railway using root `railway.toml` instead of `packages/core/railway.toml`

**Solution**: 
1. Verify Root Directory is set to `packages/core` in dashboard
2. Unlink and re-link the service if needed
3. Check that `packages/core/railway.toml` exists and is committed

### Issue: Build fails with "Script not found"

**Solution**:
- Verify `buildCommand` includes `cd packages/core`
- Verify `startCommand` includes `cd packages/core`
- Check that `packages/core/package.json` has `start:workers` script

### Issue: npm install runs instead of bun install

**Solution**:
- Verify `buildCommand` explicitly uses `bun install`
- Check that `railpack.json` doesn't have conflicting build steps
- Ensure Bun is specified in `railpack.json` packages

## Architecture Notes

- **Monorepo Structure**: Root has `package.json` with workspaces
- **Workspace**: `packages/core` is the main application package
- **Workers**: Separate service that processes Redis queue jobs
- **No HTTP**: Workers don't expose HTTP endpoints (no PORT needed)

