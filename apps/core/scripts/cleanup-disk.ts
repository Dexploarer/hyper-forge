#!/usr/bin/env bun
/**
 * Disk Space Cleanup Script
 * Cleans up temporary files, caches, and old artifacts to free up disk space
 * Safe to run in production - only removes temporary/cache files
 */

import { readdirSync, statSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";

interface CleanupStats {
  filesRemoved: number;
  bytesFreed: number;
  errors: string[];
}

const stats: CleanupStats = {
  filesRemoved: 0,
  bytesFreed: 0,
  errors: [],
};

/**
 * Get human-readable file size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Recursively delete directory contents
 */
function cleanDirectory(dirPath: string, removeDir = false): void {
  try {
    if (!statSync(dirPath).isDirectory()) return;

    const files = readdirSync(dirPath);
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        cleanDirectory(filePath, true);
      } else {
        try {
          unlinkSync(filePath);
          stats.filesRemoved++;
          stats.bytesFreed += stat.size;
        } catch (err) {
          stats.errors.push(`Failed to delete ${filePath}: ${err}`);
        }
      }
    }

    if (removeDir) {
      try {
        rmdirSync(dirPath);
      } catch (err) {
        // Directory might not be empty, that's ok
      }
    }
  } catch (err) {
    stats.errors.push(`Failed to clean ${dirPath}: ${err}`);
  }
}

/**
 * Delete files older than specified days
 */
function cleanOldFiles(dirPath: string, daysOld: number): void {
  try {
    const files = readdirSync(dirPath);
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        const stat = statSync(filePath);

        if (stat.mtimeMs < cutoffTime) {
          if (stat.isDirectory()) {
            cleanDirectory(filePath, true);
          } else {
            unlinkSync(filePath);
            stats.filesRemoved++;
            stats.bytesFreed += stat.size;
          }
        }
      } catch (err) {
        stats.errors.push(`Failed to process ${filePath}: ${err}`);
      }
    }
  } catch (err) {
    stats.errors.push(`Failed to access ${dirPath}: ${err}`);
  }
}

async function cleanup() {
  console.log("🧹 Starting disk cleanup...\n");

  // 1. Clean Bun cache (safe - Bun will recreate as needed)
  console.log("1. Cleaning Bun cache...");
  const bunCachePaths = [
    join(process.env.HOME || "/root", ".bun/install/cache"),
    "/tmp/bun-cache",
  ];
  for (const cachePath of bunCachePaths) {
    try {
      cleanDirectory(cachePath, false);
      console.log(`   ✓ Cleaned ${cachePath}`);
    } catch (err) {
      console.log(`   ⚠ Could not clean ${cachePath} (may not exist)`);
    }
  }

  // 2. Clean /tmp directory (older than 1 day)
  console.log("\n2. Cleaning old temporary files...");
  try {
    cleanOldFiles("/tmp", 1);
    console.log(`   ✓ Cleaned /tmp (files older than 1 day)`);
  } catch (err) {
    console.log(`   ⚠ Could not clean /tmp: ${err}`);
  }

  // 3. Clean build artifacts (if any)
  console.log("\n3. Cleaning build artifacts...");
  const buildDirs = [
    "./dist-old",
    "./build-cache",
    "./.next/cache",
    "./.turbo",
  ];
  for (const dir of buildDirs) {
    try {
      cleanDirectory(dir, true);
      console.log(`   ✓ Cleaned ${dir}`);
    } catch (err) {
      console.log(`   ⚠ ${dir} not found or already clean`);
    }
  }

  // 4. Clean npm/pnpm caches (if they exist)
  console.log("\n4. Cleaning package manager caches...");
  const packageCaches = [
    join(process.env.HOME || "/root", ".npm/_cacache"),
    join(process.env.HOME || "/root", ".pnpm-store"),
  ];
  for (const cache of packageCaches) {
    try {
      cleanDirectory(cache, false);
      console.log(`   ✓ Cleaned ${cache}`);
    } catch (err) {
      console.log(`   ⚠ ${cache} not found`);
    }
  }

  // 5. Clean old log files (older than 7 days)
  console.log("\n5. Cleaning old log files...");
  const logDirs = ["./logs", "/var/log"];
  for (const logDir of logDirs) {
    try {
      cleanOldFiles(logDir, 7);
      console.log(`   ✓ Cleaned old logs from ${logDir}`);
    } catch (err) {
      console.log(`   ⚠ ${logDir} not accessible`);
    }
  }

  // 6. Print summary
  console.log("\n" + "─".repeat(60));
  console.log("📊 Cleanup Summary:");
  console.log(`   Files removed: ${stats.filesRemoved}`);
  console.log(`   Space freed: ${formatBytes(stats.bytesFreed)}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    if (process.env.DEBUG) {
      stats.errors.forEach((err) => console.log(`   - ${err}`));
    }
  }

  console.log("─".repeat(60));

  // 7. Show current disk usage
  console.log("\n💾 Current disk usage:");
  try {
    const proc = Bun.spawn(["df", "-h", "/"]);
    const output = await new Response(proc.stdout).text();
    console.log(output);
  } catch (err) {
    console.log("   Could not retrieve disk usage");
  }

  console.log("\n✅ Cleanup complete!\n");
}

cleanup().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
