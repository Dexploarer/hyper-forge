/**
 * Caching Middleware
 * Intelligent cache headers for static files, API responses, and user-specific data
 *
 * Cache Strategy:
 * - Immutable assets (with content hash): Cache-Control: public, max-age=31536000, immutable
 * - Versioned API responses: Cache-Control: public, max-age=3600 with ETag
 * - User-specific data: Cache-Control: private, max-age=300
 * - No cache for mutations: Cache-Control: no-store for POST/PUT/DELETE
 *
 * Features:
 * - ETag generation for conditional requests (304 Not Modified)
 * - Vary header for content negotiation
 * - Smart cache invalidation based on route type
 */

import { Elysia } from "elysia";
import crypto from "crypto";

/**
 * Generate ETag from response body
 * Uses SHA-256 hash for strong validation
 */
function generateETag(content: string | Uint8Array | ArrayBuffer): string {
  const buffer =
    typeof content === "string"
      ? Buffer.from(content)
      : Buffer.from(content as Uint8Array);
  const hash = crypto.createHash("sha256").update(buffer).digest("base64");
  return `"${hash.substring(0, 27)}"`; // Truncate to reasonable length
}

/**
 * Check if client has valid cached version
 */
function isNotModified(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag;
}

/**
 * Determine cache strategy based on request path and method
 */
function getCacheHeaders(path: string, method: string): Record<string, string> {
  const headers: Record<string, string> = {};

  // Never cache mutations
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    headers["Cache-Control"] = "no-store";
    return headers;
  }

  // Immutable assets with content hash (Vite generates these)
  // Example: /assets/index-abc123.js, /assets/logo-xyz789.png
  if (
    path.startsWith("/assets/") &&
    /\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i.test(
      path,
    )
  ) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
    return headers;
  }

  // Static files without hash - shorter cache for updates
  if (path.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i)) {
    headers["Cache-Control"] = "public, max-age=3600"; // 1 hour
    headers["Vary"] = "Accept-Encoding";
    return headers;
  }

  // 3D model files (.glb, .gltf) - longer cache, they rarely change
  if (path.match(/\.(glb|gltf)$/i)) {
    headers["Cache-Control"] = "public, max-age=86400"; // 24 hours
    headers["Vary"] = "Accept-Encoding";
    return headers;
  }

  // Image proxy responses - cache for 1 year (they're immutable URLs)
  if (path.startsWith("/api/proxy/image")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
    return headers;
  }

  // Public API endpoints (no auth required)
  if (
    path.startsWith("/api/health") ||
    path.startsWith("/api/public/") ||
    path.startsWith("/api/profiles/")
  ) {
    headers["Cache-Control"] = "public, max-age=60"; // 1 minute
    headers["Vary"] = "Accept-Encoding";
    return headers;
  }

  // User-specific API responses (requires auth)
  if (path.startsWith("/api/")) {
    headers["Cache-Control"] = "private, max-age=300"; // 5 minutes
    headers["Vary"] = "Authorization, Accept-Encoding";
    return headers;
  }

  // HTML pages (SPA fallback) - short cache, must revalidate
  if (path === "/" || !path.includes(".")) {
    headers["Cache-Control"] = "public, max-age=0, must-revalidate";
    return headers;
  }

  // Default: no cache
  headers["Cache-Control"] = "no-cache";
  return headers;
}

/**
 * Caching middleware for Elysia
 * Adds intelligent cache headers and ETag support
 */
export const cachingMiddleware = new Elysia({ name: "caching" })
  // Store original response for ETag generation
  .derive((context) => {
    return {
      enableETag: false,
      etag: null as string | null,
    };
  })

  // Add cache headers after response is generated
  .onAfterResponse(async (context) => {
    const { request, set } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Get appropriate cache headers
    const cacheHeaders = getCacheHeaders(path, method);

    // Apply cache headers
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      set.headers[key.toLowerCase()] = value;
    });

    // Add ETag for GET requests on cacheable resources
    // Note: We can't generate ETag from response body after it's sent
    // This would require buffering the response, which we'll implement for JSON responses only
    if (method === "GET" && cacheHeaders["Cache-Control"]?.includes("public")) {
      // ETag will be added by compression plugin if applicable
      // or by individual route handlers for critical responses
    }
  });

/**
 * ETag helper for route handlers
 * Use this in route handlers to add ETag support
 *
 * Example:
 * ```ts
 * app.get("/api/data", async ({ request, set }) => {
 *   const data = { ... };
 *   const json = JSON.stringify(data);
 *   const etag = generateETag(json);
 *
 *   if (isNotModified(request, etag)) {
 *     set.status = 304;
 *     return null;
 *   }
 *
 *   set.headers["etag"] = etag;
 *   return data;
 * });
 * ```
 */
export { generateETag, isNotModified };
