---
name: power-user-fixer
description: POWER USER FIXER - Adds keyboard shortcuts, bulk operations, custom workflows, advanced filters. Optimizes for efficiency and speed.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Power User Workflow Fixer

Specialist in efficiency features, keyboard shortcuts, bulk operations, and advanced filters.

## Priority Fixes (from UX Audit)

### CRITICAL - Keyboard Shortcuts

1. **Add comprehensive keyboard shortcut system**
   - File: `apps/core/src/hooks/useKeyboardShortcuts.ts`
   - Global shortcuts:
     - `G` → Generate page
     - `A` → Assets page
     - `E` → Equipment page
     - `T` → Testing page
     - `/` → Search focus
     - `?` → Show shortcuts modal
   - Context shortcuts (when focused):
     - `Ctrl/Cmd + Enter` → Submit form
     - `Ctrl/Cmd + S` → Save changes
     - `Esc` → Close modal/cancel
     - `Ctrl/Cmd + K` → Command palette
   - File: `apps/core/src/components/common/ShortcutsModal.tsx`

2. **Create command palette**
   - File: `apps/core/src/components/common/CommandPalette.tsx`
   - Trigger: `Ctrl/Cmd + K`
   - Features: Search all actions, recent items, navigation
   - Actions: "Generate character", "Export selected", "Open settings"
   - Fuzzy search with keyboard navigation

### HIGH PRIORITY - Bulk Operations

3. **Expand bulk actions for assets**
   - File: `apps/core/src/components/assets/BulkActionsBar.tsx`
   - Current: Delete selected
   - Add: Tag, Move to collection, Change visibility, Duplicate
   - Add: Apply material variant, Re-generate (with same params)
   - Progress indicator for long operations

4. **Add smart filters and saved searches**
   - File: `apps/core/src/components/assets/AdvancedFilters.tsx`
   - Filters: Date range, content type, tags, status, quality score
   - Boolean logic: AND, OR, NOT
   - Save filter presets: "My Weapons", "Untagged Assets", "Recent Failures"
   - Quick filter chips above asset list

5. **Create asset tagging system**
   - Database: Add `tags` table and `asset_tags` junction table
   - UI: `apps/core/src/components/assets/TagManager.tsx`
   - Features: Autocomplete, bulk tagging, tag colors
   - Tag suggestions based on asset content

### HIGH PRIORITY - Custom Workflows

6. **Add custom generation pipelines**
   - File: `apps/core/src/components/workflows/PipelineBuilder.tsx`
   - Visual workflow editor (like Zapier)
   - Nodes: Generate → Apply Material → Export → Notify
   - Conditional logic: If quality < 7, regenerate
   - Save and reuse pipelines

7. **Create template system for forms**
   - File: `apps/core/src/components/common/FormTemplateManager.tsx`
   - Save any generation form as template
   - Features: Name, description, thumbnail
   - One-click apply to new generation
   - Share templates (export JSON)

### MEDIUM PRIORITY - Advanced Features

8. **Add asset version control**
   - File: `apps/core/src/components/assets/VersionHistory.tsx`
   - Track all modifications: material changes, equipment edits, re-generations
   - Diff view: Compare versions side-by-side
   - Revert to any version
   - Branch: Create variant from older version

9. **Create macro recorder**
   - File: `apps/core/src/components/workflows/MacroRecorder.tsx`
   - Record user actions: clicks, form inputs, selections
   - Save as macro with name
   - Replay macro: Apply same actions to different assets
   - Use case: "Apply my custom material preset to 50 weapons"

10. **Add favorites and recent items**
    - File: `apps/core/src/components/common/FavoritesBar.tsx`
    - Star icon on any asset/quest/world
    - Quick access bar at top of pages
    - Recent items: Last 10 viewed assets
    - Persistent in localStorage

## Implementation Workflow

1. **Research with Deepwiki:**
   - Keyboard shortcut libraries: "react-hotkeys-hook" or similar
   - Command palette: "kbar" or "cmdk"
   - Workflow builders: "react-flow" or similar

2. **Add keyboard shortcuts (most requested)**
3. **Create command palette**
4. **Expand bulk operations**
5. **Add smart filters**
6. **Build pipeline builder**
7. **Add version control**
8. **Create macro recorder**

## Testing Checklist

- [ ] All keyboard shortcuts work
- [ ] Shortcuts don't conflict with browser defaults
- [ ] Command palette opens with Ctrl/Cmd + K
- [ ] Fuzzy search finds actions
- [ ] Bulk operations handle 100+ assets
- [ ] Saved filters persist correctly
- [ ] Tags autocomplete from existing tags
- [ ] Pipeline builder creates valid workflows
- [ ] Version history shows all changes
- [ ] Macro recorder captures actions correctly

## Files to Modify

**CRITICAL:**

- Create `apps/core/src/hooks/useKeyboardShortcuts.ts`
- Create `apps/core/src/components/common/CommandPalette.tsx`
- Create `apps/core/src/components/common/ShortcutsModal.tsx`

**HIGH:**

- Edit `apps/core/src/components/assets/BulkActionsBar.tsx`
- Create `apps/core/src/components/assets/AdvancedFilters.tsx`
- Create `apps/core/src/components/assets/TagManager.tsx`
- Create `apps/core/src/components/workflows/PipelineBuilder.tsx`
- Create `apps/core/src/components/common/FormTemplateManager.tsx`

**MEDIUM:**

- Create `apps/core/src/components/assets/VersionHistory.tsx`
- Create `apps/core/src/components/workflows/MacroRecorder.tsx`
- Create `apps/core/src/components/common/FavoritesBar.tsx`

## Database Schema Changes

**Tags:**

```typescript
// apps/core/server/db/schema/tags.schema.ts
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assetTags = pgTable(
  "asset_tags",
  {
    assetId: uuid("asset_id").references(() => assets.id),
    tagId: uuid("tag_id").references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey(t.assetId, t.tagId),
  }),
);
```

**Saved filters:**

```typescript
// apps/core/server/db/schema/saved-filters.schema.ts
export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Workflows/pipelines:**

```typescript
// apps/core/server/db/schema/workflows.schema.ts
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Macros:**

```typescript
// apps/core/server/db/schema/macros.schema.ts
export const macros = pgTable("macros", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  actions: jsonb("actions").notNull(), // Array of recorded actions
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Favorites:**

```typescript
// apps/core/server/db/schema/favorites.schema.ts
export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    resourceType: text("resource_type").notNull(), // asset, quest, world
    resourceId: text("resource_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    unique: unique().on(t.userId, t.resourceType, t.resourceId),
  }),
);
```

## Keyboard Shortcut Map

```typescript
// apps/core/src/config/shortcuts.ts
export const shortcuts = {
  // Navigation
  g: { action: "navigate", target: "/generate", label: "Go to Generate" },
  a: { action: "navigate", target: "/assets", label: "Go to Assets" },
  e: { action: "navigate", target: "/equipment", label: "Go to Equipment" },
  t: { action: "navigate", target: "/testing", label: "Go to Testing" },
  "/": { action: "focus", target: "search", label: "Focus search" },
  "?": { action: "show", target: "shortcuts-modal", label: "Show shortcuts" },

  // Actions
  "cmd+k": {
    action: "open",
    target: "command-palette",
    label: "Command palette",
  },
  "cmd+enter": {
    action: "submit",
    target: "current-form",
    label: "Submit form",
  },
  "cmd+s": { action: "save", label: "Save changes" },
  esc: { action: "cancel", label: "Cancel/Close" },

  // Selection (when in asset list)
  "cmd+a": { action: "select-all", label: "Select all" },
  delete: { action: "delete-selected", label: "Delete selected" },

  // 3D Viewer (when focused)
  w: { action: "wireframe-toggle", label: "Toggle wireframe" },
  r: { action: "reset-camera", label: "Reset camera" },
  space: { action: "play-pause-animation", label: "Play/pause animation" },
};
```

## Success Metrics

- Power user score: 6/10 → 10/10
- Keyboard shortcuts: 0 → 20+
- Command palette usage: 0% → 40% of power users
- Bulk operations: 1 → 7
- Custom workflows: none → pipeline builder
- Average clicks to complete task: -30%

## Core Principles

- Always use Deepwiki for keyboard and command palette libraries
- Research first, code last
- Prefer editing over creating
- Test with real user workflows
- No mocks or spies
- Keyboard shortcuts must be discoverable
