# Privy Dashboard Configuration Checklist

## Your Current Setup

**Privy App ID**: `cmhr5kvfp00hxl40c5aebrci5`

**Login Methods Enabled**:
- ✅ Twitter (X) OAuth
- ✅ Discord OAuth
- ✅ Farcaster
- ✅ Ethereum Wallets
- ✅ Solana Wallets

---

## CRITICAL: Whitelist Your Railway Domain

**This is WHY logins aren't saving on Railway!**

### Step 1: Get Your Railway Domain

1. Go to Railway Dashboard → Your Project
2. Find your deployment URL (e.g., `https://asset-forge-production.up.railway.app`)
3. Copy the full URL

### Step 2: Add to Privy Dashboard

Go to https://dashboard.privy.io → Your App (`cmhr5kvfp00hxl40c5aebrci5`) → **Settings**

#### A. Allowed Domains

Click **Settings** → **Allowed Domains** → Add:

```
https://your-app.railway.app
```

**Example**:
```
https://asset-forge-production.up.railway.app
```

#### B. OAuth Redirect URLs

Click **Settings** → **OAuth Redirect URLs** → Add:

```
https://your-app.railway.app
```

<Warning>
Without this, Privy login will FAIL on Railway and users won't be created in your database!
</Warning>

---

## Current Login Method Status

Based on the documentation you shared, here's what you have:

### ✅ Using Privy Default Credentials (Quick Start)

Your OAuth logins (Twitter, Discord, Farcaster) are currently using **Privy's default credentials**. This is:
- ✅ **Fine for development and testing**
- ⚠️ **Should be replaced with your own for production**

**Benefit of custom credentials:**
- Your branding on OAuth screens
- More control over security
- Better for production apps

---

## For Production: Set Up Custom OAuth Credentials

### Twitter (X) OAuth 2.0

**Why**: Your users see "Asset Forge" instead of "Privy" when logging in

**Steps**:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new app → "Confidential client" (Web app)
3. Set OAuth 2.0 Redirect URI:
   ```
   https://auth.privy.io/api/v1/oauth/callback
   ```
4. Get **Client ID** and **Client Secret**
5. Add to Privy Dashboard → Login Methods → X (Twitter) → Configure

**What you'll need**:
- Client ID
- Client Secret

---

### Discord OAuth

**Steps**:
1. Go to https://discord.com/developers/applications
2. Create New Application → OAuth2 Settings
3. Add Redirect URI:
   ```
   https://auth.privy.io/api/v1/oauth/callback
   ```
4. Generate **Client Secret**
5. Add to Privy Dashboard → Login Methods → Discord → Configure

**What you'll need**:
- Client ID (from General Information)
- Client Secret (from OAuth2)

---

### Farcaster

Farcaster works automatically - no custom setup needed! ✅

Just make sure it's enabled in:
- Privy Dashboard → Login Methods → Farcaster → Toggle ON

---

## Wallet Login Configuration

### Ethereum Wallets

**Supported by default**:
- MetaMask
- Coinbase Wallet
- WalletConnect
- Rainbow
- And more...

**No additional setup needed** - works out of the box! ✅

Privy uses **Sign-In with Ethereum (SIWE)** standard.

---

### Solana Wallets

**Supported by default**:
- Phantom
- Solflare
- And more...

**Configuration in your code** (already done ✅):

```tsx
// src/App.tsx
embeddedWallets: {
  ethereum: {
    createOnLogin: 'users-without-wallets',
  },
  solana: {
    createOnLogin: 'users-without-wallets',
  },
}
```

Privy uses **Sign-In with Solana (SIWS)** standard.

---

## Testing Checklist

### Local Development (localhost:5173)

- [x] Privy modal opens ✅
- [x] Can login with Twitter ✅
- [x] Can login with Discord ✅
- [x] Can login with Farcaster ✅
- [x] Can login with Ethereum wallet ✅
- [x] Can login with Solana wallet ✅
- [x] User saved to database ✅

### Railway Deployment (your-app.railway.app)

- [ ] Add Railway domain to Privy Dashboard **← DO THIS FIRST!**
- [ ] Add OAuth redirect URL to Privy Dashboard
- [ ] Deploy with PRIVY env vars set
- [ ] Test: Privy modal opens
- [ ] Test: Login with Twitter works
- [ ] Test: Login with Discord works
- [ ] Test: User saved to Railway database
- [ ] Verify: Check Railway PostgreSQL for new user

---

## Quick Setup Commands

### 1. Get Railway URL

```bash
# In Railway Dashboard
railway status

# Or check your deployment URL in Railway Dashboard → Deployments
```

### 2. Add to Privy Dashboard

Go to: https://dashboard.privy.io/apps/cmhr5kvfp00hxl40c5aebrci5/settings

**Add these domains:**
```
Development: http://localhost:5173
Production: https://your-railway-app.railway.app
```

### 3. Verify Environment Variables in Railway

```bash
# Railway Dashboard → Variables → Verify these exist:
PRIVY_APP_ID=cmhr5kvfp00hxl40c5aebrci5
PRIVY_APP_SECRET=4YQTtAxEojLLfdpDwbvozo4gUPA368ZHMvR4ejVFB4VJQDLbjh9zJX72ZJqVZMG4nc51fgJHdBYNuudDc7ZbEjhA
VITE_PRIVY_APP_ID=cmhr5kvfp00hxl40c5aebrci5
```

### 4. Deploy to Railway

```bash
git add .
git commit -m "Configure Privy for Railway production"
git push origin main
```

### 5. Test Login Flow

```bash
# Open your Railway app
open https://your-app.railway.app

# Try logging in with each method:
# - Twitter
# - Discord
# - Farcaster
# - Wallet (MetaMask, Phantom)

# Then verify user was created:
# Railway Dashboard → PostgreSQL → Data → SELECT * FROM users;
```

---

## Why Users Aren't Saving on Railway

**Root Cause**: Railway domain not whitelisted in Privy Dashboard

**Symptoms**:
- ❌ Privy login modal doesn't open on Railway
- ❌ OR modal opens but login fails
- ❌ OR login succeeds but user not created
- ❌ Console errors about CORS or domain mismatch

**Fix**:
1. ✅ Add Railway domain to **Allowed Domains**
2. ✅ Add Railway domain to **OAuth Redirect URLs**
3. ✅ Redeploy Railway (or just wait for next deploy)
4. ✅ Test login again

---

## Advanced: Custom OAuth Credentials (Optional)

**When to do this**:
- Going to production
- Want your branding on OAuth screens
- Need more control over OAuth flow

**Current status**: Using Privy defaults (totally fine!)

**To upgrade**:
1. Create Twitter OAuth app
2. Create Discord OAuth app
3. Configure in Privy Dashboard
4. See full guide in documentation above

**Benefits**:
- Users see "Sign in with Asset Forge" instead of "Sign in with Privy"
- More control over permissions/scopes
- Independent from Privy's OAuth apps

---

## Support Resources

- **Privy Dashboard**: https://dashboard.privy.io
- **Privy Docs**: https://docs.privy.io
- **Privy Discord**: https://discord.gg/privy
- **Support Email**: support@privy.io

---

## Success Criteria

✅ Railway domain whitelisted in Privy
✅ OAuth redirect URLs configured
✅ Environment variables set in Railway
✅ Can login on Railway with Twitter
✅ Can login on Railway with Discord
✅ Can login on Railway with wallet
✅ Users auto-created in Railway PostgreSQL
✅ Admin promotion works

🎉 **Your auth is production-ready!**
