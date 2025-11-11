#!/usr/bin/env bun

import { chromium, type Page, type Browser } from "playwright";
import path from "path";
import fs from "fs";

const FRONTEND_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "3d-artist-manual",
);

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  screenshot?: string;
}

const results: TestResult[] = [];

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch (e) {
    console.log("⚠️ Network idle timeout (continuing anyway)");
  }
}

async function test1_AssetsPageLoad(page: Page) {
  console.log("\n📦 TEST 1: Assets Page Loading");
  console.log("=".repeat(50));

  try {
    // Navigate to Assets
    await page.click("text=Assets", { timeout: 5000 }).catch(() => {
      console.log("⚠️ No Assets link found, might already be on Assets page");
    });
    await waitForNetworkIdle(page);
    const screenshot = await takeScreenshot(page, "assets-page-loaded");

    // Check for asset grid
    const assetCards = page.locator(
      '[data-testid="asset-card"], .asset-card, [class*="card"]',
    );
    const count = await assetCards.count();

    console.log(`✅ Found ${count} asset cards`);

    if (count > 0) {
      results.push({
        name: "Assets Page Load",
        status: "pass",
        message: `Successfully loaded ${count} assets`,
        screenshot,
      });
    } else {
      results.push({
        name: "Assets Page Load",
        status: "warning",
        message: "Page loaded but no assets found",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "assets-page-error");
    results.push({
      name: "Assets Page Load",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test2_AssetDetailsPanel(page: Page) {
  console.log("\n📋 TEST 2: Asset Details Panel");
  console.log("=".repeat(50));

  try {
    // Click first asset
    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card, [class*="card"]')
      .first();
    const assetCount = await page
      .locator('[data-testid="asset-card"], .asset-card, [class*="card"]')
      .count();

    if (assetCount === 0) {
      results.push({
        name: "Asset Details Panel",
        status: "warning",
        message: "No assets available to test",
      });
      return;
    }

    await firstAsset.click();
    await page.waitForTimeout(2000);
    const screenshot = await takeScreenshot(page, "asset-details-opened");

    // Check for various detail elements
    const detailsPanel = page.locator(
      '[data-testid="asset-details"], [class*="details"], aside, [role="complementary"]',
    );
    const isPanelVisible = await detailsPanel
      .first()
      .isVisible()
      .catch(() => false);

    if (isPanelVisible) {
      console.log("✅ Asset details panel is visible");
      results.push({
        name: "Asset Details Panel",
        status: "pass",
        message: "Details panel opened successfully",
        screenshot,
      });
    } else {
      console.log("⚠️ Details panel might be in a modal or different location");
      results.push({
        name: "Asset Details Panel",
        status: "warning",
        message: "Details panel not found in expected location",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "asset-details-error");
    results.push({
      name: "Asset Details Panel",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test3_AssetActionButtons(page: Page) {
  console.log("\n🎬 TEST 3: Asset Action Buttons");
  console.log("=".repeat(50));

  try {
    const actions = [
      "Sprites",
      "Retexture",
      "Regenerate",
      "Download",
      "Export",
    ];
    const foundActions: string[] = [];

    for (const action of actions) {
      const button = page.locator(`button:has-text("${action}")`).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        foundActions.push(action);
        console.log(`✅ Found ${action} button`);
      }
    }

    const screenshot = await takeScreenshot(page, "asset-action-buttons");

    if (foundActions.length > 0) {
      results.push({
        name: "Asset Action Buttons",
        status: "pass",
        message: `Found action buttons: ${foundActions.join(", ")}`,
        screenshot,
      });
    } else {
      results.push({
        name: "Asset Action Buttons",
        status: "warning",
        message: "No standard action buttons found",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "asset-actions-error");
    results.push({
      name: "Asset Action Buttons",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test4_ThreeDViewer(page: Page) {
  console.log("\n🎮 TEST 4: 3D Viewer Controls");
  console.log("=".repeat(50));

  try {
    // Look for canvas element
    const canvas = page.locator("canvas").first();
    const isCanvasVisible = await canvas
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isCanvasVisible) {
      results.push({
        name: "3D Viewer",
        status: "warning",
        message: "3D viewer canvas not found",
      });
      return;
    }

    console.log("✅ 3D viewer canvas found");

    // Test interaction
    const box = await canvas.boundingBox();
    if (box) {
      // Test rotation (drag)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2 + 100,
        box.y + box.height / 2 + 50,
      );
      await page.mouse.up();
      await page.waitForTimeout(500);

      console.log("✅ Rotation test completed");

      // Test zoom (scroll)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);

      console.log("✅ Zoom test completed");

      const screenshot = await takeScreenshot(page, "3d-viewer-tested");

      results.push({
        name: "3D Viewer",
        status: "pass",
        message: "3D viewer interaction successful (rotation & zoom)",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "3d-viewer-error");
    results.push({
      name: "3D Viewer",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test5_SpritesModal(page: Page) {
  console.log("\n🖼️ TEST 5: Sprites Modal");
  console.log("=".repeat(50));

  try {
    // Look for Sprites button
    const spritesButton = page
      .locator('button:has-text("Sprites"), button:has-text("Sprite")')
      .first();
    const isVisible = await spritesButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!isVisible) {
      results.push({
        name: "Sprites Modal",
        status: "warning",
        message: "Sprites button not found",
      });
      return;
    }

    // Click sprites button
    await spritesButton.click();
    await page.waitForTimeout(1000);

    // Check for modal
    const modal = page.locator(
      '[role="dialog"], [class*="modal"], [class*="Modal"]',
    );
    const isModalVisible = await modal
      .first()
      .isVisible()
      .catch(() => false);

    if (isModalVisible) {
      console.log("✅ Sprites modal opened");

      // Test scrolling
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(300);

      console.log("✅ Modal scrolling tested");

      const screenshot = await takeScreenshot(page, "sprites-modal-opened");

      // Try to close modal
      const closeButton = page
        .locator(
          'button[aria-label*="lose" i], button:has-text("Close"), [class*="close"]',
        )
        .first();
      await closeButton.click().catch(() => {
        // If no close button, try ESC
        page.keyboard.press("Escape");
      });

      results.push({
        name: "Sprites Modal",
        status: "pass",
        message: "Sprites modal opened and scrolling works",
        screenshot,
      });
    } else {
      const screenshot = await takeScreenshot(page, "sprites-modal-not-found");
      results.push({
        name: "Sprites Modal",
        status: "warning",
        message: "Modal not visible after clicking button",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "sprites-modal-error");
    results.push({
      name: "Sprites Modal",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test6_GenerationPage(page: Page) {
  console.log("\n🎨 TEST 6: Generation/Chat Page");
  console.log("=".repeat(50));

  try {
    // Navigate to generation page
    const genNav = page.locator(
      'text=Generation, text=Chat, text=Create, [href*="generation"], [href*="chat"]',
    );
    const navExists = await genNav
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!navExists) {
      results.push({
        name: "Generation Page",
        status: "warning",
        message: "Generation/Chat navigation not found",
      });
      return;
    }

    await genNav.first().click();
    await waitForNetworkIdle(page);

    const screenshot = await takeScreenshot(page, "generation-page-loaded");

    // Look for prompt input
    const promptInput = page.locator('textarea, input[type="text"]').first();
    const hasInput = await promptInput.isVisible().catch(() => false);

    if (hasInput) {
      console.log("✅ Prompt input found");
      results.push({
        name: "Generation Page",
        status: "pass",
        message: "Generation page loaded with prompt input",
        screenshot,
      });
    } else {
      results.push({
        name: "Generation Page",
        status: "warning",
        message: "Generation page loaded but no prompt input found",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "generation-page-error");
    results.push({
      name: "Generation Page",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test7_SearchFilter(page: Page) {
  console.log("\n🔍 TEST 7: Search and Filters");
  console.log("=".repeat(50));

  try {
    // Navigate back to Assets
    await page.click("text=Assets").catch(() => {});
    await waitForNetworkIdle(page);

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]',
    );
    const hasSearch = await searchInput
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    // Look for filter buttons
    const filterTypes = ["Character", "Prop", "Environment", "Weapon", "All"];
    const foundFilters: string[] = [];

    for (const type of filterTypes) {
      const filterButton = page.locator(`button:has-text("${type}")`).first();
      const isVisible = await filterButton.isVisible().catch(() => false);
      if (isVisible) {
        foundFilters.push(type);
      }
    }

    const screenshot = await takeScreenshot(page, "search-filters");

    const features: string[] = [];
    if (hasSearch) features.push("Search");
    if (foundFilters.length > 0)
      features.push(`Filters: ${foundFilters.join(", ")}`);

    if (features.length > 0) {
      console.log(`✅ Found: ${features.join(" | ")}`);
      results.push({
        name: "Search & Filters",
        status: "pass",
        message: `Available: ${features.join(", ")}`,
        screenshot,
      });
    } else {
      results.push({
        name: "Search & Filters",
        status: "warning",
        message: "No search or filter features found",
        screenshot,
      });
    }
  } catch (error) {
    const screenshot = await takeScreenshot(page, "search-filters-error");
    results.push({
      name: "Search & Filters",
      status: "fail",
      message: `Error: ${error}`,
      screenshot,
    });
  }
}

async function test8_Performance(page: Page) {
  console.log("\n⏱️ TEST 8: Performance Measurements");
  console.log("=".repeat(50));

  try {
    // Measure page load
    const startTime = Date.now();
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);
    const loadTime = Date.now() - startTime;

    console.log(`📊 Initial page load: ${loadTime}ms`);

    // Navigate to Assets
    const assetsStart = Date.now();
    await page.click("text=Assets").catch(() => {});
    await waitForNetworkIdle(page);
    const assetsLoadTime = Date.now() - assetsStart;

    console.log(`📊 Assets page navigation: ${assetsLoadTime}ms`);

    // Test 3D viewer if available
    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    const hasAssets = await firstAsset.isVisible().catch(() => false);

    let viewerTime = 0;
    if (hasAssets) {
      const viewerStart = Date.now();
      await firstAsset.click();
      await page.waitForTimeout(2000); // Wait for 3D viewer to initialize
      viewerTime = Date.now() - viewerStart;
      console.log(`📊 3D viewer initialization: ${viewerTime}ms`);
    }

    const screenshot = await takeScreenshot(page, "performance-test");

    const performanceRating =
      loadTime < 3000 && assetsLoadTime < 2000 ? "pass" : "warning";

    results.push({
      name: "Performance",
      status: performanceRating,
      message: `Load: ${loadTime}ms, Assets: ${assetsLoadTime}ms${viewerTime > 0 ? `, 3D Viewer: ${viewerTime}ms` : ""}`,
      screenshot,
    });
  } catch (error) {
    results.push({
      name: "Performance",
      status: "fail",
      message: `Error: ${error}`,
    });
  }
}

async function generateReport() {
  console.log("\n");
  console.log("=".repeat(70));
  console.log("📊 3D ARTIST WORKFLOW TEST REPORT");
  console.log("=".repeat(70));
  console.log("\n");

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "warning"
          ? "⚠️"
          : "❌";
    console.log(`${icon} ${index + 1}. ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.screenshot) {
      console.log(`   Screenshot: ${result.screenshot}`);
    }
    console.log("");

    if (result.status === "pass") passCount++;
    else if (result.status === "warning") warnCount++;
    else failCount++;
  });

  console.log("=".repeat(70));
  console.log(
    `SUMMARY: ${passCount} passed | ${warnCount} warnings | ${failCount} failed`,
  );
  console.log("=".repeat(70));
  console.log("\n");

  // Save report to file
  const reportPath = path.join(SCREENSHOT_DIR, "test-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { passed: passCount, warnings: warnCount, failed: failCount },
        results,
      },
      null,
      2,
    ),
  );

  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

async function main() {
  console.log("🚀 Starting 3D Artist Workflow Tests...\n");
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Initial page load
    console.log("📍 Loading application...");
    await page.goto(FRONTEND_URL);
    await waitForNetworkIdle(page);
    await takeScreenshot(page, "initial-load");

    // Run all tests
    await test1_AssetsPageLoad(page);
    await test2_AssetDetailsPanel(page);
    await test3_AssetActionButtons(page);
    await test4_ThreeDViewer(page);
    await test5_SpritesModal(page);
    await test6_GenerationPage(page);
    await test7_SearchFilter(page);
    await test8_Performance(page);

    // Generate report
    await generateReport();
  } catch (error) {
    console.error("❌ Critical error during testing:", error);
  } finally {
    console.log("🏁 Tests complete. Browser will close in 5 seconds...");
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

main().catch(console.error);
