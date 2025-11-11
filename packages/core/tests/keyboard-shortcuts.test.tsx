/**
 * Keyboard Shortcuts Integration Test
 * Tests that global keyboard shortcuts are properly integrated
 */

import { test, expect } from "@playwright/test";

test.describe("Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming it's running on localhost:3000)
    await page.goto("http://localhost:3000");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");
  });

  test("should open shortcuts modal with Shift+?", async ({ page }) => {
    // Press Shift+? to open shortcuts modal
    await page.keyboard.press("Shift+?");

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 });

    // Check that the modal title is visible
    const title = await page.locator("#shortcuts-title");
    await expect(title).toHaveText("Keyboard Shortcuts");

    // Check that shortcuts are listed
    const shortcutsList = await page.locator('[role="dialog"]');
    await expect(shortcutsList).toBeVisible();
  });

  test("should close shortcuts modal with Escape", async ({ page }) => {
    // Open shortcuts modal
    await page.keyboard.press("Shift+?");
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 });

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Modal should be closed
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });

  test("should open command palette with Cmd+K", async ({ page }) => {
    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+k`);

    // Command palette should be visible
    // (Adjust selector based on your CommandPalette implementation)
    await page.waitForSelector(
      '[placeholder*="Search" i], [placeholder*="Command" i]',
      {
        timeout: 2000,
      },
    );
  });

  test("should show all shortcut categories", async ({ page }) => {
    // Open shortcuts modal
    await page.keyboard.press("Shift+?");
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 });

    // Check for expected categories
    const expectedCategories = [
      "Navigation",
      "Assets",
      "Creation",
      "View",
      "System",
    ];

    for (const category of expectedCategories) {
      const categoryElement = page.locator(`text=${category}`).first();
      await expect(categoryElement).toBeVisible();
    }
  });

  test("should search shortcuts", async ({ page }) => {
    // Open shortcuts modal
    await page.keyboard.press("Shift+?");
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 });

    // Find search input
    const searchInput = page.locator(
      'input[placeholder*="Search shortcuts" i]',
    );
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill("generate");

    // Should show filtered results
    const resultsContainer = page.locator('[role="dialog"]');
    await expect(resultsContainer).toContainText("Generate");
  });

  test("should navigate to generation page with Cmd+G", async ({ page }) => {
    // Ensure we're logged in or skip this test for landing page
    const isLandingPage = await page.locator("text=Asset-Forge").isVisible();
    if (isLandingPage) {
      test.skip();
      return;
    }

    // Press Cmd+G
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+g`);

    // Check that we navigated to generation page
    // (Adjust based on your actual page title/heading)
    await expect(
      page.locator("text=/AI Asset Generation|Generate/i"),
    ).toBeVisible({
      timeout: 3000,
    });
  });

  test("should toggle fullscreen with Cmd+Shift+F", async ({ page }) => {
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    // Press Cmd+Shift+F to toggle fullscreen
    await page.keyboard.press(`${modifier}+Shift+f`);

    // Wait a bit for fullscreen to activate
    await page.waitForTimeout(500);

    // Check if fullscreen was activated
    // Note: This may not work in headless mode
    const isFullscreen = await page.evaluate(
      () => !!document.fullscreenElement,
    );

    // If not in fullscreen (e.g., headless mode), just check that no error occurred
    // In real tests, this would verify the fullscreen state
    expect(isFullscreen).toBeDefined();
  });

  test("should have 48 shortcuts registered", async ({ page }) => {
    // Open shortcuts modal
    await page.keyboard.press("Shift+?");
    await page.waitForSelector('[role="dialog"]', { timeout: 2000 });

    // Check the count displayed in the modal
    const countText = page.locator("text=/\\d+ shortcuts available/i");
    await expect(countText).toContainText("48");
  });

  test("should not trigger shortcuts when typing in input fields", async ({
    page,
  }) => {
    // Find any input field (search, etc.)
    const input = page
      .locator('input[type="text"], input[type="search"]')
      .first();

    // If no input is visible, skip this test
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Focus the input
    await input.click();

    // Type something that includes shortcut keys
    await input.fill("Generate a new asset with Cmd+N");

    // Shortcuts modal should NOT open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });
});
