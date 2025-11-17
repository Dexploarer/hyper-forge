/**
 * Rate Limiting Plugin for Elysia
 * Consolidates all rate limiting configuration into organized groups
 *
 * Rate Limits (Relaxed for Development):
 * - Global: 10000 req/min (all endpoints)
 * - Admin: 5000 req/min (/api/admin/*)
 * - Generation: 100 req/min (/api/generation/*)
 * - Music: 200 req/min (/api/music/*)
 * - SFX: 300 req/min (/api/sfx/*)
 * - Voice: 200 req/min (/api/voice/*)
 *
 * Note: Rate limiting is disabled in development mode
 * Uses Elysia's .group() pattern for organized route protection
 */

import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { env } from "../config/env";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Time window in milliseconds */
  duration: number;
  /** Maximum requests per window */
  max: number;
  /** Error response for rate limit exceeded */
  errorMessage: string;
}

/**
 * Standard error response for rate limiting
 */
function createRateLimitError(message: string) {
  return {
    error: "TOO_MANY_REQUESTS",
    message,
  } as any;
}

/**
 * Check if rate limiting should be enabled
 * Disabled in development and test environments
 */
const RATE_LIMITING_ENABLED =
  env.NODE_ENV === "production" || env.ENABLE_RATE_LIMITING === true;

/**
 * Global rate limit (applied to all routes)
 * Very relaxed limits for development and admin usage
 */
const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  duration: 60000, // 1 minute
  max: 10000, // 10x increase
  errorMessage: "Rate limit exceeded. Please try again later.",
};

/**
 * Rate limits for specific endpoint groups
 * Significantly relaxed for better development experience
 */
const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  admin: {
    duration: 60000,
    max: 5000, // 50x increase - admins need high limits
    errorMessage: "Admin endpoint rate limit exceeded. Please try again later.",
  },
  generation: {
    duration: 60000,
    max: 100, // 10x increase - still controlled for cost
    errorMessage:
      "Generation rate limit exceeded. Please wait before generating more assets.",
  },
  music: {
    duration: 60000,
    max: 200, // 10x increase
    errorMessage:
      "Music generation rate limit exceeded. Please try again later.",
  },
  sfx: {
    duration: 60000,
    max: 300, // 10x increase
    errorMessage:
      "Sound effect generation rate limit exceeded. Please try again later.",
  },
  voice: {
    duration: 60000,
    max: 200, // 10x increase
    errorMessage:
      "Voice generation rate limit exceeded. Please try again later.",
  },
};

/**
 * Rate Limiting Plugin
 * Applies global rate limiting and endpoint-specific limits
 * Automatically disabled in development mode
 */
export const rateLimitingPlugin = new Elysia({ name: "rate-limiting" })
  // Global rate limit for all endpoints (disabled in dev)
  .use(
    rateLimit({
      duration: GLOBAL_RATE_LIMIT.duration,
      max: GLOBAL_RATE_LIMIT.max,
      errorResponse: createRateLimitError(GLOBAL_RATE_LIMIT.errorMessage),
      // Skip rate limiting in development or for health checks
      skip: (req) => {
        // Disable rate limiting in development/test
        if (!RATE_LIMITING_ENABLED) {
          return true;
        }

        // Skip health checks
        const pathname = new URL(req.url).pathname;
        return (
          pathname === "/api/health/live" ||
          pathname === "/api/health/ready" ||
          pathname === "/api/health/deep"
        );
      },
      // Better error handling for client address detection
      generator: (req, server) => {
        try {
          // Try to get client IP from headers (Railway/Cloudflare)
          const forwarded = req.headers.get("x-forwarded-for");
          if (forwarded) {
            return forwarded.split(",")[0].trim();
          }

          const realIp = req.headers.get("x-real-ip");
          if (realIp) {
            return realIp;
          }

          // Fallback to CF-Connecting-IP
          const cfIp = req.headers.get("cf-connecting-ip");
          if (cfIp) {
            return cfIp;
          }

          // Last resort: use request URL
          return new URL(req.url).hostname || "unknown";
        } catch (error) {
          console.warn(
            "[Rate Limit] Failed to determine client address:",
            error,
          );
          return "unknown";
        }
      },
    }),
  )

  // Admin endpoints - relaxed limits
  .group("/api/admin", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.admin.duration,
        max: ENDPOINT_RATE_LIMITS.admin.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.admin.errorMessage,
        ),
        skip: () => !RATE_LIMITING_ENABLED,
      }),
    ),
  )

  // Generation endpoints - controlled but relaxed
  .group("/api/generation", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.generation.duration,
        max: ENDPOINT_RATE_LIMITS.generation.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.generation.errorMessage,
        ),
        skip: () => !RATE_LIMITING_ENABLED,
      }),
    ),
  )

  // Music generation endpoints
  .group("/api/music", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.music.duration,
        max: ENDPOINT_RATE_LIMITS.music.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.music.errorMessage,
        ),
        skip: () => !RATE_LIMITING_ENABLED,
      }),
    ),
  )

  // Sound effects generation endpoints
  .group("/api/sfx", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.sfx.duration,
        max: ENDPOINT_RATE_LIMITS.sfx.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.sfx.errorMessage,
        ),
        skip: () => !RATE_LIMITING_ENABLED,
      }),
    ),
  )

  // Voice generation endpoints
  .group("/api/voice", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.voice.duration,
        max: ENDPOINT_RATE_LIMITS.voice.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.voice.errorMessage,
        ),
        skip: () => !RATE_LIMITING_ENABLED,
      }),
    ),
  );
