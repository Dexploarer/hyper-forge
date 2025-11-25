/**
 * Rate Limiting Plugin for Elysia
 * Consolidates all rate limiting configuration into organized groups
 *
 * Rate Limits (Environment-aware):
 * - Production: Strict limits to prevent abuse
 * - Development: Higher limits for testing, but still enforced
 * - Test: Very high limits but still enforced (can be disabled with DISABLE_RATE_LIMITING=true)
 *
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
 * Rate limiting is now ALWAYS enabled by default
 * Can only be disabled explicitly with DISABLE_RATE_LIMITING=true (for specific tests)
 *
 * Note: We check process.env directly here since DISABLE_RATE_LIMITING is a test-only
 * flag that may not be in the validated env schema. This is intentional to allow
 * test-specific behavior without polluting the production config.
 */
const RATE_LIMITING_ENABLED = process.env.DISABLE_RATE_LIMITING !== "true";

/**
 * Multiplier for rate limits based on environment
 * - Production: 1x (base limits)
 * - Development: 10x (relaxed for testing)
 * - Test: 100x (very relaxed for automated tests)
 */
const RATE_LIMIT_MULTIPLIER =
  env.NODE_ENV === "production" ? 1 : env.NODE_ENV === "test" ? 100 : 10;

/**
 * Base rate limits (production values)
 * Multiplied by RATE_LIMIT_MULTIPLIER for dev/test environments
 */
const BASE_GLOBAL_LIMIT = 1000; // 1000 req/min in production
const BASE_ADMIN_LIMIT = 500;
const BASE_GENERATION_LIMIT = 10; // AI generation is expensive
const BASE_MUSIC_LIMIT = 20;
const BASE_SFX_LIMIT = 30;
const BASE_VOICE_LIMIT = 20;

/**
 * Global rate limit (applied to all routes)
 */
const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  duration: 60000, // 1 minute
  max: BASE_GLOBAL_LIMIT * RATE_LIMIT_MULTIPLIER,
  errorMessage: "Rate limit exceeded. Please try again later.",
};

/**
 * Rate limits for specific endpoint groups
 */
const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  admin: {
    duration: 60000,
    max: BASE_ADMIN_LIMIT * RATE_LIMIT_MULTIPLIER,
    errorMessage: "Admin endpoint rate limit exceeded. Please try again later.",
  },
  generation: {
    duration: 60000,
    max: BASE_GENERATION_LIMIT * RATE_LIMIT_MULTIPLIER,
    errorMessage:
      "Generation rate limit exceeded. Please wait before generating more assets.",
  },
  music: {
    duration: 60000,
    max: BASE_MUSIC_LIMIT * RATE_LIMIT_MULTIPLIER,
    errorMessage:
      "Music generation rate limit exceeded. Please try again later.",
  },
  sfx: {
    duration: 60000,
    max: BASE_SFX_LIMIT * RATE_LIMIT_MULTIPLIER,
    errorMessage:
      "Sound effect generation rate limit exceeded. Please try again later.",
  },
  voice: {
    duration: 60000,
    max: BASE_VOICE_LIMIT * RATE_LIMIT_MULTIPLIER,
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
