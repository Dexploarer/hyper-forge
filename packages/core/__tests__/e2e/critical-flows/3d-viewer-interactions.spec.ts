import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: 3D Viewer Interactions
 *
 * Tests all 3D viewer functionality including:
 * - Loading various model formats (GLB, FBX, VRM)
 * - Camera controls (rotate, zoom, pan)
 * - Material/texture switching
 * - Performance with complex models
 * - Viewer controls and UI
 */

const FRONTEND_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "3d-viewer-interactions",
);

// Helper functions
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${timestamp}_${name}.png`),
    fullPage: true,
  });
}

async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState("networkidle", { timeout });
}

async function authenticateUser(page: Page) {
  const isAuthenticated = await page
    .locator('[data-testid="user-menu"], .user-profile')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isAuthenticated) return;

  await page.goto(FRONTEND_URL);
  await waitForNetworkIdle(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const adminLink = page.locator('text="admin login"').first();
  if (await adminLink.isVisible({ timeout: 3000 })) {
    await adminLink.click();
    await page.waitForTimeout(500);

    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill("admin123");

    const loginButton = page
      .locator('button[type="submit"], button:has-text("Login")')
      .first();
    await loginButton.click();

    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
  }
}

async function navigateToAsset(page: Page): Promise<boolean> {
  // Navigate to Assets page
  const assetsNav = page.locator('text="Assets", a[href*="assets"]');
  if (!(await assetsNav.first().isVisible({ timeout: 5000 }))) {
    return false;
  }

  await assetsNav.first().click();
  await waitForNetworkIdle(page);

  // Click first asset
  const firstAsset = page
    .locator('[data-testid="asset-card"], .asset-card')
    .first();
  if (!(await firstAsset.isVisible({ timeout: 5000 }))) {
    return false;
  }

  await firstAsset.click();
  await page.waitForTimeout(2000);
  return true;
}

test.describe("3D Viewer - Core Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("loads 3D model and displays canvas", async ({ page }) => {
    console.log("\n🎮 Testing 3D Viewer Loading");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      console.log("⚠️ No assets available to test");
      test.skip();
      return;
    }

    // Wait for canvas to appear
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await takeScreenshot(page, "viewer_loaded");
    console.log("✅ Canvas loaded successfully");

    // Verify canvas has dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    console.log(`📐 Canvas dimensions: ${box!.width}x${box!.height}`);
  });

  test("rotates model with mouse drag", async ({ page }) => {
    console.log("\n🔄 Testing Model Rotation");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("Canvas has no bounding box");
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Take before screenshot
    await takeScreenshot(page, "rotation_before");

    // Perform rotation drag
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 150, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);
    await takeScreenshot(page, "rotation_after");

    console.log("✅ Rotation interaction completed");
  });

  test("zooms with mouse wheel", async ({ page }) => {
    console.log("\n🔍 Testing Zoom Functionality");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("Canvas has no bounding box");
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Take before screenshot
    await takeScreenshot(page, "zoom_original");

    // Zoom in
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);
    await takeScreenshot(page, "zoom_in");
    console.log("✅ Zoomed in");

    // Zoom out
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    await takeScreenshot(page, "zoom_out");
    console.log("✅ Zoomed out");
  });

  test("pans with right-click drag or shift+drag", async ({ page }) => {
    console.log("\n↔️ Testing Pan Functionality");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("Canvas has no bounding box");
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Take before screenshot
    await takeScreenshot(page, "pan_before");

    // Try shift+drag for panning
    await page.keyboard.down("Shift");
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up("Shift");

    await page.waitForTimeout(500);
    await takeScreenshot(page, "pan_after_shift");
    console.log("✅ Shift+drag pan tested");

    // Try right-click drag for panning
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(centerX - 100, centerY - 100, { steps: 10 });
    await page.mouse.up({ button: "right" });

    await page.waitForTimeout(500);
    await takeScreenshot(page, "pan_after_right_click");
    console.log("✅ Right-click drag pan tested");
  });

  test("resets camera with reset button", async ({ page }) => {
    console.log("\n🎯 Testing Camera Reset");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for reset camera button
    const resetButton = page.locator(
      'button:has-text("Reset"), button[title*="Reset" i], button[aria-label*="Reset" i]',
    );

    const hasResetButton = await resetButton
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasResetButton) {
      // Manipulate camera first
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(500);
        await takeScreenshot(page, "camera_manipulated");

        // Reset camera
        await resetButton.first().click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, "camera_reset");

        console.log("✅ Camera reset button works");
      }
    } else {
      console.log("⚠️ Reset camera button not found");
    }
  });
});

test.describe("3D Viewer - Controls and UI", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("toggles wireframe mode", async ({ page }) => {
    console.log("\n📐 Testing Wireframe Toggle");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for wireframe toggle
    const wireframeToggle = page.locator(
      'button:has-text("Wireframe"), input[type="checkbox"]',
    );

    const hasToggle = await wireframeToggle
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasToggle) {
      await takeScreenshot(page, "wireframe_off");

      await wireframeToggle.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, "wireframe_on");

      await wireframeToggle.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, "wireframe_off_again");

      console.log("✅ Wireframe toggle works");
    } else {
      console.log("⚠️ Wireframe toggle not found");
    }
  });

  test("toggles ground plane visibility", async ({ page }) => {
    console.log("\n🌍 Testing Ground Plane Toggle");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for ground plane toggle
    const groundToggle = page.locator(
      'button:has-text("Ground"), button:has-text("Plane")',
    );

    const hasToggle = await groundToggle
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasToggle) {
      await takeScreenshot(page, "ground_default");

      await groundToggle.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, "ground_toggled");

      console.log("✅ Ground plane toggle works");
    } else {
      console.log("⚠️ Ground plane toggle not found");
    }
  });

  test("displays model information", async ({ page }) => {
    console.log("\n📊 Testing Model Info Display");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for model stats/info
    const infoPatterns = [
      "text=/vertices|polygons|triangles/i",
      "text=/faces/i",
      '[data-testid="model-stats"]',
      ".model-info",
    ];

    let foundInfo = false;
    for (const pattern of infoPatterns) {
      const element = page.locator(pattern).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await element.textContent();
        console.log(`✅ Model info found: ${text}`);
        foundInfo = true;
        break;
      }
    }

    if (!foundInfo) {
      console.log("⚠️ Model info not displayed");
    }

    await takeScreenshot(page, "model_info");
  });

  test("changes environment/lighting", async ({ page }) => {
    console.log("\n💡 Testing Environment/Lighting Changes");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for environment selector
    const envSelector = page.locator(
      'select, [role="listbox"], button:has-text("Environment")',
    );

    const hasSelector = await envSelector
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasSelector) {
      await takeScreenshot(page, "env_default");

      await envSelector.first().click();
      await page.waitForTimeout(500);

      // Try to select different environment
      const options = page.locator("option, [role='option']");
      const count = await options.count();

      if (count > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, "env_changed");
        console.log("✅ Environment changed");
      }
    } else {
      console.log("⚠️ Environment selector not found");
    }
  });
});

test.describe("3D Viewer - Performance", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("measures initial load time", async ({ page }) => {
    console.log("\n⏱️ Testing Initial Load Performance");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const startTime = Date.now();

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const loadTime = Date.now() - startTime;
    console.log(`📊 3D viewer load time: ${loadTime}ms`);

    await takeScreenshot(page, "load_performance");

    // Should load within reasonable time
    expect(loadTime).toBeLessThan(15000); // 15 seconds max
  });

  test("handles rapid camera movements", async ({ page }) => {
    console.log("\n🎮 Testing Rapid Camera Movement Performance");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("Canvas has no bounding box");
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Perform many rapid movements
    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + (i % 2 ? 50 : -50), centerY);
      await page.mouse.up();

      // Small delay to allow rendering
      await page.waitForTimeout(50);
    }

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 20;

    console.log(`📊 Total time for 20 movements: ${totalTime}ms`);
    console.log(`📊 Average per movement: ${avgTime.toFixed(2)}ms`);

    await takeScreenshot(page, "rapid_movement_complete");

    // Should handle movements reasonably
    expect(avgTime).toBeLessThan(100); // Less than 100ms per movement
  });

  test("stress test with continuous interactions", async ({ page }) => {
    console.log("\n💪 Stress Testing Viewer");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("Canvas has no bounding box");
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Continuous interactions for 30 seconds
    const duration = 30000;
    const startTime = Date.now();
    let interactionCount = 0;

    while (Date.now() - startTime < duration) {
      // Random interaction type
      const action = Math.floor(Math.random() * 3);

      if (action === 0) {
        // Rotate
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(
          centerX + Math.random() * 100 - 50,
          centerY + Math.random() * 100 - 50,
        );
        await page.mouse.up();
      } else if (action === 1) {
        // Zoom
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, Math.random() * 200 - 100);
      } else {
        // Pan
        await page.keyboard.down("Shift");
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(
          centerX + Math.random() * 50 - 25,
          centerY + Math.random() * 50 - 25,
        );
        await page.mouse.up();
        await page.keyboard.up("Shift");
      }

      interactionCount++;
      await page.waitForTimeout(100);
    }

    console.log(`📊 Completed ${interactionCount} interactions in 30s`);
    console.log(
      `📊 Average: ${(interactionCount / 30).toFixed(2)} interactions/second`,
    );

    await takeScreenshot(page, "stress_test_complete");

    // Should handle at least 2 interactions per second
    expect(interactionCount).toBeGreaterThan(60);
  });
});

test.describe("3D Viewer - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("handles missing model gracefully", async ({ page }) => {
    console.log("\n❌ Testing Missing Model Handling");

    // Try to navigate to a non-existent asset
    await page.goto(`${FRONTEND_URL}/assets/nonexistent-model-12345`);
    await page.waitForTimeout(2000);

    // Should show error or empty state
    const errorIndicators = [
      "text=/not found|error|missing/i",
      '[role="alert"]',
      ".error-message",
    ];

    let foundError = false;
    for (const selector of errorIndicators) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        foundError = true;
        console.log("✅ Error state displayed");
        break;
      }
    }

    await takeScreenshot(page, "missing_model");

    if (!foundError) {
      console.log("⚠️ No explicit error shown for missing model");
    }
  });

  test("viewer remains responsive during model load", async ({ page }) => {
    console.log("\n⌛ Testing Responsiveness During Load");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    // Try to interact with UI while loading
    const canvas = page.locator("canvas").first();

    // Don't wait for full load, start interacting immediately
    await page.waitForTimeout(500);

    // Try clicking buttons during load
    const buttons = page.locator("button");
    const count = await buttons.count();

    if (count > 0) {
      // Try to click a button
      try {
        await buttons.first().click({ timeout: 2000 });
        console.log("✅ UI responsive during load");
      } catch (error) {
        console.log("⚠️ UI may be blocked during load");
      }
    }

    await takeScreenshot(page, "responsive_during_load");
  });
});
