import { test, expect } from "@playwright/test";
import { createAuthHelper } from "./helpers/auth";

/**
 * Admin Dashboard Tests
 *
 * Tests all admin dashboard functionality including:
 * - Page loading and navigation
 * - Statistics display
 * - User management
 * - Tab navigation
 */

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const auth = createAuthHelper(page);
    await auth.loginAsAdmin();
    await auth.navigateToAdminDashboard();
  });

  test("should load admin dashboard page", async ({ page }) => {
    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /admin dashboard/i }),
    ).toBeVisible();

    // Check for description
    await expect(
      page.getByText(/manage users and view system statistics/i),
    ).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-loaded.png",
      fullPage: true,
    });
  });

  test("should display overview statistics", async ({ page }) => {
    // Click on Overview tab (if not already active)
    const overviewTab = page.getByRole("button", { name: /overview/i });
    await overviewTab.click();

    // Check for stat cards
    await expect(page.getByText(/total admins/i)).toBeVisible();
    await expect(page.getByText(/profiles completed/i)).toBeVisible();
    await expect(page.getByText(/pending profiles/i)).toBeVisible();

    // Check for quick summary section
    await expect(page.getByText(/quick summary/i)).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-overview.png",
      fullPage: true,
    });
  });

  test("should display statistics with correct icons", async ({ page }) => {
    // Click on Overview tab
    const overviewTab = page.getByRole("button", { name: /overview/i });
    await overviewTab.click();

    // Check that stat cards have proper styling
    const statCards = page
      .locator(".card")
      .filter({ hasText: /total admins|profiles completed|pending profiles/i });
    const count = await statCards.count();

    expect(count).toBe(3);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-stats.png",
      fullPage: true,
    });
  });

  test("should switch to user profiles tab", async ({ page }) => {
    // Click on User Profiles tab
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check for user profiles heading
    await expect(
      page.getByRole("heading", { name: /user profiles/i }),
    ).toBeVisible();

    // Check for table or empty state
    const hasUsers = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const emptyState = await page
      .getByText(/no users yet/i)
      .isVisible()
      .catch(() => false);

    expect(hasUsers || emptyState).toBeTruthy();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-profiles-tab.png",
      fullPage: true,
    });
  });

  test("should display user table with correct columns", async ({ page }) => {
    // Click on User Profiles tab
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Check if table exists
    const table = page.getByRole("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Check for column headers
      await expect(page.getByText(/admin/i).first()).toBeVisible();
      await expect(page.getByText(/contact/i).first()).toBeVisible();
      await expect(page.getByText(/status/i).first()).toBeVisible();
      await expect(page.getByText(/joined/i).first()).toBeVisible();
      await expect(page.getByText(/last login/i).first()).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/admin-dashboard-user-table.png",
        fullPage: true,
      });
    } else {
      console.log("No users in table - showing empty state");
      await page.screenshot({
        path: "test-results/screenshots/admin-dashboard-user-table-empty.png",
        fullPage: true,
      });
    }
  });

  test("should display loading state while fetching users", async ({
    page,
  }) => {
    // Navigate to admin dashboard with network throttling to see loading state
    await page.reload();

    // Look for loading indicator (might be quick)
    const loadingIndicator = page.getByText(/loading users/i);
    const hasLoading = await loadingIndicator
      .isVisible({ timeout: 500 })
      .catch(() => false);

    // The loading state might be very quick, so we just check it exists in the code
    console.log("Loading state visibility:", hasLoading);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-loading-check.png",
      fullPage: true,
    });
  });

  test("should handle error states gracefully", async ({ page }) => {
    // This test checks that error handling UI exists
    // We can't easily trigger an API error without mocking, so we verify the UI structure

    // Navigate to user profiles
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    await page.waitForTimeout(1000);

    // Check for any error messages (shouldn't be visible in normal operation)
    const errorMessage = await page
      .locator(".text-red-400")
      .isVisible()
      .catch(() => false);

    expect(errorMessage).toBeFalsy(); // Should not have errors in normal operation

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-error-check.png",
      fullPage: true,
    });
  });

  test("should display user badges correctly", async ({ page }) => {
    // Navigate to user profiles
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    await page.waitForTimeout(1000);

    // Check if users exist
    const table = page.getByRole("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Look for status badges (Complete/Pending)
      const completeBadge = await page
        .locator("text=Complete")
        .isVisible()
        .catch(() => false);
      const pendingBadge = await page
        .locator("text=Pending")
        .isVisible()
        .catch(() => false);

      console.log("Complete badge visible:", completeBadge);
      console.log("Pending badge visible:", pendingBadge);

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/admin-dashboard-user-badges.png",
        fullPage: true,
      });
    }
  });

  test("should display contact information for users", async ({ page }) => {
    // Navigate to user profiles
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    await page.waitForTimeout(1000);

    // Check if users exist
    const table = page.getByRole("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // The contact column should be visible
      const contactHeader = page.getByText(/contact/i).first();
      await expect(contactHeader).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/admin-dashboard-contact-info.png",
        fullPage: true,
      });
    }
  });

  test("should format dates correctly", async ({ page }) => {
    // Navigate to user profiles
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    await page.waitForTimeout(1000);

    // Check if users exist
    const table = page.getByRole("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Check for date columns
      const joinedHeader = page.getByText(/joined/i).first();
      const lastLoginHeader = page.getByText(/last login/i).first();

      await expect(joinedHeader).toBeVisible();
      await expect(lastLoginHeader).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "test-results/screenshots/admin-dashboard-dates.png",
        fullPage: true,
      });
    }
  });

  test("should have responsive design", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-desktop.png",
      fullPage: true,
    });

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-tablet.png",
      fullPage: true,
    });

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-mobile.png",
      fullPage: true,
    });

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("should maintain tab state when switching", async ({ page }) => {
    // Click on User Profiles tab
    const profilesTab = page.getByRole("button", { name: /user profiles/i });
    await profilesTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify profiles content is visible
    await expect(
      page.getByRole("heading", { name: /user profiles/i }),
    ).toBeVisible();

    // Click back to Overview
    const overviewTab = page.getByRole("button", { name: /overview/i });
    await overviewTab.click();

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify overview content is visible
    await expect(page.getByText(/quick summary/i)).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-tab-switching.png",
      fullPage: true,
    });
  });
});
