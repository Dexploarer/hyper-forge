/**
 * Error Tracking Service
 * Centralized error tracking and monitoring with Sentry integration
 *
 * Features:
 * - Capture unhandled errors with full context
 * - Include request details (user, endpoint, params)
 * - Add breadcrumbs for debugging
 * - Error fingerprinting for better grouping
 * - Severity levels (critical, error, warning)
 * - Opt-in via SENTRY_DSN environment variable
 *
 * Usage:
 *   import { errorTrackingService } from './services/ErrorTrackingService';
 *   errorTrackingService.captureError(error, { userId, endpoint, params });
 */

import * as Sentry from "@sentry/bun";
import type { SeverityLevel } from "@sentry/bun";
import { logger } from "../utils/logger";

export interface ErrorContext {
  // User information
  userId?: string;
  userEmail?: string;
  userWallet?: string;

  // Request information
  requestId?: string;
  endpoint?: string;
  method?: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;

  // Additional context
  tags?: Record<string, string>;
  extra?: Record<string, any>;

  // Error categorization
  errorType?: string;
  severity?: SeverityLevel;
}

export interface Breadcrumb {
  message: string;
  category: string;
  level?: SeverityLevel;
  data?: Record<string, any>;
}

class ErrorTrackingService {
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Sentry if DSN is provided
   */
  private initialize() {
    const sentryDsn = process.env.SENTRY_DSN;

    if (!sentryDsn) {
      logger.info(
        "[ErrorTracking] Sentry not configured (SENTRY_DSN not set). Error tracking disabled.",
      );
      return;
    }

    try {
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || "development",

        // Performance monitoring (sample rate)
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

        // Release tracking for better error grouping
        release:
          process.env.RAILWAY_DEPLOYMENT_ID || process.env.npm_package_version,

        // Don't send errors in test environment
        enabled: process.env.NODE_ENV !== "test",

        // Default integrations for Bun
        integrations: [
          // ANR detection (application not responding)
          Sentry.anrIntegration({
            captureStackTrace: true,
            anrThreshold: 5000, // 5 seconds
          }),
        ],

        // Filter sensitive data
        beforeSend(event, hint) {
          // Don't send validation errors (too noisy)
          if (
            hint.originalException &&
            typeof hint.originalException === "object"
          ) {
            const error = hint.originalException as any;
            if (error.message?.includes("Validation failed")) {
              return null;
            }
          }

          // Filter sensitive keys from request data
          if (event.request) {
            const sensitiveKeys = [
              "password",
              "token",
              "secret",
              "apiKey",
              "authorization",
            ];

            // Filter cookies
            if (event.request.cookies) {
              for (const key of sensitiveKeys) {
                if (event.request.cookies[key]) {
                  event.request.cookies[key] = "[Filtered]";
                }
              }
            }

            // Filter headers
            if (event.request.headers) {
              for (const key of sensitiveKeys) {
                if (event.request.headers[key]) {
                  event.request.headers[key] = "[Filtered]";
                }
              }
            }

            // Filter data
            if (event.request.data && typeof event.request.data === "object") {
              const data = event.request.data as Record<string, any>;
              for (const key of sensitiveKeys) {
                if (data[key]) {
                  data[key] = "[Filtered]";
                }
              }
            }
          }

          return event;
        },
      });

      this.isEnabled = true;
      logger.info(
        `[ErrorTracking] Sentry initialized (${process.env.NODE_ENV || "development"})`,
      );
    } catch (error) {
      logger.error({ error }, "[ErrorTracking] Failed to initialize Sentry");
      this.isEnabled = false;
    }
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context?: ErrorContext): string | undefined {
    // Always log to console/Pino
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        ...context,
      },
      "Error captured",
    );

    if (!this.isEnabled) {
      return undefined;
    }

    try {
      // Set user context if provided
      if (context?.userId || context?.userEmail || context?.userWallet) {
        Sentry.setUser({
          id: context.userId,
          email: context.userEmail,
          wallet: context.userWallet,
        });
      }

      // Set tags for filtering in Sentry UI
      if (context?.tags) {
        for (const [key, value] of Object.entries(context.tags)) {
          Sentry.setTag(key, value);
        }
      }

      // Add error type tag
      if (context?.errorType) {
        Sentry.setTag("error_type", context.errorType);
      }

      // Add request context
      if (context?.endpoint) {
        Sentry.setTag("endpoint", context.endpoint);
      }

      if (context?.method) {
        Sentry.setTag("method", context.method);
      }

      // Set extra context (searchable in Sentry)
      if (context?.extra) {
        for (const [key, value] of Object.entries(context.extra)) {
          Sentry.setExtra(key, value);
        }
      }

      // Add request details as extras
      if (context?.requestId) {
        Sentry.setExtra("requestId", context.requestId);
      }

      if (context?.params) {
        Sentry.setExtra("params", context.params);
      }

      if (context?.query) {
        Sentry.setExtra("query", context.query);
      }

      if (context?.body) {
        Sentry.setExtra("body", context.body);
      }

      // Set custom fingerprint for better grouping
      const fingerprint = this.generateFingerprint(error, context);

      // Capture the error
      const eventId = Sentry.captureException(error, {
        level: context?.severity || "error",
        fingerprint,
      });

      return eventId;
    } catch (sentryError) {
      logger.error(
        { error: sentryError },
        "[ErrorTracking] Failed to send error to Sentry",
      );
      return undefined;
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(
    message: string,
    context?: Omit<ErrorContext, "errorType">,
  ): string | undefined {
    logger.info({ ...context }, message);

    if (!this.isEnabled) {
      return undefined;
    }

    try {
      // Set context similar to captureError
      if (context?.userId || context?.userEmail) {
        Sentry.setUser({
          id: context.userId,
          email: context.userEmail,
        });
      }

      if (context?.tags) {
        for (const [key, value] of Object.entries(context.tags)) {
          Sentry.setTag(key, value);
        }
      }

      if (context?.extra) {
        for (const [key, value] of Object.entries(context.extra)) {
          Sentry.setExtra(key, value);
        }
      }

      const eventId = Sentry.captureMessage(message, {
        level: context?.severity || "info",
      });

      return eventId;
    } catch (sentryError) {
      logger.error(
        { error: sentryError },
        "[ErrorTracking] Failed to send message to Sentry",
      );
      return undefined;
    }
  }

  /**
   * Add a breadcrumb (trail of events leading to an error)
   */
  addBreadcrumb(breadcrumb: Breadcrumb) {
    if (!this.isEnabled) {
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: breadcrumb.level || "info",
        data: breadcrumb.data,
        timestamp: Date.now() / 1000,
      });
    } catch (sentryError) {
      logger.error(
        { error: sentryError },
        "[ErrorTracking] Failed to add breadcrumb",
      );
    }
  }

  /**
   * Set user context for all subsequent errors
   */
  setUser(userId: string, email?: string, wallet?: string) {
    if (!this.isEnabled) {
      return;
    }

    try {
      Sentry.setUser({
        id: userId,
        email,
        wallet,
      });
    } catch (sentryError) {
      logger.error(
        { error: sentryError },
        "[ErrorTracking] Failed to set user",
      );
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.isEnabled) {
      return;
    }

    try {
      Sentry.setUser(null);
    } catch (sentryError) {
      logger.error(
        { error: sentryError },
        "[ErrorTracking] Failed to clear user",
      );
    }
  }

  /**
   * Generate a fingerprint for error grouping
   * Sentry uses fingerprints to group similar errors together
   */
  private generateFingerprint(error: Error, context?: ErrorContext): string[] {
    const fingerprint: string[] = [];

    // Use error type if provided
    if (context?.errorType) {
      fingerprint.push(context.errorType);
    }

    // Use error name and message
    fingerprint.push(error.name);

    // Use endpoint for API errors
    if (context?.endpoint) {
      fingerprint.push(context.endpoint);
    }

    // Include Sentry's default fingerprinting
    fingerprint.push("{{ default }}");

    return fingerprint;
  }

  /**
   * Flush pending events (useful for serverless/shutdown)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.isEnabled) {
      return true;
    }

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      logger.error({ error }, "[ErrorTracking] Failed to flush events");
      return false;
    }
  }

  /**
   * Check if error tracking is enabled
   */
  isConfigured(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();

// Export for testing
export { ErrorTrackingService };
