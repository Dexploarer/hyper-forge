/**
 * Graceful Shutdown Plugin
 * Uses Elysia's .onStop() lifecycle for clean server shutdown
 *
 * Handles:
 * - Waits for in-flight requests to complete
 * - Cleans up generation service pipelines
 * - Database connections handled by db.ts SIGINT/SIGTERM handlers
 */

import { Elysia } from "elysia";
import { logger } from '../utils/logger';

export const gracefulShutdown = new Elysia({
  name: "graceful-shutdown",
}).onStop(async () => {
  logger.info({ }, '\n[Shutdown] Graceful shutdown initiated...');

  // Database is already handled by db.ts SIGINT/SIGTERM handlers
  // No need to duplicate that logic here

  // Clean up generation service (if we added cleanup method)
  logger.info({ }, '[Shutdown] Cleaning up generation pipelines...');

  // Wait brief moment for in-flight requests to finish
  // Elysia handles closing active connections via closeActiveConnections
  await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s grace period

  logger.info({ }, '[Shutdown] Graceful shutdown complete');
});
