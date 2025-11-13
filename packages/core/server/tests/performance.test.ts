/**
 * Performance Benchmark Tests
 * Tests compression ratios, caching headers, and database query performance
 */

import { describe, it, expect } from "bun:test";
import {
  compressBrotli,
  compressGzip,
  isCompressible,
  getSupportedCompression,
} from "../plugins/compression";
import { generateETag, isNotModified } from "../middleware/caching";

describe("Performance Optimizations", () => {
  describe("Compression", () => {
    it("should compress JSON with Brotli efficiently", () => {
      const largeJson = JSON.stringify({
        data: new Array(1000).fill({
          id: "abc123",
          name: "test",
          description: "long description here",
        }),
      });

      const original = Buffer.from(largeJson);
      const compressed = compressBrotli(original);

      // Calculate compression ratio
      const ratio = (1 - compressed.length / original.length) * 100;

      console.log(
        `[Brotli] Original: ${original.length} bytes, Compressed: ${compressed.length} bytes (${ratio.toFixed(1)}% reduction)`,
      );

      // Expect at least 60% compression for JSON
      expect(ratio).toBeGreaterThan(60);
      expect(compressed.length).toBeLessThan(original.length);
    });

    it("should compress JSON with Gzip efficiently", () => {
      const largeJson = JSON.stringify({
        data: new Array(1000).fill({
          id: "abc123",
          name: "test",
          description: "long description here",
        }),
      });

      const original = Buffer.from(largeJson);
      const compressed = compressGzip(original);

      // Calculate compression ratio
      const ratio = (1 - compressed.length / original.length) * 100;

      console.log(
        `[Gzip] Original: ${original.length} bytes, Compressed: ${compressed.length} bytes (${ratio.toFixed(1)}% reduction)`,
      );

      // Expect at least 70% compression for JSON
      expect(ratio).toBeGreaterThan(70);
      expect(compressed.length).toBeLessThan(original.length);
    });

    it("should detect compressible content types", () => {
      expect(isCompressible("application/json")).toBe(true);
      expect(isCompressible("text/html")).toBe(true);
      expect(isCompressible("text/css")).toBe(true);
      expect(isCompressible("application/javascript")).toBe(true);

      // Should NOT compress these
      expect(isCompressible("image/png")).toBe(false);
      expect(isCompressible("image/jpeg")).toBe(false);
      expect(isCompressible("video/mp4")).toBe(false);
      expect(isCompressible("model/gltf-binary")).toBe(false);
    });

    it("should select correct compression from Accept-Encoding", () => {
      // Prefer Brotli
      expect(getSupportedCompression("gzip, deflate, br")).toBe("br");
      expect(getSupportedCompression("br, gzip")).toBe("br");

      // Fallback to Gzip
      expect(getSupportedCompression("gzip, deflate")).toBe("gzip");
      expect(getSupportedCompression("gzip")).toBe("gzip");

      // No compression
      expect(getSupportedCompression("identity")).toBe(null);
      expect(getSupportedCompression(null)).toBe(null);
    });

    it("should achieve better compression with Brotli than Gzip", () => {
      const largeJson = JSON.stringify({
        data: new Array(1000).fill({
          id: "abc123",
          name: "test",
          description: "long description here",
        }),
      });

      const original = Buffer.from(largeJson);
      const brotli = compressBrotli(original);
      const gzip = compressGzip(original);

      // Brotli should be smaller (or equal in rare cases)
      expect(brotli.length).toBeLessThanOrEqual(gzip.length);

      const brotliRatio = (1 - brotli.length / original.length) * 100;
      const gzipRatio = (1 - gzip.length / original.length) * 100;

      console.log(`Brotli compression: ${brotliRatio.toFixed(1)}%`);
      console.log(`Gzip compression: ${gzipRatio.toFixed(1)}%`);
    });
  });

  describe("Caching", () => {
    it("should generate consistent ETags for same content", () => {
      const content = "Hello, World!";
      const etag1 = generateETag(content);
      const etag2 = generateETag(content);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^"[A-Za-z0-9+/=]+"$/); // Base64 format
    });

    it("should generate different ETags for different content", () => {
      const content1 = "Hello, World!";
      const content2 = "Goodbye, World!";

      const etag1 = generateETag(content1);
      const etag2 = generateETag(content2);

      expect(etag1).not.toBe(etag2);
    });

    it("should detect if resource is not modified", () => {
      const content = "Test content";
      const etag = generateETag(content);

      // Create mock request with If-None-Match header
      const request = new Request("http://localhost/test", {
        headers: { "if-none-match": etag },
      });

      expect(isNotModified(request, etag)).toBe(true);
    });

    it("should detect if resource is modified", () => {
      const content = "Test content";
      const etag = generateETag(content);

      // Create mock request with different ETag
      const request = new Request("http://localhost/test", {
        headers: { "if-none-match": '"different-etag"' },
      });

      expect(isNotModified(request, etag)).toBe(false);
    });
  });

  describe("Performance Metrics", () => {
    it("should measure compression time", () => {
      const largeData = Buffer.from(
        JSON.stringify({
          data: new Array(10000).fill({ id: "test", value: "data" }),
        }),
      );

      // Measure Brotli compression time
      const brotliStart = performance.now();
      compressBrotli(largeData);
      const brotliTime = performance.now() - brotliStart;

      // Measure Gzip compression time
      const gzipStart = performance.now();
      compressGzip(largeData);
      const gzipTime = performance.now() - gzipStart;

      console.log(`Brotli compression time: ${brotliTime.toFixed(2)}ms`);
      console.log(`Gzip compression time: ${gzipTime.toFixed(2)}ms`);

      // Both should be fast (< 100ms for this size)
      expect(brotliTime).toBeLessThan(100);
      expect(gzipTime).toBeLessThan(100);
    });

    it("should measure ETag generation time", () => {
      const largeData = Buffer.from(
        JSON.stringify({
          data: new Array(10000).fill({ id: "test", value: "data" }),
        }),
      );

      const start = performance.now();
      generateETag(largeData);
      const duration = performance.now() - start;

      console.log(`ETag generation time: ${duration.toFixed(2)}ms`);

      // Should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });
});
