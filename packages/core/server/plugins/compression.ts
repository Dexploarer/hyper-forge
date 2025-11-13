/**
 * Response Compression Plugin
 * Implements Brotli (primary) and Gzip (fallback) compression for HTTP responses
 *
 * Features:
 * - Brotli compression (20-30% better than Gzip)
 * - Gzip fallback for older clients
 * - Smart compression based on content type and size
 * - Skips already-compressed formats (images, videos, .glb)
 * - Sets appropriate Content-Encoding and Vary headers
 *
 * Performance:
 * - Only compresses responses > 1KB (overhead not worth it for smaller responses)
 * - Compresses JSON, HTML, CSS, JS, SVG, XML
 * - Uses Bun's native compression APIs for best performance
 */

import { Elysia } from "elysia";
import * as zlib from "node:zlib";
import { generateETag } from "../middleware/caching";

/**
 * Minimum response size to compress (bytes)
 * Responses smaller than this won't be compressed (overhead not worth it)
 */
const MIN_COMPRESS_SIZE = 1024; // 1KB

/**
 * Content types that should be compressed
 */
const COMPRESSIBLE_TYPES = [
  "text/html",
  "text/css",
  "text/plain",
  "text/xml",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "application/x-javascript",
  "application/xhtml+xml",
  "application/rss+xml",
  "application/atom+xml",
  "image/svg+xml",
  "application/ld+json",
  "application/manifest+json",
];

/**
 * Check if content type is compressible
 */
function isCompressible(contentType: string | null): boolean {
  if (!contentType) return false;

  // Check against known compressible types
  return COMPRESSIBLE_TYPES.some((type) =>
    contentType.toLowerCase().includes(type),
  );
}

/**
 * Get supported compression from Accept-Encoding header
 * Returns 'br' for Brotli, 'gzip' for Gzip, or null if not supported
 */
function getSupportedCompression(
  acceptEncoding: string | null,
): "br" | "gzip" | null {
  if (!acceptEncoding) return null;

  const encoding = acceptEncoding.toLowerCase();

  // Prefer Brotli (better compression)
  if (encoding.includes("br")) {
    return "br";
  }

  // Fallback to Gzip
  if (encoding.includes("gzip")) {
    return "gzip";
  }

  return null;
}

/**
 * Compress data using Brotli
 * Uses Bun's Node.js compatibility layer for Brotli
 */
function compressBrotli(data: Buffer): Buffer {
  return zlib.brotliCompressSync(data, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // 0-11, 4 is good balance of speed/compression
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
    },
  });
}

/**
 * Compress data using Gzip
 * Uses Bun's native gzipSync for best performance
 */
function compressGzip(data: Buffer): Buffer {
  // Use zlib.gzipSync for better TypeScript compatibility with Bun
  return zlib.gzipSync(data, {
    level: 6, // 0-9, 6 is default and good balance
  });
}

/**
 * Compression plugin for Elysia
 * Compresses responses based on Accept-Encoding header
 */
export const compression = new Elysia({ name: "compression" })
  .onAfterResponse(async (context) => {
    const { request, set } = context;

    // Get response body from context
    // Note: In Elysia, we can't modify the response after it's sent
    // This is a demonstration of the compression logic
    // In production, you'd need to use onBeforeHandle or transform hooks
  })
  .derive((context) => {
    return {
      compress: async (data: any, contentType: string | null = null) => {
        const { request, set } = context;

        // Convert data to Buffer
        let buffer: Buffer;
        if (typeof data === "string") {
          buffer = Buffer.from(data);
        } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
          buffer = Buffer.from(data as Uint8Array);
        } else if (typeof data === "object") {
          // Assume JSON
          buffer = Buffer.from(JSON.stringify(data));
          contentType = contentType || "application/json";
        } else {
          // Can't compress this
          return data;
        }

        // Check if compression is worthwhile
        if (buffer.length < MIN_COMPRESS_SIZE) {
          return data;
        }

        // Check if content type is compressible
        const responseContentType = contentType || set.headers["content-type"];
        if (!isCompressible(responseContentType as string)) {
          return data;
        }

        // Get client's supported compression
        const acceptEncoding = request.headers.get("accept-encoding");
        const compression = getSupportedCompression(acceptEncoding);

        if (!compression) {
          return data;
        }

        // Compress the data
        let compressed: Buffer;
        try {
          if (compression === "br") {
            compressed = compressBrotli(buffer);
            set.headers["content-encoding"] = "br";
          } else {
            compressed = compressGzip(buffer);
            set.headers["content-encoding"] = "gzip";
          }

          // Set Vary header for caching
          set.headers["vary"] = set.headers["vary"]
            ? `${set.headers["vary"]}, Accept-Encoding`
            : "Accept-Encoding";

          // Update content length
          set.headers["content-length"] = String(compressed.length);

          // Generate ETag for compressed content
          const etag = generateETag(compressed);
          set.headers["etag"] = etag;

          // Log compression ratio for monitoring
          const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(
            1,
          );
          console.log(
            `[Compression] ${compression.toUpperCase()}: ${buffer.length} -> ${compressed.length} bytes (${ratio}% reduction)`,
          );

          return new Response(compressed as unknown as BodyInit, {
            headers: {
              "content-type": responseContentType as string,
              "content-encoding": compression,
              "content-length": String(compressed.length),
              etag: etag,
              vary: "Accept-Encoding",
            } as HeadersInit,
          });
        } catch (error) {
          console.error("[Compression] Error compressing response:", error);
          return data;
        }
      },
    };
  });

/**
 * Helper function to compress JSON responses
 * Use this in route handlers for automatic compression
 *
 * Example:
 * ```ts
 * app.get("/api/data", async ({ compress }) => {
 *   const data = { large: "json", object: [...] };
 *   return compress(data, "application/json");
 * });
 * ```
 */
export {
  compressBrotli,
  compressGzip,
  isCompressible,
  getSupportedCompression,
};
