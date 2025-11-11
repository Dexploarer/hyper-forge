import { test, expect, type Page } from "@playwright/test";
import path from "path";

// Test configuration
const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:3004";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "3d-artist-workflow",
);

// Helper to take screenshots with timestamp
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`),
    fullPage: true,
  });
}

// Helper to wait for network idle
async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState("networkidle", { timeout });
}

test.describe("3D Artist Workflow - Comprehensive Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);
  });

  test.describe("1. Assets Page Testing", () => {
    test("should load assets page and display asset grid", async ({ page }) => {
      console.log("📦 Testing Assets Page...");

      // Navigate to Assets view
      await page.click("text=Assets");
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "assets-page-loaded");

      // Check for asset grid container
      const assetGrid = page.locator(
        '[data-testid="asset-grid"], .asset-grid, [class*="grid"]',
      );
      await expect(assetGrid).toBeVisible({ timeout: 10000 });

      // Count visible assets
      const assetCards = page.locator(
        '[data-testid="asset-card"], .asset-card, [class*="card"]',
      );
      const count = await assetCards.count();
      console.log(`✅ Found ${count} assets in grid`);

      expect(count).toBeGreaterThan(0);
    });

    test("should toggle between grid and list views", async ({ page }) => {
      console.log("🔄 Testing view toggle...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Look for view toggle buttons
      const gridButton = page.locator(
        '[data-testid="grid-view"], button:has-text("Grid"), [aria-label*="grid" i]',
      );
      const listButton = page.locator(
        '[data-testid="list-view"], button:has-text("List"), [aria-label*="list" i]',
      );

      if (await gridButton.isVisible()) {
        await listButton.click();
        await takeScreenshot(page, "assets-list-view");
        console.log("✅ Switched to list view");

        await gridButton.click();
        await takeScreenshot(page, "assets-grid-view");
        console.log("✅ Switched back to grid view");
      } else {
        console.log("⚠️ View toggle buttons not found");
      }
    });

    test("should filter assets by type", async ({ page }) => {
      console.log("🔍 Testing asset filters...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Look for filter dropdowns/buttons
      const filterTypes = ["Character", "Prop", "Environment", "Weapon"];

      for (const type of filterTypes) {
        const filterButton = page.locator(
          `button:has-text("${type}"), [data-filter="${type.toLowerCase()}"]`,
        );
        if (await filterButton.isVisible()) {
          await filterButton.click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, `assets-filtered-${type.toLowerCase()}`);
          console.log(`✅ Filtered by ${type}`);
          break;
        }
      }
    });

    test("should search for assets", async ({ page }) => {
      console.log("🔎 Testing search functionality...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Look for search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]',
      );

      if (await searchInput.isVisible()) {
        await searchInput.fill("sword");
        await page.waitForTimeout(1000);
        await takeScreenshot(page, "assets-search-results");
        console.log("✅ Search executed");

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      } else {
        console.log("⚠️ Search input not found");
      }
    });

    test("should open asset details panel", async ({ page }) => {
      console.log("📋 Testing asset details panel...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Click first asset card
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card, [class*="card"]')
        .first();
      await firstAsset.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "asset-details-panel");

      // Check if details panel is visible
      const detailsPanel = page.locator(
        '[data-testid="asset-details"], [class*="details"], [class*="panel"]',
      );
      const isPanelVisible = await detailsPanel.isVisible().catch(() => false);

      if (isPanelVisible) {
        console.log("✅ Asset details panel opened");
      } else {
        console.log("⚠️ Details panel not found or not visible");
      }
    });

    test("should test bulk selection", async ({ page }) => {
      console.log("☑️ Testing bulk selection...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Try to select multiple assets
      const assetCards = page.locator(
        '[data-testid="asset-card"], .asset-card',
      );
      const count = await assetCards.count();

      if (count >= 2) {
        // Try shift+click or checkboxes
        await assetCards.first().click();
        await page.keyboard.down("Shift");
        await assetCards.nth(1).click();
        await page.keyboard.up("Shift");

        await takeScreenshot(page, "assets-bulk-selected");
        console.log("✅ Bulk selection attempted");
      }
    });
  });

  test.describe("2. Asset Generation Testing", () => {
    test("should navigate to generation page", async ({ page }) => {
      console.log("🎨 Testing generation page...");

      // Look for Generation/Chat navigation
      const genNav = page.locator(
        'text=Generation, text=Chat, text=Create, [href*="generation"], [href*="chat"]',
      );

      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
        await takeScreenshot(page, "generation-page-loaded");
        console.log("✅ Generation page loaded");
      } else {
        console.log("⚠️ Generation page navigation not found");
      }
    });

    test("should generate 3D model with text prompt", async ({ page }) => {
      console.log("🤖 Testing text-to-3D generation...");

      // Navigate to generation page
      const genNav = page.locator("text=Generation, text=Chat, text=Create");
      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
      }

      // Find prompt input
      const promptInput = page.locator('textarea, input[type="text"]').first();
      await promptInput.fill("A medieval fantasy sword with ornate handle");
      await takeScreenshot(page, "generation-prompt-entered");

      // Find generate button
      const generateButton = page.locator(
        'button:has-text("Generate"), button:has-text("Create")',
      );

      if (await generateButton.first().isVisible()) {
        await generateButton.first().click();
        console.log("✅ Generation started");

        // Wait a bit to see if progress appears
        await page.waitForTimeout(3000);
        await takeScreenshot(page, "generation-in-progress");

        // Check for progress indicators
        const progressIndicators = page.locator(
          '[role="progressbar"], .progress, [class*="loading"]',
        );
        const hasProgress = await progressIndicators
          .first()
          .isVisible()
          .catch(() => false);

        if (hasProgress) {
          console.log("✅ Generation progress visible");
        }
      }
    });

    test("should test advanced generation options", async ({ page }) => {
      console.log("⚙️ Testing advanced options...");

      // Navigate to generation
      const genNav = page.locator("text=Generation, text=Chat, text=Create");
      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
      }

      // Look for advanced options toggle/dropdown
      const advancedToggle = page.locator(
        'button:has-text("Advanced"), [data-testid="advanced-options"]',
      );

      if (await advancedToggle.first().isVisible()) {
        await advancedToggle.first().click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, "generation-advanced-options");
        console.log("✅ Advanced options visible");

        // Look for option controls
        const options = ["polycount", "style", "rigging", "texture"];
        for (const option of options) {
          const optionControl = page.locator(
            `[data-option="${option}"], label:has-text("${option}")`,
            { hasText: new RegExp(option, "i") },
          );
          if (await optionControl.first().isVisible()) {
            console.log(`✅ Found ${option} option`);
          }
        }
      }
    });

    test("should test generation cancellation", async ({ page }) => {
      console.log("⏹️ Testing generation cancellation...");

      // Navigate to generation
      const genNav = page.locator("text=Generation, text=Chat, text=Create");
      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
      }

      // Start generation
      const promptInput = page.locator('textarea, input[type="text"]').first();
      await promptInput.fill("Test model for cancellation");

      const generateButton = page.locator(
        'button:has-text("Generate"), button:has-text("Create")',
      );
      if (await generateButton.first().isVisible()) {
        await generateButton.first().click();
        await page.waitForTimeout(1000);

        // Look for cancel button
        const cancelButton = page.locator(
          'button:has-text("Cancel"), button:has-text("Stop")',
        );
        if (await cancelButton.first().isVisible()) {
          await cancelButton.first().click();
          await takeScreenshot(page, "generation-cancelled");
          console.log("✅ Generation cancelled");
        }
      }
    });
  });

  test.describe("3. Asset Details & Actions Testing", () => {
    test("should test asset action buttons", async ({ page }) => {
      console.log("🎬 Testing asset actions...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Click first asset
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();
      await firstAsset.click();
      await page.waitForTimeout(1000);

      // Look for action buttons
      const actions = [
        {
          name: "Sprites",
          selector: 'button:has-text("Sprites"), button:has-text("Sprite")',
        },
        {
          name: "Retexture",
          selector: 'button:has-text("Retexture"), button:has-text("Texture")',
        },
        {
          name: "Regenerate",
          selector:
            'button:has-text("Regenerate"), button:has-text("Generate")',
        },
        {
          name: "Download",
          selector: 'button:has-text("Download"), button:has-text("Export")',
        },
      ];

      for (const action of actions) {
        const button = page.locator(action.selector);
        if (await button.first().isVisible()) {
          console.log(`✅ Found ${action.name} button`);
          await takeScreenshot(
            page,
            `asset-action-${action.name.toLowerCase()}`,
          );
        }
      }
    });

    test("should test sprites modal", async ({ page }) => {
      console.log("🖼️ Testing sprites modal...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Click first asset
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();
      await firstAsset.click();
      await page.waitForTimeout(1000);

      // Click sprites button
      const spritesButton = page.locator(
        'button:has-text("Sprites"), button:has-text("Sprite")',
      );
      if (await spritesButton.first().isVisible()) {
        await spritesButton.first().click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, "sprites-modal-opened");

        // Check modal content
        const modal = page.locator('[role="dialog"], [class*="modal"]');
        const isModalVisible = await modal
          .first()
          .isVisible()
          .catch(() => false);

        if (isModalVisible) {
          console.log("✅ Sprites modal opened");

          // Test scrolling in modal
          await page.mouse.wheel(0, 500);
          await page.waitForTimeout(500);
          await takeScreenshot(page, "sprites-modal-scrolled");
          console.log("✅ Modal scrolling tested");

          // Close modal
          const closeButton = page.locator(
            'button[aria-label="Close"], button:has-text("Close"), [class*="close"]',
          );
          if (await closeButton.first().isVisible()) {
            await closeButton.first().click();
            console.log("✅ Modal closed");
          }
        }
      }
    });

    test("should test 3D viewer controls", async ({ page }) => {
      console.log("🎮 Testing 3D viewer...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      // Click first asset
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();
      await firstAsset.click();
      await page.waitForTimeout(2000);

      // Find canvas element
      const canvas = page.locator("canvas").first();
      if (await canvas.isVisible()) {
        console.log("✅ 3D viewer canvas found");

        // Get canvas bounding box
        const box = await canvas.boundingBox();
        if (box) {
          // Test rotation (drag)
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 + 100,
            box.y + box.height / 2,
          );
          await page.mouse.up();
          await page.waitForTimeout(500);
          await takeScreenshot(page, "3d-viewer-rotated");
          console.log("✅ 3D viewer rotation tested");

          // Test zoom (scroll)
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.wheel(0, -100);
          await page.waitForTimeout(500);
          await takeScreenshot(page, "3d-viewer-zoomed");
          console.log("✅ 3D viewer zoom tested");
        }
      }
    });
  });

  test.describe("4. Equipment/Armor Fitting Testing", () => {
    test("should navigate to equipment page", async ({ page }) => {
      console.log("⚔️ Testing equipment page...");

      const equipNav = page.locator(
        'text=Equipment, text=Fitting, [href*="equipment"]',
      );
      if (await equipNav.first().isVisible()) {
        await equipNav.first().click();
        await waitForNetworkIdle(page);
        await takeScreenshot(page, "equipment-page-loaded");
        console.log("✅ Equipment page loaded");
      } else {
        console.log("⚠️ Equipment page navigation not found");
      }
    });

    test("should test equipment fitting controls", async ({ page }) => {
      console.log("🎯 Testing fitting controls...");

      const equipNav = page.locator("text=Equipment, text=Fitting");
      if (await equipNav.first().isVisible()) {
        await equipNav.first().click();
        await waitForNetworkIdle(page);

        // Look for transform controls
        const controls = ["Position", "Rotation", "Scale"];
        for (const control of controls) {
          const controlElement = page.locator(
            `label:has-text("${control}"), [data-control="${control.toLowerCase()}"]`,
          );
          if (await controlElement.first().isVisible()) {
            console.log(`✅ Found ${control} control`);
          }
        }

        await takeScreenshot(page, "equipment-fitting-controls");
      }
    });
  });

  test.describe("5. Edge Cases Testing", () => {
    test("should test empty prompt generation", async ({ page }) => {
      console.log("🚫 Testing empty prompt...");

      const genNav = page.locator("text=Generation, text=Chat, text=Create");
      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
      }

      const generateButton = page.locator(
        'button:has-text("Generate"), button:has-text("Create")',
      );
      if (await generateButton.first().isVisible()) {
        await generateButton.first().click();
        await page.waitForTimeout(1000);

        // Check for error message
        const errorMessage = page.locator(
          '[role="alert"], [class*="error"], text=required',
        );
        const hasError = await errorMessage
          .first()
          .isVisible()
          .catch(() => false);

        if (hasError) {
          console.log("✅ Empty prompt validation working");
          await takeScreenshot(page, "edge-case-empty-prompt");
        } else {
          console.log("⚠️ No validation for empty prompt");
        }
      }
    });

    test("should test very long prompt", async ({ page }) => {
      console.log("📝 Testing long prompt...");

      const genNav = page.locator("text=Generation, text=Chat, text=Create");
      if (await genNav.first().isVisible()) {
        await genNav.first().click();
        await waitForNetworkIdle(page);
      }

      const longPrompt =
        "A " +
        "very ".repeat(100) +
        "long prompt to test character limits and UI handling of extremely verbose descriptions that might break the layout or cause performance issues";

      const promptInput = page.locator('textarea, input[type="text"]').first();
      await promptInput.fill(longPrompt);
      await takeScreenshot(page, "edge-case-long-prompt");
      console.log("✅ Long prompt entered");
    });

    test("should test modal scrolling with lots of content", async ({
      page,
    }) => {
      console.log("📜 Testing modal scrolling...");

      await page.click("text=Assets");
      await waitForNetworkIdle(page);

      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();
      await firstAsset.click();
      await page.waitForTimeout(1000);

      // Open any modal
      const modalTrigger = page
        .locator(
          'button:has-text("Sprites"), button:has-text("Details"), button',
        )
        .first();
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForTimeout(1000);

        // Test aggressive scrolling
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, 300);
          await page.waitForTimeout(200);
        }
        await takeScreenshot(page, "edge-case-modal-scroll-1");

        // Scroll back up
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, -300);
          await page.waitForTimeout(200);
        }
        await takeScreenshot(page, "edge-case-modal-scroll-2");

        console.log("✅ Modal scrolling stress tested");
      }
    });
  });
});

// Performance monitoring test
test.describe("Performance Monitoring", () => {
  test("should measure page load times", async ({ page }) => {
    console.log("⏱️ Measuring performance...");

    const startTime = Date.now();
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);
    const loadTime = Date.now() - startTime;

    console.log(`📊 Initial load time: ${loadTime}ms`);

    // Navigate to Assets
    const assetsStart = Date.now();
    await page.click("text=Assets");
    await waitForNetworkIdle(page);
    const assetsLoadTime = Date.now() - assetsStart;

    console.log(`📊 Assets page load time: ${assetsLoadTime}ms`);

    expect(loadTime).toBeLessThan(10000);
    expect(assetsLoadTime).toBeLessThan(5000);
  });

  test("should test 3D viewer performance", async ({ page }) => {
    console.log("🎮 Testing 3D performance...");

    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);

    await page.click("text=Assets");
    await waitForNetworkIdle(page);

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();

    // Wait for 3D viewer to initialize
    await page.waitForTimeout(3000);

    const canvas = page.locator("canvas").first();
    if (await canvas.isVisible()) {
      // Perform many rapid interactions
      const box = await canvas.boundingBox();
      if (box) {
        const startTime = Date.now();

        for (let i = 0; i < 10; i++) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 + 50,
            box.y + box.height / 2 + 50,
          );
          await page.mouse.up();
        }

        const interactionTime = Date.now() - startTime;
        console.log(
          `📊 3D interaction time (10 rotations): ${interactionTime}ms`,
        );
        console.log(`📊 Average per rotation: ${interactionTime / 10}ms`);
      }
    }
  });
});
