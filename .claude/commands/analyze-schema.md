---
description: Analyze Drizzle database schema structure and relationships
allowed-tools: [Read, Grep, Glob, Bash]
---

# Asset-Forge Database Schema Analysis

Comprehensive analysis of the Drizzle database schema structure, relationships, and type safety for Asset-Forge.

## Pre-Task: Research

**MANDATORY FIRST STEP:**
Use Deepwiki to check current Drizzle ORM patterns:

```
mcp__deepwiki__ask_question repo: "drizzle-team/drizzle-orm"
Ask: "Best practices for schema design and relationships in Drizzle ORM"
```

## Schema Overview

Reading schema files:

- apps/core/server/db/schema/
- apps/core/server/db/drizzle.config.ts

## Analysis Tasks

### 1. List All Tables

Identify all table definitions in schema files:

```
Search for pgTable or table declarations
```

### 2. Table Relationships

Map foreign key relationships:

- One-to-many relationships
- Many-to-many through junction tables
- Cascading deletes and updates

### 3. Index Analysis

Check for:

- Primary keys
- Unique constraints
- Foreign key indexes
- Custom indexes for performance

### 4. Type Safety

Verify:

- All columns have explicit types
- No `any` types in schema definitions
- Proper use of Drizzle type helpers
- TypeScript inference compatibility

### 5. Schema Quality Metrics

Provide summary of:

- **Total tables**: Count of table definitions
- **Total columns**: Across all tables
- **Relationships**: Number of foreign key constraints
- **Indexes**: Custom indexes defined
- **Issues**: Missing indexes, circular dependencies, type issues

## Common Schema Issues to Check

### Missing Indexes

Tables with foreign keys should have indexes:

```typescript
// ❌ Missing index
export const users = pgTable("users", {
  factionId: text("faction_id").notNull(),
});

// ✅ With index
export const users = pgTable(
  "users",
  {
    factionId: text("faction_id").notNull(),
  },
  (table) => ({
    factionIdIdx: index("faction_id_idx").on(table.factionId),
  }),
);
```

### Circular Dependencies

Check for circular references between tables:

- Can cause migration issues
- May require deferred constraints

### Type Consistency

Ensure consistent types across related columns:

- Foreign keys match primary key types
- Timestamps use consistent format
- JSON columns properly typed

## Asset-Forge Schema

The schema defines tables for the Asset-Forge 3D asset generation platform, including:

**Core Tables:**

- `users` - Privy wallet-based user accounts
- `projects` - Asset generation projects
- `assets` - 3D asset metadata

**Collaboration:**

- `teams` - Team workspaces
- `team_members` - User-team relationships
- `team_invitations` - Pending team invites

**3D Processing:**

- `rigging_metadata` - Character rigging data
- `fitting_sessions` - Character fitting workflows

**Audit & Admin:**

- `activity_log` - User activity tracking
- `admin_whitelist` - Admin user permissions

## Asset-Forge Specific Checks

1. **Privy Auth Integration**
   - Verify `users` table has wallet address column
   - Check wallet address is indexed
   - Verify wallet metadata stored in jsonb

2. **3D Asset Storage**
   - Check asset URLs stored as text
   - Verify metadata stored in jsonb (poly count, vertices, materials)
   - Check generation parameters tracked

3. **Team Collaboration**
   - Verify foreign key constraints
   - Check for soft deletes (deleted_at column)
   - Verify activity logging

## Recommendations

Based on analysis, provide:

1. **Performance Improvements**
   - Missing indexes to add
   - Query optimization opportunities
   - Denormalization candidates

2. **Schema Enhancements**
   - Additional constraints needed
   - Type improvements
   - Better relationship modeling

3. **Migration Planning**
   - Breaking changes to avoid
   - Safe migration strategies
   - Backward compatibility considerations

## See Also

- `/migrate` - Generate and apply schema changes
- `/db:studio` - Visual database browser (Drizzle Studio)
- apps/core/server/db/schema/ - Schema source files
- apps/core/server/db/drizzle.config.ts - Drizzle configuration
