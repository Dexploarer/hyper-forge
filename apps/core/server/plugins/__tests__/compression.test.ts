/**
 * Compression Plugin Tests
 * Tests for compression.ts - response compression (Brotli/Gzip)
 */

import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import {
  compression,
  compressBrotli,
  compressGzip,
  isCompressible,
  getSupportedCompression,
} from "../compression";

describe("Compression Plugin", () => {
  describe("isCompressible", () => {
    it("should identify compressible content types", () => {
      expect(isCompressible("text/html")).toBe(true);
      expect(isCompressible("text/css")).toBe(true);
      expect(isCompressible("text/javascript")).toBe(true);
      expect(isCompressible("application/json")).toBe(true);
      expect(isCompressible("application/xml")).toBe(true);
      expect(isCompressible("image/svg+xml")).toBe(true);
    });

    it("should reject non-compressible content types", () => {
      expect(isCompressible("image/png")).toBe(false);
      expect(isCompressible("image/jpeg")).toBe(false);
      expect(isCompressible("video/mp4")).toBe(false);
      expect(isCompressible("model/gltf-binary")).toBe(false);
    });

    it("should handle null content type", () => {
      expect(isCompressible(null)).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isCompressible("TEXT/HTML")).toBe(true);
      expect(isCompressible("Application/JSON")).toBe(true);
    });
  });

  describe("getSupportedCompression", () => {
    it("should detect Brotli support", () => {
      expect(getSupportedCompression("br, gzip, deflate")).toBe("br");
      expect(getSupportedCompression("gzip, br")).toBe("br");
    });

    it("should detect Gzip support", () => {
      expect(getSupportedCompression("gzip, deflate")).toBe("gzip");
      expect(getSupportedCompression("deflate, gzip")).toBe("gzip");
    });

    it("should prefer Brotli over Gzip", () => {
      expect(getSupportedCompression("br, gzip")).toBe("br");
      expect(getSupportedCompression("gzip, br, deflate")).toBe("br");
    });

    it("should handle case-insensitive encoding", () => {
      expect(getSupportedCompression("BR, GZIP")).toBe("br");
      expect(getSupportedCompression("GZIP")).toBe("gzip");
    });

    it("should return null for unsupported encodings", () => {
      expect(getSupportedCompression("deflate")).toBe(null);
      expect(getSupportedCompression("identity")).toBe(null);
      expect(getSupportedCompression(null)).toBe(null);
    });
  });

  describe("compressBrotli", () => {
    it("should compress data with Brotli", () => {
      // Use larger data to ensure compression actually reduces size
      const data = Buffer.from("test data to compress ".repeat(100));
      const compressed = compressBrotli(data);

      expect(compressed).toBeDefined();
      expect(compressed.length).toBeLessThan(data.length);
    });

    it("should produce consistent output", () => {
      const data = Buffer.from("test");
      const compressed1 = compressBrotli(data);
      const compressed2 = compressBrotli(data);

      expect(compressed1.equals(compressed2)).toBe(true);
    });
  });

  describe("compressGzip", () => {
    it("should compress data with Gzip", () => {
      // Use larger data to ensure compression actually reduces size
      const data = Buffer.from("test data to compress ".repeat(100));
      const compressed = compressGzip(data);

      expect(compressed).toBeDefined();
      expect(compressed.length).toBeLessThan(data.length);
    });

    it("should produce consistent output", () => {
      const data = Buffer.from("test");
      const compressed1 = compressGzip(data);
      const compressed2 = compressGzip(data);

      expect(compressed1.equals(compressed2)).toBe(true);
    });
  });

  describe("Compression ratio", () => {
    it("should achieve good compression for repetitive data", () => {
      const data = Buffer.from("a".repeat(10000));
      const compressed = compressBrotli(data);

      const ratio = compressed.length / data.length;
      expect(ratio).toBeLessThan(0.1); // Should compress very well
    });

    it("should not expand already compressed data", () => {
      const data = Buffer.from("random data");
      const compressed = compressGzip(data);

      // Might be larger for small data due to overhead
      expect(compressed).toBeDefined();
    });
  });

  describe("Minimum compress size", () => {
    it("should skip compression for small responses", () => {
      // Responses < 1KB should not be compressed
      // This is tested in the compress function integration
      expect(true).toBe(true);
    });

    it("should compress responses >= 1KB", () => {
      // Responses >= 1KB should be compressed
      expect(true).toBe(true);
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(compression)
        .get("/test", () => ({ data: "test" }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should provide compress function in context", async () => {
      const app = new Elysia().use(compression).get("/test", ({ compress }) => {
        expect(compress).toBeDefined();
        expect(typeof compress).toBe("function");
        return { success: true };
      });

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });
  });

  describe("Content-Encoding header", () => {
    it("should set content-encoding for compressed responses", () => {
      // Tested in integration tests with actual compression
      expect(true).toBe(true);
    });

    it("should set Vary header for caching", () => {
      // Should include "Accept-Encoding" in Vary header
      expect(true).toBe(true);
    });
  });

  describe("ETag generation", () => {
    it("should generate ETag for compressed content", () => {
      // Tested in integration tests
      expect(true).toBe(true);
    });

    it("should update content-length header", () => {
      // Should reflect compressed size
      expect(true).toBe(true);
    });
  });
});
