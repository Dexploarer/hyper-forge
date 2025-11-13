/**
 * Request/Response Logging Middleware with Structured Logging
 *
 * Provides:
 * - Request correlation IDs for distributed tracing (via elysia-requestid plugin)
 * - Structured logging with Pino
 * - Request/response timing
 * - User context in logs
 */

import { Elysia } from "elysia";
import { logger, createRequestLogger } from "../utils/logger";

/**
 * Logging middleware for request/response tracking with correlation IDs
 * Note: requestID is provided by the elysia-requestid plugin
 */
export const loggingMiddleware = new Elysia({ name: "logging" })
  // Add timing and create request-specific logger
  .derive((context) => {
    // requestID comes from elysia-requestid plugin
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

      requestLogger[logLevel](
        {
          method: request.method,
          path: url.pathname,
          status: statusCode,
          duration,
          responseTime: `${duration}ms`,
        },
        `Request completed - ${statusCode} in ${duration}ms`,
      );
    }

    // Add response headers for client-side correlation
    set.headers["x-request-id"] = requestID || "unknown";
    set.headers["server-timing"] = `total;dur=${duration}`;
  });
