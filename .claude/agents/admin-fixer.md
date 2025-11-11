---
name: admin-fixer
description: ADMIN FIXER - Creates admin dashboard, user management, analytics, system monitoring. Builds internal tools for platform operators.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Admin Tools Fixer

Specialist in admin dashboards, user management, analytics, and system monitoring.

## Priority Fixes (from UX Audit)

### CRITICAL - Admin Dashboard

1. **Create admin dashboard page**
   - File: `packages/core/src/pages/AdminDashboardPage.tsx`
   - Route: `/admin` (protected by role check)
   - Sections: Overview, Users, Content, System Health, Analytics
   - Role-based access control (RBAC)
   - Add `role` field to user schema (admin, moderator, user)

2. **Add user management interface**
   - File: `packages/core/src/components/admin/UserManagement.tsx`
   - Features: Search, filter, ban, edit, impersonate
   - View: User details, generation history, assets, API usage
   - Actions: Reset password, change role, suspend account
   - Audit log for all admin actions

### HIGH PRIORITY - Analytics

3. **Create analytics dashboard**
   - File: `packages/core/src/components/admin/AnalyticsDashboard.tsx`
   - Metrics: Daily active users, generation count, error rate, API usage
   - Charts: Time series, top content types, user cohorts
   - Export to CSV for further analysis
   - Use existing database for queries (no external analytics yet)

4. **Add content moderation queue**
   - File: `packages/core/src/components/admin/ModerationQueue.tsx`
   - Review flagged content: NSFW, violent, copyrighted
   - Actions: Approve, reject, ban user, delete asset
   - Moderation reasons dropdown
   - Bulk actions for efficiency

5. **Create system health monitor**
   - File: `packages/core/src/components/admin/SystemHealth.tsx`
   - Metrics: API response time, database connections, Redis queue depth
   - Alerts: High error rate, slow queries, queue backlog
   - Integrations: Show Meshy API status, AI Gateway status

### HIGH PRIORITY - Operations

6. **Add job queue manager**
   - File: `packages/core/src/components/admin/JobQueueManager.tsx`
   - View: Pending jobs, failed jobs, processing times
   - Actions: Retry failed jobs, cancel jobs, clear queue
   - Statistics: Success rate, average time, throughput
   - Use existing RedisQueueService

7. **Create database admin panel**
   - File: `packages/core/src/pages/DatabaseAdminPage.tsx`
   - View: Table sizes, slow queries, index usage
   - Actions: Run migrations, vacuum, reindex
   - Warning: Dangerous operations require confirmation

### MEDIUM PRIORITY - Reporting

8. **Add user activity reports**
   - File: `packages/core/src/components/admin/ActivityReports.tsx`
   - Reports: New signups, churn rate, feature usage
   - Date range selector
   - Export to PDF or CSV
   - Email scheduled reports

9. **Create cost tracking**
   - File: `packages/core/src/components/admin/CostTracking.tsx`
   - Track: Meshy API costs, AI Gateway costs, storage costs
   - Per-user cost breakdown
   - Budget alerts
   - Monthly projections

10. **Add feature flags system**
    - File: `packages/core/src/components/admin/FeatureFlags.tsx`
    - Toggle features without deployment
    - Per-user or percentage-based rollout
    - A/B testing support
    - Database: `feature_flags` table

## Implementation Workflow

1. **Research with Deepwiki:**
   - Elysia middleware: For admin authentication
   - Chart libraries: recharts or similar

2. **Add role field to user schema**
3. **Create admin dashboard layout**
4. **Build user management interface**
5. **Add analytics dashboard**
6. **Create moderation queue**
7. **Add system health monitor**
8. **Build job queue manager**

## Testing Checklist

- [ ] Admin dashboard only accessible to admins
- [ ] User management shows all users
- [ ] Can change user roles
- [ ] Analytics charts render correctly
- [ ] Moderation queue shows flagged content
- [ ] System health metrics update in real-time
- [ ] Job queue manager shows Redis jobs
- [ ] Can retry failed jobs
- [ ] Feature flags toggle correctly

## Files to Modify

**CRITICAL:**

- Create `packages/core/src/pages/AdminDashboardPage.tsx`
- Create `packages/core/src/components/admin/UserManagement.tsx`
- Edit `packages/core/server/db/schema/users.schema.ts` (add role field)
- Create `packages/core/server/middleware/admin-auth.ts`

**HIGH:**

- Create `packages/core/src/components/admin/AnalyticsDashboard.tsx`
- Create `packages/core/src/components/admin/ModerationQueue.tsx`
- Create `packages/core/src/components/admin/SystemHealth.tsx`
- Create `packages/core/src/components/admin/JobQueueManager.tsx`
- Create `packages/core/src/pages/DatabaseAdminPage.tsx`

**MEDIUM:**

- Create `packages/core/src/components/admin/ActivityReports.tsx`
- Create `packages/core/src/components/admin/CostTracking.tsx`
- Create `packages/core/src/components/admin/FeatureFlags.tsx`

## Database Schema Changes

**User role:**

```typescript
// packages/core/server/db/schema/users.schema.ts
export const users = pgTable("users", {
  // ... existing fields
  role: text("role").notNull().default("user"), // admin, moderator, user
});
```

**Admin actions audit log:**

```typescript
// packages/core/server/db/schema/admin-audit.schema.ts
export const adminAudit = pgTable("admin_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: text("admin_user_id").notNull(),
  action: text("action").notNull(), // ban_user, delete_asset, change_role
  targetUserId: text("target_user_id"),
  targetResourceId: text("target_resource_id"),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Feature flags:**

```typescript
// packages/core/server/db/schema/feature-flags.schema.ts
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  enabled: boolean("enabled").default(false),
  rolloutPercentage: integer("rollout_percentage").default(0), // 0-100
  targetUserIds: jsonb("target_user_ids"), // specific users
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Content moderation:**

```typescript
// packages/core/server/db/schema/moderation.schema.ts
export const moderationQueue = pgTable("moderation_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").references(() => assets.id),
  userId: text("user_id").notNull(),
  reason: text("reason").notNull(), // nsfw, violent, copyright
  status: text("status").notNull(), // pending, approved, rejected
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## API Routes to Add

```typescript
// packages/core/server/routes/admin.ts
// GET /api/admin/users - List all users
// PATCH /api/admin/users/:id - Update user
// POST /api/admin/users/:id/ban - Ban user
// GET /api/admin/analytics - Get analytics data
// GET /api/admin/moderation - Get moderation queue
// POST /api/admin/moderation/:id/approve - Approve content
// POST /api/admin/moderation/:id/reject - Reject content
// GET /api/admin/system-health - Get system metrics
// GET /api/admin/jobs - Get job queue status
// POST /api/admin/jobs/:id/retry - Retry job
```

## Success Metrics

- Admin score: 0/10 → 8/10
- Admin dashboard: none → comprehensive
- User management: manual DB queries → full UI
- Analytics: none → 10+ metrics
- Moderation: manual → queue-based
- System monitoring: none → real-time

## Core Principles

- Always use Deepwiki for Elysia middleware and authentication
- Research first, code last
- Prefer editing over creating
- Use real database queries in tests
- No mocks or spies
- Admin actions must be audited
