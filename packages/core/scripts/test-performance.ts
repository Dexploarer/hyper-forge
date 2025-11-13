#!/usr/bin/env bun

/**
 * Test Performance Monitor
 * Tracks test execution times and generates performance reports
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface TestResult {
  name: string;
  duration: number;
  status: "pass" | "fail" | "skip";
  file: string;
}

interface PerformanceReport {
  timestamp: string;
  totalTests: number;
  totalDuration: number;
  averageDuration: number;
  slowestTests: TestResult[];
  failedTests: TestResult[];
  baseline?: {
    totalDuration: number;
    averageDuration: number;
  };
  performanceChange?: {
    totalChange: number;
    averageChange: number;
    status: "improved" | "degraded" | "stable";
  };
}

// Thresholds
const SLOW_TEST_THRESHOLD = 5000; // 5 seconds
const VERY_SLOW_TEST_THRESHOLD = 10000; // 10 seconds
const PERFORMANCE_DEGRADATION_THRESHOLD = 10; // 10% slower is concerning

/**
 * Parse test results from Bun test output
 */
function parseTestResults(): TestResult[] {
  const results: TestResult[] = [];

  // In a real implementation, you'd parse the actual test output
  // For now, we'll create a placeholder structure
  console.log("📊 Parsing test results...");

  // Look for test result files
  const testResultFiles = [
    "test-results.json",
    "playwright-report/results.json",
  ];

  for (const file of testResultFiles) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        // Parse results based on format
        console.log(`Found test results in ${file}`);
      } catch (error) {
        console.warn(`Could not parse ${file}:`, error);
      }
    }
  }

  return results;
}

/**
 * Load baseline performance data
 */
function loadBaseline(): PerformanceReport | null {
  const baselinePath = join(
    process.cwd(),
    ".test-performance",
    "baseline.json",
  );

  if (existsSync(baselinePath)) {
    try {
      return JSON.parse(readFileSync(baselinePath, "utf-8"));
    } catch (error) {
      console.warn("Could not load baseline:", error);
    }
  }

  return null;
}

/**
 * Save baseline performance data
 */
function saveBaseline(report: PerformanceReport) {
  const baselineDir = join(process.cwd(), ".test-performance");
  if (!existsSync(baselineDir)) {
    mkdirSync(baselineDir, { recursive: true });
  }

  const baselinePath = join(baselineDir, "baseline.json");
  writeFileSync(baselinePath, JSON.stringify(report, null, 2));
  console.log(`✅ Baseline saved to ${baselinePath}`);
}

/**
 * Generate performance report
 */
function generateReport(results: TestResult[]): PerformanceReport {
  const totalTests = results.length;
  const totalDuration = results.reduce((sum, test) => sum + test.duration, 0);
  const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

  // Find slowest tests
  const slowestTests = [...results]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Find failed tests
  const failedTests = results.filter((test) => test.status === "fail");

  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    totalTests,
    totalDuration,
    averageDuration,
    slowestTests,
    failedTests,
  };

  // Compare with baseline
  const baseline = loadBaseline();
  if (baseline) {
    const totalChange =
      ((totalDuration - baseline.totalDuration) / baseline.totalDuration) * 100;
    const averageChange =
      ((averageDuration - baseline.averageDuration) /
        baseline.averageDuration) *
      100;

    report.baseline = {
      totalDuration: baseline.totalDuration,
      averageDuration: baseline.averageDuration,
    };

    report.performanceChange = {
      totalChange,
      averageChange,
      status:
        Math.abs(totalChange) < 5
          ? "stable"
          : totalChange > 0
            ? "degraded"
            : "improved",
    };
  }

  return report;
}

/**
 * Print performance report
 */
function printReport(report: PerformanceReport) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST PERFORMANCE REPORT");
  console.log("=".repeat(60));

  console.log(`\n📅 Generated: ${report.timestamp}`);
  console.log(`📝 Total Tests: ${report.totalTests}`);
  console.log(
    `⏱️  Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s`,
  );
  console.log(
    `⏱️  Average Duration: ${(report.averageDuration / 1000).toFixed(2)}s`,
  );

  // Performance comparison
  if (report.performanceChange) {
    const change = report.performanceChange;
    const emoji =
      change.status === "improved"
        ? "🚀"
        : change.status === "degraded"
          ? "⚠️"
          : "✓";

    console.log(`\n${emoji} Performance vs Baseline:`);
    console.log(
      `   Total: ${change.totalChange > 0 ? "+" : ""}${change.totalChange.toFixed(2)}%`,
    );
    console.log(
      `   Average: ${change.averageChange > 0 ? "+" : ""}${change.averageChange.toFixed(2)}%`,
    );

    if (
      change.status === "degraded" &&
      Math.abs(change.totalChange) > PERFORMANCE_DEGRADATION_THRESHOLD
    ) {
      console.log(
        `\n⚠️  WARNING: Test performance has degraded by ${Math.abs(change.totalChange).toFixed(2)}%`,
      );
      console.log(
        "   Consider investigating slow tests or optimizing test setup.",
      );
    }
  }

  // Slowest tests
  if (report.slowestTests.length > 0) {
    console.log(`\n🐌 Slowest Tests (Top 10):`);
    report.slowestTests.forEach((test, index) => {
      const duration = (test.duration / 1000).toFixed(2);
      const emoji =
        test.duration > VERY_SLOW_TEST_THRESHOLD
          ? "🔴"
          : test.duration > SLOW_TEST_THRESHOLD
            ? "🟡"
            : "🟢";

      console.log(`   ${index + 1}. ${emoji} ${test.name} - ${duration}s`);
      console.log(`      File: ${test.file}`);
    });
  }

  // Failed tests
  if (report.failedTests.length > 0) {
    console.log(`\n❌ Failed Tests: ${report.failedTests.length}`);
    report.failedTests.forEach((test) => {
      console.log(`   - ${test.name} (${test.file})`);
    });
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Save report to file
 */
function saveReport(report: PerformanceReport) {
  const reportsDir = join(process.cwd(), ".test-performance", "reports");
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  // Save timestamped report
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = join(reportsDir, `report-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save latest report
  const latestPath = join(reportsDir, "latest.json");
  writeFileSync(latestPath, JSON.stringify(report, null, 2));

  console.log(`📁 Report saved to ${reportPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "baseline") {
    console.log("📊 Setting new baseline...");
    const results = parseTestResults();
    const report = generateReport(results);
    saveBaseline(report);
    console.log("✅ Baseline set successfully");
    return;
  }

  console.log("📊 Analyzing test performance...");

  const results = parseTestResults();
  const report = generateReport(results);

  printReport(report);
  saveReport(report);

  // Exit with error if performance degraded significantly
  if (
    report.performanceChange &&
    report.performanceChange.status === "degraded" &&
    Math.abs(report.performanceChange.totalChange) >
      PERFORMANCE_DEGRADATION_THRESHOLD
  ) {
    console.error(
      "\n❌ Test performance has degraded significantly. Please investigate.",
    );
    process.exit(1);
  }

  console.log("✅ Performance monitoring complete");
}

// Run main function
main().catch((error) => {
  console.error("Error running performance monitor:", error);
  process.exit(1);
});
