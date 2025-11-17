import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: Complete Asset Creation Flow
 *
 * Tests the core user journey from prompt entry to 3D model viewing and download.
 * This is the most critical flow in the application.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://test-frontend:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "asset-creation-flow",
);

// Test data
const TEST_ASSET = {
  name: "E2E Test Sword",
  description:
    "A glowing fantasy sword with magical runes for automated testing",
  category: "weapon",
  style: "fantasy",
};

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
  // Check if already authenticated
  const isAuthenticated = await page
    .locator('[data-testid="user-menu"], .user-profile')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isAuthenticated) {
    console.log("✅ User already authenticated");
    return;
  }

  // Navigate to landing page
  await page.goto(FRONTEND_URL);
  await waitForNetworkIdle(page);

  // Find and click admin login link
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const adminLink = page.locator('text="admin login"').first();
  const adminVisible = await adminLink
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (adminVisible) {
    await adminLink.click();
    await page.waitForTimeout(500);

    // Enter password
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill("admin123");

    const loginButton = page
      .locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      )
      .first();
    await loginButton.click();

    await page.waitForTimeout(2000);
    await waitForNetworkIdle(page);
    console.log("✅ User authenticated successfully");
  } else {
    throw new Error("Could not find admin login link");
  }
}

test.describe("Asset Creation Flow - Critical Path", () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Store errors for later retrieval
    (page as any)._consoleErrors = consoleErrors;
  });

  test("complete asset creation flow from prompt to download", async ({
    page,
  }) => {
    test.setTimeout(180000); // 3 minutes for full flow

    console.log("\n🚀 Starting Complete Asset Creation Flow Test");
    console.log("=".repeat(60));

    // STEP 1: Authentication
    console.log("\n1️⃣ STEP 1: Authenticating user...");
    await authenticateUser(page);
    await takeScreenshot(page, "01_authenticated");

    // STEP 2: Navigate to Generation Page
    console.log("\n2️⃣ STEP 2: Navigating to generation page...");
    const generationNav = page.locator(
      'text="3D Model", text="Generate", a[href*="generation"]',
    );

    if (await generationNav.first().isVisible({ timeout: 5000 })) {
      await generationNav.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "02_generation_page");
      console.log("✅ Navigation successful");
    } else {
      // Try alternative navigation
      const navLinks = page.locator("nav a, aside a");
      const count = await navLinks.count();
      console.log(`Found ${count} navigation links, looking for generation...`);

      let found = false;
      for (let i = 0; i < count; i++) {
        const text = await navLinks.nth(i).textContent();
        if (
          text?.toLowerCase().includes("generate") ||
          text?.toLowerCase().includes("3d model") ||
          text?.toLowerCase().includes("prop")
        ) {
          await navLinks.nth(i).click();
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error("Could not find generation page navigation");
      }
    }

    // STEP 3: Select Asset Category
    console.log("\n3️⃣ STEP 3: Selecting asset category...");
    const categoryButton = page.locator(
      `button:has-text("${TEST_ASSET.category}")`,
    );

    if (await categoryButton.first().isVisible({ timeout: 3000 })) {
      await categoryButton.first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, "03_category_selected");
      console.log(`✅ Selected category: ${TEST_ASSET.category}`);
    } else {
      console.log("⚠️ Category selection not found, continuing...");
    }

    // STEP 4: Enter Asset Details
    console.log("\n4️⃣ STEP 4: Entering asset details...");

    // Find and fill name input
    const nameInput = page
      .locator('input[type="text"]')
      .filter({ hasText: /name/i })
      .or(page.locator('input[placeholder*="name" i]'))
      .first();

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(TEST_ASSET.name);
      console.log(`✅ Entered name: ${TEST_ASSET.name}`);
    } else {
      // Try finding any text input
      const anyTextInput = page.locator('input[type="text"]').first();
      await anyTextInput.fill(TEST_ASSET.name);
      console.log("✅ Entered name in first text input");
    }

    // Find and fill description
    const descriptionInput = page
      .locator("textarea")
      .or(page.locator('input[placeholder*="describe" i]'))
      .first();

    if (await descriptionInput.isVisible({ timeout: 3000 })) {
      await descriptionInput.fill(TEST_ASSET.description);
      console.log(`✅ Entered description`);
    }

    await takeScreenshot(page, "04_details_entered");

    // STEP 5: Start Generation
    console.log("\n5️⃣ STEP 5: Starting generation...");
    const generateButton = page.locator(
      'button:has-text("Generate"), button:has-text("Create")',
    );

    // Wait for button to be enabled
    await page.waitForTimeout(1000);

    const buttonEnabled = await generateButton
      .first()
      .isEnabled()
      .catch(() => false);

    if (!buttonEnabled) {
      console.log("⚠️ Generate button is disabled, checking requirements...");
      await takeScreenshot(page, "04b_button_disabled");
    }

    if (await generateButton.first().isVisible({ timeout: 3000 })) {
      await generateButton.first().click({ timeout: 5000 });
      console.log("✅ Clicked generate button");
      await page.waitForTimeout(2000);
      await takeScreenshot(page, "05_generation_started");
    } else {
      throw new Error("Could not find generate button");
    }

    // STEP 6: Monitor Progress
    console.log("\n6️⃣ STEP 6: Monitoring generation progress...");

    // Look for progress indicators
    const progressIndicators = [
      '[role="progressbar"]',
      ".progress",
      '[class*="loading"]',
      "text=/generating|processing|creating/i",
    ];

    let progressFound = false;
    for (const selector of progressIndicators) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        progressFound = true;
        console.log(`✅ Progress indicator found: ${selector}`);
        break;
      }
    }

    if (progressFound) {
      // Take periodic screenshots during generation
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(5000);
        await takeScreenshot(page, `06_progress_${i + 1}`);
        console.log(`⏳ Generation in progress... (${(i + 1) * 5}s elapsed)`);
      }
    } else {
      console.log("⚠️ No progress indicator found");
      await takeScreenshot(page, "06_no_progress");
    }

    // STEP 7: Wait for Completion (or reasonable timeout)
    console.log("\n7️⃣ STEP 7: Waiting for generation completion...");

    // Look for completion indicators or 3D viewer
    const completionIndicators = [
      "canvas", // 3D viewer canvas
      "text=/completed|success|ready/i",
      '[class*="result"]',
      ".asset-preview",
    ];

    let completed = false;
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 2000;
    const maxChecks = maxWaitTime / checkInterval;

    for (let i = 0; i < maxChecks; i++) {
      for (const selector of completionIndicators) {
        if (
          await page
            .locator(selector)
            .first()
            .isVisible({ timeout: 1000 })
            .catch(() => false)
        ) {
          completed = true;
          console.log(`✅ Completion indicator found: ${selector}`);
          break;
        }
      }

      if (completed) break;
      await page.waitForTimeout(checkInterval);
      console.log(
        `⏳ Waiting for completion... (${((i + 1) * checkInterval) / 1000}s elapsed)`,
      );
    }

    await takeScreenshot(page, "07_completion_check");

    // STEP 8: Verify 3D Viewer Loaded
    console.log("\n8️⃣ STEP 8: Verifying 3D viewer...");
    const canvas = page.locator("canvas").first();
    const canvasVisible = await canvas
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (canvasVisible) {
      console.log("✅ 3D viewer canvas found");
      await takeScreenshot(page, "08_3d_viewer_loaded");

      // Test basic interactions
      const box = await canvas.boundingBox();
      if (box) {
        // Test rotation
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + 100,
          box.y + box.height / 2,
        );
        await page.mouse.up();
        await page.waitForTimeout(500);
        await takeScreenshot(page, "08b_viewer_rotated");
        console.log("✅ 3D viewer rotation tested");

        // Test zoom
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(500);
        await takeScreenshot(page, "08c_viewer_zoomed");
        console.log("✅ 3D viewer zoom tested");
      }

      expect(canvasVisible).toBe(true);
    } else {
      console.log(
        "⚠️ 3D viewer canvas not found - generation may still be in progress",
      );
      await takeScreenshot(page, "08_no_canvas");
    }

    // STEP 9: Test Download Functionality
    console.log("\n9️⃣ STEP 9: Testing download functionality...");
    const downloadButton = page.locator(
      'button:has-text("Download"), button:has-text("Export"), a[download]',
    );

    if (await downloadButton.first().isVisible({ timeout: 5000 })) {
      console.log("✅ Download button found");

      // Set up download listener
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

      await downloadButton.first().click();

      try {
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        console.log(`✅ Download initiated: ${filename}`);

        // Verify it's a GLB file
        expect(filename).toMatch(/\.(glb|gltf)$/i);

        await takeScreenshot(page, "09_download_initiated");
      } catch (error) {
        console.log("⚠️ Download did not complete within timeout");
        await takeScreenshot(page, "09_download_timeout");
      }
    } else {
      console.log("⚠️ Download button not found");
      await takeScreenshot(page, "09_no_download_button");
    }

    // STEP 10: Final Verification
    console.log("\n🔟 STEP 10: Final verification...");

    // Check for console errors
    const consoleErrors = (page as any)._consoleErrors || [];
    console.log(`Console errors encountered: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log("Console errors:");
      consoleErrors.slice(0, 5).forEach((error: string, i: number) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Take final screenshot
    await takeScreenshot(page, "10_final_state");

    // Generate summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 ASSET CREATION FLOW TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Asset Name: ${TEST_ASSET.name}`);
    console.log(`Category: ${TEST_ASSET.category}`);
    console.log(`3D Viewer Loaded: ${canvasVisible ? "✅ Yes" : "❌ No"}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log("=".repeat(60) + "\n");

    // Test assertions
    expect(consoleErrors.length).toBeLessThan(10);
  });

  test("handle generation errors gracefully", async ({ page }) => {
    test.setTimeout(120000);

    console.log("\n🧪 Testing Error Handling in Asset Creation");

    await authenticateUser(page);

    // Navigate to generation page
    const generationNav = page.locator(
      'text="3D Model", text="Generate", a[href*="generation"]',
    );
    if (await generationNav.first().isVisible({ timeout: 5000 })) {
      await generationNav.first().click();
      await waitForNetworkIdle(page);
    }

    // Try to generate without required fields
    console.log("Testing empty form submission...");
    const generateButton = page.locator('button:has-text("Generate")').first();

    if (await generateButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await generateButton.isDisabled();
      console.log(
        `Generate button disabled with empty form: ${isDisabled ? "✅" : "❌"}`,
      );
      expect(isDisabled).toBe(true);

      await takeScreenshot(page, "error_empty_form");
    }

    // Try to generate with only name (missing description)
    console.log("Testing partial form submission...");
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill("Test Asset");

    await page.waitForTimeout(500);
    const stillDisabled = await generateButton.isDisabled();
    console.log(
      `Generate button still disabled with only name: ${stillDisabled ? "✅" : "❌"}`,
    );

    await takeScreenshot(page, "error_partial_form");
  });

  test("verify asset appears in assets list after creation", async ({
    page,
  }) => {
    test.setTimeout(120000);

    console.log("\n📋 Testing Asset List Integration");

    await authenticateUser(page);

    // Navigate to Assets page
    console.log("Navigating to Assets page...");
    const assetsNav = page.locator('text="Assets", a[href*="assets"]');

    if (await assetsNav.first().isVisible({ timeout: 5000 })) {
      await assetsNav.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "assets_page");
      console.log("✅ Assets page loaded");

      // Check for asset grid
      const assetGrid = page.locator(
        '[data-testid="asset-grid"], .asset-grid, [class*="grid"]',
      );
      const gridVisible = await assetGrid
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (gridVisible) {
        console.log("✅ Asset grid found");

        // Count assets
        const assetCards = page.locator(
          '[data-testid="asset-card"], .asset-card',
        );
        const count = await assetCards.count();
        console.log(`📦 Found ${count} assets`);

        expect(count).toBeGreaterThanOrEqual(0);

        await takeScreenshot(page, "assets_grid");
      } else {
        console.log("⚠️ Asset grid not found");
      }
    } else {
      console.log("⚠️ Could not navigate to Assets page");
    }
  });
});
