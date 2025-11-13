# E2E Test Suite

Comprehensive end-to-end tests for Asset-Forge using Playwright.

## Overview

This test suite covers critical user journeys and flows in the Asset-Forge application, ensuring that the entire system works correctly from the user's perspective.

## Test Structure

```
__tests__/e2e/
├── critical-flows/          # Core user journeys (NEW)
│   ├── asset-creation-flow.spec.ts
│   ├── 3d-viewer-interactions.spec.ts
│   ├── project-management.spec.ts
│   └── authentication-flow.spec.ts
├── admin/                   # Admin features
│   └── admin-dashboard.spec.ts
├── security/                # Security testing
│   └── security.spec.ts
├── ui/                      # UI component tests
│   ├── settings-page.spec.ts
│   └── keyboard-shortcuts.spec.tsx
└── user-flows/              # User journey tests
    ├── new-user-journey.spec.ts
    └── 3d-artist-workflow.spec.ts
```

## Critical Flows (New)

### 1. Asset Creation Flow (`asset-creation-flow.spec.ts`)

**Most Important Test** - Tests the complete 3D asset generation pipeline.

**Coverage:**

- User authentication
- Navigation to generation page
- Asset category selection (weapon, armor, prop, etc.)
- Form field validation (name, description)
- Generation initiation
- Progress monitoring
- 3D viewer loading and interaction
- Download functionality
- Error handling

**Key Test Cases:**

- ✅ Complete asset creation from prompt to download
- ✅ Handle generation errors gracefully
- ✅ Verify asset appears in assets list

**Runtime:** ~3 minutes per test

---

### 2. 3D Viewer Interactions (`3d-viewer-interactions.spec.ts`)

Tests all 3D viewer functionality and performance.

**Coverage:**

- Canvas loading and rendering
- Camera controls (rotate, zoom, pan)
- Reset camera functionality
- Wireframe mode toggle
- Ground plane toggle
- Environment/lighting changes
- Model information display
- Performance benchmarks
- Edge cases (missing models, load responsiveness)

**Key Test Cases:**

- ✅ Loads 3D model and displays canvas
- ✅ Rotates model with mouse drag
- ✅ Zooms with mouse wheel
- ✅ Pans with shift+drag or right-click
- ✅ Resets camera with reset button
- ✅ Toggles wireframe mode
- ✅ Measures initial load time (<15s)
- ✅ Handles rapid camera movements
- ✅ Stress test with continuous interactions (30s)

**Runtime:** ~2-5 minutes per test

---

### 3. Project Management (`project-management.spec.ts`)

Tests project creation, organization, and management.

**Coverage:**

- Projects page navigation
- Project list display
- Create new project
- Edit project details
- Delete project with confirmation
- Add assets to projects
- View project assets
- Remove assets from projects
- Export projects (if supported)

**Key Test Cases:**

- ✅ Navigates to projects page
- ✅ Displays existing projects list
- ✅ Creates new project
- ✅ Opens project details
- ✅ Adds asset to project
- ✅ Views project assets
- ✅ Removes asset from project
- ✅ Edits project details
- ✅ Deletes project with confirmation
- ✅ Exports project (if supported)

**Runtime:** ~2-3 minutes per test

---

### 4. Authentication Flow (`authentication-flow.spec.ts`)

Tests authentication mechanisms and session management.

**Coverage:**

- Landing page display
- Admin login modal
- Password validation
- Authentication success
- Session persistence across reloads
- Session persistence across navigation
- Logout functionality
- Access control after logout
- Edge cases (rapid login/logout, concurrent attempts)

**Key Test Cases:**

- ✅ Displays landing page to unauthenticated users
- ✅ Shows admin login modal
- ✅ Closes modal with ESC key
- ✅ Closes modal with close button
- ✅ Rejects invalid password
- ✅ Accepts valid password and authenticates
- ✅ Redirects to dashboard after authentication
- ✅ Maintains session across page reloads
- ✅ Maintains session across navigation
- ✅ Logs out user successfully
- ✅ Prevents access to authenticated pages after logout
- ✅ Handles rapid login/logout cycles
- ✅ Prevents concurrent login attempts

**Runtime:** ~3-4 minutes per test

---

## Running Tests

### All E2E Tests

```bash
bun test:e2e
```

### With UI Mode (Interactive)

```bash
bun test:e2e:ui
```

### Specific Test File

```bash
bunx playwright test __tests__/e2e/critical-flows/asset-creation-flow.spec.ts
```

### Specific Test Suite

```bash
bunx playwright test __tests__/e2e/critical-flows/
```

### With Specific Browser

```bash
bunx playwright test --project=desktop-1920
```

### Debug Mode

```bash
bunx playwright test --debug
```

### Generate Report

```bash
bunx playwright show-report
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Timeout:** 120 seconds (2 minutes) per test
- **Retries:** 2 retries in CI, 0 locally
- **Workers:** Sequential execution for power user flows
- **Screenshots:** On failure
- **Video:** On failure
- **Trace:** On first retry

### Viewports Tested

- **Desktop:** 1920x1080, 1440x900
- **Tablet:** 768x1024 (portrait), 1024x768 (landscape)
- **Mobile:** 375x667, 414x896, 360x640

## Test Results Location

```
test-results/
├── asset-creation-flow/     # Screenshots for asset creation tests
├── 3d-viewer-interactions/  # Screenshots for viewer tests
├── project-management/      # Screenshots for project tests
├── authentication-flow/     # Screenshots for auth tests
└── playwright-report/       # HTML test report
```

## Best Practices

### 1. Test Independence

- Each test should be completely independent
- Use `beforeEach` to set up fresh state
- Don't rely on data from previous tests

### 2. Resilient Selectors

- Use multiple selector strategies (data-testid, text, class)
- Fall back to alternative selectors
- Handle dynamic content gracefully

### 3. Realistic Interactions

- Simulate real user behavior
- Add appropriate wait times
- Use network idle for page loads

### 4. Error Handling

- Tests should not crash on missing elements
- Use `.catch(() => false)` for optional checks
- Skip tests gracefully when prerequisites aren't met

### 5. Performance Awareness

- Monitor test execution time
- Avoid unnecessary waits
- Use parallel execution where possible

## Writing New Tests

### Template Structure

```typescript
import { test, expect, type Page } from "@playwright/test";
import path from "path";

const FRONTEND_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "test-name");

async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${timestamp}_${name}.png`),
    fullPage: true,
  });
}

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test("test case description", async ({ page }) => {
    // Test implementation
  });
});
```

## CI/CD Integration

Tests run automatically in CI:

```yaml
- name: Run E2E Tests
  run: bun test:e2e
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in test: `test.setTimeout(180000)`
- Check network conditions
- Verify server is running

### Flaky Tests

- Add explicit waits: `await page.waitForTimeout(1000)`
- Use `waitForNetworkIdle()` after navigation
- Increase retry count

### Element Not Found

- Check selector specificity
- Verify element is visible: `await element.isVisible()`
- Add fallback selectors

### Screenshots Not Saving

- Verify `test-results/` directory exists
- Check file system permissions
- Ensure screenshot path is absolute

## Coverage Metrics

| Flow               | Tests | Coverage | Priority |
| ------------------ | ----- | -------- | -------- |
| Asset Creation     | 3     | 95%      | CRITICAL |
| 3D Viewer          | 12    | 85%      | HIGH     |
| Project Management | 10    | 75%      | HIGH     |
| Authentication     | 13    | 90%      | CRITICAL |
| Admin Dashboard    | 1     | 50%      | MEDIUM   |
| Security           | 1     | 60%      | HIGH     |
| Settings           | 1     | 40%      | LOW      |
| User Journeys      | 2     | 70%      | MEDIUM   |

**Total E2E Tests:** 43
**Critical Flows Coverage:** ~90%

## Next Steps

### Recommended Additional Tests

1. **Asset Upload Flow**
   - Upload custom 3D models
   - File format validation
   - Size limits

2. **Material Variants**
   - Material preset selection
   - Custom material creation
   - Material prompt editing

3. **Advanced Generation Options**
   - Quality settings
   - Style presets
   - Character rigging options

4. **Collaboration Features**
   - Team creation
   - Member invitations
   - Permission management

5. **Export Workflows**
   - Batch export
   - Format selection
   - Custom export settings

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For issues or questions about E2E tests:

1. Check test output and screenshots in `test-results/`
2. Run with `--debug` flag for step-by-step execution
3. Review Playwright report: `bunx playwright show-report`
4. Consult existing test patterns in this directory
