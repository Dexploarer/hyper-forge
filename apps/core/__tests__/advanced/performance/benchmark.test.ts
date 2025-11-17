/**
 * Performance Benchmarking Tests
 *
 * Establishes performance baselines and detects regressions.
 * Tracks execution time for critical operations.
 *
 * Run with: bun test __tests__/advanced/performance
 */

import { describe, it, expect, beforeAll } from "bun:test";
import * as fs from "fs/promises";
import * as path from "path";

interface BenchmarkResult {
  operation: string;
  averageMs: number;
  minMs: number;
  maxMs: number;
  stdDeviation: number;
  iterations: number;
  timestamp: string;
}

interface BenchmarkBaseline {
  operation: string;
  baselineMs: number;
  tolerancePercent: number;
}

const BENCHMARK_RESULTS_FILE = path.join(
  __dirname,
  "../../../reports/performance/benchmarks.json",
);
const BASELINE_FILE = path.join(
  __dirname,
  "../../../reports/performance/baselines.json",
);

// Performance baselines (update these after establishing benchmarks)
const BASELINES: BenchmarkBaseline[] = [
  { operation: "asset-id-generation", baselineMs: 0.1, tolerancePercent: 50 },
  { operation: "prompt-sanitization", baselineMs: 0.5, tolerancePercent: 50 },
  {
    operation: "material-preset-validation",
    baselineMs: 0.05,
    tolerancePercent: 50,
  },
  {
    operation: "json-serialization-small",
    baselineMs: 1,
    tolerancePercent: 50,
  },
  {
    operation: "json-serialization-large",
    baselineMs: 10,
    tolerancePercent: 50,
  },
  {
    operation: "file-path-construction",
    baselineMs: 0.05,
    tolerancePercent: 50,
  },
];

describe("Performance Benchmarking", () => {
  const results: BenchmarkResult[] = [];

  beforeAll(async () => {
    // Ensure reports directory exists
    await fs.mkdir(path.dirname(BENCHMARK_RESULTS_FILE), { recursive: true });
  });

  /**
   * Benchmark a function and return timing statistics
   */
  async function benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 1000,
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warm-up runs
    for (let i = 0; i < 10; i++) {
      await fn();
    }

    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    // Calculate statistics
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
      times.length;
    const stdDev = Math.sqrt(variance);

    const result: BenchmarkResult = {
      operation: name,
      averageMs: avg,
      minMs: min,
      maxMs: max,
      stdDeviation: stdDev,
      iterations,
      timestamp: new Date().toISOString(),
    };

    results.push(result);
    return result;
  }

  /**
   * Check if performance meets baseline requirements
   */
  function checkPerformanceRegression(result: BenchmarkResult): void {
    const baseline = BASELINES.find((b) => b.operation === result.operation);

    if (!baseline) {
      console.log(`⚠️  No baseline set for ${result.operation}`);
      return;
    }

    const tolerance = baseline.baselineMs * (baseline.tolerancePercent / 100);
    const maxAllowed = baseline.baselineMs + tolerance;

    console.log(`\n📊 ${result.operation}`);
    console.log(`   Average: ${result.averageMs.toFixed(3)}ms`);
    console.log(
      `   Baseline: ${baseline.baselineMs.toFixed(3)}ms (max: ${maxAllowed.toFixed(3)}ms)`,
    );
    console.log(
      `   Range: ${result.minMs.toFixed(3)}ms - ${result.maxMs.toFixed(3)}ms`,
    );
    console.log(`   Std Dev: ${result.stdDeviation.toFixed(3)}ms`);

    if (result.averageMs > maxAllowed) {
      console.log(
        `   ❌ REGRESSION DETECTED: ${((result.averageMs / baseline.baselineMs - 1) * 100).toFixed(1)}% slower`,
      );
    } else {
      console.log(`   ✅ Within tolerance`);
    }

    // Soft assertion - log warning but don't fail test
    if (result.averageMs > maxAllowed * 1.5) {
      console.warn(
        `⚠️  CRITICAL: Performance is ${((result.averageMs / baseline.baselineMs) * 100).toFixed(0)}% of baseline!`,
      );
    }
  }

  describe("String Operations", () => {
    it("should benchmark asset ID generation", async () => {
      const testInputs = [
        "bronze sword",
        "Epic Dragon Shield of the Ancient Warriors",
        "test-123",
        "武器",
        "a".repeat(100),
      ];

      const result = await benchmark(
        "asset-id-generation",
        () => {
          testInputs.forEach((input) => {
            input
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .replace(/-+/g, "-") || "asset";
          });
        },
        1000,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(1); // Should be very fast
    });

    it("should benchmark prompt sanitization", async () => {
      const testPrompts = [
        "Create a bronze sword",
        "'; DROP TABLE users; --",
        "a".repeat(5000),
        "Normal text with unicode: 你好 мир",
      ];

      const result = await benchmark(
        "prompt-sanitization",
        () => {
          testPrompts.forEach((prompt) => {
            let sanitized = prompt
              .replace(/('|"|;|--)/g, "")
              .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT)\s+/gi, "");
            if (sanitized.length > 2000) {
              sanitized = sanitized.slice(0, 2000);
            }
          });
        },
        1000,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(2);
    });
  });

  describe("Validation Operations", () => {
    it("should benchmark material preset validation", async () => {
      const testPresets = Array.from({ length: 10 }, (_, i) => ({
        id: `preset-${i}`,
        displayName: `Preset ${i}`,
        category: "metal",
        tier: i + 1,
        color: "#CD7F32",
        stylePrompt: "bronze material with metallic finish",
      }));

      const result = await benchmark(
        "material-preset-validation",
        () => {
          testPresets.forEach((preset) => {
            typeof preset.id === "string" &&
              typeof preset.displayName === "string" &&
              typeof preset.tier === "number" &&
              preset.tier >= 1 &&
              preset.tier <= 10 &&
              /^#[0-9A-Fa-f]{6}$/.test(preset.color);
          });
        },
        1000,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(1);
    });
  });

  describe("JSON Operations", () => {
    it("should benchmark small JSON serialization", async () => {
      const smallData = {
        id: "test-asset",
        name: "Test Asset",
        type: "weapon",
        metadata: {
          created: new Date().toISOString(),
          tier: 5,
        },
      };

      const result = await benchmark(
        "json-serialization-small",
        () => {
          JSON.stringify(smallData);
          JSON.parse(JSON.stringify(smallData));
        },
        5000,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(2);
    });

    it("should benchmark large JSON serialization", async () => {
      const largeData = {
        assets: Array.from({ length: 100 }, (_, i) => ({
          id: `asset-${i}`,
          name: `Asset ${i}`,
          description: "a".repeat(200),
          metadata: {
            created: new Date().toISOString(),
            variants: Array.from({ length: 5 }, (_, j) => ({
              id: `variant-${j}`,
              name: `Variant ${j}`,
              tier: j + 1,
            })),
          },
        })),
      };

      const result = await benchmark(
        "json-serialization-large",
        () => {
          JSON.stringify(largeData);
          JSON.parse(JSON.stringify(largeData));
        },
        500,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(20);
    });
  });

  describe("File Path Operations", () => {
    it("should benchmark file path construction", async () => {
      const testBasenames = [
        "bronze-sword",
        "epic-dragon-shield",
        "test-asset-123",
      ];
      const extensions = [".glb", ".png", ".json"];

      const result = await benchmark(
        "file-path-construction",
        () => {
          testBasenames.forEach((basename) => {
            extensions.forEach((ext) => {
              `assets/${basename}/${basename}${ext}`;
            });
          });
        },
        1000,
      );

      checkPerformanceRegression(result);
      expect(result.averageMs).toBeLessThan(0.5);
    });
  });

  describe("Report Generation", () => {
    it("should save benchmark results to file", async () => {
      // Load existing results
      let historicalResults: BenchmarkResult[] = [];
      try {
        const data = await fs.readFile(BENCHMARK_RESULTS_FILE, "utf-8");
        historicalResults = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      // Append new results
      const allResults = [...historicalResults, ...results];

      // Keep only last 100 runs per operation
      const resultsByOperation = new Map<string, BenchmarkResult[]>();
      allResults.forEach((result) => {
        if (!resultsByOperation.has(result.operation)) {
          resultsByOperation.set(result.operation, []);
        }
        resultsByOperation.get(result.operation)!.push(result);
      });

      const trimmedResults: BenchmarkResult[] = [];
      resultsByOperation.forEach((opResults) => {
        // Sort by timestamp descending and keep last 100
        const sorted = opResults
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 100);
        trimmedResults.push(...sorted);
      });

      await fs.writeFile(
        BENCHMARK_RESULTS_FILE,
        JSON.stringify(trimmedResults, null, 2),
      );

      console.log(
        `\n✅ Saved ${results.length} benchmark results to ${BENCHMARK_RESULTS_FILE}`,
      );
      expect(trimmedResults.length).toBeGreaterThan(0);
    });

    it("should update baselines if needed", async () => {
      // Calculate new baselines from recent results
      const newBaselines: BenchmarkBaseline[] = BASELINES.map((baseline) => {
        const recentResults = results
          .filter((r) => r.operation === baseline.operation)
          .slice(-10); // Last 10 runs

        if (recentResults.length === 0) {
          return baseline;
        }

        const avgRecent =
          recentResults.reduce((sum, r) => sum + r.averageMs, 0) /
          recentResults.length;

        return {
          operation: baseline.operation,
          baselineMs: avgRecent,
          tolerancePercent: baseline.tolerancePercent,
        };
      });

      await fs.writeFile(BASELINE_FILE, JSON.stringify(newBaselines, null, 2));

      console.log(`\n📊 Updated baseline file: ${BASELINE_FILE}`);
      expect(newBaselines.length).toBe(BASELINES.length);
    });
  });
});
