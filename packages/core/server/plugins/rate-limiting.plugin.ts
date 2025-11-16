/**
 * Rate Limiting Plugin for Elysia
 * Consolidates all rate limiting configuration into organized groups
 *
 * Rate Limits:
 * - Global: 1000 req/min (all endpoints)
 * - Admin: 100 req/min (/api/admin/*)
 * - Generation: 10 req/min (/api/generation/*)
 * - Music: 20 req/min (/api/music/*)
 * - SFX: 30 req/min (/api/sfx/*)
 * - Voice: 20 req/min (/api/voice/*)
 *
 * Uses Elysia's .group() pattern for organized route protection
 */

import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

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
 * Global rate limit (applied to all routes)
 * 1000 requests per minute per IP (generous for development)
 */
const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  duration: 60000, // 1 minute
  max: 1000,
  errorMessage: "Rate limit exceeded. Please try again later.",
};

/**
 * Rate limits for specific endpoint groups
 */
const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  admin: {
    duration: 60000,
    max: 100,
    errorMessage: "Admin endpoint rate limit exceeded. Please try again later.",
  },
  generation: {
    duration: 60000,
    max: 10,
    errorMessage:
      "Generation rate limit exceeded. Please wait before generating more assets.",
  },
  music: {
    duration: 60000,
    max: 20,
    errorMessage:
      "Music generation rate limit exceeded. Please try again later.",
  },
  sfx: {
    duration: 60000,
    max: 30,
    errorMessage:
      "Sound effect generation rate limit exceeded. Please try again later.",
  },
  voice: {
    duration: 60000,
    max: 20,
    errorMessage:
      "Voice generation rate limit exceeded. Please try again later.",
  },
};

/**
 * Rate Limiting Plugin
 * Applies global rate limiting and endpoint-specific limits
 */
export const rateLimitingPlugin = new Elysia({ name: "rate-limiting" })
  // Global rate limit for all endpoints
  .use(
    rateLimit({
      duration: GLOBAL_RATE_LIMIT.duration,
      max: GLOBAL_RATE_LIMIT.max,
      errorResponse: createRateLimitError(GLOBAL_RATE_LIMIT.errorMessage),
      // Skip rate limiting for health checks
      skip: (req) => {
        const pathname = new URL(req.url).pathname;
        return (
          pathname === "/api/health/live" ||
          pathname === "/api/health/ready" ||
          pathname === "/api/health/deep"
        );
      },
    }),
  )

  // Admin endpoints - stricter rate limiting
  .group("/api/admin", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.admin.duration,
        max: ENDPOINT_RATE_LIMITS.admin.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.admin.errorMessage,
        ),
      }),
    ),
  )

  // Generation endpoints - very strict (expensive AI operations)
  .group("/api/generation", (app) =>
    app.use(
      rateLimit({
        duration: ENDPOINT_RATE_LIMITS.generation.duration,
        max: ENDPOINT_RATE_LIMITS.generation.max,
        errorResponse: createRateLimitError(
          ENDPOINT_RATE_LIMITS.generation.errorMessage,
        ),
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
      }),
    ),
  );
