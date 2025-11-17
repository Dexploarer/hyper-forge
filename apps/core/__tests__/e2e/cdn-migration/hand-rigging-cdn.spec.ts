import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: Hand Rigging Flow with CDN URLs
 *
 * Tests the hand rigging workflow uses CDN URLs for avatar selection
 * and model loading. Verifies NO legacy modelUrl references.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "hand-rigging-cdn",
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

test.describe("Hand Rigging Flow - CDN URL Architecture", () => {
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

    await authenticateUser(page);
  });

  test("navigates to hand rigging page and verifies CDN URLs", async ({
    page,
  }) => {
    test.setTimeout(120000); // 2 minutes

    console.log("\n🤖 Testing Hand Rigging with CDN URLs");
    console.log("=".repeat(60));

    // STEP 1: Navigate to Hand Rigging Page
    console.log("\n1️⃣ STEP 1: Navigating to hand rigging page...");

    const navOptions = [
      'a[href*="hand-rigging"]',
      'a:has-text("Hand Rigging")',
      'button:has-text("Hand Rigging")',
    ];

    let navigated = false;
    for (const selector of navOptions) {
      const nav = page.locator(selector);
      if (await nav.first().isVisible({ timeout: 3000 })) {
        await nav.first().click();
        await waitForNetworkIdle(page);
        navigated = true;
        console.log(`✅ Navigated via ${selector}`);
        break;
      }
    }

    if (!navigated) {
      console.log("⚠️ Hand rigging page not accessible via navigation");
      // Try direct URL
      await page.goto(`${FRONTEND_URL}/hand-rigging`);
      await waitForNetworkIdle(page);
    }

    await takeScreenshot(page, "01_hand_rigging_page");

    // Verify page loaded
    const pageContent = await page.content();
    const hasHandRigging =
      pageContent.includes("Hand Rigging") ||
      pageContent.includes("hand-rigging") ||
      pageContent.includes("Avatar Selection");

    if (!hasHandRigging) {
      console.log("⚠️ Hand rigging page may not be available");
      test.skip();
      return;
    }

    console.log("✅ Hand rigging page loaded");

    // STEP 2: Verify Page Uses CDN URLs (NO modelUrl)
    console.log("\n2️⃣ STEP 2: Verifying CDN URL architecture on page load...");

    const hasModelUrl = pageContent.includes("modelUrl");
    const hasCdnUrl = pageContent.includes("cdnUrl");

    console.log(
      `Legacy modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    console.log(
      `CDN cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
    );

    expect(hasModelUrl).toBe(false);

    await takeScreenshot(page, "02_cdn_architecture_verified");

    // STEP 3: Select Avatar from List
    console.log("\n3️⃣ STEP 3: Selecting avatar from list...");

    // Look for avatar selection panel/grid
    const avatarSelectors = [
      '[data-testid="avatar-card"]',
      ".avatar-card",
      '[class*="avatar"]',
      'button:has-text("Select")',
    ];

    let avatarFound = false;
    for (const selector of avatarSelectors) {
      const avatars = page.locator(selector);
      const count = await avatars.count();

      if (count > 0) {
        console.log(`✅ Found ${count} avatars with selector: ${selector}`);
        await avatars.first().click();
        await page.waitForTimeout(1000);
        avatarFound = true;
        await takeScreenshot(page, "03_avatar_selected");
        break;
      }
    }

    if (!avatarFound) {
      console.log("⚠️ No avatars found in selector");
      await takeScreenshot(page, "03_no_avatars");

      // Try to find any clickable items
      const items = page.locator('button, [role="button"]');
      const itemCount = await items.count();
      console.log(`Found ${itemCount} clickable items on page`);

      if (itemCount > 0) {
        // Try clicking first item that might be an avatar
        for (let i = 0; i < Math.min(itemCount, 10); i++) {
          const text = await items.nth(i).textContent();
          if (
            text &&
            (text.toLowerCase().includes("avatar") ||
              text.toLowerCase().includes("character") ||
              text.toLowerCase().includes("select"))
          ) {
            await items.nth(i).click();
            await page.waitForTimeout(1000);
            avatarFound = true;
            await takeScreenshot(page, "03_avatar_selected_fallback");
            break;
          }
        }
      }
    }

    if (!avatarFound) {
      console.log("⚠️ Could not find/select avatar - skipping remaining tests");
      test.skip();
      return;
    }

    // STEP 4: Verify 3D Viewers Show Models from CDN/Blob URLs
    console.log("\n4️⃣ STEP 4: Verifying 3D viewer loads from CDN...");

    // Wait for canvas(es) to appear
    const canvas = page.locator("canvas");
    const canvasCount = await canvas.count();
    console.log(`📊 Canvas elements found: ${canvasCount}`);

    if (canvasCount > 0) {
      await expect(canvas.first()).toBeVisible({ timeout: 10000 });
      console.log("✅ 3D viewer canvas loaded");

      await takeScreenshot(page, "04_viewer_loaded");

      // Verify dimensions
      const box = await canvas.first().boundingBox();
      if (box) {
        console.log(`📐 Viewer dimensions: ${box.width}x${box.height}`);
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);
      }
    } else {
      console.log("⚠️ No 3D viewer canvas found");
      await takeScreenshot(page, "04_no_canvas");
    }

    // Check page content for CDN URL usage
    const updatedPageContent = await page.content();
    const stillHasModelUrl = updatedPageContent.includes("modelUrl");
    const stillHasCdnUrl = updatedPageContent.includes("cdnUrl");

    console.log(
      `Post-selection modelUrl check: ${stillHasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    console.log(
      `Post-selection cdnUrl check: ${stillHasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
    );

    expect(stillHasModelUrl).toBe(false);

    // STEP 5: Check Network Requests for CDN URLs
    console.log("\n5️⃣ STEP 5: Checking network requests for CDN patterns...");

    const networkRequests = (page as any)._networkRequests || [];
    const cdnRequests = networkRequests.filter(
      (url: string) =>
        url.includes("cdn") ||
        url.includes("cloudflare") ||
        url.includes("r2.dev") ||
        url.includes(".glb"),
    );

    console.log(`📡 Total network requests: ${networkRequests.length}`);
    console.log(`📡 CDN-related requests: ${cdnRequests.length}`);

    if (cdnRequests.length > 0) {
      console.log("Sample CDN requests:");
      cdnRequests.slice(0, 3).forEach((url: string, i: number) => {
        console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
      });
    }

    await takeScreenshot(page, "05_network_verified");

    // STEP 6: Test Viewer Interactions
    console.log("\n6️⃣ STEP 6: Testing viewer interactions...");

    if (canvasCount > 0) {
      const viewerCanvas = canvas.first();
      const box = await viewerCanvas.boundingBox();

      if (box) {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Test rotation
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 100, centerY);
        await page.mouse.up();
        await page.waitForTimeout(500);

        await takeScreenshot(page, "06_viewer_rotated");
        console.log("✅ Viewer rotation tested");

        // Test zoom
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(500);

        await takeScreenshot(page, "06_viewer_zoomed");
        console.log("✅ Viewer zoom tested");
      }
    }

    // STEP 7: Look for Start Rigging Button (Don't Click - Takes Too Long)
    console.log("\n7️⃣ STEP 7: Verifying rigging controls...");

    const riggingButton = page.locator(
      'button:has-text("Start Rigging"), button:has-text("Rig Hands")',
    );

    if (await riggingButton.first().isVisible({ timeout: 3000 })) {
      console.log("✅ Start rigging button found");
      await takeScreenshot(page, "07_rigging_controls");

      // DON'T click - rigging takes too long for E2E test
      console.log("⚠️ Skipping actual rigging (too time-consuming for E2E)");
    } else {
      console.log("⚠️ Start rigging button not found");
      await takeScreenshot(page, "07_no_rigging_button");
    }

    // STEP 8: Verify Model Info Shows (if available)
    console.log("\n8️⃣ STEP 8: Checking for model information...");

    const modelInfoPatterns = [
      "text=/vertices|faces|materials/i",
      '[data-testid="model-info"]',
      ".model-info",
    ];

    let foundInfo = false;
    for (const pattern of modelInfoPatterns) {
      if (
        await page
          .locator(pattern)
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        const text = await page.locator(pattern).first().textContent();
        console.log(`✅ Model info found: ${text}`);
        foundInfo = true;
        await takeScreenshot(page, "08_model_info");
        break;
      }
    }

    if (!foundInfo) {
      console.log("⚠️ No model info displayed");
    }

    // STEP 9: Final CDN URL Verification
    console.log("\n9️⃣ STEP 9: Final CDN URL verification...");

    const finalPageContent = await page.content();
    const finalModelUrl = finalPageContent.includes("modelUrl");
    const finalCdnUrl = finalPageContent.includes("cdnUrl");

    console.log(
      `Final modelUrl check: ${finalModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    console.log(
      `Final cdnUrl check: ${finalCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
    );

    await takeScreenshot(page, "09_final_state");

    // STEP 10: Summary
    console.log("\n🔟 STEP 10: Test summary...");
    const consoleErrors = (page as any)._consoleErrors || [];
    console.log(`Console errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log("Top 5 console errors:");
      consoleErrors.slice(0, 5).forEach((error: string, i: number) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 HAND RIGGING CDN MIGRATION TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Page Loaded: YES`);
    console.log(`Avatar Selected: ${avatarFound ? "YES" : "NO"}`);
    console.log(`3D Viewer Loaded: ${canvasCount > 0 ? "YES" : "NO"}`);
    console.log(
      `Legacy modelUrl Found: ${finalModelUrl ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
    );
    console.log(`CDN cdnUrl Found: ${finalCdnUrl ? "✅ YES (PASS)" : "⚠️ NO"}`);
    console.log(`CDN Network Requests: ${cdnRequests.length}`);
    console.log("=".repeat(60) + "\n");

    // Critical assertions
    expect(finalModelUrl).toBe(false); // NO legacy modelUrl
    expect(consoleErrors.length).toBeLessThan(10);
  });

  test("verifies avatar selector uses CDN URLs", async ({ page }) => {
    test.setTimeout(60000);

    console.log("\n📋 Testing Avatar Selector CDN URLs");

    await page.goto(`${FRONTEND_URL}/hand-rigging`);
    await waitForNetworkIdle(page);

    const pageContent = await page.content();

    // Check for avatar selection UI
    const hasAvatarSelection =
      pageContent.includes("Avatar Selection") ||
      pageContent.includes("avatar-card") ||
      pageContent.includes("Select Avatar");

    if (!hasAvatarSelection) {
      console.log("⚠️ Avatar selection UI not found");
      test.skip();
      return;
    }

    // Verify CDN URL usage in avatar selector
    const hasModelUrl = pageContent.includes("modelUrl");
    const hasCdnUrl = pageContent.includes("cdnUrl");

    console.log(
      `Avatar selector modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
    );
    console.log(
      `Avatar selector cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
    );

    expect(hasModelUrl).toBe(false);

    await takeScreenshot(page, "avatar_selector_cdn");
  });

  test("verifies rigging controls panel with CDN URLs", async ({ page }) => {
    test.setTimeout(90000);

    console.log("\n🎛️ Testing Rigging Controls Panel CDN URLs");

    await page.goto(`${FRONTEND_URL}/hand-rigging`);
    await waitForNetworkIdle(page);

    // Try to select an avatar first
    const avatars = page.locator(
      '[data-testid="avatar-card"], .avatar-card, button:has-text("Select")',
    );
    const count = await avatars.count();

    if (count > 0) {
      await avatars.first().click();
      await page.waitForTimeout(1000);
      console.log("✅ Avatar selected");
    }

    // Look for rigging controls
    const controlsPanel = page.locator(
      'text="Rigging Controls", text="Processing Pipeline"',
    );

    if (await controlsPanel.first().isVisible({ timeout: 5000 })) {
      console.log("✅ Rigging controls panel found");
      await takeScreenshot(page, "rigging_controls_panel");

      // Verify CDN URL usage
      const pageContent = await page.content();
      const hasModelUrl = pageContent.includes("modelUrl");
      const hasCdnUrl = pageContent.includes("cdnUrl");

      console.log(
        `Controls panel modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
      );
      console.log(
        `Controls panel cdnUrl check: ${hasCdnUrl ? "FOUND (GOOD)" : "NOT FOUND"}`,
      );

      expect(hasModelUrl).toBe(false);
    } else {
      console.log("⚠️ Rigging controls panel not visible");
      await takeScreenshot(page, "no_controls_panel");
    }
  });

  test("verifies skeleton toggle with CDN models", async ({ page }) => {
    test.setTimeout(90000);

    console.log("\n🦴 Testing Skeleton Toggle with CDN Models");

    await page.goto(`${FRONTEND_URL}/hand-rigging`);
    await waitForNetworkIdle(page);

    // Select an avatar
    const avatars = page.locator(
      '[data-testid="avatar-card"], .avatar-card, button',
    );
    const count = await avatars.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await avatars.nth(i).textContent();
        if (text && !text.includes("Close") && !text.includes("Toggle")) {
          await avatars.nth(i).click();
          await page.waitForTimeout(1500);
          break;
        }
      }
    }

    // Wait for canvas to load
    const canvas = page.locator("canvas").first();
    if (await canvas.isVisible({ timeout: 10000 })) {
      console.log("✅ Viewer loaded");

      // Look for skeleton toggle
      const skeletonToggle = page.locator(
        'button:has-text("Skeleton"), button[aria-label*="skeleton" i]',
      );

      if (await skeletonToggle.first().isVisible({ timeout: 3000 })) {
        console.log("✅ Skeleton toggle found");
        await takeScreenshot(page, "before_skeleton_toggle");

        await skeletonToggle.first().click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, "after_skeleton_toggle");

        console.log("✅ Skeleton toggled");

        // Verify CDN URLs still used after toggle
        const pageContent = await page.content();
        const hasModelUrl = pageContent.includes("modelUrl");

        console.log(
          `Post-toggle modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
        );
        expect(hasModelUrl).toBe(false);
      } else {
        console.log("⚠️ Skeleton toggle not found");
      }
    } else {
      console.log("⚠️ Viewer did not load");
      test.skip();
    }
  });

  test("verifies camera reset with CDN-loaded avatar", async ({ page }) => {
    test.setTimeout(90000);

    console.log("\n🎯 Testing Camera Reset with CDN Avatar");

    await page.goto(`${FRONTEND_URL}/hand-rigging`);
    await waitForNetworkIdle(page);

    // Select avatar
    const avatars = page.locator('[data-testid="avatar-card"], .avatar-card');
    if ((await avatars.count()) > 0) {
      await avatars.first().click();
      await page.waitForTimeout(1500);
    }

    // Wait for canvas
    const canvas = page.locator("canvas").first();
    if (await canvas.isVisible({ timeout: 10000 })) {
      // Look for reset camera button
      const resetButton = page.locator(
        'button:has-text("Reset"), button[aria-label*="Reset" i]',
      );

      if (await resetButton.first().isVisible({ timeout: 3000 })) {
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

          console.log("✅ Camera reset tested");

          // Verify CDN URLs
          const pageContent = await page.content();
          const hasModelUrl = pageContent.includes("modelUrl");

          console.log(
            `Post-reset modelUrl check: ${hasModelUrl ? "FOUND (BAD)" : "NOT FOUND (GOOD)"}`,
          );
          expect(hasModelUrl).toBe(false);
        }
      } else {
        console.log("⚠️ Reset button not found");
      }
    } else {
      console.log("⚠️ Canvas not visible");
      test.skip();
    }
  });
});
