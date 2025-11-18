#!/usr/bin/env python3
"""Test image generation and saving in the local environment"""

from playwright.sync_api import sync_playwright
import time

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Non-headless to see what's happening
        page = browser.new_page()

        # Set up console logging to capture errors
        page.on("console", lambda msg: print(f"[Console {msg.type}]: {msg.text}"))

        print("Navigating to http://localhost:3000...")
        page.goto('http://localhost:3000')

        # Wait for page to load
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Take screenshot of initial state
        page.screenshot(path='/tmp/landing_page.png', full_page=True)
        print("Screenshot saved to /tmp/landing_page.png")

        # Check if we can see any Privy errors
        print("\nPage title:", page.title())
        print("Current URL:", page.url)

        # Look for login buttons
        login_buttons = page.locator('button').all()
        print(f"\nFound {len(login_buttons)} buttons on the page")

        for i, btn in enumerate(login_buttons):
            try:
                text = btn.text_content()
                if text:
                    print(f"  Button {i}: {text.strip()}")
            except:
                pass

        # Keep browser open for manual inspection
        print("\nBrowser will remain open for 30 seconds for inspection...")
        time.sleep(30)

        browser.close()

if __name__ == "__main__":
    test_app()
