/**
 * Custom Error Classes for Asset-Forge API
 *
 * Provides standardized error types with proper HTTP status codes
 * and structured error information for logging and client responses.
 */

/**
 * Base API Error class
 */
export abstract class ApiError extends Error {
  abstract statusCode: number;
  abstract code: string;

  constructor(
    message: string,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(process.env.NODE_ENV !== "production" && { context: this.context }),
    };
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends ApiError {
  statusCode = 400;
  code = "BAD_REQUEST";

  constructor(message: string = "Bad request", context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends ApiError {
  statusCode = 401;
  code = "UNAUTHORIZED";

  constructor(
    message: string = "Authentication required",
    context?: Record<string, any>,
  ) {
    super(message, context);
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends ApiError {
  statusCode = 403;
  code = "FORBIDDEN";

  constructor(
    message: string = "Access forbidden",
    context?: Record<string, any>,
  ) {
    super(message, context);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends ApiError {
  statusCode = 404;
  code = "NOT_FOUND";

  constructor(
    resource: string,
    identifier?: string,
    context?: Record<string, any>,
  ) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, context);
  }
}

/**
 * 409 Conflict - Resource already exists or conflicts with current state
 */
export class ConflictError extends ApiError {
  statusCode = 409;
  code = "CONFLICT";

  constructor(
    message: string = "Resource conflict",
    context?: Record<string, any>,
  ) {
    super(message, context);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends ApiError {
  statusCode = 422;
  code = "VALIDATION_ERROR";

  constructor(
    message: string = "Validation failed",
    public fields?: Record<string, string>,
    context?: Record<string, any>,
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      fields: this.fields,
      ...(process.env.NODE_ENV !== "production" && { context: this.context }),
    };
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  statusCode = 429;
  code = "RATE_LIMIT_EXCEEDED";

  constructor(
    message: string = "Too many requests",
    public retryAfter?: number,
    context?: Record<string, any>,
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      retryAfter: this.retryAfter,
      ...(process.env.NODE_ENV !== "production" && { context: this.context }),
    };
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends ApiError {
  statusCode = 500;
  code = "INTERNAL_SERVER_ERROR";

  constructor(
    message: string = "Internal server error",
    context?: Record<string, any>,
  ) {
    super(message, context);
  }
}

/**
 * 502 Bad Gateway - External service error
 */
export class ExternalServiceError extends ApiError {
  statusCode = 502;
  code = "EXTERNAL_SERVICE_ERROR";

  constructor(
    service: string,
    message: string,
    public originalError?: any,
    context?: Record<string, any>,
  ) {
    super(`${service}: ${message}`, { ...context, service, originalError });
  }
}

/**
 * 503 Service Unavailable - External service is down
 */
export class ServiceUnavailableError extends ApiError {
  statusCode = 503;
  code = "SERVICE_UNAVAILABLE";

  constructor(
    service: string,
    message?: string,
    context?: Record<string, any>,
  ) {
    super(message || `${service} is currently unavailable`, context);
  }
}

/**
 * Helper function to determine if an error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper function to convert unknown errors to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new InternalServerError("An unknown error occurred", {
    originalError: String(error),
  });
}

/**
 * Helper function to extract error context for logging
 */
export function getErrorContext(error: unknown): Record<string, any> {
  if (isApiError(error)) {
    return {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      context: error.context,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: String(error),
  };
}

/**
 * Determine error category for database logging
 */
export function determineErrorCategory(
  error: unknown,
):
  | "validation"
  | "authentication"
  | "authorization"
  | "external_api"
  | "database"
  | "file_system"
  | "network"
  | "application"
  | "unknown" {
  if (isApiError(error)) {
    if (error instanceof ValidationError) return "validation";
    if (error instanceof UnauthorizedError) return "authentication";
    if (error instanceof ForbiddenError) return "authorization";
    if (
      error instanceof ExternalServiceError ||
      error instanceof ServiceUnavailableError
    )
      return "external_api";
    return "application";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("database") ||
      message.includes("sql") ||
      message.includes("query")
    ) {
      return "database";
    }
    if (
      message.includes("file") ||
      message.includes("enoent") ||
      message.includes("eacces")
    ) {
      return "file_system";
    }
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused")
    ) {
      return "network";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation";
    }
    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return "authentication";
    }
    if (message.includes("forbidden") || message.includes("permission")) {
      return "authorization";
    }
  }

  return "unknown";
}
