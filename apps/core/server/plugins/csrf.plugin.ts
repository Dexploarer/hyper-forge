/**
 * CSRF Protection Plugin for Elysia
 *
 * Simple Origin-based CSRF protection:
 * - Checks Origin/Referer header on state-changing requests (POST, PUT, DELETE, PATCH)
 * - Allows requests from configured origins
 * - Skips protection for API key authenticated requests (machine-to-machine)
 */

import { Elysia } from "elysia";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Get allowed origins for CSRF check
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add FRONTEND_URL if configured
  if (env.FRONTEND_URL) {
    origins.push(env.FRONTEND_URL);
  }

  // Add CORS_ALLOWED_ORIGINS if configured
  if (env.CORS_ALLOWED_ORIGINS && env.CORS_ALLOWED_ORIGINS.length > 0) {
    origins.push(...env.CORS_ALLOWED_ORIGINS);
  }

  // In development, allow localhost
  if (env.NODE_ENV === "development") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3004",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3004",
    );
  }

  return origins;
}

/**
 * Check if request origin is allowed
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false;

  // Exact match
  if (allowedOrigins.includes(origin)) return true;

  // Check if origin matches any allowed origin (handle trailing slashes)
  const normalizedOrigin = origin.replace(/\/$/, "");
  return allowedOrigins.some(
    (allowed) => allowed.replace(/\/$/, "") === normalizedOrigin,
  );
}

/**
 * CSRF Protection Plugin
 * Validates Origin header on state-changing requests
 */
export const csrfPlugin = new Elysia({ name: "csrf" }).onBeforeHandle(
  ({ request, headers }) => {
    const method = request.method.toUpperCase();

    // Only check state-changing methods
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return;
    }

    // Skip CSRF check for API key authentication (machine-to-machine)
    const authHeader =
      headers?.authorization || request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer af_")) {
      return; // API key requests don't need CSRF protection
    }

    // Get origin from headers
    const origin = headers?.origin || request.headers.get("origin");
    const referer = headers?.referer || request.headers.get("referer");

    // Extract origin from referer if origin header is missing
    let effectiveOrigin = origin;
    if (!effectiveOrigin && referer) {
      try {
        const url = new URL(referer);
        effectiveOrigin = url.origin;
      } catch {
        // Invalid referer URL
      }
    }

    // In production, reject state-changing requests without an origin header.
    // This is a stricter CSRF check.
    if (!effectiveOrigin) {
      if (env.NODE_ENV === "production") {
        logger.warn(
          {
            context: "csrf",
            method,
            path: new URL(request.url).pathname,
          },
          "CSRF validation failed - missing Origin/Referer header in production",
        );
        return new Response(
          JSON.stringify({
            error: "CSRF_VALIDATION_FAILED",
            message: "Missing Origin header",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      // In non-production, allow requests without an origin for easier testing.
      return;
    }

    // Check if origin is allowed
    const allowedOrigins = getAllowedOrigins();
    if (!isOriginAllowed(effectiveOrigin, allowedOrigins)) {
      logger.warn(
        {
          context: "csrf",
          origin: effectiveOrigin,
          allowedOrigins,
          method,
          path: new URL(request.url).pathname,
        },
        "CSRF validation failed - origin not allowed",
      );

      return new Response(
        JSON.stringify({
          error: "CSRF_VALIDATION_FAILED",
          message: "Request origin not allowed",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
);
