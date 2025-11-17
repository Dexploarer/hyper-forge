/**
 * Logging Plugin for Elysia 2025
 *
 * Provides:
 * - Request correlation IDs for distributed tracing (via request-id plugin)
 * - Structured logging with Pino
 * - Request/response timing
 * - User context in logs
 * - Performance monitoring (slow request detection)
 * - Server-Timing headers for client-side performance monitoring
 *
 * Usage:
 * ```ts
 * app.use(loggingPlugin)
 * ```
 */

import { Elysia } from "elysia";
import { logger, createRequestLogger } from "../utils/logger";

/**
 * Logging plugin for request/response tracking with correlation IDs
 * Note: requestID is provided by the request-id plugin
 */
export const loggingPlugin = new Elysia({ name: "logging" })
  // Add timing and create request-specific logger
  .derive((context) => {
    // requestID comes from request-id plugin
    const requestID = (context as any).requestID || "unknown";
    const startTime = Date.now();

    return {
      startTime,
      requestLogger: createRequestLogger(requestID),
    };
  })

  // Log incoming requests with correlation ID
  .onRequest((context) => {
    const { request, requestID, requestLogger } = context as any;
    const url = new URL(request.url);

    // Defensive check - requestLogger might not be available in all contexts
    if (requestLogger && typeof requestLogger.info === "function") {
      requestLogger.info(
        {
          method: request.method,
          path: url.pathname,
          query: url.search,
          userAgent: request.headers.get("user-agent"),
        },
        "Request started",
      );
    }
  })

  // Log responses with timing and status
  .onAfterResponse((context) => {
    const { request, set, requestID, startTime, requestLogger } =
      context as any;
    const url = new URL(request.url);
    const duration = Date.now() - startTime;
    // Convert status to number for comparison (Elysia status can be string | number)
    const statusCode =
      typeof set.status === "number" ? set.status : Number(set.status) || 200;

    // Defensive check - requestLogger might not be available in all contexts
    if (requestLogger && typeof requestLogger.info === "function") {
      // Log at appropriate level based on status code
      const logLevel =
        statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

      // Enhanced logging with performance metrics
      requestLogger[logLevel](
        {
          method: request.method,
          path: url.pathname,
          status: statusCode,
          duration,
          responseTime: `${duration}ms`,
          // Track slow requests (> 1 second)
          slow: duration > 1000,
        },
        `Request completed - ${statusCode} in ${duration}ms${duration > 1000 ? " (SLOW)" : ""}`,
      );

      // Log warning for slow requests
      if (duration > 1000) {
        requestLogger.warn(
          {
            method: request.method,
            path: url.pathname,
            duration,
          },
          `Slow request detected: ${url.pathname} took ${duration}ms`,
        );
      }
    }

    // Add response headers for client-side correlation and performance monitoring
    set.headers["x-request-id"] = requestID || "unknown";
    set.headers["server-timing"] = `total;dur=${duration}`;

    // Add timing breakdown if available (will be populated by other middleware)
    if ((context as any).timings) {
      const timings = (context as any).timings;
      const serverTiming = Object.entries(timings)
        .map(([name, dur]) => `${name};dur=${dur}`)
        .join(", ");
      set.headers["server-timing"] = `${serverTiming}, total;dur=${duration}`;
    }
  });
