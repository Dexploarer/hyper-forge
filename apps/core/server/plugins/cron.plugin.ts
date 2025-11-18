/**
 * Cron Jobs Plugin for Elysia
 * Consolidates all scheduled background jobs
 *
 * Jobs:
 * - cleanup-expired-jobs: Cleanup expired and old failed generation jobs (hourly)
 * - aggregate-errors: Aggregate API errors for analytics (hourly at :05)
 * - cleanup-old-errors: Delete old error logs and aggregations (daily at 2 AM)
 * - cleanup-disk-space: Clean up temporary files and caches (daily at 3 AM)
 *
 * Uses @elysiajs/cron for scheduling
 */

import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { logger } from "../utils/logger";
import { generationPipelineService } from "../services/GenerationPipelineService";

/**
 * Cron Jobs Plugin
 * Registers all scheduled background tasks
 */
// @ts-ignore TS2742 - Transitive dependency croner causes non-portable type (safe to ignore)
export const cronPlugin = new Elysia({ name: "cron" })
  // Cleanup expired and old failed generation jobs every hour
  .use(
    cron({
      name: "cleanup-expired-jobs",
      pattern: "0 * * * *", // Every hour
      async run() {
        logger.info({}, "[Cron] Running job cleanup...");
        const expiredCount = await generationPipelineService.cleanupExpiredJobs();
        const failedCount = await generationPipelineService.cleanupOldFailedJobs();
        logger.info(
          { expiredCount, failedCount },
          "Cleaned up expired and old failed jobs",
        );
      },
    }),
  )

  // Aggregate API errors for analytics every hour at :05
  .use(
    cron({
      name: "aggregate-errors",
      pattern: "5 * * * *", // Every hour at :05 (offset to avoid collision)
      async run() {
        logger.info({}, "[Cron] Running error aggregation...");
        const { aggregateErrors } = await import("../cron/error-aggregation");
        try {
          const result = await aggregateErrors();
          logger.info(
            {
              totalAggregations: result.totalAggregations,
              inserted: result.inserted,
              updated: result.updated,
            },
            "Error aggregation completed",
          );
        } catch (error) {
          logger.error({ err: error }, "Error aggregation failed");
        }
      },
    }),
  )

  // Cleanup old error logs and aggregations daily at 2 AM
  .use(
    cron({
      name: "cleanup-old-errors",
      pattern: "0 2 * * *", // Daily at 2 AM
      async run() {
        logger.info({}, "[Cron] Running error cleanup...");
        const { cleanupOldErrors, cleanupOldAggregations } = await import(
          "../cron/error-aggregation"
        );
        try {
          const errorsResult = await cleanupOldErrors();
          const aggsResult = await cleanupOldAggregations();
          logger.info(
            {
              errorsDeleted: errorsResult.deletedCount,
              aggregationsDeleted: aggsResult.deletedCount,
            },
            "Error cleanup completed",
          );
        } catch (error) {
          logger.error({ err: error }, "Error cleanup failed");
        }
      },
    }),
  )

  // Cleanup disk space daily at 3 AM
  .use(
    cron({
      name: "cleanup-disk-space",
      pattern: "0 3 * * *", // Daily at 3 AM
      async run() {
        logger.info({}, "[Cron] Running disk space cleanup...");
        try {
          // Run the cleanup script
          const proc = Bun.spawn(["bash", "scripts/quick-cleanup.sh"], {
            cwd: process.cwd(),
            stdout: "pipe",
            stderr: "pipe",
          });

          const output = await new Response(proc.stdout).text();
          const exitCode = await proc.exited;

          if (exitCode === 0) {
            logger.info({ output }, "Disk cleanup completed successfully");
          } else {
            const errorOutput = await new Response(proc.stderr).text();
            logger.error({ exitCode, errorOutput }, "Disk cleanup failed");
          }
        } catch (error) {
          logger.error({ err: error }, "Disk cleanup failed");
        }
      },
    }),
  );
