/**
 * Global Error Handler Middleware with Structured Logging
 *
 * Features:
 * - Handles custom ApiError classes with proper status codes
 * - Logs all errors with full context and stack traces
 * - Includes request correlation IDs in error responses
 * - Safe error messages for production
 */

import { Elysia } from "elysia";
import { logger } from "../utils/logger";
import { isApiError, getErrorContext } from "../errors";
import { errorTrackingService } from "../services/ErrorTrackingService";
import { apiRequestsCounter } from "../metrics/business";

/**
 * Global error handling middleware
 */
export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set, request }) => {
    // Get request ID from context if available (added by logging middleware)
    const requestId = set.headers?.["x-request-id"] as string | undefined;
    const url = new URL(request.url);

    // Extract error context for logging
    const errorContext = getErrorContext(error);

    // Determine status code for metrics (before it's set in response)
    let statusCode = 500; // Default for unknown errors

    // Handle custom ApiError classes
    if (isApiError(error)) {
      statusCode = error.statusCode;
      set.status = statusCode;

      // Log with appropriate level
      const logLevel = statusCode >= 500 ? "error" : "warn";
      logger[logLevel](
        {
          requestId,
          method: request.method,
          path: url.pathname,
          ...errorContext,
        },
        `API Error: ${error.message}`,
      );

      // Track error in Sentry for 5xx errors
      if (statusCode >= 500) {
        errorTrackingService.captureError(error, {
          requestId,
          endpoint: url.pathname,
          method: request.method,
          errorType: "api_error",
          severity: "error",
        });
      }

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: url.pathname,
        method: request.method,
        status_code: statusCode.toString(),
      });

      return {
        ...error.toJSON(),
        requestId, // Include for client-side correlation
      };
    }

    // Handle Elysia validation errors with field-level details
    if (code === "VALIDATION") {
      statusCode = 400;
      set.status = 400;

      // Extract field-level validation errors from Elysia's validation error
      const fields: Array<{
        field: string;
        message: string;
        expected?: string;
        received?: string;
      }> = [];

      // Parse Elysia validation error structure
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as Error).message;

        // Elysia validation errors include field paths and expected values
        // Example: "Expected string, received number at /body/name"
        const fieldMatches = errorMessage.matchAll(
          /Expected (.+?), received (.+?)(?: at (.+?))?(?:\.|$)/gi,
        );

        for (const match of fieldMatches) {
          fields.push({
            field: match[3] || "unknown",
            message: `Expected ${match[1]}, received ${match[2]}`,
            expected: match[1],
            received: match[2],
          });
        }
      }

      logger.warn(
        {
          requestId,
          method: request.method,
          path: url.pathname,
          fields,
          error: errorContext,
        },
        "Validation error",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: url.pathname,
        method: request.method,
        status_code: "400",
      });

      return {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: fields.length > 0 ? fields : undefined,
        requestId,
      };
    }

    // Handle not found errors (endpoint doesn't exist)
    if (code === "NOT_FOUND") {
      statusCode = 404;
      set.status = 404;

      logger.warn(
        {
          requestId,
          method: request.method,
          path: url.pathname,
        },
        "Endpoint not found",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: url.pathname,
        method: request.method,
        status_code: "404",
      });

      return {
        error: "NOT_FOUND",
        message: "Endpoint not found",
        requestId,
      };
    }

    // Handle parse errors (invalid JSON, etc.)
    if (code === "PARSE") {
      statusCode = 400;
      set.status = 400;

      logger.warn(
        {
          requestId,
          method: request.method,
          path: url.pathname,
          error: errorContext,
        },
        "Parse error",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: url.pathname,
        method: request.method,
        status_code: "400",
      });

      return {
        error: "PARSE_ERROR",
        message: "Invalid request body format",
        requestId,
      };
    }

    // Handle all other errors as internal server errors
    statusCode = 500;
    set.status = 500;

    // Always log full error details server-side (including in production)
    logger.error(
      {
        requestId,
        method: request.method,
        path: url.pathname,
        ...errorContext,
      },
      "Internal server error",
    );

    // Track unknown errors in Sentry
    if (error instanceof Error) {
      errorTrackingService.captureError(error, {
        requestId,
        endpoint: url.pathname,
        method: request.method,
        errorType: String(code || "unknown"),
        severity: "error",
        extra: {
          elysiaCode: code,
        },
      });
    }

    // Record metrics
    apiRequestsCounter.inc({
      endpoint: url.pathname,
      method: request.method,
      status_code: "500",
    });

    // Return safe error message to client in production
    return {
      error: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error && typeof error === "object" && "message" in error
            ? (error as Error).message
            : "Unknown error",
      requestId,
      // Include stack trace only in development
      ...(process.env.NODE_ENV !== "production" &&
        error instanceof Error && {
          stack: error.stack,
        }),
    };
  },
);
