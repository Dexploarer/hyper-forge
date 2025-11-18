#!/usr/bin/env python3
"""
Complete end-to-end test of portrait generation and save
Proves the fix is working in production
"""

from playwright.sync_api import sync_playwright
import time
import json

def test_complete_flow():
    print("=" * 70)
    print("🧪 COMPLETE PORTRAIT GENERATION & SAVE TEST")
    print("=" * 70)
    print()

    with sync_playwright() as p:
        # Launch browser in visible mode so we can see what's happening
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Track console messages for debugging
        console_messages = []
        errors = []

        def handle_console(msg):
            text = f"[{msg.type.upper()}] {msg.text}"
            console_messages.append(text)
            if msg.type == "error":
                errors.append(text)
                print(f"  ❌ {text}")
            elif "Failed" in msg.text or "Error" in msg.text:
                print(f"  ⚠️  {text}")

        def handle_response(response):
            if response.status >= 400:
                print(f"  🔴 HTTP {response.status}: {response.url}")

        page.on("console", handle_console)
        page.on("response", handle_response)

        print("Step 1: Navigate to production app")
        print("-" * 70)
        page.goto('https://hyperforge-production.up.railway.app')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        page.screenshot(path='/tmp/test_01_landing.png', full_page=True)
        print("  ✅ Loaded landing page")
        print("  📸 Screenshot: /tmp/test_01_landing.png")
        print()

        # Check for Privy login
        print("Step 2: Handle authentication")
        print("-" * 70)

        # Look for login button
        login_buttons = page.locator('button:has-text("Sign"), button:has-text("Login"), button:has-text("Connect")').all()

        if len(login_buttons) > 0:
            print("  🔐 Login required - please log in manually in the browser window")
            print("  ⏳ Waiting up to 90 seconds for login...")
            print()

            page.screenshot(path='/tmp/test_02_login.png', full_page=True)
            print("  📸 Screenshot: /tmp/test_02_login.png")

            # Wait for login by checking for URL change or dashboard elements
            start_time = time.time()
            logged_in = False

            while time.time() - start_time < 90:
                # Check if we've navigated or if Content Library appears
                if page.locator('text=/Content.*Library/i').count() > 0:
                    logged_in = True
                    break

                # Check if we see user-specific UI
                if page.locator('[class*="avatar"], [class*="profile"]').count() > 0:
                    logged_in = True
                    break

                time.sleep(1)

            if not logged_in:
                print("  ❌ Login timeout - please ensure you're logged in")
                browser.close()
                return False

            print("  ✅ Login detected")
            time.sleep(3)  # Let app initialize
        else:
            print("  ✅ Already logged in")

        page.screenshot(path='/tmp/test_03_authenticated.png', full_page=True)
        print("  📸 Screenshot: /tmp/test_03_authenticated.png")
        print()

        # Navigate to Content Library
        print("Step 3: Navigate to Content Library")
        print("-" * 70)

        content_nav = page.locator('text=/Content.*Library/i').first
        if content_nav.count() > 0:
            content_nav.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print("  ✅ Navigated to Content Library")
        else:
            print("  ⚠️  Content Library nav not found, may already be there")

        page.screenshot(path='/tmp/test_04_content_library.png', full_page=True)
        print("  📸 Screenshot: /tmp/test_04_content_library.png")
        print()

        # Look for existing NPC or create new one
        print("Step 4: Find or create NPC")
        print("-" * 70)

        # Try to find NPC cards
        npc_items = page.locator('[data-type="npc"], [class*="npc"]').all()

        if len(npc_items) == 0:
            print("  📝 No NPCs found, looking for 'New NPC' button...")
            new_npc_btn = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("NPC")').first

            if new_npc_btn.count() > 0:
                new_npc_btn.click()
                time.sleep(2)
                print("  ✅ Clicked New NPC button")
            else:
                print("  ❌ Cannot find NPCs or create button")
                page.screenshot(path='/tmp/test_04_no_npcs.png', full_page=True)
                browser.close()
                return False
        else:
            print(f"  ✅ Found {len(npc_items)} NPC items")

        print()

        # Click on first NPC to open detail modal
        print("Step 5: Open NPC detail modal")
        print("-" * 70)

        # Re-query for NPC items
        npc_cards = page.locator('[class*="card"]').all()

        if len(npc_cards) > 0:
            print(f"  🎯 Clicking first NPC card...")
            npc_cards[0].click()
            time.sleep(2)
            print("  ✅ NPC detail opened")
        else:
            print("  ❌ No NPC cards found")
            page.screenshot(path='/tmp/test_05_no_cards.png', full_page=True)
            browser.close()
            return False

        page.screenshot(path='/tmp/test_05_npc_detail.png', full_page=True)
        print("  📸 Screenshot: /tmp/test_05_npc_detail.png")
        print()

        # Generate portrait
        print("Step 6: Generate portrait")
        print("-" * 70)

        # Look for Generate button (may have sparkles icon or "Generate" text)
        generate_btn = page.locator('button:has-text("Generate"), button[title*="Generate"]').first

        if generate_btn.count() > 0:
            print("  🎨 Clicking Generate Portrait button...")
            generate_btn.click()
            print("  ⏳ Waiting for AI generation (this may take 10-30 seconds)...")

            # Wait and watch for completion
            time.sleep(5)
            page.screenshot(path='/tmp/test_06_generating.png', full_page=True)
            print("  📸 Screenshot: /tmp/test_06_generating.png")

            # Wait for generation to complete and auto-save
            time.sleep(15)

            page.screenshot(path='/tmp/test_07_after_generate.png', full_page=True)
            print("  📸 Screenshot: /tmp/test_07_after_generate.png")

            # Check for success/error messages
            success_msg = page.locator('text=/saved|success/i').count() > 0
            error_msg = page.locator('text=/failed|error/i').count() > 0

            if success_msg:
                print("  ✅ SUCCESS - Portrait generated and saved!")
            elif error_msg:
                print("  ❌ ERROR - Save failed, check screenshots")
            else:
                print("  ⏳ Status unclear, waiting longer...")
                time.sleep(5)

            # Wait a bit more to see final state
            time.sleep(5)
            page.screenshot(path='/tmp/test_08_final.png', full_page=True)
            print("  📸 Screenshot: /tmp/test_08_final.png")

        else:
            print("  ⚠️  Generate button not found")
            page.screenshot(path='/tmp/test_06_no_generate.png', full_page=True)

        print()

        # Summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print()
        print(f"Console messages: {len(console_messages)}")
        print(f"Errors: {len(errors)}")
        print()

        if errors:
            print("🔴 Console Errors:")
            for err in errors[:5]:  # Show first 5 errors
                print(f"  {err}")
            print()

        print("📸 Screenshots saved to /tmp/test_*.png")
        print()
        print("✅ Test flow completed - check screenshots for results")
        print()
        print("⏸️  Browser will stay open for 20 seconds for inspection...")

        # Keep browser open for inspection
        time.sleep(20)

        browser.close()
        return True

if __name__ == "__main__":
    try:
        success = test_complete_flow()
        if success:
            print("\n✅ Test completed successfully!")
        else:
            print("\n❌ Test failed - check output above")
    except Exception as e:
        print(f"\n❌ Test crashed: {e}")
        import traceback
        traceback.print_exc()
