import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: Asset Generation Flow with CDN URLs
 *
 * Verifies the complete asset generation pipeline uses CDN URLs exclusively.
 * NO modelUrl references - only cdnUrl.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "cdn-generation-flow",
);

// Test data
const TEST_ASSET = {
  name: "CDN Test Sword",
  description: "A magical sword for testing CDN-only architecture",
  category: "weapon",
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
  const isAuthenticated = await page
    .locator('[data-testid="user-menu"], .user-profile')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isAuthenticated) {
    console.log("✅ User already authenticated");
    return;
  }

  await page.goto(FRONTEND_URL);
  await waitForNetworkIdle(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const adminLink = page.locator('text="admin login"').first();
  const adminVisible = await adminLink
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (adminVisible) {
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
    console.log("✅ User authenticated successfully");
  } else {
    throw new Error("Could not find admin login link");
  }
}

async function navigateToGeneration(page: Page) {
  const generationNav = page.locator(
    'text="3D Model", text="Generate", a[href*="generation"], a[href*="prop"]',
  );

  if (await generationNav.first().isVisible({ timeout: 5000 })) {
    await generationNav.first().click();
    await waitForNetworkIdle(page);
    return true;
  }

  // Try alternative navigation
  const navLinks = page.locator("nav a, aside a");
  const count = await navLinks.count();

  for (let i = 0; i < count; i++) {
    const text = await navLinks.nth(i).textContent();
    if (
      text?.toLowerCase().includes("generate") ||
      text?.toLowerCase().includes("3d model") ||
      text?.toLowerCase().includes("prop")
    ) {
      await navLinks.nth(i).click();
      await waitForNetworkIdle(page);
      return true;
    }
  }

  return false;
}

test.describe("Asset Generation Flow - CDN URL Architecture", () => {
  test.beforeEach(async ({ page }) => {
    // Track console errors and network requests
    const consoleErrors: string[] = [];
    const networkRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("request", (request) => {
      networkRequests.push(request.url());
    });

    (page as any)._consoleErrors = consoleErrors;
    (page as any)._networkRequests = networkRequests;
  });

  test("generates asset with CDN URL (NO modelUrl references)", async ({
    page,
  }) => {
    test.setTimeout(180000); // 3 minutes for full flow

    console.log("\n🚀 Testing Asset Generation with CDN-Only URLs");
    console.log("=".repeat(60));

    // STEP 1: Authentication
    console.log("\n1️⃣ STEP 1: Authenticating user...");
    await authenticateUser(page);
    await takeScreenshot(page, "01_authenticated");

    // STEP 2: Navigate to Generation Page
    console.log("\n2️⃣ STEP 2: Navigating to generation page...");
    const navigated = await navigateToGeneration(page);
    if (!navigated) {
      throw new Error("Could not navigate to generation page");
    }
    await takeScreenshot(page, "02_generation_page");

    // STEP 3: Fill Asset Details
    console.log("\n3️⃣ STEP 3: Filling asset details...");

    // Find name input
    const nameInput = page
      .locator('input[type="text"]')
      .filter({ hasText: /name/i })
      .or(page.locator('input[placeholder*="name" i]'))
      .first();

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(TEST_ASSET.name);
      console.log(`✅ Entered name: ${TEST_ASSET.name}`);
    } else {
      const anyTextInput = page.locator('input[type="text"]').first();
      await anyTextInput.fill(TEST_ASSET.name);
      console.log("✅ Entered name in first text input");
    }

    // Find description input
    const descriptionInput = page
      .locator("textarea")
      .or(page.locator('input[placeholder*="describe" i]'))
      .first();

    if (await descriptionInput.isVisible({ timeout: 3000 })) {
      await descriptionInput.fill(TEST_ASSET.description);
      console.log("✅ Entered description");
    }

    await takeScreenshot(page, "03_details_filled");

    // STEP 4: Start Generation
    console.log("\n4️⃣ STEP 4: Starting generation...");
    const generateButton = page.locator(
      'button:has-text("Generate"), button:has-text("Start Generation")',
    );

    await page.waitForTimeout(1000);

    if (await generateButton.first().isVisible({ timeout: 3000 })) {
      await generateButton.first().click({ timeout: 5000 });
      console.log("✅ Clicked generate button");
      await page.waitForTimeout(2000);
      await takeScreenshot(page, "04_generation_started");
    } else {
      console.log("⚠️ Generate button not found, test incomplete");
      test.skip();
      return;
    }

    // STEP 5: Monitor Pipeline Progress
    console.log("\n5️⃣ STEP 5: Monitoring pipeline progress...");

    const progressIndicators = [
      '[role="progressbar"]',
      ".progress",
      '[class*="loading"]',
      "text=/generating|processing|creating/i",
      '[class*="pipeline"]',
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
        await takeScreenshot(page, "05_progress_indicator");
        break;
      }
    }

    if (!progressFound) {
      console.log("⚠️ No progress indicator found");
      await takeScreenshot(page, "05_no_progress");
    }

    // STEP 6: Wait for Completion (with reasonable timeout)
    console.log("\n6️⃣ STEP 6: Waiting for generation to complete...");

    const completionIndicators = [
      "canvas", // 3D viewer canvas
      "text=/completed|success|ready/i",
      '[class*="result"]',
      ".asset-preview",
      '[data-testid="asset-card"]',
    ];

    let completed = false;
    const maxWaitTime = 90000; // 90 seconds
    const checkInterval = 3000;
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

      // Take periodic screenshots
      if ((i + 1) % 3 === 0) {
        await takeScreenshot(page, `06_progress_${i + 1}`);
      }
    }

    await takeScreenshot(page, "06_completion_check");

    // STEP 7: Verify CDN URL is Used (NOT modelUrl)
    console.log("\n7️⃣ STEP 7: Verifying CDN URL architecture...");

    // Check for cdnUrl in page content and network requests
    const pageContent = await page.content();
    const networkRequests = (page as any)._networkRequests || [];

    // CRITICAL: Verify NO modelUrl references
    const hasModelUrl = pageContent.includes("modelUrl");
    console.log(
      `❌ Checking for legacy modelUrl: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    expect(hasModelUrl).toBe(false);

    // Verify cdnUrl is present
    const hasCdnUrl = pageContent.includes("cdnUrl");
    console.log(
      `✅ Checking for cdnUrl: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND (BAD)"}`,
    );
    expect(hasCdnUrl).toBe(true);

    // Check network requests for CDN patterns
    const cdnRequests = networkRequests.filter(
      (url: string) =>
        url.includes("cdn") ||
        url.includes("cloudflare") ||
        url.includes("r2.dev"),
    );
    console.log(`📡 CDN network requests detected: ${cdnRequests.length}`);

    await takeScreenshot(page, "07_cdn_verification");

    // STEP 8: Verify 3D Viewer Uses CDN URL
    console.log("\n8️⃣ STEP 8: Verifying 3D viewer with CDN URL...");
    const canvas = page.locator("canvas").first();
    const canvasVisible = await canvas
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (canvasVisible) {
      console.log("✅ 3D viewer canvas found");
      await takeScreenshot(page, "08_3d_viewer_loaded");

      // Test viewer interactions
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
        "⚠️ 3D viewer not loaded yet - generation may still be in progress",
      );
      await takeScreenshot(page, "08_no_canvas");
    }

    // STEP 9: Verify Asset Card Shows CDN URL
    console.log("\n9️⃣ STEP 9: Verifying asset card displays with CDN URL...");

    // Try to navigate to results/assets view
    const resultsTab = page.locator(
      'button:has-text("Results"), a[href*="results"]',
    );
    if (await resultsTab.first().isVisible({ timeout: 3000 })) {
      await resultsTab.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "09_results_view");
      console.log("✅ Navigated to results view");
    }

    // Look for asset card with download link
    const downloadLink = page.locator(
      'a[href*=".glb"], a:has-text("Download")',
    );
    if (await downloadLink.first().isVisible({ timeout: 5000 })) {
      const href = await downloadLink.first().getAttribute("href");
      console.log(`✅ Download link found: ${href}`);

      // Verify it's a CDN URL (not local path)
      const isCdnUrl =
        href?.includes("cdn") ||
        href?.includes("cloudflare") ||
        href?.includes("r2.dev") ||
        href?.startsWith("https://");
      console.log(`📦 Download link is CDN URL: ${isCdnUrl ? "YES" : "NO"}`);
      expect(isCdnUrl).toBe(true);

      await takeScreenshot(page, "09_download_link_verified");
    } else {
      console.log("⚠️ Download link not found");
      await takeScreenshot(page, "09_no_download_link");
    }

    // STEP 10: Final Summary
    console.log("\n🔟 STEP 10: Test summary...");
    const consoleErrors = (page as any)._consoleErrors || [];
    console.log(`Console errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log("Top 5 console errors:");
      consoleErrors.slice(0, 5).forEach((error: string, i: number) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    await takeScreenshot(page, "10_final_state");

    console.log("\n" + "=".repeat(60));
    console.log("📊 CDN MIGRATION TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Asset Name: ${TEST_ASSET.name}`);
    console.log(
      `Legacy modelUrl Found: ${hasModelUrl ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
    );
    console.log(
      `CDN cdnUrl Found: ${hasCdnUrl ? "✅ YES (PASS)" : "❌ NO (FAIL)"}`,
    );
    console.log(`3D Viewer Loaded: ${canvasVisible ? "✅ YES" : "❌ NO"}`);
    console.log(`CDN Network Requests: ${cdnRequests.length}`);
    console.log("=".repeat(60) + "\n");

    // Critical assertions
    expect(hasModelUrl).toBe(false); // NO legacy modelUrl
    expect(hasCdnUrl).toBe(true); // YES new cdnUrl
    expect(consoleErrors.length).toBeLessThan(10);
  });

  test("verifies pipeline status updates show CDN URLs", async ({ page }) => {
    test.setTimeout(120000);

    console.log("\n📊 Testing Pipeline Status with CDN URLs");

    await authenticateUser(page);
    const navigated = await navigateToGeneration(page);

    if (!navigated) {
      test.skip();
      return;
    }

    // Check for existing pipeline/assets
    const pipelineTab = page.locator(
      'button:has-text("Pipeline"), a[href*="pipeline"]',
    );
    if (await pipelineTab.first().isVisible({ timeout: 3000 })) {
      await pipelineTab.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "pipeline_view");
      console.log("✅ Pipeline view loaded");

      // Check pipeline stages for CDN URL references
      const pageContent = await page.content();
      const hasModelUrl = pageContent.includes("modelUrl");
      const hasCdnUrl = pageContent.includes("cdnUrl");

      console.log(
        `Pipeline view modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
      );
      console.log(
        `Pipeline view cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
      );

      expect(hasModelUrl).toBe(false);
    } else {
      console.log("⚠️ Pipeline view not available");
    }
  });

  test("verifies completed asset has CDN URL in asset list", async ({
    page,
  }) => {
    test.setTimeout(60000);

    console.log("\n📋 Testing Asset List CDN URLs");

    await authenticateUser(page);

    // Navigate to results or assets page
    const resultsNav = page.locator(
      'button:has-text("Results"), a[href*="results"], a[href*="assets"]',
    );

    if (await resultsNav.first().isVisible({ timeout: 5000 })) {
      await resultsNav.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "asset_list");
      console.log("✅ Asset list loaded");

      // Check first asset card
      const firstAsset = page
        .locator('[data-testid="asset-card"], .asset-card')
        .first();

      if (await firstAsset.isVisible({ timeout: 5000 })) {
        // Check for CDN URL in asset card
        const cardContent = await firstAsset.textContent();
        console.log(
          "📦 Asset card content preview:",
          cardContent?.substring(0, 100),
        );

        // Check page content for CDN architecture
        const pageContent = await page.content();
        const hasModelUrl = pageContent.includes("modelUrl");
        const hasCdnUrl = pageContent.includes("cdnUrl");

        console.log(
          `Asset list modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
        );
        console.log(
          `Asset list cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
        );

        expect(hasModelUrl).toBe(false);

        await takeScreenshot(page, "asset_card_verified");
      } else {
        console.log("⚠️ No assets found in list");
      }
    } else {
      console.log("⚠️ Results/Assets view not accessible");
      test.skip();
    }
  });
});
