# Privy Environment Configuration

This guide explains how to use different Privy client keys for testing vs production environments.

## Overview

You can use separate Privy apps for different environments:
- **Development/Testing**: Test Privy app with test users
- **Production**: Production Privy app with real users

Both environments can share the same database - users are identified by their `privyUserId`, which is unique across Privy apps.

## Setup

### 1. Create Privy Apps

1. **Development App**:
   - Go to https://dashboard.privy.io
   - Create a new app (e.g., "Asset-Forge Dev")
   - Copy the App ID and App Secret

2. **Production App**:
   - Create another app (e.g., "Asset-Forge Production")
   - Copy the App ID and App Secret

### 2. Configure Environment Variables

#### Development Environment (`.env` or `.env.local`)

```bash
# Frontend - Test Privy App
VITE_PRIVY_APP_ID=clx_test_app_id_here

# Backend - Test Privy App (must match frontend)
PRIVY_APP_ID=clx_test_app_id_here
PRIVY_APP_SECRET=your_test_privy_secret_here
```

#### Production Environment (Railway/Production)

```bash
# Frontend - Production Privy App
VITE_PRIVY_APP_ID=clx_prod_app_id_here

# Backend - Production Privy App (must match frontend)
PRIVY_APP_ID=clx_prod_app_id_here
PRIVY_APP_SECRET=your_prod_privy_secret_here
```

## Important Notes

### Frontend and Backend Must Match

**CRITICAL**: The frontend `VITE_PRIVY_APP_ID` and backend `PRIVY_APP_ID` must be the same for the same environment. If they don't match:
- Users can log in on the frontend
- But backend token verification will fail
- API calls will return 401 Unauthorized

### User Database Sharing

- Users from different Privy apps can coexist in the same database
- Users are identified by `privyUserId` (unique per Privy app)
- Same email/wallet can exist in both test and prod Privy apps
- They will be separate users in your database

### Testing Workflow

1. **Local Development**:
   ```bash
   # Use test Privy app
   VITE_PRIVY_APP_ID=clx_test_123
   PRIVY_APP_ID=clx_test_123
   PRIVY_APP_SECRET=test_secret
   ```

2. **Production Testing**:
   ```bash
   # Use production Privy app
   VITE_PRIVY_APP_ID=clx_prod_456
   PRIVY_APP_ID=clx_prod_456
   PRIVY_APP_SECRET=prod_secret
   ```

## Verification

### Check Frontend Configuration

Open browser console and check:
```javascript
console.log('Privy App ID:', import.meta.env.VITE_PRIVY_APP_ID);
```

### Check Backend Configuration

Backend logs will show Privy initialization:
```
[Auth] Privy client initialized with app ID: clx_...
```

### Test Authentication

1. Log in with Privy on frontend
2. Check browser console for `[AssetService] Fetched X assets from API`
3. If you see 401 errors, Privy app IDs don't match

## Troubleshooting

### "Authentication required" errors

- **Cause**: Frontend and backend Privy app IDs don't match
- **Fix**: Ensure `VITE_PRIVY_APP_ID === PRIVY_APP_ID` in your `.env`

### Users not appearing

- **Cause**: Using different Privy apps, so different `privyUserId` values
- **Fix**: Use the same Privy app for frontend and backend in the same environment

### Can't log in

- **Cause**: Wrong Privy app ID in frontend
- **Fix**: Check `VITE_PRIVY_APP_ID` matches your Privy dashboard app ID

## Best Practices

1. **Separate Apps**: Always use different Privy apps for dev and prod
2. **Environment Variables**: Never commit `.env` files with real secrets
3. **Match IDs**: Always ensure frontend and backend use the same Privy app ID
4. **Test First**: Test authentication in dev before deploying to prod

