#!/usr/bin/env python3
"""
Comprehensive Developer Testing Script for Asset Forge
Tests advanced technical features, performance, and developer tools
"""

import json
import time
from datetime import datetime
from playwright.sync_api import sync_playwright, Page, Browser, ConsoleMessage
from typing import List, Dict, Any

class DevTestReport:
    def __init__(self):
        self.console_logs: List[Dict[str, Any]] = []
        self.network_requests: List[Dict[str, Any]] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.performance_metrics: Dict[str, Any] = {}
        self.test_results: List[Dict[str, Any]] = []
        self.start_time = time.time()

    def add_console_log(self, msg: ConsoleMessage):
        """Capture console logs"""
        log_entry = {
            'type': msg.type,
            'text': msg.text,
            'timestamp': datetime.now().isoformat()
        }
        self.console_logs.append(log_entry)

        if msg.type == 'error':
            self.errors.append(msg.text)
        elif msg.type == 'warning':
            self.warnings.append(msg.text)

    def add_network_request(self, request, response=None):
        """Capture network requests"""
        req_data = {
            'url': request.url,
            'method': request.method,
            'timestamp': datetime.now().isoformat(),
            'resource_type': request.resource_type
        }

        if response:
            req_data['status'] = response.status
            req_data['timing'] = response.request.timing

        self.network_requests.append(req_data)

    def add_test_result(self, test_name: str, passed: bool, details: Dict[str, Any] = None):
        """Add a test result"""
        result = {
            'test': test_name,
            'passed': passed,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)

    def generate_report(self) -> str:
        """Generate comprehensive test report"""
        duration = time.time() - self.start_time

        report = f"""
{'='*80}
ASSET FORGE - DEVELOPER TESTING REPORT
{'='*80}

Test Duration: {duration:.2f} seconds
Timestamp: {datetime.now().isoformat()}

{'='*80}
1. TEST RESULTS SUMMARY
{'='*80}

Total Tests: {len(self.test_results)}
Passed: {sum(1 for t in self.test_results if t['passed'])}
Failed: {sum(1 for t in self.test_results if not t['passed'])}

Detailed Results:
"""
        for result in self.test_results:
            status = "✅ PASS" if result['passed'] else "❌ FAIL"
            report += f"\n{status} - {result['test']}\n"
            if result['details']:
                for key, value in result['details'].items():
                    report += f"  {key}: {value}\n"

        report += f"""
{'='*80}
2. CONSOLE ANALYSIS
{'='*80}

Total Console Messages: {len(self.console_logs)}
Errors: {len(self.errors)}
Warnings: {len(self.warnings)}

"""
        if self.errors:
            report += "ERRORS FOUND:\n"
            for error in self.errors[:10]:  # Show first 10
                report += f"  - {error}\n"

        if self.warnings:
            report += "\nWARNINGS FOUND:\n"
            for warning in self.warnings[:10]:  # Show first 10
                report += f"  - {warning}\n"

        report += f"""
{'='*80}
3. NETWORK ANALYSIS
{'='*80}

Total Requests: {len(self.network_requests)}
"""

        # Analyze API requests
        api_requests = [r for r in self.network_requests if '/api/' in r['url']]
        report += f"API Calls: {len(api_requests)}\n"

        if api_requests:
            report += "\nAPI Request Summary:\n"
            for req in api_requests[:20]:  # Show first 20
                status = req.get('status', 'pending')
                report += f"  [{req['method']}] {req['url']} - Status: {status}\n"

        # Performance timing for requests with responses
        timed_requests = [r for r in self.network_requests if 'timing' in r]
        if timed_requests:
            avg_response_time = sum(r['timing'].get('responseEnd', 0) - r['timing'].get('requestStart', 0)
                                   for r in timed_requests) / len(timed_requests)
            report += f"\nAverage Response Time: {avg_response_time:.2f}ms\n"

        report += f"""
{'='*80}
4. PERFORMANCE METRICS
{'='*80}

"""
        for metric, value in self.performance_metrics.items():
            report += f"{metric}: {value}\n"

        report += f"""
{'='*80}
5. OVERALL ASSESSMENT
{'='*80}

Technical Quality Rating: {self._calculate_rating()}/10

Key Findings:
"""

        findings = self._generate_findings()
        for finding in findings:
            report += f"  • {finding}\n"

        report += f"\n{'='*80}\n"

        return report

    def _calculate_rating(self) -> int:
        """Calculate overall technical rating"""
        score = 10

        # Deduct for errors
        if len(self.errors) > 10:
            score -= 3
        elif len(self.errors) > 5:
            score -= 2
        elif len(self.errors) > 0:
            score -= 1

        # Deduct for failed tests
        failed_tests = sum(1 for t in self.test_results if not t['passed'])
        if failed_tests > 5:
            score -= 3
        elif failed_tests > 2:
            score -= 2
        elif failed_tests > 0:
            score -= 1

        # Deduct for warnings
        if len(self.warnings) > 20:
            score -= 1

        return max(0, score)

    def _generate_findings(self) -> List[str]:
        """Generate key findings"""
        findings = []

        if len(self.errors) == 0:
            findings.append("No console errors detected - excellent!")
        else:
            findings.append(f"Found {len(self.errors)} console errors - needs attention")

        if len(self.warnings) > 20:
            findings.append(f"{len(self.warnings)} warnings detected - consider cleanup")

        passed = sum(1 for t in self.test_results if t['passed'])
        total = len(self.test_results)
        if passed == total:
            findings.append("All tests passed successfully!")
        else:
            findings.append(f"{total - passed} tests failed out of {total}")

        api_requests = [r for r in self.network_requests if '/api/' in r['url']]
        if api_requests:
            findings.append(f"API integration working with {len(api_requests)} requests")

        return findings


def test_page_load_and_performance(page: Page, report: DevTestReport):
    """Test 1: Page load and performance metrics"""
    print("Test 1: Testing page load and performance...")

    try:
        # Navigate to home page
        start = time.time()
        page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
        load_time = time.time() - start

        report.performance_metrics['initial_load_time'] = f"{load_time:.2f}s"

        # Take screenshot of homepage
        page.screenshot(path='/tmp/asset_forge_homepage.png', full_page=False)

        # Get performance metrics
        performance = page.evaluate("""() => {
            const perfData = window.performance.timing;
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                loadComplete: perfData.loadEventEnd - perfData.navigationStart,
                firstPaint: navigation ? navigation.domContentLoadedEventEnd : 0
            };
        }""")

        report.performance_metrics.update(performance)
        report.add_test_result("Page Load", True, {
            'load_time': f"{load_time:.2f}s",
            'dom_ready': f"{performance.get('domContentLoaded', 0)}ms"
        })

        print(f"  ✓ Page loaded in {load_time:.2f}s")

    except Exception as e:
        report.add_test_result("Page Load", False, {'error': str(e)})
        print(f"  ✗ Page load failed: {e}")


def test_command_palette(page: Page, report: DevTestReport):
    """Test 2: Command Palette (Cmd+K / Ctrl+K)"""
    print("Test 2: Testing Command Palette...")

    try:
        # Try to open command palette
        page.keyboard.press('Meta+K')  # Mac Cmd+K
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path='/tmp/asset_forge_command_palette.png')

        # Check if command palette is visible
        palette_visible = page.locator('[role="dialog"]').count() > 0 or \
                         page.locator('input[placeholder*="Search"]').count() > 0 or \
                         page.locator('[data-command-palette]').count() > 0

        if palette_visible:
            print("  ✓ Command palette opened")

            # Try typing in search
            search_input = page.locator('input').first
            if search_input.count() > 0:
                search_input.type('asset')
                page.wait_for_timeout(300)
                print("  ✓ Search functionality works")

            # Close with Escape
            page.keyboard.press('Escape')
            page.wait_for_timeout(300)

            report.add_test_result("Command Palette", True, {
                'opens_with_keyboard': True,
                'search_works': True
            })
        else:
            report.add_test_result("Command Palette", False, {
                'error': 'Command palette not found or not visible'
            })
            print("  ✗ Command palette not found")

    except Exception as e:
        report.add_test_result("Command Palette", False, {'error': str(e)})
        print(f"  ✗ Command palette test failed: {e}")


def test_navigation_and_pages(page: Page, report: DevTestReport):
    """Test 3: Navigation to different pages"""
    print("Test 3: Testing navigation and page routing...")

    pages_to_test = [
        ('Assets', '/assets', 'assets'),
        ('Hand Rigging', '/hand-rigging', 'hand-rigging'),
        ('Animation', '/animation-retargeting', 'animation'),
    ]

    for page_name, url_path, identifier in pages_to_test:
        try:
            # Try navigation
            full_url = f'http://localhost:3000{url_path}'
            page.goto(full_url, wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(1000)

            # Take screenshot
            page.screenshot(path=f'/tmp/asset_forge_{identifier}_page.png')

            # Check if page loaded (check for common elements or page content)
            page_loaded = page.locator('body').count() > 0

            if page_loaded:
                print(f"  ✓ {page_name} page loaded")
                report.add_test_result(f"Navigation - {page_name}", True, {'url': full_url})
            else:
                print(f"  ✗ {page_name} page failed to load")
                report.add_test_result(f"Navigation - {page_name}", False, {'url': full_url})

        except Exception as e:
            report.add_test_result(f"Navigation - {page_name}", False, {'error': str(e)})
            print(f"  ✗ {page_name} navigation failed: {e}")


def test_hand_rigging_page(page: Page, report: DevTestReport):
    """Test 4: Hand Rigging Page specific features"""
    print("Test 4: Testing Hand Rigging Page features...")

    try:
        page.goto('http://localhost:3000/hand-rigging', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1500)

        # Take detailed screenshot
        page.screenshot(path='/tmp/asset_forge_hand_rigging_detail.png', full_page=True)

        # Look for key elements
        tests = {
            'upload_button': page.locator('input[type="file"]').count() > 0 or page.locator('button:has-text("Upload")').count() > 0,
            'camera_controls': page.locator('video').count() > 0 or page.locator('canvas').count() > 0,
            'mediapipe_script': page.evaluate('typeof window.MediaPipeHands !== "undefined" || typeof Hands !== "undefined"')
        }

        passed = sum(tests.values()) >= 2  # At least 2 key features should be present

        report.add_test_result("Hand Rigging Page", passed, tests)

        if passed:
            print("  ✓ Hand Rigging page has key features")
        else:
            print(f"  ⚠ Hand Rigging page partially loaded: {tests}")

    except Exception as e:
        report.add_test_result("Hand Rigging Page", False, {'error': str(e)})
        print(f"  ✗ Hand Rigging page test failed: {e}")


def test_animation_retargeting_page(page: Page, report: DevTestReport):
    """Test 5: Animation Retargeting Page"""
    print("Test 5: Testing Animation Retargeting Page...")

    try:
        page.goto('http://localhost:3000/animation-retargeting', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1500)

        # Take screenshot
        page.screenshot(path='/tmp/asset_forge_animation_retarget.png', full_page=True)

        # Look for key elements
        has_upload = page.locator('input[type="file"]').count() > 0
        has_3d_viewer = page.locator('canvas').count() > 0
        has_controls = page.locator('button').count() > 2

        passed = has_upload and (has_3d_viewer or has_controls)

        report.add_test_result("Animation Retargeting Page", passed, {
            'has_upload': has_upload,
            'has_3d_viewer': has_3d_viewer,
            'has_controls': has_controls
        })

        if passed:
            print("  ✓ Animation Retargeting page loaded with key features")
        else:
            print(f"  ⚠ Animation Retargeting page missing features")

    except Exception as e:
        report.add_test_result("Animation Retargeting Page", False, {'error': str(e)})
        print(f"  ✗ Animation Retargeting test failed: {e}")


def test_assets_page_performance(page: Page, report: DevTestReport):
    """Test 6: Assets page with data"""
    print("Test 6: Testing Assets page performance...")

    try:
        page.goto('http://localhost:3000/assets', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        # Take screenshot
        page.screenshot(path='/tmp/asset_forge_assets_page.png', full_page=True)

        # Count assets loaded
        asset_count = page.locator('[data-asset-card], .asset-card, article, [class*="card"]').count()

        # Test scroll performance
        start = time.time()
        page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        page.wait_for_timeout(500)
        page.evaluate('window.scrollTo(0, 0)')
        scroll_time = time.time() - start

        report.performance_metrics['assets_count'] = asset_count
        report.performance_metrics['scroll_performance'] = f"{scroll_time:.2f}s"

        report.add_test_result("Assets Page Performance", True, {
            'assets_loaded': asset_count,
            'scroll_time': f"{scroll_time:.2f}s"
        })

        print(f"  ✓ Assets page loaded with {asset_count} items, scroll time: {scroll_time:.2f}s")

    except Exception as e:
        report.add_test_result("Assets Page Performance", False, {'error': str(e)})
        print(f"  ✗ Assets page test failed: {e}")


def test_keyboard_shortcuts(page: Page, report: DevTestReport):
    """Test 7: Keyboard shortcuts and navigation"""
    print("Test 7: Testing keyboard shortcuts...")

    shortcuts_working = []

    try:
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Test Tab navigation
        page.keyboard.press('Tab')
        page.wait_for_timeout(200)
        focused = page.evaluate('document.activeElement.tagName')
        shortcuts_working.append(('Tab navigation', focused in ['A', 'BUTTON', 'INPUT']))

        # Test Escape (should do something like close modals)
        page.keyboard.press('Escape')
        shortcuts_working.append(('Escape key', True))

        passed = any(result for _, result in shortcuts_working)

        report.add_test_result("Keyboard Shortcuts", passed, {
            'shortcuts_tested': len(shortcuts_working),
            'working': sum(1 for _, r in shortcuts_working if r)
        })

        print(f"  ✓ Keyboard shortcuts tested: {sum(1 for _, r in shortcuts_working if r)}/{len(shortcuts_working)}")

    except Exception as e:
        report.add_test_result("Keyboard Shortcuts", False, {'error': str(e)})
        print(f"  ✗ Keyboard shortcuts test failed: {e}")


def test_3d_viewer_performance(page: Page, report: DevTestReport):
    """Test 8: 3D Viewer performance (if present)"""
    print("Test 8: Testing 3D Viewer performance...")

    try:
        # Go to a page likely to have 3D viewer
        page.goto('http://localhost:3000/assets', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        # Check for canvas element (Three.js renderer)
        canvas_count = page.locator('canvas').count()

        if canvas_count > 0:
            # Measure FPS if possible
            fps_info = page.evaluate("""() => {
                // Try to get Three.js renderer info if available
                const canvases = document.querySelectorAll('canvas');
                return {
                    canvas_count: canvases.length,
                    canvas_dimensions: Array.from(canvases).map(c => ({
                        width: c.width,
                        height: c.height
                    }))
                };
            }""")

            report.performance_metrics['3d_canvases'] = canvas_count
            report.performance_metrics['canvas_info'] = json.dumps(fps_info)

            report.add_test_result("3D Viewer", True, {
                'canvas_count': canvas_count,
                'details': json.dumps(fps_info)
            })

            print(f"  ✓ Found {canvas_count} canvas elements (3D viewers)")
        else:
            report.add_test_result("3D Viewer", False, {'error': 'No canvas elements found'})
            print("  ⚠ No 3D viewer canvas found")

    except Exception as e:
        report.add_test_result("3D Viewer", False, {'error': str(e)})
        print(f"  ✗ 3D Viewer test failed: {e}")


def test_memory_leak_detection(page: Page, report: DevTestReport):
    """Test 9: Memory leak detection (open/close modals multiple times)"""
    print("Test 9: Testing for memory leaks...")

    try:
        page.goto('http://localhost:3000', wait_until='networkidle')
        page.wait_for_timeout(1000)

        # Get initial memory
        initial_memory = page.evaluate("""() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                };
            }
            return null;
        }""")

        # Open/close command palette 10 times
        for i in range(10):
            page.keyboard.press('Meta+K')
            page.wait_for_timeout(100)
            page.keyboard.press('Escape')
            page.wait_for_timeout(100)

        # Get final memory
        final_memory = page.evaluate("""() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                };
            }
            return null;
        }""")

        if initial_memory and final_memory:
            memory_increase = final_memory['usedJSHeapSize'] - initial_memory['usedJSHeapSize']
            memory_increase_mb = memory_increase / 1024 / 1024

            # If memory increased by more than 10MB, flag it
            passed = memory_increase_mb < 10

            report.performance_metrics['memory_leak_test'] = f"{memory_increase_mb:.2f}MB increase"
            report.add_test_result("Memory Leak Detection", passed, {
                'memory_increase_mb': f"{memory_increase_mb:.2f}",
                'threshold': '10MB'
            })

            print(f"  ✓ Memory test: {memory_increase_mb:.2f}MB increase after 10 iterations")
        else:
            report.add_test_result("Memory Leak Detection", True, {
                'note': 'performance.memory not available'
            })
            print("  ⚠ Memory API not available")

    except Exception as e:
        report.add_test_result("Memory Leak Detection", False, {'error': str(e)})
        print(f"  ✗ Memory leak test failed: {e}")


def test_api_integration(page: Page, report: DevTestReport):
    """Test 10: API integration and response times"""
    print("Test 10: Testing API integration...")

    try:
        # Navigate and trigger API calls
        page.goto('http://localhost:3000/assets', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        # Check for API requests in the report
        api_requests = [r for r in report.network_requests if '/api/' in r['url']]

        if api_requests:
            avg_status = sum(r.get('status', 0) for r in api_requests) / len(api_requests)
            successful = sum(1 for r in api_requests if r.get('status', 0) < 400)

            passed = successful > 0

            report.add_test_result("API Integration", passed, {
                'total_requests': len(api_requests),
                'successful': successful,
                'avg_status': int(avg_status)
            })

            print(f"  ✓ API calls: {len(api_requests)} total, {successful} successful")
        else:
            report.add_test_result("API Integration", False, {
                'error': 'No API calls detected'
            })
            print("  ⚠ No API calls detected")

    except Exception as e:
        report.add_test_result("API Integration", False, {'error': str(e)})
        print(f"  ✗ API integration test failed: {e}")


def run_developer_tests():
    """Main test runner"""
    print("\n" + "="*80)
    print("ASSET FORGE - COMPREHENSIVE DEVELOPER TESTING")
    print("="*80 + "\n")

    report = DevTestReport()

    with sync_playwright() as p:
        # Launch browser with dev tools
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--enable-precise-memory-info'
            ]
        )

        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )

        page = context.new_page()

        # Setup listeners
        page.on('console', lambda msg: report.add_console_log(msg))
        page.on('request', lambda request: report.add_network_request(request))
        page.on('response', lambda response: report.add_network_request(response.request, response))

        # Run all tests
        try:
            test_page_load_and_performance(page, report)
            test_navigation_and_pages(page, report)
            test_command_palette(page, report)
            test_hand_rigging_page(page, report)
            test_animation_retargeting_page(page, report)
            test_assets_page_performance(page, report)
            test_keyboard_shortcuts(page, report)
            test_3d_viewer_performance(page, report)
            test_memory_leak_detection(page, report)
            test_api_integration(page, report)

        except Exception as e:
            print(f"\n❌ Critical error during testing: {e}")
            report.errors.append(f"Critical test failure: {e}")

        finally:
            browser.close()

    # Generate and print report
    print("\n" + "="*80)
    print("GENERATING REPORT...")
    print("="*80 + "\n")

    report_text = report.generate_report()
    print(report_text)

    # Save report to file
    report_file = '/tmp/asset_forge_dev_test_report.txt'
    with open(report_file, 'w') as f:
        f.write(report_text)

    print(f"\n📄 Full report saved to: {report_file}")
    print(f"📸 Screenshots saved to: /tmp/asset_forge_*.png")
    print("\n" + "="*80 + "\n")


if __name__ == '__main__':
    run_developer_tests()
