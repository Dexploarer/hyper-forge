---
description: Verify environment variables are configured
allowed-tools: [Bash, Read]
---

# Environment Check

Verify all required environment variables are set.

**Check .env file exists:**
```bash
!`test -f ${WORKSPACE_DIR}/packages/server/.env && echo "✓ .env file exists" || echo "✗ .env file missing"`
```

**Required variables:**
```bash
!`cd ${WORKSPACE_DIR}/packages/server && (
  echo "Checking required environment variables..."
  test -n "$DATABASE_URL" && echo "✓ DATABASE_URL" || echo "✗ DATABASE_URL missing"
  test -n "$PRIVY_APP_ID" && echo "✓ PRIVY_APP_ID" || echo "✗ PRIVY_APP_ID missing"
  test -n "$PRIVY_APP_SECRET" && echo "✓ PRIVY_APP_SECRET" || echo "✗ PRIVY_APP_SECRET missing"
  test -n "$MESHY_API_KEY" && echo "✓ MESHY_API_KEY" || echo "✗ MESHY_API_KEY missing"
)`
```

**Environment variables needed:**
- `DATABASE_URL` - SQLite database path
- `PRIVY_APP_ID` - Privy authentication app ID
- `PRIVY_APP_SECRET` - Privy authentication secret
- `MESHY_API_KEY` - MeshyAI 3D generation API key
- `VITE_PRIVY_APP_ID` - Frontend Privy config

**Create .env from template:**
```bash
!`test -f ${WORKSPACE_DIR}/packages/server/.env.example && cp ${WORKSPACE_DIR}/packages/server/.env.example ${WORKSPACE_DIR}/packages/server/.env && echo "✓ Created .env from template" || echo "ℹ No .env.example found"`
```
