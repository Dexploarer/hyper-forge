# Development with Production Services

This guide explains how to run the frontend dev server locally while connecting to production services (CDN, Database, Qdrant) for testing with real data.

## Setup Options

### Option 1: Local Frontend + Production Backend (Simplest)

Point your local frontend directly to the production backend API.

1. **Set `VITE_API_URL` in your `.env` file:**
   ```bash
   # Point frontend to production backend
   VITE_API_URL=https://your-production-backend.up.railway.app
   ```

2. **Run only the frontend dev server:**
   ```bash
   bun run dev:frontend
   ```

**Pros:**
- Simplest setup
- No local backend needed
- Fast frontend development

**Cons:**
- Can't debug backend code locally
- All API calls go to production
- Must be careful not to break production data

### Option 2: Local Frontend + Local Backend with Production Services (Recommended)

Run both frontend and backend locally, but connect backend to production services.

1. **Create a `.env` file with production service URLs:**
   ```bash
   # Frontend - use local backend via Vite proxy (default)
   # VITE_API_URL=  # Leave empty to use Vite proxy to localhost:3004

   # Backend - connect to production services
   DATABASE_URL=postgresql://user:pass@prod-db.railway.app:5432/dbname
   CDN_URL=https://your-cdn-service.up.railway.app
   CDN_API_KEY=your-production-cdn-api-key
   CDN_WS_URL=wss://your-cdn-service.up.railway.app/ws/events
   QDRANT_URL=https://your-qdrant-service.up.railway.app
   QDRANT_API_KEY=your-production-qdrant-api-key

   # Authentication (use production Privy app)
   PRIVY_APP_ID=your-production-privy-app-id
   PRIVY_APP_SECRET=your-production-privy-app-secret

   # AI Services (use your keys)
   AI_GATEWAY_API_KEY=your-ai-gateway-key
   # or
   OPENAI_API_KEY=your-openai-key

   # Other required vars
   API_KEY_ENCRYPTION_SECRET=your-encryption-secret
   ```

2. **Run both frontend and backend:**
   ```bash
   bun run dev
   # or separately:
   bun run dev:frontend  # Terminal 1
   bun run dev:backend   # Terminal 2
   ```

**Pros:**
- Can debug backend code locally
- Vite proxy works normally
- Uses production data/services
- Safe - can test without affecting production

**Cons:**
- Need to run both frontend and backend
- Backend connects to production services (be careful with writes)

## Getting Production Service URLs

### From Railway Dashboard

1. **Database URL:**
   - Go to your Railway project
   - Find the PostgreSQL service
   - Copy the `DATABASE_URL` from the Variables tab

2. **CDN URL:**
   - Find your CDN service (asset-forge-cdn)
   - Copy the public URL from the service settings
   - Get `CDN_API_KEY` from the Variables tab

3. **Qdrant URL:**
   - Find your Qdrant service
   - Copy the public URL
   - Get `QDRANT_API_KEY` from the Variables tab

### Using Railway CLI

```bash
# List all services
railway status

# Get environment variables for a service
railway variables --service your-service-name
```

## Important Notes

### ⚠️ Safety Considerations

1. **Read-Only Testing:**
   - Be careful with write operations (creating/updating/deleting)
   - Consider using a test user account
   - Don't run migrations against production database

2. **Authentication:**
   - Use production Privy app credentials
   - Your local dev will authenticate with production Privy
   - Users logged in locally will be real production users

3. **Rate Limits:**
   - Production services may have rate limits
   - Be mindful of API usage during development

### 🔧 Development Workflow

1. **Start with Option 2** (local backend + prod services) for full debugging
2. **Switch to Option 1** (prod backend) for quick frontend-only changes
3. **Always test locally** before deploying to production

### 🐛 Troubleshooting

**Frontend can't connect to backend:**
- Check `VITE_API_URL` is set correctly (or empty for proxy)
- Ensure backend is running on port 3004
- Check Vite proxy config in `vite.config.ts`

**Backend can't connect to production services:**
- Verify all service URLs are correct
- Check API keys are valid
- Ensure your IP isn't blocked by Railway firewall
- Check service health in Railway dashboard

**CORS errors:**
- Production backend should allow your localhost origin
- Check `FRONTEND_URL` in production backend env vars
- Add `http://localhost:3000` to allowed origins if needed

## Example .env File

```bash
# ============================================
# Development with Production Services
# ============================================

# Frontend - use local backend (Vite proxy)
# VITE_API_URL=  # Empty = use Vite proxy to localhost:3004

# Backend - Production Services
DATABASE_URL=postgresql://postgres:password@prod-db.railway.internal:5432/railway
CDN_URL=https://cdn-production-4e4b.up.railway.app
CDN_API_KEY=your-cdn-api-key-here
CDN_WS_URL=wss://cdn-production-4e4b.up.railway.app/ws/events
QDRANT_URL=https://qdrant-production.up.railway.app
QDRANT_API_KEY=your-qdrant-api-key-here

# Authentication
PRIVY_APP_ID=clx1234567890abcdef
PRIVY_APP_SECRET=your-privy-secret

# AI Services
AI_GATEWAY_API_KEY=your-ai-gateway-key

# Security
API_KEY_ENCRYPTION_SECRET=your-32-char-encryption-secret

# Server
API_PORT=3004
NODE_ENV=development
```

## Quick Start

1. Copy production service URLs from Railway
2. Create `.env` file with production service URLs
3. Run `bun run dev`
4. Open `http://localhost:3000`
5. Test your changes with real production data! 🎉

