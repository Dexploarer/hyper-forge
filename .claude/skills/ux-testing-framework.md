---
name: ux-testing-framework
description: Comprehensive UX testing framework using Playwright for all user personas. Validates onboarding, workflows, and critical paths. No mocks allowed.
tools: Read, Write, Edit, Bash
---

# UX Testing Framework Skill

Comprehensive testing methodology for validating user experience improvements across all personas.

## Core Principles

1. **NO MOCKS OR SPIES** - All tests use real implementations
2. **Mini-Worlds** - Each test creates its own isolated environment
3. **Real Data** - Use actual API calls, database operations, 3D files
4. **Visual Validation** - Test both data AND visual output
5. **100% Pass Rate** - All tests must pass before deployment

## Test Structure

### Location

All UX tests live in: `packages/core/tests/ux/`

### File Naming

- `new-user.spec.ts` - New user onboarding tests
- `3d-artist.spec.ts` - 3D artist workflow tests
- `game-designer.spec.ts` - Game designer workflow tests
- `developer.spec.ts` - Developer/technical user tests
- `admin.spec.ts` - Admin dashboard tests
- `power-user.spec.ts` - Power user efficiency tests

### Test Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("[Persona] - [Workflow]", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create mini-world
    // - Clear database (test user only)
    // - Seed required data
    // - Navigate to starting page
  });

  test.afterEach(async ({ page }) => {
    // Teardown: Clean up resources
    // - Delete test assets
    // - Clear test user data
  });

  test("[Critical path action]", async ({ page }) => {
    // 1. Setup specific to this test
    // 2. Perform user actions
    // 3. Assert data changes
    // 4. Assert visual changes
    // 5. Assert no errors
  });
});
```

## Persona Test Plans

### 1. New User Tests (`new-user.spec.ts`)

```typescript
test.describe("New User - First Experience", () => {
  test("CRITICAL: Landing page does not expose hardcoded password", async ({
    page,
  }) => {
    await page.goto("/");
    const pageContent = await page.content();
    expect(pageContent).not.toContain("admin123");
    expect(pageContent).not.toContain("const success = await login");
  });

  test("Can sign in with Privy and see onboarding tour", async ({ page }) => {
    // Real Privy authentication flow
    await page.goto("/");
    await page.click("text=Sign In");
    // Wait for Privy modal
    // Complete auth
    // Verify onboarding tour appears
    await expect(page.locator('[data-testid="onboarding-tour"]')).toBeVisible();
  });

  test("Can complete first asset generation with help tooltips", async ({
    page,
  }) => {
    // Navigate to generate page
    // Check help tooltips are present
    await expect(
      page.locator('[data-testid="help-tooltip"]').first(),
    ).toBeVisible();
    // Fill form with example prompt
    // Submit generation
    // Wait for result
    // Verify asset appears in asset list
  });

  test("Can access documentation from topbar", async ({ page }) => {
    await page.goto("/generate");
    await page.click("text=Docs");
    await expect(page).toHaveURL(/.*docs/);
    // Verify getting started guide loads
    await expect(page.locator('h1:has-text("Getting Started")')).toBeVisible();
  });
});
```

### 2. 3D Artist Tests (`3d-artist.spec.ts`)

```typescript
test.describe("3D Artist - Asset Workflow", () => {
  test("Can batch export multiple assets as ZIP", async ({ page }) => {
    // Setup: Create 3 test assets
    // Navigate to assets page
    // Select all 3 assets
    await page.click('[data-testid="select-all"]');
    // Click batch export
    await page.click("text=Export Selected as ZIP");
    // Wait for download
    const download = await page.waitForEvent("download");
    const path = await download.path();
    // Verify ZIP contains 3 GLB files + metadata
    // Use JSZip to extract and validate
  });

  test("Animation switching is instant (no reload)", async ({ page }) => {
    // Setup: Create asset with 3 animations
    // Navigate to asset viewer
    // Record initial load time
    const startTime = Date.now();
    await page.selectOption('[data-testid="animation-select"]', "run");
    await page.waitForSelector('[data-testid="animation-playing"]');
    const switchTime = Date.now() - startTime;
    // Should be < 500ms (no GLB reload)
    expect(switchTime).toBeLessThan(500);
  });

  test("Floating toolbar is always visible during equipment fitting", async ({
    page,
  }) => {
    // Navigate to equipment page
    // Scroll viewport
    // Verify toolbar position is fixed
    const toolbar = page.locator('[data-testid="floating-toolbar"]');
    await expect(toolbar).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, 1000));
    await expect(toolbar).toBeVisible();
  });

  test("Material preview thumbnails render correctly", async ({ page }) => {
    // Navigate to material variants card
    // Wait for thumbnails to load
    const thumbnails = page.locator('[data-testid="material-thumbnail"]');
    await expect(thumbnails).toHaveCount(5); // 5 presets
    // Verify each has image data
    for (let i = 0; i < 5; i++) {
      const src = await thumbnails.nth(i).getAttribute("src");
      expect(src).toMatch(/^data:image/);
    }
  });
});
```

### 3. Game Designer Tests (`game-designer.spec.ts`)

```typescript
test.describe("Game Designer - Content Creation", () => {
  test("Can view generation history and revert to previous version", async ({
    page,
  }) => {
    // Setup: Generate asset 3 times with different prompts
    // Navigate to generation history
    await page.click('[data-testid="generation-history"]');
    // Verify 3 revisions shown
    await expect(page.locator('[data-testid="revision-item"]')).toHaveCount(3);
    // Click revert on first revision
    await page.locator('[data-testid="revision-item"]').first().click();
    await page.click("text=Revert to this version");
    // Verify current asset matches first revision
  });

  test("Can create quest using visual builder", async ({ page }) => {
    // Navigate to quest generation
    await page.click("text=Visual Builder");
    // Add nodes: Start → Objective → Combat → End
    await page.click('[data-testid="add-node-objective"]');
    await page.click('[data-testid="add-node-combat"]');
    // Connect nodes
    await page.dragAndDrop(
      '[data-testid="node-start"]',
      '[data-testid="node-objective"]',
    );
    // Generate quest
    await page.click("text=Generate Quest");
    // Verify quest structure matches builder
  });

  test("Can use world template to create new world", async ({ page }) => {
    // Navigate to world config
    await page.click("text=Use Template");
    // Select Fantasy RPG template
    await page.click("text=Fantasy RPG");
    // Verify all fields populated
    await expect(page.locator("#world-theme")).toHaveValue("Fantasy");
    await expect(page.locator("#factions")).not.toBeEmpty();
    // Generate world
    await page.click("text=Generate World");
    // Verify world created with template settings
  });

  test("AI swarm test shows real-time visualization", async ({ page }) => {
    // Setup: Create test quest
    // Navigate to swarm testing
    // Start test with 10 AI agents
    await page.click("text=Start Test");
    // Wait for visualization to appear
    await expect(
      page.locator('[data-testid="live-test-viewer"]'),
    ).toBeVisible();
    // Verify agents are moving (check canvas updates)
    // Verify metrics update in real-time
  });
});
```

### 4. Developer Tests (`developer.spec.ts`)

```typescript
test.describe("Developer - API Integration", () => {
  test("Can access Swagger docs at /api/docs", async ({ page }) => {
    await page.goto("/api/docs");
    // Verify Swagger UI loads
    await expect(page.locator(".swagger-ui")).toBeVisible();
    // Verify endpoints listed
    await expect(page.locator("text=/api/generate")).toBeVisible();
  });

  test("Can generate asset using SDK", async ({ page }) => {
    // Run test script that uses SDK
    // Verify asset created in database
    // Verify API key authentication works
  });

  test("Webhook fires on generation complete", async ({ page }) => {
    // Setup: Create webhook URL (test endpoint)
    // Navigate to webhooks page
    await page.fill("#webhook-url", "https://test.webhook.site/abc123");
    await page.check("text=generation_complete");
    await page.click("text=Save Webhook");
    // Trigger generation
    // Wait for webhook to fire (check test endpoint)
    // Verify payload contains correct data
  });

  test("Batch API handles 100 requests", async ({ page }) => {
    // Create batch request with 100 items
    // Submit to /api/batch/generate
    // Poll status endpoint
    // Verify all 100 complete
    // Verify no rate limiting errors
  });
});
```

### 5. Admin Tests (`admin.spec.ts`)

```typescript
test.describe("Admin - Platform Management", () => {
  test("Admin dashboard only accessible to admin role", async ({ page }) => {
    // Setup: Create regular user
    // Login as regular user
    await page.goto("/admin");
    // Verify 403 or redirect
    await expect(page).toHaveURL(/.*\/generate/); // Redirected

    // Logout, login as admin
    // Navigate to admin dashboard
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
  });

  test("Can ban user and verify assets hidden", async ({ page }) => {
    // Setup: Create test user with assets
    // Navigate to user management
    await page.fill("#user-search", "test@example.com");
    await page.click('[data-testid="user-row"]');
    await page.click("text=Ban User");
    // Verify user banned
    // Check assets no longer appear in public list
  });

  test("Analytics dashboard shows correct metrics", async ({ page }) => {
    // Setup: Create test data (10 users, 50 generations)
    // Navigate to analytics
    await page.goto("/admin/analytics");
    // Verify metrics match test data
    await expect(page.locator('[data-testid="total-users"]')).toContainText(
      "10",
    );
    await expect(
      page.locator('[data-testid="total-generations"]'),
    ).toContainText("50");
  });

  test("Can retry failed jobs from queue manager", async ({ page }) => {
    // Setup: Create failed job in Redis
    // Navigate to job queue manager
    await page.goto("/admin/jobs");
    // Find failed job
    await page.click('[data-testid="failed-jobs-tab"]');
    // Click retry
    await page.click('[data-testid="retry-job"]');
    // Verify job moves to processing
    await expect(page.locator('[data-testid="processing-jobs"]')).toContainText(
      "1",
    );
  });
});
```

### 6. Power User Tests (`power-user.spec.ts`)

```typescript
test.describe("Power User - Efficiency Features", () => {
  test("Keyboard shortcuts work correctly", async ({ page }) => {
    await page.goto("/");
    // Press 'g' to navigate to generate
    await page.keyboard.press("g");
    await expect(page).toHaveURL(/.*\/generate/);
    // Press 'a' to navigate to assets
    await page.keyboard.press("a");
    await expect(page).toHaveURL(/.*\/assets/);
    // Press '/' to focus search
    await page.keyboard.press("/");
    await expect(page.locator("#search-input")).toBeFocused();
  });

  test("Command palette opens and finds actions", async ({ page }) => {
    await page.goto("/");
    // Open command palette
    await page.keyboard.press("Meta+k"); // Cmd+K on Mac
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
    // Type to search
    await page.fill('[data-testid="command-search"]', "generate");
    // Verify results
    await expect(page.locator("text=Generate Character")).toBeVisible();
  });

  test("Can save and apply smart filter", async ({ page }) => {
    // Navigate to assets
    // Open advanced filters
    await page.click("text=Advanced Filters");
    // Configure filters
    await page.selectOption("#content-type", "character");
    await page.fill("#tags", "weapon");
    // Save filter
    await page.click("text=Save Filter");
    await page.fill("#filter-name", "My Weapons");
    await page.click("text=Save");
    // Clear filters
    await page.click("text=Clear All");
    // Apply saved filter
    await page.selectOption("#saved-filters", "My Weapons");
    // Verify filters applied
    await expect(page.locator("#content-type")).toHaveValue("character");
  });

  test("Pipeline builder creates and executes workflow", async ({ page }) => {
    // Navigate to pipelines
    await page.goto("/workflows/pipelines");
    // Create new pipeline
    await page.click("text=New Pipeline");
    // Add nodes
    await page.click('[data-testid="add-generate-node"]');
    await page.click('[data-testid="add-material-node"]');
    await page.click('[data-testid="add-export-node"]');
    // Connect nodes
    // Save pipeline
    await page.fill("#pipeline-name", "Auto Character Pipeline");
    await page.click("text=Save");
    // Execute pipeline
    await page.click("text=Run Pipeline");
    // Verify pipeline executes all steps
    await page.waitForSelector("text=Pipeline Complete");
  });
});
```

## Running Tests

### Commands

```bash
# Run all UX tests
bun test tests/ux/

# Run specific persona
bun test tests/ux/new-user.spec.ts

# Run in headed mode (see browser)
bun test tests/ux/ --headed

# Run with debug
bun test tests/ux/ --debug

# Generate test report
bun test tests/ux/ --reporter=html
```

### Configuration

```typescript
// packages/core/playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ux",
  timeout: 60000, // 60s per test
  retries: 0, // No retries - tests must be reliable
  workers: 1, // Serial execution for database isolation
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
```

## Test Data Management

### Test Database

```bash
# Create test database
createdb asset_forge_test

# Run migrations
DATABASE_URL=postgresql://localhost/asset_forge_test bun run db:migrate
```

### Test User Creation

```typescript
// tests/ux/helpers/createTestUser.ts
export async function createTestUser(role: "user" | "admin" = "user") {
  const userId = `test-${Date.now()}`;
  await db.insert(users).values({
    id: userId,
    email: `${userId}@test.com`,
    role,
  });
  return userId;
}
```

### Test Asset Creation

```typescript
// tests/ux/helpers/createTestAsset.ts
export async function createTestAsset(userId: string) {
  const assetId = crypto.randomUUID();
  await db.insert(assets).values({
    id: assetId,
    userId,
    name: "Test Asset",
    contentType: "character",
    glbUrl: "/test-assets/character.glb",
  });
  return assetId;
}
```

## Visual Regression Testing

### Screenshots

```typescript
test("Asset viewer renders correctly", async ({ page }) => {
  await page.goto("/assets/test-asset-id");
  await page.waitForSelector('[data-testid="three-viewer"]');
  // Wait for 3D model to load
  await page.waitForTimeout(2000);
  // Compare screenshot
  await expect(page).toHaveScreenshot("asset-viewer.png");
});
```

### Canvas Testing

```typescript
test("Material preview renders spheres", async ({ page }) => {
  await page.goto("/generate");
  const canvas = page.locator('canvas[data-testid="material-preview"]');
  // Get canvas image data
  const imageData = await canvas.screenshot();
  // Verify not blank (has pixel data)
  expect(imageData.length).toBeGreaterThan(1000);
});
```

## Performance Testing

### Load Time

```typescript
test("Asset list loads in under 2 seconds", async ({ page }) => {
  const startTime = Date.now();
  await page.goto("/assets");
  await page.waitForSelector('[data-testid="asset-grid"]');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

### Memory Leaks

```typescript
test("3D viewer does not leak memory", async ({ page }) => {
  await page.goto("/assets/test-asset-id");
  // Get initial memory
  const initialMemory = await page.evaluate(
    () => performance.memory.usedJSHeapSize,
  );
  // Open and close viewer 10 times
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="close-viewer"]');
    await page.click('[data-testid="open-viewer"]');
  }
  // Get final memory
  const finalMemory = await page.evaluate(
    () => performance.memory.usedJSHeapSize,
  );
  // Should not grow by more than 10MB
  expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
});
```

## Success Criteria

### Before Deployment

- [ ] All persona tests pass (100% pass rate)
- [ ] No hardcoded credentials exposed
- [ ] All critical paths validated
- [ ] Performance benchmarks met
- [ ] No visual regressions
- [ ] No memory leaks detected

### After Deployment

- Monitor real user metrics
- Compare with test predictions
- Iterate on failing tests
- Add new tests for bug fixes

## Core Principles (Repeated)

1. **NO MOCKS** - Real implementations only
2. **Mini-Worlds** - Isolated test environments
3. **Real Data** - Actual API calls and files
4. **Visual Validation** - Test what users see
5. **100% Pass Rate** - All tests must pass

This testing framework ensures that all UX improvements are validated before deployment and that user experience remains consistent across all personas.
