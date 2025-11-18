#!/usr/bin/env python3
"""
Test portrait generation and save functionality in production
"""

from playwright.sync_api import sync_playwright
import time

def test_production_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Run visible to see what's happening
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))

        # Navigate to production
        print("🌐 Opening production app...")
        page.goto('https://hyperforge-production.up.railway.app')
        page.wait_for_load_state('networkidle')

        # Take screenshot of landing page
        page.screenshot(path='/tmp/01_landing.png', full_page=True)
        print("📸 Landing page screenshot saved to /tmp/01_landing.png")

        # Check if we're on landing page or already logged in
        time.sleep(2)

        # Look for login/auth UI
        if page.locator('text=Sign In').count() > 0 or page.locator('text=Login').count() > 0:
            print("🔐 Login required - checking for Privy auth...")
            page.screenshot(path='/tmp/02_auth.png', full_page=True)
            print("📸 Auth screen screenshot saved to /tmp/02_auth.png")
            print("\n⚠️  Manual login required - Privy auth cannot be automated")
            print("Please log in manually in the browser window...")

            # Wait for user to log in manually (check for navigation away from login)
            print("Waiting for login... (will timeout after 60 seconds)")
            try:
                # Wait for URL to change or for content library elements to appear
                page.wait_for_url(lambda url: 'hyperforge-production' in url, timeout=60000)
                time.sleep(3)  # Give time for app to initialize
            except:
                print("❌ Login timeout - please ensure you're logged in")
                browser.close()
                return

        # Take screenshot after potential login
        page.screenshot(path='/tmp/03_after_login.png', full_page=True)
        print("📸 After login screenshot saved to /tmp/03_after_login.png")

        # Look for Content Library or navigation
        print("\n🔍 Looking for Content Library...")

        # Check if we can find content library navigation
        content_nav = page.locator('text=/Content.*Library/i').first
        if content_nav.count() > 0:
            print("✅ Found Content Library navigation")
            content_nav.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
        else:
            print("⚠️  Content Library navigation not found, taking screenshot...")
            page.screenshot(path='/tmp/04_no_content_nav.png', full_page=True)

        # Look for NPCs
        print("\n🔍 Looking for NPC items...")
        npc_cards = page.locator('[class*="card"]').all()
        print(f"Found {len(npc_cards)} card elements")

        if len(npc_cards) > 0:
            print("✅ Found NPC cards, clicking first one...")
            npc_cards[0].click()
            time.sleep(2)

            page.screenshot(path='/tmp/05_npc_detail.png', full_page=True)
            print("📸 NPC detail screenshot saved to /tmp/05_npc_detail.png")

            # Look for Generate Portrait button
            generate_btn = page.locator('button:has-text("Generate")').first
            if generate_btn.count() > 0:
                print("\n✅ Found Generate button, clicking...")
                generate_btn.click()

                # Wait for generation (could take 10-30 seconds)
                print("⏳ Waiting for portrait generation...")
                time.sleep(5)

                # Check console for errors
                page.screenshot(path='/tmp/06_after_generate.png', full_page=True)
                print("📸 After generate screenshot saved to /tmp/06_after_generate.png")

                # Wait for "Saving..." or "Saved" message
                time.sleep(10)

                page.screenshot(path='/tmp/07_final.png', full_page=True)
                print("📸 Final state screenshot saved to /tmp/07_final.png")

                print("\n✅ Test complete - check screenshots for results")
            else:
                print("⚠️  Generate button not found")
                page.screenshot(path='/tmp/05_no_generate_btn.png', full_page=True)
        else:
            print("⚠️  No NPC cards found")
            page.screenshot(path='/tmp/04_no_npcs.png', full_page=True)

        # Keep browser open for inspection
        print("\n⏸️  Browser will stay open for 30 seconds for inspection...")
        time.sleep(30)

        browser.close()
        print("\n✅ Test completed!")

if __name__ == "__main__":
    test_production_app()
