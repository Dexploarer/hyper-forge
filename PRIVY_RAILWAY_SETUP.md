# Privy Authentication - Railway Deployment Guide

## Step 1: Set Environment Variables in Railway

Go to **Railway Dashboard** → **Your Project** → **Variables** tab and add:

### Required for Privy Auth

```bash
# Backend Privy credentials (for JWT verification)
PRIVY_APP_ID=cmhr5kvfp00hxl40c5aebrci5
PRIVY_APP_SECRET=4YQTtAxEojLLfdpDwbvozo4gUPA368ZHMvR4ejVFB4VJQDLbjh9zJX72ZJqVZMG4nc51fgJHdBYNuudDc7ZbEjhA

# Frontend Privy App ID (VITE_ prefix makes it accessible in browser)
VITE_PRIVY_APP_ID=cmhr5kvfp00hxl40c5aebrci5
```

### Already Set (verify these exist)

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-set by Railway PostgreSQL plugin

# Environment
NODE_ENV=production
```

---

## Step 2: Configure Privy Dashboard for Railway

1. Go to https://dashboard.privy.io
2. Select your app (ID: `cmhr5kvfp00hxl40c5aebrci5`)
3. **Settings** → **Allowed Domains**
4. Add your Railway domain:
   ```
   https://your-app.railway.app
   ```
5. **Settings** → **OAuth Redirect URLs**
6. Add:
   ```
   https://your-app.railway.app
   ```

---

## Step 3: Update Railway Build Settings (Already Configured)

Your `railway.toml` is already set up correctly:

```toml
[build]
builder = "RAILPACK"
buildCommand = "cd packages/core && bun run build"  # Builds Vite frontend

[deploy]
startCommand = "cd packages/core && bun run start:api"  # Runs migrations + starts server
```

**What happens on deploy:**
1. `bun run build` - Vite bundles frontend with `VITE_PRIVY_APP_ID`
2. `bun run db:migrate` - Creates `users` table (auto-runs via `start:api`)
3. Elysia server starts with Privy auth middleware

---

## Step 4: Deploy to Railway

### Option A: Auto Deploy (Recommended)

Push to your connected branch:

```bash
git add .
git commit -m "Add Privy authentication"
git push origin main
```

Railway will automatically:
- Detect the push
- Run the build
- Deploy with new environment variables

### Option B: Manual Deploy

Railway Dashboard → **Deployments** → **Deploy Now**

---

## Step 5: Verify Deployment

### Check Health Endpoint

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T...",
  "services": {"meshy": true, "openai": true}
}
```

### Test Frontend

Visit: `https://your-app.railway.app/`

You should see:
- Landing page loads ✅
- Click "Login" → Privy modal appears ✅
- Login with Twitter/Discord/Wallet ✅
- User auto-created in database ✅

### Test Backend Auth

After logging in, check browser DevTools:
1. **Application** → **Local Storage**
2. Find `privy:token` or check **Network** tab for JWT in requests
3. Copy the JWT token
4. Test API:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.railway.app/users/me
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "privyUserId": "did:privy:...",
    "email": "your@email.com",
    "role": "member",
    ...
  }
}
```

---

## Step 6: Promote First User to Admin

Your first user will have `role="member"` by default.

### Method 1: Railway PostgreSQL Data Tab

1. Railway Dashboard → **PostgreSQL** → **Data** tab
2. Run SQL:
   ```sql
   UPDATE users
   SET role = 'admin'
   WHERE email = 'your@email.com';
   ```

### Method 2: pgAdmin / Local Connection

```bash
# Get DATABASE_URL from Railway
psql "postgresql://postgres:PASSWORD@HOST:PORT/railway"

UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Method 3: Via Code (Future)

Add an admin promotion endpoint (secure it properly).

---

## Troubleshooting

### ❌ Privy Modal Doesn't Open

**Check:**
1. `VITE_PRIVY_APP_ID` is set in Railway
2. Railway re-deployed after setting the variable
3. Privy dashboard has your Railway domain whitelisted
4. Browser console for errors

**Fix:**
```bash
# Railway Dashboard → Variables → Add VITE_PRIVY_APP_ID
# Then redeploy
```

### ❌ "Unauthorized" Error on Login

**Check:**
1. `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are set (backend)
2. Credentials match your Privy dashboard
3. Railway logs for PrivyClient initialization errors

**Fix:**
```bash
# Railway Dashboard → Logs
# Look for: "PRIVY_APP_ID and PRIVY_APP_SECRET not configured"
```

### ❌ Database Not Storing Users

**Check:**
1. DATABASE_URL is set correctly
2. Migrations ran successfully
3. Railway logs for database connection errors

**Verify migrations:**
```bash
# Railway Dashboard → Logs
# Look for: "[Migrations] ✓ Migrations completed successfully"
```

### ❌ CORS Errors

**Check `api-elysia.ts` CORS config:**
```typescript
cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "*"
    : true,
  credentials: true,
})
```

**Set in Railway if needed:**
```bash
FRONTEND_URL=https://your-app.railway.app
```

---

## Environment Variables Summary

Required for Privy Auth to work on Railway:

| Variable | Value | Where Used |
|----------|-------|------------|
| `PRIVY_APP_ID` | `cmhr5kvfp00hxl40c5aebrci5` | Backend JWT verification |
| `PRIVY_APP_SECRET` | `4YQTtAxE...` | Backend JWT verification |
| `VITE_PRIVY_APP_ID` | `cmhr5kvfp00hxl40c5aebrci5` | Frontend PrivyProvider |
| `DATABASE_URL` | `postgresql://...` | Database connection |
| `NODE_ENV` | `production` | Environment mode |

---

## Post-Deployment Checklist

- [ ] Environment variables set in Railway
- [ ] Privy dashboard domain whitelisted
- [ ] Railway deployment successful
- [ ] Health check returns 200
- [ ] Frontend loads without errors
- [ ] Privy login modal opens
- [ ] Can login with Twitter/Discord/Wallet
- [ ] User auto-created in database
- [ ] First user promoted to admin
- [ ] Admin dashboard accessible

---

## Quick Deploy Commands

```bash
# 1. Set env vars in Railway Dashboard (do this first!)

# 2. Deploy
git add .
git commit -m "Configure Privy auth for production"
git push origin main

# 3. Monitor deployment
# Railway Dashboard → Logs tab

# 4. Test
curl https://your-app.railway.app/api/health
open https://your-app.railway.app

# 5. Promote admin (after first login)
# Railway Dashboard → PostgreSQL → Data → Run SQL:
# UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Success Criteria

✅ Login with Privy works in production
✅ Users auto-created in Railway PostgreSQL
✅ JWT verification working on backend
✅ Admin dashboard accessible (after promotion)
✅ All OAuth providers working (Twitter, Discord, Farcaster)
✅ Wallet login working (Ethereum, Solana)

🎉 **Your auth is production-ready!**
