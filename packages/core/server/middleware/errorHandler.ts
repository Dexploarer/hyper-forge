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

    // Handle custom ApiError classes
    if (isApiError(error)) {
      set.status = error.statusCode;

      // Log with appropriate level
      const logLevel = error.statusCode >= 500 ? "error" : "warn";
      logger[logLevel](
        {
          requestId,
          method: request.method,
          path: url.pathname,
          ...errorContext,
        },
        `API Error: ${error.message}`,
      );

      return {
        ...error.toJSON(),
        requestId, // Include for client-side correlation
      };
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      set.status = 400;

      logger.warn(
        {
          requestId,
          method: request.method,
          path: url.pathname,
          error: errorContext,
        },
        "Validation error",
      );

      return {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        details:
          error && typeof error === "object" && "message" in error
            ? (error as Error).message
            : "Invalid request data",
        requestId,
      };
    }

    // Handle not found errors (endpoint doesn't exist)
    if (code === "NOT_FOUND") {
      set.status = 404;

      logger.warn(
        {
          requestId,
          method: request.method,
          path: url.pathname,
        },
        "Endpoint not found",
      );

      return {
        error: "NOT_FOUND",
        message: "Endpoint not found",
        requestId,
      };
    }

    // Handle parse errors (invalid JSON, etc.)
    if (code === "PARSE") {
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

      return {
        error: "PARSE_ERROR",
        message: "Invalid request body format",
        requestId,
      };
    }

    // Handle all other errors as internal server errors
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
