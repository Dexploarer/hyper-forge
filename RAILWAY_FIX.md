# Railway DATABASE_URL Fix

## Problem

Database connection failing with error:

```
Error Code: 28P01
Error Message: password authentication failed for user "postgres"
```

## Root Cause

The `DATABASE_URL` environment variable in Railway has incorrect credentials or is not using the proper Railway reference variable syntax.

## Solution

### Step 1: Fix DATABASE_URL in Railway Dashboard

1. **Open Railway Dashboard**: https://railway.app
2. **Navigate to your project** (hyper-forge)
3. **Select your API service** (the one running migrations)
4. **Click on "Variables" tab**
5. **Find the `DATABASE_URL` variable**
6. **Update it to use the reference variable**:

   ```
   ${{Postgres.DATABASE_URL}}
   ```

   **Important**: Use the exact syntax above. This tells Railway to automatically inject the correct connection string from your Postgres service.

7. **Click "Save"** or it saves automatically
8. **Redeploy** your service (or it will redeploy automatically)

### Step 2: Verify the Fix

After redeploying, check your deployment logs. You should see:

```
[Migrations] ✓ Database connection successful
[Migrations] ✓ Migrations completed successfully
```

Instead of the previous authentication error.

### Step 3: Test with Diagnostic Script

Run the verification script locally to test your Railway configuration:

```bash
# Make sure you're logged in to Railway
railway login

# Link to your project (if not already linked)
railway link

# Run the diagnostic script with Railway variables
railway run bun apps/core/scripts/verify-railway-config.ts
```

This will check:

- All required environment variables are set
- DATABASE_URL format is correct
- Database connection is working
- Whether you're using private networking (recommended)

## Why This Happened

Railway provides automatic environment variables for services like Postgres. When you use the reference variable syntax `${{Postgres.DATABASE_URL}}`, Railway automatically:

1. Generates the correct connection string
2. Updates it if credentials change
3. Uses private networking for better performance
4. Keeps it secure

If you set a hardcoded DATABASE_URL instead, it can become stale when:

- Postgres service is redeployed
- Database credentials are regenerated
- Postgres instance is moved

## Alternative: Manual Connection String

If you need more control, you can build the connection string manually:

```
postgresql://${{Postgres.PGUSER}}:${{Postgres.PGPASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
```

This still uses reference variables but gives you explicit control over each component.

## About the "npm cache not found" Warning

This warning is harmless and can be ignored. It appears because:

- Your project uses **Bun**, not npm
- The cleanup script checks for npm cache, which doesn't exist
- It's just informational, not an error

The cleanup script successfully cleans:

- Old temp files (✓)
- Disk space (✓)

You can ignore the npm cache warnings.

## Next Steps

1. ✅ Update DATABASE_URL in Railway Dashboard
2. ✅ Verify deployment succeeds
3. ✅ Run diagnostic script to confirm
4. ✅ Continue development

## Need Help?

If the issue persists after updating DATABASE_URL:

1. Check that your Postgres service is running in Railway
2. Verify the Postgres service is in the same project
3. Check Railway service logs for any Postgres errors
4. Try recreating the Postgres service (last resort)

## References

- Railway Variables: https://docs.railway.com/guides/variables
- Railway Postgres: https://docs.railway.com/guides/postgresql
- Railway Private Networking: https://docs.railway.com/guides/private-networking
