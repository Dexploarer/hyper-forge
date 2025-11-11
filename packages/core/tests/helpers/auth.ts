import { Page, expect } from "@playwright/test";

/**
 * Authentication helper for Playwright tests
 * Handles admin login and session management
 */

export interface AuthConfig {
  baseURL: string;
  adminPassword: string;
}

export class AuthHelper {
  constructor(
    private page: Page,
    private config: AuthConfig,
  ) {}

  /**
   * Login as admin user
   * Note: This is a placeholder - actual implementation depends on Privy auth flow
   */
  async loginAsAdmin() {
    await this.page.goto(this.config.baseURL);

    // Wait for the page to load
    await this.page.waitForLoadState("networkidle");

    // Check if already authenticated
    const isAuthenticated = await this.checkAuthentication();
    if (isAuthenticated) {
      console.log("Already authenticated");
      return;
    }

    // TODO: Implement actual Privy authentication flow
    // For now, we'll simulate being authenticated by checking for the landing page
    console.log("Authentication check complete");
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication(): Promise<boolean> {
    try {
      // Check for elements that only appear when authenticated
      const authIndicators = [
        "Admin Dashboard",
        "Settings",
        "Assets",
        "Generation",
      ];

      for (const indicator of authIndicators) {
        const element = this.page.getByText(indicator, { exact: false });
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to admin dashboard
   */
  async navigateToAdminDashboard() {
    // Try clicking the navigation item
    const adminDashboardButton = this.page.getByRole("button", {
      name: /admin/i,
    });
    const adminDashboardLink = this.page.getByRole("link", { name: /admin/i });

    if (
      await adminDashboardButton.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await adminDashboardButton.click();
    } else if (
      await adminDashboardLink.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await adminDashboardLink.click();
    } else {
      // Direct navigation
      await this.page.goto(`${this.config.baseURL}/#/admin-dashboard`);
    }

    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to settings page
   */
  async navigateToSettings() {
    // Try clicking the navigation item
    const settingsButton = this.page.getByRole("button", {
      name: /settings/i,
    });
    const settingsLink = this.page.getByRole("link", { name: /settings/i });

    if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.click();
    } else if (
      await settingsLink.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await settingsLink.click();
    } else {
      // Direct navigation
      await this.page.goto(`${this.config.baseURL}/#/settings`);
    }

    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Logout
   */
  async logout() {
    // Look for logout button
    const logoutButton = this.page.getByRole("button", { name: /logout/i });
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: "visible", timeout });
  }

  /**
   * Check if element exists on page
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create auth helper for a page
 */
export function createAuthHelper(
  page: Page,
  config: Partial<AuthConfig> = {},
): AuthHelper {
  const defaultConfig: AuthConfig = {
    baseURL: "http://localhost:3000",
    adminPassword: "admin123",
    ...config,
  };

  return new AuthHelper(page, defaultConfig);
}
