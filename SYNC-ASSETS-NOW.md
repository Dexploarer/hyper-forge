# Sync CDN Assets to Database - READY TO RUN!

Your API already has an endpoint ready! Just call it once:

## Method 1: Use Your Browser (Easiest!)

1. **Open your browser DevTools** (F12)
2. **Go to Console tab**
3. **Paste this code and press Enter:**

```javascript
// Get your Privy auth token
const token = document.cookie.match(/privy-token=([^;]+)/)?.[1];

// Call the import endpoint
fetch(
  "https://hyperforge-production.up.railway.app/api/admin/import-cdn-assets",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  },
)
  .then((r) => r.json())
  .then((result) => {
    console.log("✅ SYNC COMPLETE!", result);
    alert(`Success! Imported ${result.imported} assets. Refresh the page!`);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    alert("Error: " + err.message);
  });
```

4. **Wait for the success message**
5. **Refresh your app!** All assets should now appear!

## Method 2: Use curl (Alternative)

```bash
# Get your token from browser DevTools → Application → Cookies → privy-token
TOKEN="your-privy-token-here"

curl -X POST \
  https://hyperforge-production.up.railway.app/api/admin/import-cdn-assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## What It Does:

- ✅ Scans your entire CDN
- ✅ Creates database records for all assets
- ✅ Links thumbnails and concept art
- ✅ Sets you as the owner automatically
- ✅ Skips assets already in database

## After Running:

**Just refresh your app and all your assets will appear!**
