# Asset-Forge Common Workflows

## 1. Database Migration Workflow

### When to Create a Migration

- Adding new tables
- Modifying existing columns
- Adding/removing indexes
- Changing relationships
- Adding constraints

### Step-by-Step Process

1. **Research First**

   ```bash
   # Check current Drizzle ORM patterns using Deepwiki
   # Ask: "What's the current way to define schemas in Drizzle?"
   ```

2. **Edit TypeScript Schema**

   ```bash
   # Location: packages/core/server/db/schema/
   # Edit or create schema files (users.ts, assets.ts, etc.)
   ```

3. **Generate Migration**

   ```bash
   bun run db:generate
   # Drizzle Kit will prompt for migration name
   # Review generated SQL in server/db/migrations/
   ```

4. **Review Generated SQL**

   ```bash
   # Check the generated SQL file carefully
   # Ensure it matches your intentions
   # Look for potential data loss operations
   ```

5. **Apply Migration**

   ```bash
   # Development
   bun run db:migrate

   # Production (Railway)
   railway run bun run db:migrate
   ```

6. **Verify Changes**

   ```bash
   # Launch Drizzle Studio to visually inspect
   bun run db:studio
   ```

7. **Commit Both Files**
   ```bash
   git add packages/core/server/db/schema/
   git add packages/core/server/db/migrations/
   git commit -m "feat(db): add new table for X"
   ```

## 2. Adding a New API Endpoint

### Step-by-Step Process

1. **Research with Deepwiki**

   ```bash
   # Check current Elysia patterns
   # Ask about: elysiajs/elysia
   # Understand TypeBox validation patterns
   ```

2. **Define Service Layer**

   ```typescript
   // Location: packages/core/server/services/YourService.ts
   // - Define TypeBox schemas for validation
   // - Implement business logic
   // - Handle database operations via Drizzle
   // - Add error handling
   ```

3. **Create Route Handler**

   ```typescript
   // Location: packages/core/server/routes/your-route.ts
   // - Import service
   // - Add TypeBox validation
   // - Implement route handler
   // - Add Swagger documentation tags
   // - Use proper HTTP methods (GET, POST, PATCH, DELETE)
   ```

4. **Add to Main Server**

   ```typescript
   // Location: packages/core/server/api-elysia.ts
   // Import and register your route
   ```

5. **Write Tests**

   ```typescript
   // Location: packages/core/server/routes/your-route.test.ts
   // - Test happy paths
   // - Test error cases
   // - Test validation
   // - NO MOCKS - use real implementations
   ```

6. **Run Tests**

   ```bash
   bun test
   # Ensure 100% pass rate
   ```

7. **Verify Types**

   ```bash
   bun run typecheck
   ```

8. **Test Manually** (optional)
   ```bash
   # Use curl, Postman, or Swagger UI
   curl http://test-server:5555/api/your-endpoint
   ```

## 3. Adding a New 3D Component

### Step-by-Step Process

1. **Research with Deepwiki**

   ```bash
   # Check current patterns:
   # - React Three Fiber: pmndrs/react-three-fiber
   # - Drei helpers: pmndrs/drei
   # - Three.js: mrdoob/three.js
   ```

2. **Check Existing Components**

   ```bash
   # Look for similar patterns in:
   # - packages/core/src/components/shared/ThreeViewer.tsx
   # - packages/core/src/components/shared/VRMTestViewer.tsx
   ```

3. **Create Component**

   ```typescript
   // Location: packages/core/src/components/shared/YourComponent.tsx
   // - Use TypeScript with strict typing
   // - Implement proper Three.js cleanup in useEffect
   // - Add loading states
   // - Add error boundaries
   // - Use React Three Fiber hooks (useFrame, useThree, etc.)
   ```

4. **Add Proper Cleanup**

   ```typescript
   useEffect(() => {
     return () => {
       // Dispose geometries
       geometry?.dispose();
       // Dispose materials
       material?.dispose();
       // Remove from scene if needed
     };
   }, []);
   ```

5. **Test Visually**

   ```bash
   # Start dev server
   bun run dev

   # Navigate to your component
   # Check in browser at test-client:3333

   # Optional: Use Playwright for screenshots
   bun test visual-regression.test.ts
   ```

6. **Optimize Performance**

   ```typescript
   // Use React.memo for expensive components
   export const YourComponent = React.memo(({ ... }) => {
     // ...
   });
   ```

7. **Verify Types**
   ```bash
   bun run typecheck
   ```

## 4. Implementing Privy Authentication

### Step-by-Step Process

1. **Research with Deepwiki**

   ```bash
   # Check: privy-io/privy-js
   # Understand current auth patterns
   ```

2. **Use Privy Hooks**

   ```typescript
   import { usePrivy, useWallets } from "@privy-io/react-auth";

   const { authenticated, user, login, logout } = usePrivy();
   const { wallets } = useWallets();
   ```

3. **Protect Routes**

   ```typescript
   // Add auth guard to routes
   if (!authenticated) {
     return <Navigate to="/login" />;
   }
   ```

4. **Send JWT to Backend**

   ```typescript
   // Get JWT token
   const { getAccessToken } = usePrivy();
   const token = await getAccessToken();

   // Send in Authorization header
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

5. **Verify on Backend**
   ```typescript
   // Elysia middleware verifies JWT
   // See: packages/core/server/middleware/auth.ts
   ```

## 5. Git Workflow for Features

### Step-by-Step Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**

   ```bash
   # Edit files, add features, fix bugs
   ```

3. **Run Tests**

   ```bash
   bun test
   bun run typecheck
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add feature X

   - Implemented Y
   - Updated Z
   - Added tests for W"
   ```

5. **Push to Remote**

   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Create Pull Request**

   ```bash
   # Use GitHub CLI or web interface
   gh pr create --title "Add feature X" --body "Description..."
   ```

7. **Wait for Review**

   ```bash
   # Address review comments
   # Make additional commits
   git push  # Updates PR automatically
   ```

8. **Merge After Approval**
   ```bash
   # Use GitHub web interface or CLI
   gh pr merge --squash
   ```

## 6. Deploying to Railway

### Step-by-Step Process

1. **Verify Build Locally**

   ```bash
   bun run build
   bun run typecheck
   bun test
   ```

2. **Ensure Environment Variables Are Set**

   ```bash
   # In Railway dashboard:
   # - DATABASE_URL
   # - PRIVY_APP_ID
   # - PRIVY_APP_SECRET
   # - AI_GATEWAY_API_KEY
   # - MESHY_API_KEY
   ```

3. **Push to Main Branch**

   ```bash
   git push origin main
   # Railway auto-deploys on push to main
   ```

4. **Run Migrations (if needed)**

   ```bash
   railway run bun run db:migrate
   ```

5. **Monitor Deployment**

   ```bash
   railway logs
   # Check for errors
   ```

6. **Verify Deployment**

   ```bash
   # Test API endpoints
   curl https://your-app.railway.app/api/health

   # Check frontend
   # Open https://your-app.railway.app in browser
   ```

## 7. Debugging Common Issues

### TypeScript Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .turbo dist
bun install
bun run typecheck
```

### Database Connection Errors

```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Test connection
bun run db:studio
```

### 3D Model Not Loading

```bash
# Check browser console for errors
# Verify model URL is correct
# Check CORS headers if loading from external source
# Ensure model format is supported (GLB, GLTF, VRM)
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3333  # Frontend
lsof -i :5555  # Backend

# Kill process
kill -9 <PID>
```
