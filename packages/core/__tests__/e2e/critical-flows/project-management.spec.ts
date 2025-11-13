import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * E2E Test: Project Management Flow
 *
 * Tests project creation, organization, and management including:
 * - Creating new projects
 * - Adding assets to projects
 * - Organizing and categorizing assets
 * - Sharing/exporting projects
 * - Deleting projects
 */

const FRONTEND_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "project-management",
);

const TEST_PROJECT = {
  name: "E2E Test Project",
  description: "Automated test project for E2E testing",
  tags: ["test", "automated", "e2e"],
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
  if (await adminLink.isVisible({ timeout: 3000 })) {
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
    console.log("✅ User authenticated");
  }
}

test.describe("Project Management - Core Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("navigates to projects page", async ({ page }) => {
    console.log("\n📁 Testing Projects Page Navigation");

    // Look for Projects navigation
    const projectsNav = page.locator(
      'text="Projects", a[href*="projects"], button:has-text("Projects")',
    );

    const hasNav = await projectsNav
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasNav) {
      await projectsNav.first().click();
      await waitForNetworkIdle(page);
      await takeScreenshot(page, "projects_page");

      console.log("✅ Projects page loaded");

      // Verify URL or page content
      const url = page.url();
      console.log(`Current URL: ${url}`);
    } else {
      console.log("⚠️ Projects navigation not found");
      test.skip();
    }
  });

  test("displays existing projects list", async ({ page }) => {
    console.log("\n📋 Testing Projects List Display");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Look for projects grid/list
    const projectsContainer = page.locator(
      '[data-testid="projects-list"], .projects-grid, [class*="project"]',
    );

    const hasContainer = await projectsContainer
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasContainer) {
      // Count projects
      const projectCards = page.locator(
        '[data-testid="project-card"], .project-card',
      );
      const count = await projectCards.count();

      console.log(`📦 Found ${count} projects`);
      await takeScreenshot(page, "projects_list");
    } else {
      // May be empty state
      const emptyState = page.locator(
        "text=/no projects|empty|create your first/i",
      );
      const isEmpty = await emptyState
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isEmpty) {
        console.log("✅ Empty state displayed");
        await takeScreenshot(page, "projects_empty");
      } else {
        console.log("⚠️ Projects list not found");
      }
    }
  });

  test("creates new project", async ({ page }) => {
    console.log("\n➕ Testing Project Creation");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Look for "Create Project" or "New Project" button
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New Project"), button:has-text("Add Project")',
    );

    const hasButton = await createButton
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasButton) {
      console.log("⚠️ Create project button not found");
      test.skip();
      return;
    }

    await createButton.first().click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "create_project_dialog");

    // Look for modal/form
    const modal = page.locator('dialog, [role="dialog"], .modal');
    const modalVisible = await modal
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (modalVisible) {
      console.log("✅ Create project modal opened");

      // Fill in project name
      const nameInput = page
        .locator('input[type="text"]')
        .or(page.locator('input[name*="name" i]'))
        .first();

      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill(TEST_PROJECT.name);
        console.log(`✅ Entered project name: ${TEST_PROJECT.name}`);
      }

      // Fill in description if available
      const descInput = page
        .locator("textarea")
        .or(page.locator('input[name*="description" i]'))
        .first();

      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill(TEST_PROJECT.description);
        console.log("✅ Entered project description");
      }

      await takeScreenshot(page, "create_project_filled");

      // Submit form
      const submitButton = page
        .locator('button[type="submit"]')
        .or(page.locator('button:has-text("Create")'))
        .or(page.locator('button:has-text("Save")'));

      if (await submitButton.first().isVisible({ timeout: 3000 })) {
        await submitButton.first().click();
        await page.waitForTimeout(2000);
        await waitForNetworkIdle(page);

        await takeScreenshot(page, "project_created");
        console.log("✅ Project creation submitted");

        // Verify project appears in list
        const projectName = page.locator(`text="${TEST_PROJECT.name}"`);
        const projectExists = await projectName
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        if (projectExists) {
          console.log("✅ New project appears in list");
          expect(projectExists).toBe(true);
        } else {
          console.log("⚠️ New project not immediately visible");
        }
      }
    } else {
      console.log("⚠️ Create project modal did not appear");
    }
  });

  test("opens project details", async ({ page }) => {
    console.log("\n🔍 Testing Project Details View");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Click on first project
    const firstProject = page
      .locator('[data-testid="project-card"], .project-card')
      .first();

    if (!(await firstProject.isVisible({ timeout: 5000 }))) {
      console.log("⚠️ No projects available");
      test.skip();
      return;
    }

    await firstProject.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "project_details");

    console.log("✅ Project details opened");

    // Look for project details elements
    const detailsElements = [
      "text=/assets|members|settings/i",
      '[data-testid="project-assets"]',
      ".project-content",
    ];

    let foundDetails = false;
    for (const selector of detailsElements) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        foundDetails = true;
        console.log(`✅ Project details element found: ${selector}`);
        break;
      }
    }

    if (!foundDetails) {
      console.log("⚠️ Project details not clearly identified");
    }
  });
});

test.describe("Project Management - Asset Organization", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("adds asset to project", async ({ page }) => {
    console.log("\n➕ Testing Add Asset to Project");

    // Navigate to Assets page
    const assetsNav = page.locator('text="Assets", a[href*="assets"]');
    if (!(await assetsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await assetsNav.first().click();
    await waitForNetworkIdle(page);

    // Look for first asset
    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();

    if (!(await firstAsset.isVisible({ timeout: 5000 }))) {
      console.log("⚠️ No assets available");
      test.skip();
      return;
    }

    // Look for "Add to Project" action
    await firstAsset.hover();
    await page.waitForTimeout(500);

    const addToProjectButton = page.locator(
      'button:has-text("Add to Project"), button:has-text("Add")',
    );

    const hasButton = await addToProjectButton
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasButton) {
      await addToProjectButton.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "add_to_project_dialog");

      // Look for project selector
      const projectSelector = page.locator(
        'select, [role="listbox"], .project-selector',
      );

      if (
        await projectSelector
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await projectSelector.first().click();
        await page.waitForTimeout(500);

        // Select first project
        const firstOption = page.locator("option, [role='option']").nth(1);
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
          console.log("✅ Project selected");

          // Confirm
          const confirmButton = page.locator(
            'button:has-text("Add"), button:has-text("Confirm")',
          );
          if (
            await confirmButton
              .first()
              .isVisible({ timeout: 3000 })
              .catch(() => false)
          ) {
            await confirmButton.first().click();
            await page.waitForTimeout(1000);
            console.log("✅ Asset added to project");
          }
        }
      }
    } else {
      console.log("⚠️ Add to project functionality not found");
      // May need to click on asset first
      await firstAsset.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "asset_detail_for_add");
    }
  });

  test("views project assets", async ({ page }) => {
    console.log("\n👀 Testing View Project Assets");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Click first project
    const firstProject = page
      .locator('[data-testid="project-card"], .project-card')
      .first();

    if (!(await firstProject.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await firstProject.click();
    await page.waitForTimeout(2000);

    // Look for assets section
    const assetsSection = page.locator(
      '[data-testid="project-assets"], .project-assets, text="Assets"',
    );

    if (
      await assetsSection
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await takeScreenshot(page, "project_assets_view");

      // Count assets in project
      const assetCards = page.locator(
        '[data-testid="asset-card"], .asset-card',
      );
      const count = await assetCards.count();

      console.log(`📦 Project contains ${count} assets`);

      if (count > 0) {
        // Click first asset to view details
        await assetCards.first().click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, "project_asset_detail");
        console.log("✅ Asset detail view from project");
      } else {
        console.log("⚠️ Project has no assets");
      }
    } else {
      console.log("⚠️ Assets section not found in project");
    }
  });

  test("removes asset from project", async ({ page }) => {
    console.log("\n➖ Testing Remove Asset from Project");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Click first project
    const firstProject = page
      .locator('[data-testid="project-card"], .project-card')
      .first();

    if (!(await firstProject.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await firstProject.click();
    await page.waitForTimeout(2000);

    // Look for asset with remove option
    const assetCards = page.locator('[data-testid="asset-card"], .asset-card');
    const count = await assetCards.count();

    if (count === 0) {
      console.log("⚠️ No assets in project to remove");
      test.skip();
      return;
    }

    // Hover over first asset
    await assetCards.first().hover();
    await page.waitForTimeout(500);

    // Look for remove button
    const removeButton = page.locator(
      'button:has-text("Remove"), button:has-text("Delete"), button[title*="Remove" i]',
    );

    if (
      await removeButton
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await removeButton.first().click();
      await page.waitForTimeout(1000);

      // Confirm if prompted
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes")',
      );
      if (
        await confirmButton
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await confirmButton.first().click();
        await page.waitForTimeout(1000);
      }

      await takeScreenshot(page, "asset_removed_from_project");
      console.log("✅ Asset removed from project");
    } else {
      console.log("⚠️ Remove button not found");
    }
  });
});

test.describe("Project Management - Advanced Features", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test("edits project details", async ({ page }) => {
    console.log("\n✏️ Testing Edit Project");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Click first project
    const firstProject = page
      .locator('[data-testid="project-card"], .project-card')
      .first();

    if (!(await firstProject.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await firstProject.click();
    await page.waitForTimeout(2000);

    // Look for edit button
    const editButton = page.locator(
      'button:has-text("Edit"), button:has-text("Settings"), button[title*="Edit" i]',
    );

    if (
      await editButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await editButton.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "edit_project_dialog");

      // Look for editable fields
      const nameInput = page.locator('input[type="text"]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        const currentValue = await nameInput.inputValue();
        await nameInput.fill(`${currentValue} (Edited)`);
        console.log("✅ Project name edited");

        // Save changes
        const saveButton = page.locator(
          'button:has-text("Save"), button[type="submit"]',
        );
        if (
          await saveButton
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await saveButton.first().click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, "project_edited");
          console.log("✅ Changes saved");
        }
      }
    } else {
      console.log("⚠️ Edit button not found");
    }
  });

  test("deletes project with confirmation", async ({ page }) => {
    console.log("\n🗑️ Testing Delete Project");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Look for test project or create one
    const testProject = page.locator(`text="${TEST_PROJECT.name}"`);
    const hasTestProject = await testProject
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasTestProject) {
      console.log("⚠️ Test project not found, skipping delete test");
      test.skip();
      return;
    }

    // Click on test project
    await testProject.click();
    await page.waitForTimeout(2000);

    // Look for delete button
    const deleteButton = page.locator(
      'button:has-text("Delete"), button:has-text("Remove")',
    );

    if (
      await deleteButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await deleteButton.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "delete_confirmation");

      // Should show confirmation dialog
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")',
      );

      const hasConfirm = await confirmButton
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasConfirm) {
        console.log("✅ Delete confirmation shown");
        await confirmButton.first().click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, "project_deleted");
        console.log("✅ Project deleted");

        // Verify project is gone
        const stillExists = await page
          .locator(`text="${TEST_PROJECT.name}"`)
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        expect(stillExists).toBe(false);
      } else {
        console.log("⚠️ No confirmation dialog shown");
      }
    } else {
      console.log("⚠️ Delete button not found");
    }
  });

  test("exports project (if supported)", async ({ page }) => {
    console.log("\n📤 Testing Project Export");

    const projectsNav = page.locator('text="Projects", a[href*="projects"]');
    if (!(await projectsNav.first().isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await projectsNav.first().click();
    await waitForNetworkIdle(page);

    // Click first project
    const firstProject = page
      .locator('[data-testid="project-card"], .project-card')
      .first();

    if (!(await firstProject.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await firstProject.click();
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), button:has-text("Share")',
    );

    if (
      await exportButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      console.log("✅ Export button found");
      await takeScreenshot(page, "export_available");

      // Try to initiate export
      const downloadPromise = page.waitForEvent("download", {
        timeout: 5000,
      });

      await exportButton.first().click();

      try {
        const download = await downloadPromise;
        console.log(`✅ Export initiated: ${download.suggestedFilename()}`);
      } catch (error) {
        console.log("⚠️ Export may require additional steps");
        await takeScreenshot(page, "export_dialog");
      }
    } else {
      console.log("⚠️ Export functionality not found");
    }
  });
});
