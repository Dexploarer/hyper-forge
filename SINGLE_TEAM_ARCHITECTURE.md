# Single-Team Application Architecture

## ⚠️ CRITICAL: This is a Single-Team Application

**Hyper-Forge is designed and configured for SINGLE-TEAM use ONLY.**

This means:

- **NO access control** - All users can access all data and features
- **NO team isolation** - There is only ONE team/organization
- **NO multi-tenancy** - All data is shared among all users
- **Optional authentication** - Auth is for tracking only, not security

## What This Means in Practice

### 1. Authentication is Optional and Non-Restrictive

- Users can access most features **without logging in**
- Authentication is used only to **track who performed actions** (audit trail)
- No routes enforce permission checks based on ownership or roles
- API endpoints accept both authenticated and anonymous requests

**Example**: Anyone can view, create, edit, or delete any asset, project, or content.

### 2. No Role-Based Access Control

The `role` field in the user table (`admin` vs `member`) is **organizational only**:

- It does NOT restrict access to any features or data
- It does NOT affect what users can see or do
- The "Admin Dashboard" is accessible to ALL users
- User management, system settings, etc. are open to everyone

**Deprecated**: `requireAdminGuard` in `auth.plugin.ts` no longer checks roles.

### 3. Ownership Fields Are Organizational Only

Database fields like `ownerId`, `createdBy`, `projectId` are kept for:

- **Organization**: Grouping related items together
- **Audit trail**: Tracking who created what
- **UI display**: Showing creator names

They are **NOT used for**:

- Access control
- Permission checking
- Data filtering based on user

### 4. Everything Defaults to Public

- `isPublic` defaults to `true` on projects and content
- `visibility` defaults to `"public"` on assets
- These fields have no effect on who can access the data
- They may be displayed in UI but don't restrict access

## Architecture Changes Made

### Backend Changes

#### Removed

- ✅ **PermissionService** (`apps/core/server/services/PermissionService.ts`) - Completely deleted
- ✅ All permission checks from routes (projects, assets, etc.)
- ✅ Role-based route guards (requireAdminGuard now deprecated)

#### Updated

- ✅ **Projects routes** (`apps/core/server/routes/projects.ts`)
  - Removed all `permissionService.canView/canEdit/canDelete` checks
  - Changed user type from `AuthUser` to `user?: AuthUser` (optional)
  - Updated documentation to say "Auth optional - single-team app"

- ✅ **Auth plugin** (`apps/core/server/plugins/auth.plugin.ts`)
  - Deprecated `requireAdminGuard` with clear warnings
  - Updated header comments to explain single-team architecture
  - No longer checks `user.role === "admin"`

- ✅ **Admin routes** (`apps/core/server/routes/admin.ts`)
  - Added header comment explaining they're open to all users
  - Role management kept for organizational purposes only

- ✅ **Database schema** (`apps/core/server/db/schema/users.schema.ts`)
  - Added comprehensive warning comment at top of file
  - Explains that ownership fields are organizational only

### Frontend Changes

#### Updated

- ✅ **Sidebar** (`apps/core/src/components/layout/Sidebar.tsx`)
  - Removed `isAdmin` role check (lines 321-326)
  - Admin dashboard always visible to all users
  - Renamed "Admin Dashboard" to "System Dashboard"

- ✅ **Mobile Menu** (`apps/core/src/components/layout/MobileMenuDrawer.tsx`)
  - Removed `isAdmin` role check (lines 93-96)
  - All navigation items visible to all users

## What Was NOT Changed

### Kept for Organizational Purposes

These fields/features remain but have **no access control effect**:

1. **User roles** (`admin`, `member`)
   - Still stored in database
   - Still displayed in UI
   - Can still be changed via admin dashboard
   - **Effect**: None - purely organizational label

2. **Ownership fields** (`ownerId`, `createdBy`, `projectId`)
   - Still stored in database
   - Still used for grouping related items
   - Still displayed in UI ("Created by...")
   - **Effect**: None - no filtering or restrictions

3. **Visibility fields** (`isPublic`, `visibility`)
   - Still stored in database
   - Still have default values
   - May still be displayed in UI
   - **Effect**: None - everything is accessible regardless

4. **Admin dashboard and user management**
   - Still exists at `/admin-dashboard`
   - Still allows role changes, user deletion, etc.
   - Now labeled "System Dashboard"
   - **Effect**: Available to all users, not just admins

## Security Implications

### What This Architecture Provides

- ✅ Collaborative team environment with full transparency
- ✅ Simple audit trail (who did what)
- ✅ No permission denied errors or access friction
- ✅ Perfect for small teams, internal tools, prototypes

### What This Architecture Does NOT Provide

- ❌ Multi-tenancy (multiple teams/organizations)
- ❌ Data isolation between users
- ❌ Access control or permission management
- ❌ Privacy for individual users' work
- ❌ Protection against malicious team members

### When to Use This Architecture

✅ **Good for:**

- Small teams (2-20 people) who trust each other
- Internal company tools
- Prototypes and MVPs
- Collaborative creative environments
- When transparency and sharing are paramount

❌ **NOT good for:**

- SaaS products with multiple organizations
- Platforms with untrusted users
- Applications requiring data privacy
- Enterprise products with strict access control
- Anything requiring SOC2, HIPAA, or similar compliance

## Migration Path: If You Need Multi-Team Support

If you later need proper multi-team support with access control:

### 1. Add Team/Organization Tables

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- admin, member, viewer
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### 2. Add Organization Foreign Keys

Add `organization_id` to all major tables:

- `users.organization_id`
- `projects.organization_id`
- `assets.organization_id`
- `content.organization_id`

### 3. Re-implement PermissionService

Create a new PermissionService that checks:

- User is a member of the organization
- User has appropriate role for the action
- Resource belongs to user's organization

### 4. Add Middleware to All Routes

```typescript
// Example: Require organization membership
app.use(requireOrgMembership).get("/api/projects", async ({ user, query }) => {
  // Filter by user's organization
  const projects = await projectService.getOrgProjects(user.organizationId);
  return projects;
});
```

### 5. Make Authentication Required

- Remove optional auth (`user?: AuthUser` → `user: AuthUser`)
- Add authentication checks to all routes
- Remove anonymous access

### 6. Update All Queries

Every database query must filter by `organization_id`:

```typescript
// Before (single-team)
const projects = await db.select().from(projects);

// After (multi-team)
const projects = await db
  .select()
  .from(projects)
  .where(eq(projects.organizationId, user.organizationId));
```

## Testing in Single-Team Mode

### What to Test

- ✅ All features work without authentication
- ✅ All features work with any user (no permission errors)
- ✅ Audit logs track user actions correctly
- ✅ UI displays creator/owner info correctly

### What NOT to Test

- ❌ Access control (there isn't any)
- ❌ Permission denied scenarios (they don't exist)
- ❌ Data isolation (it doesn't exist)
- ❌ Role-based feature restrictions (roles don't restrict)

## Key Files Modified

### Backend

- `apps/core/server/services/PermissionService.ts` - **DELETED**
- `apps/core/server/services/index.ts` - Removed PermissionService export
- `apps/core/server/routes/projects.ts` - Removed all permission checks
- `apps/core/server/routes/admin.ts` - Added single-team comments
- `apps/core/server/plugins/auth.plugin.ts` - Deprecated requireAdminGuard
- `apps/core/server/db/schema/users.schema.ts` - Added architecture warning

### Frontend

- `apps/core/src/components/layout/Sidebar.tsx` - Removed role-based nav filtering
- `apps/core/src/components/layout/MobileMenuDrawer.tsx` - Removed role-based nav filtering

## FAQ

### Q: Why keep the role field if it doesn't do anything?

**A**: For organizational purposes and easy labeling. If you later add multi-team support, the infrastructure is already there.

### Q: Can I make certain routes require authentication?

**A**: Technically yes (use `requireAuthGuard`), but this defeats the single-team purpose. If you need auth requirements, you probably need multi-team architecture.

### Q: What if I want some basic privacy between users?

**A**: You need multi-team architecture. Single-team = full transparency.

### Q: Is this secure?

**A**: It depends on your threat model:

- ✅ Secure against external threats (with proper network/app security)
- ❌ NOT secure against team members (they have full access by design)
- ✅ Secure for trusted internal teams
- ❌ NOT secure for untrusted users or public access

### Q: Can I selectively add permission checks to some routes?

**A**: This creates an inconsistent security model. Either commit fully to single-team (no checks anywhere) or multi-team (checks everywhere).

## Conclusion

This application is **intentionally designed** as a single-team collaborative platform with:

- No access control
- Full transparency
- Optional authentication for tracking only

This is **not a bug** or security oversight - it's the architecture.

If you need multi-team support with proper access control, follow the migration path above to implement a complete multi-tenancy system.

---

**Last Updated**: 2025-11-21
**Architecture Version**: Single-Team v1.0
