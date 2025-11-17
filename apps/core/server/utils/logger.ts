/**
 * Structured Logger using Pino
 *
 * Provides structured logging with request correlation IDs, context,
 * and proper log levels for production debugging.
 *
 * Usage:
 *   logger.info({ userId, projectId, action: 'create' }, 'Project created');
 *   logger.error({ err, userId }, 'Failed to create project');
 *
 * ============================================================================
 * LOGGING MIGRATION GUIDE
 * ============================================================================
 *
 * Migrate console.log/error/warn to structured Pino logging:
 *
 * BEFORE:
 * logger.info({ context: 'Upload' }, 'Saved file: ${filename}');
 * logger.error({ err: error }, 'Upload failed:');
 *
 * AFTER:
 * const logger = createChildLogger('Upload');
 * logger.info({ filename, size: file.size }, 'File saved');
 * logger.error({ error }, 'Upload failed');
 *
 * PRIORITY FILES FOR MIGRATION:
 * 1. asset-forge-cdn/src/middleware/auth.ts (142 console calls)
 * 2. asset-forge-cdn/src/utils/file-helpers.ts
 * 3. asset-forge-cdn/src/routes/upload.ts
 * 4. apps/core/server/db/db.ts (database operations)
 * 5. apps/core/server/services/* (service files)
 *
 * BENEFITS:
 * - Structured data for log aggregation (Railway, Datadog)
 * - Request correlation IDs
 * - Proper log levels for filtering
 * - Production-safe (no sensitive data leaks)
 *
 * ============================================================================
 */

import pino from "pino";

// Create base logger instance
export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Pretty printing in development, JSON in production
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            singleLine: false,
          },
        }
      : undefined,

  // Base configuration
  base: {
    env: process.env.NODE_ENV || "development",
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Include timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 *
 * @example
 * const userLogger = createChildLogger('UserService', { userId: '123' });
 * userLogger.info({ action: 'update' }, 'User profile updated');
 */
export function createChildLogger(name: string, context?: Record<string, any>) {
  return logger.child({
    service: name,
    ...context,
  });
}

/**
 * Create a request logger with correlation ID
 *
 * @example
 * const reqLogger = createRequestLogger(requestId, userId);
 * reqLogger.info({ path: '/api/assets' }, 'Request started');
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
  });
}

/**
 * Log levels:
 * - trace: Very detailed debugging (e.g., query parameters)
 * - debug: Debugging information (e.g., function entry/exit)
 * - info: Important information (e.g., API calls, database operations)
 * - warn: Warning conditions (e.g., validation failures, deprecated usage)
 * - error: Error conditions (e.g., exceptions, failed operations)
 * - fatal: Application crash (e.g., database connection failure)
 */

// Export common logging patterns
export const logPatterns = {
  /**
   * Log a database operation
   */
  dbOperation: (
    logger: pino.Logger,
    operation: string,
    table: string,
    details?: Record<string, any>,
  ) => {
    logger.info(
      {
        context: "database",
        operation,
        table,
        ...details,
      },
      `Database ${operation} on ${table}`,
    );
  },

  /**
   * Log an API request
   */
  apiRequest: (
    logger: pino.Logger,
    method: string,
    path: string,
    details?: Record<string, any>,
  ) => {
    logger.info(
      {
        context: "api",
        method,
        path,
        ...details,
      },
      `${method} ${path}`,
    );
  },

  /**
   * Log an API response
   */
  apiResponse: (
    logger: pino.Logger,
    method: string,
    path: string,
    status: number,
    duration: number,
  ) => {
    logger.info(
      {
        context: "api",
        method,
        path,
        status,
        duration,
      },
      `${method} ${path} - ${status} (${duration}ms)`,
    );
  },

  /**
   * Log an external API call
   */
  externalApi: (
    logger: pino.Logger,
    service: string,
    action: string,
    details?: Record<string, any>,
  ) => {
    logger.info(
      {
        context: "external-api",
        service,
        action,
        ...details,
      },
      `External API: ${service}.${action}`,
    );
  },

  /**
   * Log an error with full context
   */
  error: (logger: pino.Logger, error: Error, context?: Record<string, any>) => {
    logger.error(
      {
        err: error,
        stack: error.stack,
        ...context,
      },
      error.message,
    );
  },
};

export default logger;
