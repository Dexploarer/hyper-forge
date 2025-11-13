/**
 * Performance Tracing Plugin
 * Uses Elysia's .trace() lifecycle for production metrics
 *
 * Features:
 * - Tracks request handling time
 * - Adds X-Response-Time header for monitoring tools
 * - Logs slow requests (>1s) for investigation
 * - Tracks errors with timing context
 */

import { Elysia } from "elysia";

export const performanceTracing = new Elysia({
  name: "performance-tracing",
}).trace(async ({ onHandle, onError, set }) => {
  // Track request handling time
  onHandle(({ onStop }) => {
    onStop(({ elapsed }) => {
      // Add timing header for monitoring (Prometheus, Datadog, etc can scrape this)
      set.headers["X-Response-Time"] = `${elapsed}ms`;

      // Log slow requests for investigation
      if (elapsed > 1000) {
        console.warn(`[Performance] Slow request: ${elapsed}ms`);
      }

      // Very slow requests (>5s) are critical
      if (elapsed > 5000) {
        console.error(
          `[Performance] CRITICAL: Very slow request: ${elapsed}ms`,
        );
      }
    });
  });

  // Track errors with timing context
  onError(({ onStop, error }) => {
    onStop(async ({ elapsed }) => {
      const resolvedError = await error;
      console.error("[Trace] Request failed:", {
        error: resolvedError?.message || "Unknown error",
        name: resolvedError?.name || "Error",
        elapsed: `${elapsed}ms`,
      });
    });
  });
});
