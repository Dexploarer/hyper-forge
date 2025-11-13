/**
 * 3D Viewer Performance Tests
 *
 * Tests for rendering performance, FPS, memory usage
 */

import { test, expect, type Page } from "@playwright/test";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://test-frontend:3000";

// Helper to measure FPS
async function measureFPS(
  page: Page,
  duration: number = 2000,
): Promise<number> {
  const fps = await page.evaluate((testDuration) => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      let lastTime = startTime;

      function countFrames() {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - startTime >= testDuration) {
          const totalTime = currentTime - startTime;
          const avgFPS = (frameCount / totalTime) * 1000;
          resolve(avgFPS);
        } else {
          requestAnimationFrame(countFrames);
        }

        lastTime = currentTime;
      }

      requestAnimationFrame(countFrames);
    });
  }, duration);

  return fps;
}

// Helper to measure memory usage
async function measureMemory(
  page: Page,
): Promise<{ used: number; total: number }> {
  const memory = await page.evaluate(() => {
    if ((performance as any).memory) {
      return {
        used: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
        total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
      };
    }
    return { used: 0, total: 0 };
  });

  return memory;
}

// Helper to wait for 3D viewer
async function wait3DViewerReady(page: Page) {
  await page.waitForSelector("canvas", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe("3D Viewer Performance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");
  });

  test("initial load time", async ({ page }) => {
    const startTime = Date.now();

    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const loadTime = Date.now() - startTime;

    console.log(`3D viewer load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });

  test("model loading time", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();

    const modelLoadStart = Date.now();
    await firstAsset.click();
    await wait3DViewerReady(page);
    const modelLoadTime = Date.now() - modelLoadStart;

    console.log(`Model load time: ${modelLoadTime}ms`);

    expect(modelLoadTime).toBeLessThan(5000); // Model should load within 5 seconds
  });

  test("idle rendering FPS", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const fps = await measureFPS(page, 3000);

    console.log(`Idle rendering FPS: ${fps.toFixed(2)}`);

    expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
    expect(fps).toBeLessThan(120); // Reasonable upper bound
  });

  test("FPS during camera rotation", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();

    if (box) {
      // Start rotating
      const rotationPromise = (async () => {
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 + 50,
            box.y + box.height / 2 + 50,
          );
          await page.mouse.up();
          await page.waitForTimeout(100);
        }
      })();

      // Measure FPS during rotation
      const fps = await measureFPS(page, 2000);

      await rotationPromise;

      console.log(`FPS during rotation: ${fps.toFixed(2)}`);

      expect(fps).toBeGreaterThan(20); // Should maintain at least 20 FPS during interaction
    }
  });

  test("memory usage - single model", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const memoryBefore = await measureMemory(page);

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const memoryAfter = await measureMemory(page);

    const memoryIncrease = memoryAfter.used - memoryBefore.used;

    console.log(`Memory before: ${memoryBefore.used.toFixed(2)}MB`);
    console.log(`Memory after: ${memoryAfter.used.toFixed(2)}MB`);
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

    // Model should not consume more than 200MB
    expect(memoryIncrease).toBeLessThan(200);
  });

  test("memory leak detection - multiple model loads", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const assetCards = page.locator('[data-testid="asset-card"], .asset-card');
    const count = Math.min(await assetCards.count(), 5);

    const memorySnapshots: number[] = [];

    for (let i = 0; i < count; i++) {
      await assetCards.nth(i).click();
      await wait3DViewerReady(page);

      const memory = await measureMemory(page);
      memorySnapshots.push(memory.used);

      console.log(`Memory after model ${i + 1}: ${memory.used.toFixed(2)}MB`);

      // Go back to list
      await page.goBack();
      await page.waitForTimeout(500);
    }

    // Check for memory leak pattern
    if (memorySnapshots.length >= 3) {
      const increases = [];
      for (let i = 1; i < memorySnapshots.length; i++) {
        increases.push(memorySnapshots[i] - memorySnapshots[i - 1]);
      }

      const avgIncrease =
        increases.reduce((a, b) => a + b, 0) / increases.length;

      console.log(
        `Average memory increase per model: ${avgIncrease.toFixed(2)}MB`,
      );

      // Average increase should not exceed 50MB (indicates proper cleanup)
      expect(avgIncrease).toBeLessThan(50);
    }
  });

  test("render time per frame", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const frameTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        let totalTime = 0;
        const maxFrames = 60;

        function measureFrame() {
          const start = performance.now();

          requestAnimationFrame(() => {
            const end = performance.now();
            totalTime += end - start;
            frameCount++;

            if (frameCount >= maxFrames) {
              resolve(totalTime / frameCount);
            } else {
              measureFrame();
            }
          });
        }

        measureFrame();
      });
    });

    console.log(`Average frame time: ${frameTime.toFixed(2)}ms`);
    console.log(`Equivalent FPS: ${(1000 / frameTime).toFixed(2)}`);

    // Frame time should be less than 33ms (30 FPS)
    expect(frameTime).toBeLessThan(33);
  });

  test("complex model performance", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const assetCards = page.locator('[data-testid="asset-card"], .asset-card');
    const count = await assetCards.count();

    let highestFPS = 0;
    let lowestFPS = Infinity;

    // Test up to 5 models
    for (let i = 0; i < Math.min(count, 5); i++) {
      await assetCards.nth(i).click();
      await wait3DViewerReady(page);

      const fps = await measureFPS(page, 2000);
      highestFPS = Math.max(highestFPS, fps);
      lowestFPS = Math.min(lowestFPS, fps);

      console.log(`Model ${i + 1} FPS: ${fps.toFixed(2)}`);

      await page.goBack();
      await page.waitForTimeout(500);
    }

    console.log(`Highest FPS: ${highestFPS.toFixed(2)}`);
    console.log(`Lowest FPS: ${lowestFPS.toFixed(2)}`);

    // Even the most complex model should maintain at least 15 FPS
    expect(lowestFPS).toBeGreaterThan(15);
  });

  test("texture loading impact", async ({ page }) => {
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();

    const loadStart = Date.now();
    await firstAsset.click();
    await wait3DViewerReady(page);
    const totalLoadTime = Date.now() - loadStart;

    // Wait for textures to fully load
    await page.waitForTimeout(2000);

    const canvas = page.locator("canvas").first();
    const finalLoadTime = Date.now() - loadStart;

    console.log(`Initial load: ${totalLoadTime}ms`);
    console.log(`With textures: ${finalLoadTime}ms`);

    // Total load with textures should be under 10 seconds
    expect(finalLoadTime).toBeLessThan(10000);
  });

  test("multiple viewport renders", async ({ page }) => {
    // Test if multiple 3D viewers on same page impact performance
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const singleViewerFPS = await measureFPS(page, 2000);
    console.log(`Single viewer FPS: ${singleViewerFPS.toFixed(2)}`);

    // If there are multiple canvases (unlikely but test anyway)
    const canvasCount = await page.locator("canvas").count();
    console.log(`Canvas count: ${canvasCount}`);

    expect(singleViewerFPS).toBeGreaterThan(30);
  });
});

test.describe("3D Viewer Performance Benchmarks", () => {
  test("establish baseline metrics", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    // Gather all metrics
    const metrics = {
      loadTime: 0,
      fps: 0,
      memoryUsed: 0,
      frameTime: 0,
    };

    const loadStart = Date.now();
    await page.reload();
    await wait3DViewerReady(page);
    metrics.loadTime = Date.now() - loadStart;

    metrics.fps = await measureFPS(page, 3000);
    const memory = await measureMemory(page);
    metrics.memoryUsed = memory.used;

    metrics.frameTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(end - start);
        });
      });
    });

    console.log("\n=== Performance Baseline ===");
    console.log(`Load Time: ${metrics.loadTime}ms`);
    console.log(`FPS: ${metrics.fps.toFixed(2)}`);
    console.log(`Memory: ${metrics.memoryUsed.toFixed(2)}MB`);
    console.log(`Frame Time: ${metrics.frameTime.toFixed(2)}ms`);
    console.log("===========================\n");

    // Save baseline to file for comparison
    expect(metrics.loadTime).toBeGreaterThan(0);
    expect(metrics.fps).toBeGreaterThan(0);
  });
});

test.describe("3D Viewer Stress Tests", () => {
  test("rapid camera movements", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();

    if (box) {
      const startTime = Date.now();

      // Perform 50 rapid camera movements
      for (let i = 0; i < 50; i++) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + Math.random() * 100 - 50,
          box.y + box.height / 2 + Math.random() * 100 - 50,
        );
        await page.mouse.up();
      }

      const totalTime = Date.now() - startTime;
      console.log(`50 camera movements in ${totalTime}ms`);
      console.log(`Average: ${(totalTime / 50).toFixed(2)}ms per movement`);

      // Should handle rapid interactions without crashing
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    }
  });

  test("rapid zoom in/out", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.click("text=Assets");
    await page.waitForLoadState("networkidle");

    const firstAsset = page
      .locator('[data-testid="asset-card"], .asset-card')
      .first();
    await firstAsset.click();
    await wait3DViewerReady(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      // Perform 20 rapid zoom operations
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, i % 2 === 0 ? -100 : 100);
        await page.waitForTimeout(50);
      }

      // Should handle rapid zoom without issues
      await expect(canvas).toBeVisible();
    }
  });
});
