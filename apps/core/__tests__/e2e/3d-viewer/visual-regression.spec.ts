/**
 * 3D Viewer Visual Regression Tests
 *
 * Visual regression testing with Playwright screenshot comparison
 */

import { test, expect, type Page } from "@playwright/test";
import path from "path";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://test-frontend:3000";
const BASELINE_DIR = path.join(process.cwd(), "__tests__/e2e/baselines");

// Helper to wait for 3D viewer to load
async function wait3DViewerReady(page: Page) {
  // Wait for canvas element
  await page.waitForSelector("canvas", { timeout: 10000 });

  // Wait for WebGL context to initialize
  await page.waitForTimeout(2000);

  // Wait for any loading states to clear
  const loadingIndicator = page.locator(
    '[data-loading="true"], .loading, text=Loading',
  );
  try {
    await loadingIndicator.waitFor({ state: "hidden", timeout: 5000 });
  } catch {
    // Loading indicator might not exist, that's ok
  }
}

// Helper to take 3D viewer screenshot
async function take3DScreenshot(page: Page, name: string) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();

  return canvas.screenshot({
    path: path.join(BASELINE_DIR, `${name}.png`),
  });
}

test.describe("3D Viewer - Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");
  });

  test("empty 3D viewer baseline", async ({ page }) => {
    // Navigate to generation or assets page with 3D viewer
    const hasGenerationPage = await page
      .locator("text=Generation, text=Chat, text=Create")
      .first()
      .isVisible();

    if (hasGenerationPage) {
      await page.click("text=Generation, text=Chat, text=Create");
      await page.waitForLoadState("networkidle");
    }

    await wait3DViewerReady(page);

    // Take screenshot of empty viewer
    await page.screenshot({
      path: path.join(BASELINE_DIR, "empty-viewer.png"),
      fullPage: false,
    });
  });

  test("3D viewer with model loaded", async ({ page }) => {
    // Navigate to assets
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    // Click first asset
    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card, [class*="card"]')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Take screenshot of viewer with model
      await take3DScreenshot(page, "viewer-with-model");

      // Compare with baseline (will create baseline on first run)
      const canvas = page.locator("canvas").first();
      await expect(canvas).toHaveScreenshot("viewer-with-model.png", {
        maxDiffPixels: 1000, // Allow some variance for lighting/shadows
      });
    }
  });

  test("3D viewer - different camera angles", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      const canvas = page.locator("canvas").first();
      const box = await canvas.boundingBox();

      if (box) {
        // Front view
        await take3DScreenshot(page, "camera-front");

        // Rotate left
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 - 100,
          box.y + box.height / 2,
        );
        await page.mouse.up();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "camera-left");

        // Rotate right
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + 200,
          box.y + box.height / 2,
        );
        await page.mouse.up();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "camera-right");

        // Top view
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2,
          box.y + box.height / 2 - 150,
        );
        await page.mouse.up();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "camera-top");
      }
    }
  });

  test("3D viewer - wireframe mode", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Look for wireframe toggle
      const wireframeButton = page.locator(
        'button:has-text("Wireframe"), [data-testid="wireframe-toggle"]',
      );
      const hasWireframe = await wireframeButton
        .first()
        .isVisible()
        .catch(() => false);

      if (hasWireframe) {
        await wireframeButton.first().click();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "wireframe-mode");
      }
    }
  });

  test("3D viewer - grid and helpers", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Look for grid toggle
      const gridButton = page.locator(
        'button:has-text("Grid"), [data-testid="grid-toggle"]',
      );
      const hasGrid = await gridButton
        .first()
        .isVisible()
        .catch(() => false);

      if (hasGrid) {
        await gridButton.first().click();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "with-grid");
      }
    }
  });

  test("3D viewer - different lighting setups", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Default lighting
      await take3DScreenshot(page, "lighting-default");

      // Look for environment/lighting controls
      const lightingButton = page.locator(
        'button:has-text("Environment"), button:has-text("Lighting")',
      );
      const hasLighting = await lightingButton
        .first()
        .isVisible()
        .catch(() => false);

      if (hasLighting) {
        await lightingButton.first().click();
        await page.waitForTimeout(500);

        // Try different environments
        const environments = ["Studio", "Outdoor", "Night", "Neutral"];
        for (const env of environments) {
          const envButton = page.locator(`button:has-text("${env}")`);
          const hasEnv = await envButton
            .first()
            .isVisible()
            .catch(() => false);

          if (hasEnv) {
            await envButton.first().click();
            await page.waitForTimeout(500);
            await take3DScreenshot(page, `lighting-${env.toLowerCase()}`);
          }
        }
      }
    }
  });

  test("3D viewer - zoom levels", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      const canvas = page.locator("canvas").first();
      const box = await canvas.boundingBox();

      if (box) {
        // Default zoom
        await take3DScreenshot(page, "zoom-default");

        // Zoom in
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -500);
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "zoom-in");

        // Zoom out
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "zoom-out");
      }
    }
  });

  test("3D viewer - responsive layouts", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      await take3DScreenshot(page, "responsive-desktop");

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await take3DScreenshot(page, "responsive-tablet");

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await take3DScreenshot(page, "responsive-mobile");
    }
  });

  test("3D viewer - animation playback", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    // Look for animated asset or character
    const assetCards = page.locator('[data-testid="asset-card"], .asset-card');
    const count = await assetCards.count();

    let foundAnimatedAsset = false;

    for (let i = 0; i < Math.min(count, 5); i++) {
      await assetCards.nth(i).click();
      await wait3DViewerReady(page);

      // Check if animation controls exist
      const playButton = page.locator(
        'button:has-text("Play"), [aria-label*="play" i]',
      );
      const hasAnimation = await playButton
        .first()
        .isVisible()
        .catch(() => false);

      if (hasAnimation) {
        foundAnimatedAsset = true;

        // Take screenshots at different animation frames
        await playButton.first().click();
        await page.waitForTimeout(500);
        await take3DScreenshot(page, "animation-frame-1");

        await page.waitForTimeout(1000);
        await take3DScreenshot(page, "animation-frame-2");

        await page.waitForTimeout(1000);
        await take3DScreenshot(page, "animation-frame-3");

        break;
      }
    }

    if (foundAnimatedAsset) {
      console.log("✅ Animation screenshots captured");
    }
  });
});

test.describe("3D Viewer - Material Variations", () => {
  test("different material types", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    if (hasAssets) {
      await firstAsset.click();
      await wait3DViewerReady(page);

      // Default material
      await take3DScreenshot(page, "material-default");

      // Look for material controls
      const materialButton = page.locator('button:has-text("Material")');
      const hasMaterial = await materialButton
        .first()
        .isVisible()
        .catch(() => false);

      if (hasMaterial) {
        const materials = ["Standard", "Physical", "Toon", "Lambert"];

        for (const mat of materials) {
          const matButton = page.locator(`button:has-text("${mat}")`);
          const hasMat = await matButton
            .first()
            .isVisible()
            .catch(() => false);

          if (hasMat) {
            await matButton.first().click();
            await page.waitForTimeout(500);
            await take3DScreenshot(page, `material-${mat.toLowerCase()}`);
          }
        }
      }
    }
  });
});

test.describe("3D Viewer - Error States", () => {
  test("model loading error", async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Try to load invalid model URL (this will fail)
    await page.evaluate(() => {
      // Inject error into viewer if possible
      window.dispatchEvent(new CustomEvent("test-model-error"));
    });

    await page.waitForTimeout(1000);

    // Take screenshot of error state
    await page.screenshot({
      path: path.join(BASELINE_DIR, "error-model-load.png"),
    });
  });

  test("WebGL not supported", async ({ page }) => {
    // Disable WebGL
    await page.context().addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        type: string,
        ...args: any[]
      ) {
        if (
          type === "webgl" ||
          type === "webgl2" ||
          type === "experimental-webgl"
        ) {
          return null;
        }
        return getContext.call(this, type, ...args);
      };
    });

    await page.goto(FRONTEND_URL);
    await page.click("text=Assets");
    await page.waitForTimeout(1000);

    // Take screenshot of WebGL error
    await page.screenshot({
      path: path.join(BASELINE_DIR, "error-webgl.png"),
    });
  });
});
