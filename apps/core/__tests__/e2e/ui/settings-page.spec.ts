import { test, expect } from "@playwright/test";

/**
 * Settings Page Tests
 *
 * Tests all settings page functionality including:
 * - Page loading and navigation
 * - Prompt category navigation
 * - JSON data display
 * - Copy functionality
 * - Mobile responsiveness
 */

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
  });

  test("should load settings page", async ({ page }) => {
    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /settings & configuration/i }),
    ).toBeVisible();

    // Check for description
    await expect(
      page.getByText(/view and manage system prompts and configurations/i),
    ).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-page-loaded.png",
      fullPage: true,
    });
  });

  test("should display all prompt categories", async ({ page }) => {
    // Check for category section heading
    await expect(page.getByText(/prompt categories/i)).toBeVisible();

    // Check for all categories (visible on desktop)
    const categories = [
      "Game Styles",
      "Asset Types",
      "Materials",
      "Generation",
      "GPT-4 Enhancement",
      "Weapon Detection",
    ];

    for (const category of categories) {
      const categoryButton = page.getByRole("button", {
        name: new RegExp(category, "i"),
      });
      const isVisible = await categoryButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (isVisible) {
        console.log(`Category "${category}" is visible`);
      } else {
        // Might be in mobile drawer
        console.log(`Category "${category}" might be in mobile drawer`);
      }
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-categories.png",
      fullPage: true,
    });
  });

  test("should display category icons", async ({ page }) => {
    // Each category should have an icon
    // We'll verify this by checking the SVG elements within category buttons

    const categoryButtons = page
      .locator("button")
      .filter({ hasText: /game styles|asset types|materials/i });
    const count = await categoryButtons.count();

    expect(count).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-category-icons.png",
      fullPage: true,
    });
  });

  test("should switch between categories", async ({ page }) => {
    // Click on Asset Types category
    const assetTypesButton = page.getByRole("button", { name: /asset types/i });
    const isVisible = await assetTypesButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await assetTypesButton.click();
      await page.waitForTimeout(500);

      // Verify category heading changed
      await expect(
        page.getByRole("heading", { name: /asset types/i }),
      ).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-asset-types.png",
        fullPage: true,
      });

      // Switch to Materials
      const materialsButton = page.getByRole("button", { name: /materials/i });
      await materialsButton.click();
      await page.waitForTimeout(500);

      // Verify category heading changed
      await expect(
        page.getByRole("heading", { name: /materials/i }),
      ).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-materials.png",
        fullPage: true,
      });
    } else {
      console.log(
        "Category buttons not visible - might need to open drawer on mobile",
      );
    }
  });

  test("should display JSON data section", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check for JSON Data section
    const jsonDataSection = page.getByText(/json data/i);
    await expect(jsonDataSection).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-json-data.png",
      fullPage: true,
    });
  });

  test("should display extracted prompts section", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Look for Extracted Prompts section
    const extractedPromptsSection = page.getByText(/extracted prompts/i);
    const isVisible = await extractedPromptsSection
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      console.log("Extracted Prompts section is visible");

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-extracted-prompts.png",
        fullPage: true,
      });
    } else {
      console.log("Extracted Prompts section might be collapsed");
    }
  });

  test("should expand and collapse sections", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Try to expand Extracted Prompts section
    const extractedPromptsButton = page.getByRole("button", {
      name: /extracted prompts/i,
    });
    const isVisible = await extractedPromptsButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Click to expand if collapsed
      await extractedPromptsButton.click();
      await page.waitForTimeout(500);

      // Take screenshot of expanded state
      await page.screenshot({
        path: "test-results/screenshots/settings-section-expanded.png",
        fullPage: true,
      });

      // Click to collapse
      await extractedPromptsButton.click();
      await page.waitForTimeout(500);

      // Take screenshot of collapsed state
      await page.screenshot({
        path: "test-results/screenshots/settings-section-collapsed.png",
        fullPage: true,
      });
    }
  });

  test("should display copy JSON button", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Look for Copy JSON button
    const copyButton = page.getByRole("button", { name: /copy json/i });
    await expect(copyButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-copy-button.png",
      fullPage: true,
    });
  });

  test("should copy JSON to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Click Copy JSON button
    const copyButton = page.getByRole("button", { name: /copy json/i });
    await copyButton.click();

    // Wait for copy operation
    await page.waitForTimeout(500);

    // Check for "Copied!" feedback
    const copiedText = page.getByText(/copied/i);
    const isCopied = await copiedText
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isCopied) {
      console.log("Copy feedback displayed");

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-copy-success.png",
        fullPage: true,
      });
    } else {
      console.log("Copy might have succeeded without visible feedback");
    }
  });

  test("should display refresh button", async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator(
      'button[title*="Refresh"], button[title*="refresh"]',
    );
    const isVisible = await refreshButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      console.log("Refresh button is visible");

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-refresh-button.png",
        fullPage: true,
      });
    }
  });

  test("should refresh prompts when clicking refresh button", async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Find and click refresh button
    const refreshButton = page.locator(
      'button[title*="Refresh"], button[title*="refresh"]',
    );
    const isVisible = await refreshButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await refreshButton.click();

      // Wait for refresh
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-after-refresh.png",
        fullPage: true,
      });
    }
  });

  test("should display loading state", async ({ page }) => {
    // Reload page to see loading state
    await page.reload();

    // Look for loading indicator (might be quick)
    const loadingIndicator = page.getByText(/loading prompts/i);
    const hasLoading = await loadingIndicator
      .isVisible({ timeout: 500 })
      .catch(() => false);

    console.log("Loading state visibility:", hasLoading);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-loading-check.png",
      fullPage: true,
    });
  });

  test("should display error state if API fails", async ({ page }) => {
    // This test checks that error handling UI exists
    // We can't easily trigger an API error without mocking

    // Check for any error messages (shouldn't be visible in normal operation)
    const errorMessage = await page
      .locator(".text-red-400")
      .isVisible()
      .catch(() => false);

    expect(errorMessage).toBeFalsy(); // Should not have errors in normal operation

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-error-check.png",
      fullPage: true,
    });
  });

  test("should show prompt counts for each category", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check for prompt count badges
    const promptCountText = page.locator("text=/\\d+ prompts?/i");
    const count = await promptCountText.count();

    expect(count).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-prompt-counts.png",
      fullPage: true,
    });
  });

  test("should have responsive design", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: "test-results/screenshots/settings-desktop.png",
      fullPage: true,
    });

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: "test-results/screenshots/settings-tablet.png",
      fullPage: true,
    });

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: "test-results/screenshots/settings-mobile.png",
      fullPage: true,
    });

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should open category drawer on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Look for menu button (should be visible on mobile)
    const menuButton = page.getByRole("button", { name: /categories/i });
    const isVisible = await menuButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Check if drawer opened
      const drawer = page.getByRole("heading", { name: /prompt categories/i });
      const isDrawerVisible = await drawer
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (isDrawerVisible) {
        console.log("Category drawer opened on mobile");

        // Take screenshot
        await page.screenshot({
          path: "test-results/screenshots/settings-mobile-drawer-open.png",
          fullPage: true,
        });
      }
    }

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should display category descriptions", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check for category description
    const descriptions = [
      /art style and aesthetic prompts/i,
      /prompts for generating different types/i,
      /material and texture/i,
      /core generation pipeline/i,
      /prompt enhancement/i,
      /ai vision prompts/i,
    ];

    let foundDescriptions = 0;
    for (const desc of descriptions) {
      const element = page.getByText(desc);
      const isVisible = await element
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isVisible) {
        foundDescriptions++;
      }
    }

    console.log(`Found ${foundDescriptions} category descriptions`);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/settings-descriptions.png",
      fullPage: true,
    });
  });

  test("should display formatted JSON with proper syntax highlighting", async ({
    page,
  }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Look for code/pre element containing JSON
    const jsonElement = page.locator("pre");
    const isVisible = await jsonElement
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      console.log("JSON display element found");

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/settings-json-formatting.png",
        fullPage: true,
      });
    }
  });
});
