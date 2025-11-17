/**
 * Error Handler Plugin for Elysia 2025
 *
 * Provides:
 * - Type-safe custom error classes registered with .error()
 * - Consistent error responses across all endpoints
 * - Proper HTTP status codes
 * - Structured error logging
 * - Integration with error tracking services
 *
 * Usage in routes:
 * ```ts
 * .get("/users/:id", ({ params }) => {
 *   if (!user) {
 *     throw new NotFoundError("User", params.id);
 *   }
 *   return { user };
 * })
 * ```
 */

import { Elysia } from "elysia";
import { logger } from "../utils/logger";
import { errorTrackingService } from "../services/ErrorTrackingService";
import { apiRequestsCounter } from "../metrics/business";
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ExternalServiceError,
  ServiceUnavailableError,
  isApiError,
  getErrorContext,
} from "../errors";

/**
 * Error Handler Plugin
 *
 * Registers all custom error classes and provides centralized error handling
 * with proper status codes, logging, and metrics tracking.
 */
export const errorHandlerPlugin = new Elysia({
  name: "error-handler-plugin",
})
  // ==================== REGISTER CUSTOM ERROR CLASSES ====================
  .error({
    // 400-level client errors
    BAD_REQUEST: BadRequestError,
    UNAUTHORIZED: UnauthorizedError,
    FORBIDDEN: ForbiddenError,
    NOT_FOUND: NotFoundError,
    CONFLICT: ConflictError,
    VALIDATION_ERROR: ValidationError,
    RATE_LIMIT_EXCEEDED: RateLimitError,

    // 500-level server errors
    INTERNAL_SERVER_ERROR: InternalServerError,
    EXTERNAL_SERVICE_ERROR: ExternalServiceError,
    SERVICE_UNAVAILABLE: ServiceUnavailableError,
  })

  // ==================== CENTRALIZED ERROR HANDLER ====================
  .onError(({ code, error, set, request }) => {
    // Get request ID for correlation (added by request-id plugin)
    const requestId = request.headers.get("x-request-id") || "unknown";
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Extract user ID from authorization header if present
    let userId: string | undefined;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        // Simple JWT decode to get user ID (don't verify, just extract)
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || payload.userId;
      } catch {
        // Ignore decode errors
      }
    }

    // Extract error context for logging
    const errorContext = getErrorContext(error);

    // Determine status code and log level
    let statusCode = 500;
    let logLevel: "error" | "warn" = "error";

    // ==================== HANDLE CUSTOM API ERRORS ====================
    if (isApiError(error)) {
      statusCode = error.statusCode;
      logLevel = statusCode >= 500 ? "error" : "warn";

      // Log with appropriate level
      logger[logLevel](
        {
          requestId,
          method,
          path: pathname,
          userId,
          ...errorContext,
        },
        `API Error: ${error.message}`,
      );

      // Track 5xx errors in Sentry
      if (statusCode >= 500) {
        errorTrackingService.captureError(error, {
          requestId,
          endpoint: pathname,
          method,
          errorType: "api_error",
          severity: "error",
        });
      }

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: pathname,
        method,
        status_code: statusCode.toString(),
      });

      // Set response status
      set.status = statusCode;

      // Return structured error response
      return {
        ...error.toJSON(),
        requestId,
      };
    }

    // ==================== HANDLE ELYSIA VALIDATION ERRORS ====================
    if (code === "VALIDATION") {
      statusCode = 400;
      logLevel = "warn";

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
          method,
          path: pathname,
          userId,
          fields,
          error: errorContext,
        },
        "Validation error",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: pathname,
        method,
        status_code: "400",
      });

      set.status = 400;
      return {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: fields.length > 0 ? fields : undefined,
        requestId,
      };
    }

    // ==================== HANDLE NOT FOUND ERRORS ====================
    if (code === "NOT_FOUND") {
      statusCode = 404;
      logLevel = "warn";

      logger.warn(
        {
          requestId,
          method,
          path: pathname,
          userId,
        },
        "Endpoint not found",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: pathname,
        method,
        status_code: "404",
      });

      set.status = 404;
      return {
        error: "NOT_FOUND",
        message: "Endpoint not found",
        requestId,
      };
    }

    // ==================== HANDLE PARSE ERRORS ====================
    if (code === "PARSE") {
      statusCode = 400;
      logLevel = "warn";

      logger.warn(
        {
          requestId,
          method,
          path: pathname,
          userId,
          error: errorContext,
        },
        "Parse error",
      );

      // Record metrics
      apiRequestsCounter.inc({
        endpoint: pathname,
        method,
        status_code: "400",
      });

      set.status = 400;
      return {
        error: "PARSE_ERROR",
        message: "Invalid request body format",
        requestId,
      };
    }

    // ==================== HANDLE ALL OTHER ERRORS ====================
    statusCode = 500;
    logLevel = "error";

    // Always log full error details server-side
    logger.error(
      {
        requestId,
        method,
        path: pathname,
        userId,
        ...errorContext,
      },
      "Internal server error",
    );

    // Track unknown errors in Sentry
    if (error instanceof Error) {
      errorTrackingService.captureError(error, {
        requestId,
        endpoint: pathname,
        method,
        errorType: String(code || "unknown"),
        severity: "error",
        extra: {
          elysiaCode: code,
        },
      });
    }

    // Record metrics
    apiRequestsCounter.inc({
      endpoint: pathname,
      method,
      status_code: "500",
    });

    set.status = 500;

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
  });
