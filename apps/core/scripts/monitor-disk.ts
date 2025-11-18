#!/usr/bin/env bun
/**
 * Disk Space Monitoring Script
 * Checks disk usage and alerts if it exceeds thresholds
 * Can be run manually or as part of health checks
 */

import { logger } from "../server/utils/logger";

interface DiskUsage {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usagePercent: number;
  mountPoint: string;
}

const THRESHOLDS = {
  WARNING: 80, // Warn at 80% usage
  CRITICAL: 90, // Critical at 90% usage
  EMERGENCY: 95, // Emergency at 95% usage
};

/**
 * Parse df output and extract disk usage information
 */
async function getDiskUsage(): Promise<DiskUsage | null> {
  try {
    const proc = Bun.spawn(["df", "-h", "/"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    const lines = output.trim().split("\n");

    // Skip header line
    if (lines.length < 2) {
      logger.error({}, "Failed to parse df output");
      return null;
    }

    const dataLine = lines[1].trim().split(/\s+/);
    if (dataLine.length < 6) {
      logger.error({}, "Invalid df output format");
      return null;
    }

    const usagePercentStr = dataLine[4].replace("%", "");
    const usagePercent = parseInt(usagePercentStr, 10);

    return {
      filesystem: dataLine[0],
      size: dataLine[1],
      used: dataLine[2],
      available: dataLine[3],
      usagePercent,
      mountPoint: dataLine[5],
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to get disk usage");
    return null;
  }
}

/**
 * Check disk usage and return status
 */
function checkDiskStatus(usage: DiskUsage): {
  status: "OK" | "WARNING" | "CRITICAL" | "EMERGENCY";
  message: string;
  shouldCleanup: boolean;
} {
  const { usagePercent, available } = usage;

  if (usagePercent >= THRESHOLDS.EMERGENCY) {
    return {
      status: "EMERGENCY",
      message: `EMERGENCY: Disk usage at ${usagePercent}% (${available} free). Immediate cleanup required!`,
      shouldCleanup: true,
    };
  }

  if (usagePercent >= THRESHOLDS.CRITICAL) {
    return {
      status: "CRITICAL",
      message: `CRITICAL: Disk usage at ${usagePercent}% (${available} free). Cleanup recommended.`,
      shouldCleanup: true,
    };
  }

  if (usagePercent >= THRESHOLDS.WARNING) {
    return {
      status: "WARNING",
      message: `WARNING: Disk usage at ${usagePercent}% (${available} free). Monitor closely.`,
      shouldCleanup: false,
    };
  }

  return {
    status: "OK",
    message: `Disk usage at ${usagePercent}% (${available} free). All good!`,
    shouldCleanup: false,
  };
}

/**
 * Main monitoring function
 */
async function monitorDisk() {
  console.log("💾 Disk Space Monitor\n");
  console.log("─".repeat(60));

  const usage = await getDiskUsage();
  if (!usage) {
    console.error("❌ Failed to get disk usage");
    process.exit(1);
  }

  console.log(`Filesystem: ${usage.filesystem}`);
  console.log(`Total Size: ${usage.size}`);
  console.log(`Used:       ${usage.used}`);
  console.log(`Available:  ${usage.available}`);
  console.log(`Usage:      ${usage.usagePercent}%`);
  console.log(`Mount:      ${usage.mountPoint}`);

  console.log("\n" + "─".repeat(60));

  const status = checkDiskStatus(usage);

  // Print status with appropriate emoji
  const statusEmoji = {
    OK: "✅",
    WARNING: "⚠️",
    CRITICAL: "🔴",
    EMERGENCY: "🚨",
  }[status.status];

  console.log(`${statusEmoji} ${status.message}\n`);

  // Show thresholds
  console.log("Thresholds:");
  console.log(`  - Warning:   ${THRESHOLDS.WARNING}%`);
  console.log(`  - Critical:  ${THRESHOLDS.CRITICAL}%`);
  console.log(`  - Emergency: ${THRESHOLDS.EMERGENCY}%`);

  // Suggest cleanup if needed
  if (status.shouldCleanup) {
    console.log("\n" + "─".repeat(60));
    console.log("🧹 Recommended Actions:");
    console.log("  1. Run cleanup script: bun run cleanup:disk");
    console.log("  2. Or quick cleanup:   bash scripts/quick-cleanup.sh");
    console.log("  3. Check logs:         railway logs --service hyperforge");
    console.log("─".repeat(60));
  }

  // Exit with appropriate code
  if (status.status === "EMERGENCY") {
    process.exit(2); // Emergency exit code
  } else if (status.status === "CRITICAL") {
    process.exit(1); // Critical exit code
  } else {
    process.exit(0); // OK exit code
  }
}

// Export for use in other modules
export { getDiskUsage, checkDiskStatus, THRESHOLDS };

// Run if called directly
if (import.meta.main) {
  monitorDisk().catch((err) => {
    console.error("❌ Disk monitoring failed:", err);
    process.exit(1);
  });
}
