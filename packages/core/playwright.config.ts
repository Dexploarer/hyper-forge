import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Asset Forge admin testing
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",

  // Maximum time one test can run - increased for power user tests
  timeout: 120 * 1000,

  // Test run configuration - sequential for power user flows
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: "http://localhost:3000",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Trace on failure
    trace: "on-first-retry",

    // Browser viewport
    viewport: { width: 1920, height: 1080 },
  },

  // Configure projects for major browsers and viewports
  projects: [
    // Desktop viewports
    {
      name: "desktop-1920",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "desktop-1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    // Tablet viewports
    {
      name: "tablet-portrait",
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "tablet-landscape",
      use: {
        ...devices["iPad (gen 7) landscape"],
        viewport: { width: 1024, height: 768 },
      },
    },
    // Mobile viewports
    {
      name: "mobile-375",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "mobile-414",
      use: {
        ...devices["iPhone 12 Pro"],
        viewport: { width: 414, height: 896 },
      },
    },
    {
      name: "mobile-360",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 640 },
      },
    },
  ],

  // Run dev server before starting tests
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
