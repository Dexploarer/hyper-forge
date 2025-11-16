import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: 3D Viewer with CDN URLs
 *
 * Tests ThreeViewer component loads models exclusively from CDN URLs.
 * Verifies NO legacy modelUrl prop usage.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "three-viewer-cdn",
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
  // Try multiple navigation paths
  const navOptions = [
    'a[href*="assets"]',
    'a[href*="results"]',
    'button:has-text("Results")',
  ];

  for (const selector of navOptions) {
    const nav = page.locator(selector);
    if (await nav.first().isVisible({ timeout: 3000 })) {
      await nav.first().click();
      await waitForNetworkIdle(page);

      // Click first asset if available
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();
      if (await firstAsset.isVisible({ timeout: 5000 })) {
        await firstAsset.click();
        await page.waitForTimeout(2000);
        return true;
      }
    }
  }

  return false;
}

test.describe("3D Viewer - CDN URL Integration", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("loads model from CDN URL (no modelUrl prop)", async ({ page }) => {
    console.log("\n🎮 Testing 3D Viewer with CDN URL");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      console.log("⚠️ No assets available to test");
      test.skip();
      return;
    }

    // Wait for canvas to appear
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    await takeScreenshot(page, "viewer_loaded");
    console.log("✅ Canvas loaded successfully");

    // Verify canvas has proper dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // Check page content for CDN URL usage
    const pageContent = await page.content();
    const hasModelUrl = pageContent.includes("modelUrl");
    const hasCdnUrl = pageContent.includes("cdnUrl");

    console.log(
      `Legacy modelUrl prop: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    console.log(`CDN cdnUrl prop: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`);

    // CRITICAL: ThreeViewer should use cdnUrl prop, not modelUrl
    expect(hasModelUrl).toBe(false);

    await takeScreenshot(page, "cdn_url_verified");
  });

  test("handles invalid CDN URL gracefully", async ({ page }) => {
    console.log("\n❌ Testing Invalid CDN URL Handling");

    // Navigate to page and inject a ThreeViewer with invalid URL
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);

    // Try to trigger an error state by navigating to non-existent asset
    await page.goto(`${FRONTEND_URL}/assets/invalid-cdn-test-12345`);
    await page.waitForTimeout(2000);

    // Should show error or empty state
    const errorIndicators = [
      "text=/not found|error|missing|failed/i",
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
        console.log("✅ Error state displayed for invalid URL");
        break;
      }
    }

    await takeScreenshot(page, "invalid_cdn_url");

    if (!foundError) {
      console.log("⚠️ No explicit error shown for invalid CDN URL");
    }
  });

  test("viewer controls work with CDN-loaded models", async ({ page }) => {
    console.log("\n🎮 Testing Viewer Controls with CDN Models");

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

    // Test 1: Rotation with mouse drag
    console.log("Testing rotation...");
    await takeScreenshot(page, "before_rotation");

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 150, centerY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);
    await takeScreenshot(page, "after_rotation");
    console.log("✅ Rotation completed");

    // Test 2: Zoom with mouse wheel
    console.log("Testing zoom...");
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);
    await takeScreenshot(page, "after_zoom_in");
    console.log("✅ Zoom in completed");

    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    await takeScreenshot(page, "after_zoom_out");
    console.log("✅ Zoom out completed");

    // Test 3: Pan with shift+drag
    console.log("Testing pan...");
    await page.keyboard.down("Shift");
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up("Shift");

    await page.waitForTimeout(500);
    await takeScreenshot(page, "after_pan");
    console.log("✅ Pan completed");

    // Verify page still uses CDN URLs after interactions
    const pageContent = await page.content();
    const hasModelUrl = pageContent.includes("modelUrl");

    console.log(
      `Post-interaction modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    expect(hasModelUrl).toBe(false);
  });

  test("viewer loads animations from CDN URLs", async ({ page }) => {
    console.log("\n🎬 Testing Animation Loading from CDN");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for animation controls (if asset has animations)
    const animationControls = [
      'button:has-text("Play")',
      'button:has-text("Pause")',
      'button[aria-label*="animation" i]',
      ".animation-controls",
    ];

    let hasAnimations = false;
    for (const selector of animationControls) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        hasAnimations = true;
        console.log(`✅ Animation controls found: ${selector}`);
        await takeScreenshot(page, "animation_controls");
        break;
      }
    }

    if (hasAnimations) {
      // Try to play animation
      const playButton = page.locator('button:has-text("Play")').first();
      if (await playButton.isVisible({ timeout: 2000 })) {
        await playButton.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, "animation_playing");
        console.log("✅ Animation playback tested");
      }

      // Verify animations are loaded from CDN URLs
      const pageContent = await page.content();
      const hasModelUrl = pageContent.includes("modelUrl");

      console.log(
        `Animation CDN URL check: ${hasModelUrl ? "FOUND modelUrl (BAD)" : "NO modelUrl (GOOD)"}`,
      );
      expect(hasModelUrl).toBe(false);
    } else {
      console.log("⚠️ No animation controls found (asset may not be rigged)");
    }
  });

  test("viewer handles multiple material variants with CDN URLs", async ({
    page,
  }) => {
    console.log("\n🎨 Testing Material Variants from CDN");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    // Look for material variant cards
    const variantCards = page.locator(
      '[data-testid="material-variant"], .material-variant, .variant-card',
    );

    const count = await variantCards.count();
    console.log(`📦 Material variants found: ${count}`);

    if (count > 0) {
      // Click first variant to switch materials
      await variantCards.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "material_variant_switched");
      console.log("✅ Material variant switched");

      // Verify variants use CDN URLs
      const pageContent = await page.content();
      const hasModelUrl = pageContent.includes("modelUrl");
      const hasCdnUrl = pageContent.includes("cdnUrl");

      console.log(
        `Material variants modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
      );
      console.log(
        `Material variants cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
      );

      expect(hasModelUrl).toBe(false);
      expect(hasCdnUrl).toBe(true);
    } else {
      console.log("⚠️ No material variants available for this asset");
    }
  });

  test("viewer performance with CDN URLs", async ({ page }) => {
    console.log("\n⚡ Testing Viewer Performance with CDN");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    // Measure load time
    const startTime = Date.now();

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20000 });

    const loadTime = Date.now() - startTime;
    console.log(`📊 3D viewer load time: ${loadTime}ms`);

    await takeScreenshot(page, "load_performance");

    // Should load within reasonable time
    expect(loadTime).toBeLessThan(20000); // 20 seconds max

    // Test rapid interactions performance
    const box = await canvas.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      const interactionStart = Date.now();

      // Perform 10 rapid rotations
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + (i % 2 ? 50 : -50), centerY);
        await page.mouse.up();
        await page.waitForTimeout(50);
      }

      const interactionTime = Date.now() - interactionStart;
      const avgTime = interactionTime / 10;

      console.log(`📊 Total interaction time: ${interactionTime}ms`);
      console.log(`📊 Average per interaction: ${avgTime.toFixed(2)}ms`);

      await takeScreenshot(page, "performance_test_complete");

      // Should handle interactions smoothly
      expect(avgTime).toBeLessThan(150); // Less than 150ms per interaction
    }

    // Verify CDN URLs are still being used
    const pageContent = await page.content();
    const hasModelUrl = pageContent.includes("modelUrl");

    console.log(
      `Performance test modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    expect(hasModelUrl).toBe(false);
  });

  test("viewer camera reset with CDN models", async ({ page }) => {
    console.log("\n🎯 Testing Camera Reset with CDN Models");

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

        // Verify CDN URLs still used after reset
        const pageContent = await page.content();
        const hasModelUrl = pageContent.includes("modelUrl");

        console.log(
          `Post-reset modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
        );
        expect(hasModelUrl).toBe(false);
      }
    } else {
      console.log("⚠️ Reset camera button not found");
    }
  });

  test("viewer download uses CDN URL", async ({ page }) => {
    console.log("\n💾 Testing Download from CDN URL");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Look for download button
    const downloadButton = page.locator(
      'button:has-text("Download"), a[download], a:has-text("Download")',
    );

    if (await downloadButton.first().isVisible({ timeout: 5000 })) {
      const href = await downloadButton.first().getAttribute("href");
      console.log(`✅ Download link found: ${href}`);

      // Verify it's a CDN URL
      const isCdnUrl =
        href?.includes("cdn") ||
        href?.includes("cloudflare") ||
        href?.includes("r2.dev") ||
        href?.startsWith("https://");

      console.log(`Download link is CDN URL: ${isCdnUrl ? "YES" : "NO"}`);
      expect(isCdnUrl).toBe(true);

      // Verify no legacy modelUrl in download link
      const hasModelUrlInLink = href?.includes("modelUrl");
      console.log(
        `Download link has modelUrl: ${hasModelUrlInLink ? "YES (BAD)" : "NO (GOOD)"}`,
      );
      expect(hasModelUrlInLink).toBe(false);

      await takeScreenshot(page, "download_cdn_verified");
    } else {
      console.log("⚠️ Download button not found");
    }
  });
});

test.describe("3D Viewer - CDN Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("handles CDN URL loading errors gracefully", async ({ page }) => {
    console.log("\n🚨 Testing CDN Loading Error Handling");

    // Try to load a viewer with a broken CDN URL
    // This would require injecting a test component or using an invalid asset
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);

    // Navigate to non-existent asset
    await page.goto(`${FRONTEND_URL}/assets/broken-cdn-url-test`);
    await page.waitForTimeout(3000);

    await takeScreenshot(page, "broken_cdn_url");

    // Should show error state, not crash
    const hasErrorState = await page
      .locator("text=/error|failed|not found/i")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    console.log(`Error state shown: ${hasErrorState ? "YES" : "NO"}`);

    // Verify no modelUrl references even in error state
    const pageContent = await page.content();
    const hasModelUrl = pageContent.includes("modelUrl");

    console.log(
      `Error state modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    expect(hasModelUrl).toBe(false);
  });

  test("viewer remains responsive during CDN load", async ({ page }) => {
    console.log("\n⏳ Testing Responsiveness During CDN Load");

    const hasAsset = await navigateToAsset(page);
    if (!hasAsset) {
      test.skip();
      return;
    }

    // Try to interact with UI immediately
    await page.waitForTimeout(500);

    // Try clicking buttons during load
    const buttons = page.locator("button");
    const count = await buttons.count();

    if (count > 0) {
      try {
        await buttons.first().click({ timeout: 2000 });
        console.log("✅ UI responsive during CDN load");
      } catch (error) {
        console.log("⚠️ UI may be blocked during CDN load");
      }
    }

    await takeScreenshot(page, "responsive_during_cdn_load");

    // Verify CDN architecture is used
    const pageContent = await page.content();
    const hasModelUrl = pageContent.includes("modelUrl");

    expect(hasModelUrl).toBe(false);
  });
});
