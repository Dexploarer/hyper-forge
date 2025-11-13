/**
 * Rate Limit Enhancement Middleware
 * Adds Retry-After header to rate limit error responses
 *
 * The elysia-rate-limit plugin automatically adds:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 *
 * This middleware adds:
 * - Retry-After: Seconds until rate limit resets (when limit exceeded)
 */

import { Elysia } from "elysia";

export const rateLimitHeaders = new Elysia({ name: "rate-limit-headers" })
  // Add Retry-After header to 429 (Too Many Requests) responses
  .onAfterHandle(({ set }) => {
    // Check if this is a rate limit error response
    if (set.status === 429) {
      // Extract reset time from X-RateLimit-Reset header (Unix timestamp in seconds)
      const resetHeader = set.headers?.["x-ratelimit-reset"];

      if (resetHeader) {
        const resetTime = Number(resetHeader);
        const now = Math.floor(Date.now() / 1000);
        const retryAfterSeconds = Math.max(0, resetTime - now);

        // Add Retry-After header (HTTP standard for rate limiting)
        set.headers["Retry-After"] = String(retryAfterSeconds);
      }
    }
  });
