import { test, expect, type Page } from "@playwright/test";
import { join } from "path";

// Screenshot directory
const SCREENSHOT_DIR = join(process.cwd(), "test-results", "new-user-journey");

// Helper to take screenshots with timestamps
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `${timestamp}_${name}.png`),
    fullPage: true,
  });
}

test("Complete new user onboarding flow", async ({ page }) => {
  test.setTimeout(120000); // 2 minutes for complete journey

  const journey: string[] = [];
  const frictionPoints: string[] = [];
  const startTime = Date.now();

  // Step 1: Landing Page Load
  journey.push("Step 1: Visiting landing page");
  console.log("\n🚀 Step 1: Loading landing page...");
  const frontendUrl = process.env.FRONTEND_URL || "http://test-frontend:3000";
  await page.goto(frontendUrl);
  await page.waitForLoadState("networkidle");
  await takeScreenshot(page, "01_landing_page_initial");

  // Check for console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.log("❌ Console Error:", msg.text());
    }
  });

  // Step 2: Hero Section Verification
  journey.push("Step 2: Verifying hero section");
  console.log("\n🎯 Step 2: Checking hero section...");

  const heroTitle = page.locator("h1").first();
  const heroVisible = await heroTitle
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (heroVisible) {
    const titleText = await heroTitle.textContent();
    console.log("✅ Hero title found:", titleText);
    journey.push(`  - Hero title: "${titleText}"`);
  } else {
    frictionPoints.push("Hero title not immediately visible");
    console.log("⚠️  Hero title not found");
  }

  await takeScreenshot(page, "02_hero_section");

  // Step 3: Test Input Field
  journey.push("Step 3: Testing input field");
  console.log("\n✍️  Step 3: Testing hero input field...");

  const inputField = page
    .locator(
      'input[type="text"], input[placeholder*="imagine"], input[placeholder*="describe"]',
    )
    .first();
  const inputVisible = await inputField
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (inputVisible) {
    await inputField.fill("A medieval castle with dragons");
    await takeScreenshot(page, "03_input_filled");
    console.log("✅ Input field works");

    // Try to submit
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Generate"), button:has-text("Create")',
      )
      .first();
    const submitVisible = await submitButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (submitVisible) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, "04_after_submit");
      console.log("✅ Submit button clicked");
    }
  } else {
    frictionPoints.push("Input field not found on landing page");
    console.log("⚠️  Input field not found");
  }

  // Step 4: Test Tool Cards
  journey.push("Step 4: Testing tool cards");
  console.log("\n🎴 Step 4: Testing tool cards...");

  const toolCards = [
    {
      name: "3D Model",
      selector:
        'button:has-text("3D Model"), a:has-text("3D Model"), div:has-text("3D Model")',
    },
    {
      name: "NPC",
      selector:
        'button:has-text("NPC"), a:has-text("NPC"), div:has-text("NPC")',
    },
    {
      name: "Quest",
      selector:
        'button:has-text("Quest"), a:has-text("Quest"), div:has-text("Quest")',
    },
    {
      name: "Dialogue",
      selector:
        'button:has-text("Dialogue"), a:has-text("Dialogue"), div:has-text("Dialogue")',
    },
    {
      name: "Lore",
      selector:
        'button:has-text("Lore"), a:has-text("Lore"), div:has-text("Lore")',
    },
    {
      name: "Audio",
      selector:
        'button:has-text("Audio"), a:has-text("Audio"), div:has-text("Audio")',
    },
  ];

  for (const tool of toolCards) {
    const card = page.locator(tool.selector).first();
    const visible = await card.isVisible({ timeout: 2000 }).catch(() => false);

    if (visible) {
      console.log(`✅ ${tool.name} card found`);
      await card.hover();
      await page.waitForTimeout(300);
    } else {
      console.log(`⚠️  ${tool.name} card not found`);
      frictionPoints.push(`${tool.name} card not visible`);
    }
  }

  await takeScreenshot(page, "05_tool_cards");

  // Step 5: Test Social Links
  journey.push("Step 5: Testing social links");
  console.log("\n🔗 Step 5: Testing social links...");

  const socialLinks = [
    { name: "Twitter", selector: 'a[href*="twitter"], a[href*="x.com"]' },
    {
      name: "Farcaster",
      selector: 'a[href*="farcaster"], a[href*="warpcast"]',
    },
    { name: "GitHub", selector: 'a[href*="github"]' },
    { name: "Discord", selector: 'a[href*="discord"]' },
  ];

  for (const social of socialLinks) {
    const link = page.locator(social.selector).first();
    const visible = await link.isVisible({ timeout: 2000 }).catch(() => false);

    if (visible) {
      const href = await link.getAttribute("href");
      console.log(`✅ ${social.name} link found: ${href}`);
    } else {
      console.log(`⚠️  ${social.name} link not found`);
    }
  }

  await takeScreenshot(page, "06_social_links");

  // Step 6: Find and Click Admin Login
  journey.push("Step 6: Finding admin login");
  console.log("\n🔐 Step 6: Looking for admin login...");

  // Scroll to footer first
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await takeScreenshot(page, "07a_footer_scroll");

  const adminLink = page.locator('text="admin login"').first();
  const adminVisible = await adminLink
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (adminVisible) {
    console.log("✅ Admin login link found");
    await adminLink.scrollIntoViewIfNeeded();
    await adminLink.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, "07b_admin_login_clicked");
  } else {
    frictionPoints.push("Admin login link difficult to find");
    console.log("⚠️  Admin login link not found");
  }

  // Step 7: Test Admin Modal
  journey.push("Step 7: Testing admin login modal");
  console.log("\n📋 Step 7: Testing admin modal...");

  const modal = page.locator('dialog, div[role="dialog"], div.modal').first();
  const modalVisible = await modal
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (modalVisible) {
    console.log("✅ Modal appeared");
    await takeScreenshot(page, "08_modal_open");

    // Test ESC key
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const modalStillVisible = await modal
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!modalStillVisible) {
      console.log("✅ ESC key closes modal");
      // Reopen modal
      const reopenAdmin = page.locator('text="admin login"').first();
      await reopenAdmin.click();
      await page.waitForTimeout(500);
    } else {
      console.log("⚠️  ESC key does not close modal");
      frictionPoints.push("ESC key does not close modal");
    }

    await takeScreenshot(page, "09_modal_reopened");
  } else {
    frictionPoints.push("Admin modal did not appear");
    console.log("❌ Modal did not appear");
  }

  // Step 8: Test Invalid Password
  journey.push("Step 8: Testing invalid password");
  console.log("\n🔑 Step 8: Testing invalid password...");

  const passwordField = page.locator('input[type="password"]').first();
  const passwordVisible = await passwordField
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (passwordVisible) {
    await passwordField.fill("wrongpassword123");
    await takeScreenshot(page, "10_invalid_password_entered");

    const loginButton = page
      .locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      )
      .first();
    await loginButton.click();
    await page.waitForTimeout(1000);

    const errorMessage = page
      .locator("text=/incorrect|invalid|wrong|error/i")
      .first();
    const errorVisible = await errorMessage
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (errorVisible) {
      const errorText = await errorMessage.textContent();
      console.log("✅ Error message shown:", errorText);
      journey.push(`  - Error message: "${errorText}"`);
    } else {
      frictionPoints.push("No error message for invalid password");
      console.log("⚠️  No error message shown");
    }

    await takeScreenshot(page, "11_invalid_password_error");
  }

  // Step 9: Test Valid Password
  journey.push("Step 9: Testing valid password");
  console.log("\n✅ Step 9: Testing valid password...");

  if (passwordVisible) {
    await passwordField.clear();
    await passwordField.fill("admin123");
    await takeScreenshot(page, "12_valid_password_entered");

    const loginButton = page
      .locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
      )
      .first();
    await loginButton.click();

    // Wait for navigation or modal to close
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await takeScreenshot(page, "13_after_login");

    const currentUrl = page.url();
    console.log("📍 Current URL after login:", currentUrl);
    journey.push(`  - Redirected to: ${currentUrl}`);
  }

  // Step 10: First-Time User Experience
  journey.push("Step 10: Exploring main app");
  console.log("\n🎮 Step 10: Exploring main application...");

  await page.waitForTimeout(1000);
  await takeScreenshot(page, "14_main_app_initial");

  // Check for onboarding elements
  const onboardingElements = page.locator(
    "text=/welcome|onboarding|tutorial|guide|get started/i",
  );
  const onboardingCount = await onboardingElements.count();

  if (onboardingCount > 0) {
    console.log(`✅ Found ${onboardingCount} onboarding elements`);
    for (let i = 0; i < onboardingCount; i++) {
      const text = await onboardingElements.nth(i).textContent();
      console.log(`  - "${text}"`);
    }
  } else {
    frictionPoints.push("No onboarding guidance found");
    console.log("⚠️  No onboarding elements found");
  }

  // Check navigation
  const navItems = page.locator("nav a, nav button, aside a, aside button");
  const navCount = await navItems.count();
  console.log(`📍 Found ${navCount} navigation items`);

  await takeScreenshot(page, "15_navigation_view");

  // Step 11: Try to Generate First Asset
  journey.push("Step 11: Attempting first asset generation");
  console.log("\n🎨 Step 11: Trying to generate first asset...");

  // Look for "Assets", "Generate", "Create" buttons
  const generateButton = page
    .locator(
      'button:has-text("Generate"), button:has-text("Create"), a:has-text("Assets")',
    )
    .first();
  const generateVisible = await generateButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (generateVisible) {
    const buttonText = await generateButton.textContent();
    console.log(`✅ Found action button: "${buttonText}"`);
    await generateButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, "16_generation_page");

    // Check for empty states
    const emptyState = page
      .locator("text=/no assets|empty|get started|create your first/i")
      .first();
    const emptyVisible = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (emptyVisible) {
      const emptyText = await emptyState.textContent();
      console.log(`✅ Empty state found: "${emptyText}"`);
    }
  } else {
    frictionPoints.push("Could not find how to generate assets");
    console.log("⚠️  Could not find generation button");
  }

  // Step 12: UI/UX Assessment
  journey.push("Step 12: UI/UX assessment");
  console.log("\n🎯 Step 12: UI/UX Assessment...");

  await takeScreenshot(page, "17_final_state");

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;

  // Generate Report
  console.log("\n\n" + "=".repeat(80));
  console.log("📊 NEW USER JOURNEY TEST REPORT");
  console.log("=".repeat(80));

  console.log("\n📍 JOURNEY MAP:");
  journey.forEach((step) => console.log(`  ${step}`));

  console.log("\n\n⚠️  FRICTION POINTS:");
  if (frictionPoints.length === 0) {
    console.log("  ✅ No major friction points detected!");
  } else {
    frictionPoints.forEach((point, i) => console.log(`  ${i + 1}. ${point}`));
  }

  console.log("\n\n❌ CONSOLE ERRORS:");
  if (consoleErrors.length === 0) {
    console.log("  ✅ No console errors!");
  } else {
    consoleErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
  }

  console.log("\n\n⏱️  TIMING:");
  console.log(`  Total journey time: ${totalTime.toFixed(2)} seconds`);

  console.log("\n\n📸 SCREENSHOTS:");
  console.log(`  Saved to: ${SCREENSHOT_DIR}`);

  console.log("\n\n⭐ NEW USER RATING:");
  let rating = 10;
  rating -= frictionPoints.length * 0.5;
  rating -= consoleErrors.length * 0.3;
  rating = Math.max(1, Math.min(10, rating));
  console.log(`  ${rating.toFixed(1)}/10`);

  console.log("\n" + "=".repeat(80));

  // Test assertions
  expect(frictionPoints.length).toBeLessThan(10); // Should have fewer than 10 friction points
  expect(consoleErrors.length).toBeLessThan(5); // Should have fewer than 5 console errors
});
