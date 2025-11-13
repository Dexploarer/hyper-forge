# Railway Environment Variable Updates Required

## Main App (asset-forge)

Update these environment variables in Railway dashboard:

```bash
WEBHOOK_SECRET=6c0e398168a7d07b9468c6082314b91b29b1ffa8899f8150fb63caeace5a499a
CDN_WEBHOOK_ENABLED=true
```

## CDN Service (asset-forge-cdn)

Update these environment variables in Railway dashboard:

```bash
WEBHOOK_SECRET=6c0e398168a7d07b9468c6082314b91b29b1ffa8899f8150fb63caeace5a499a
ASSET_FORGE_API_URL=<MAIN_APP_RAILWAY_URL>
ENABLE_WEBHOOK=true
```

Replace `<MAIN_APP_RAILWAY_URL>` with actual Railway URL for main app.

## Verification

After updating, restart both services and test webhook flow:

```bash
# Upload test file to CDN
curl -X POST https://cdn-production-4e4b.up.railway.app/api/upload \
  -H "X-API-Key: ioKpjOt02sIDBtRE77Z7zDDwzmjHw6_jIHLuYZ8lzX8" \
  -F "files=@test.glb" \
  -F "directory=models"

# Check main app logs for webhook receipt
# Check database for new asset record
```
