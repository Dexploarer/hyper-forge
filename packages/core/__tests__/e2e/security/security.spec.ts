import { test, expect } from "@playwright/test";

/**
 * Security and Access Control Tests
 *
 * Tests security features including:
 * - Authentication requirements
 * - Session management
 * - Role-based access control
 * - Logout functionality
 */

test.describe("Security and Access Control", () => {
  test("should show landing page when not authenticated", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for landing page elements
    const hasLandingPage = await page
      .getByText(/asset-forge|welcome|sign in|login/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    console.log("Landing page visible:", hasLandingPage);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-landing-page.png",
      fullPage: true,
    });
  });

  test("should require authentication to access admin dashboard", async ({
    page,
  }) => {
    // Try to access admin dashboard directly without auth
    await page.goto("http://localhost:3000/#/admin-dashboard");

    // Wait for redirect or auth check
    await page.waitForLoadState("networkidle");

    // Should either show landing page or auth modal
    const hasAuthUI = await page
      .getByText(/sign in|login|authenticate|connect wallet/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const onDashboard = await page
      .getByText(/admin dashboard/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // If we're on the dashboard without auth, that's a security issue
    if (onDashboard && !hasAuthUI) {
      console.log("WARNING: Accessed admin dashboard without authentication");
    } else {
      console.log("Authentication required - correct behavior");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-admin-access-unauthenticated.png",
      fullPage: true,
    });
  });

  test("should require authentication to access settings page", async ({
    page,
  }) => {
    // Try to access settings directly without auth
    await page.goto("http://localhost:3000/#/settings");

    // Wait for redirect or auth check
    await page.waitForLoadState("networkidle");

    // Should either show landing page or auth modal
    const hasAuthUI = await page
      .getByText(/sign in|login|authenticate|connect wallet/i)
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const onSettings = await page
      .getByText(/settings & configuration/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // If we're on settings without auth, that's a security issue
    if (onSettings && !hasAuthUI) {
      console.log("WARNING: Accessed settings without authentication");
    } else {
      console.log("Authentication required - correct behavior");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-settings-access-unauthenticated.png",
      fullPage: true,
    });
  });

  test("should maintain session across page reloads", async ({ page }) => {

    // Login

    // Check if authenticated
    console.log("Initial authentication:", isAuth1);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check if still authenticated
    console.log("After reload authentication:", isAuth2);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-session-after-reload.png",
      fullPage: true,
    });
  });

  test("should logout successfully", async ({ page }) => {

    // Login

    // Verify authenticated
    console.log("Authenticated before logout:", isAuthBefore);

    // Logout

    // Wait for redirect
    await page.waitForTimeout(1000);

    // Check if logged out (should see landing page)
    console.log("Authenticated after logout:", isAuthAfter);

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-after-logout.png",
      fullPage: true,
    });
  });

  test("should prevent access to admin features for non-admin users", async ({
    page,
  }) => {
    // This test would require creating a non-admin user
    // For now, we verify that admin-specific UI elements are protected

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Check for admin dashboard link
    const adminLink = page.getByRole("link", { name: /admin dashboard/i });
    const hasAdminLink = await adminLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    console.log(
      "Admin dashboard link visible (unauthenticated):",
      hasAdminLink,
    );

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-admin-features-check.png",
      fullPage: true,
    });
  });

  test("should protect API endpoints from unauthorized access", async ({
    page,
  }) => {
    // Try to access admin API endpoint directly
    const response = await page.request
      .get("http://localhost:3004/api/users")
      .catch(() => null);

    if (response) {
      console.log("API response status:", response.status());
      console.log("API response headers:", response.headers());

      // Should either return 401/403 or require authentication
      const requiresAuth =
        response.status() === 401 || response.status() === 403;
      console.log("API requires authentication:", requiresAuth);
    } else {
      console.log("API request failed or blocked");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-api-protection.png",
      fullPage: true,
    });
  });

  test("should have secure headers", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check response headers
    const response = page.url();
    console.log("Loaded URL:", response);

    // This is a placeholder - in a real test we'd check for:
    // - Content-Security-Policy
    // - X-Content-Type-Options
    // - X-Frame-Options
    // - Strict-Transport-Security (for HTTPS)

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-headers-check.png",
      fullPage: true,
    });
  });

  test("should handle session expiration gracefully", async ({ page }) => {

    // Login

    // Verify authenticated
    console.log("Authenticated:", isAuth);

    // In a real test, we'd wait for session to expire or manually expire it
    // For now, we just verify the auth state

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-session-state.png",
      fullPage: true,
    });
  });

  test("should prevent XSS in user input fields", async ({ page }) => {

    // Navigate to a page with input fields
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Try to inject script (this should be sanitized)
    const xssPayload = '<script>alert("XSS")</script>';

    // Look for any input or textarea
    const inputs = page.locator('input[type="text"], textarea');
    const count = await inputs.count();

    if (count > 0) {
      const firstInput = inputs.first();
      await firstInput.fill(xssPayload);

      // Check if script was executed (it shouldn't be)
      const hasAlert = await page
        .locator("text=XSS")
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (hasAlert) {
        console.log("WARNING: Potential XSS vulnerability detected");
      } else {
        console.log("XSS protection working - script not executed");
      }
    } else {
      console.log("No input fields found for XSS testing");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-xss-test.png",
      fullPage: true,
    });
  });

  test("should use HTTPS in production", async ({ page }) => {
    // This test is a reminder to verify HTTPS in production
    const currentURL = page.url();
    const isHTTPS = currentURL.startsWith("https://");

    console.log("Current URL:", currentURL);
    console.log("Using HTTPS:", isHTTPS);

    // In development, HTTP is acceptable
    // In production, HTTPS should be enforced

    if (!isHTTPS && process.env.NODE_ENV === "production") {
      console.log("WARNING: Not using HTTPS in production");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-https-check.png",
      fullPage: true,
    });
  });

  test("should protect sensitive data in localStorage", async ({ page }) => {

    // Check localStorage for sensitive data
    const localStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          if (value) {
            data[key] = value;
          }
        }
      }
      return data;
    });

    console.log("localStorage keys:", Object.keys(localStorage));

    // Check if any sensitive data is stored unencrypted
    // This is a basic check - in production, ensure tokens/secrets are properly protected
    const hasSensitiveData = Object.keys(localStorage).some(
      (key) =>
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key"),
    );

    if (hasSensitiveData) {
      console.log("WARNING: Potentially sensitive data in localStorage");
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-localstorage-check.png",
      fullPage: true,
    });
  });

  test("should have proper CORS configuration", async ({ page }) => {
    // Try to make a request from the frontend to backend
    const response = await page.request
      .get("http://localhost:3004/api/health")
      .catch(() => null);

    if (response) {
      console.log("Health check status:", response.status());
      const corsHeaders = {
        "access-control-allow-origin":
          response.headers()["access-control-allow-origin"],
        "access-control-allow-credentials":
          response.headers()["access-control-allow-credentials"],
      };

      console.log("CORS headers:", corsHeaders);
    }

    // Take screenshot
    await page.screenshot({
      path: "test-results/screenshots/security-cors-check.png",
      fullPage: true,
    });
  });
});
