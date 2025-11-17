/**
 * Caching Plugin Tests
 * Tests for caching.plugin.ts - HTTP caching headers and ETag support
 */

import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { cachingPlugin, generateETag, isNotModified } from "../caching.plugin";

describe("Caching Plugin", () => {
  describe("generateETag", () => {
    it("should generate consistent ETags for same content", () => {
      const content = "test content";
      const etag1 = generateETag(content);
      const etag2 = generateETag(content);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^".*"$/); // Should be wrapped in quotes
    });

    it("should generate different ETags for different content", () => {
      const etag1 = generateETag("content 1");
      const etag2 = generateETag("content 2");

      expect(etag1).not.toBe(etag2);
    });

    it("should handle Buffer input", () => {
      const buffer = Buffer.from("test");
      const etag = generateETag(buffer);

      expect(etag).toBeDefined();
      expect(etag).toMatch(/^".*"$/);
    });

    it("should handle ArrayBuffer input", () => {
      const arrayBuffer = new ArrayBuffer(10);
      const etag = generateETag(arrayBuffer);

      expect(etag).toBeDefined();
    });
  });

  describe("isNotModified", () => {
    it("should return true when ETags match", () => {
      const etag = '"abc123"';
      const request = new Request("http://localhost/test", {
        headers: { "if-none-match": etag },
      });

      expect(isNotModified(request, etag)).toBe(true);
    });

    it("should return false when ETags differ", () => {
      const request = new Request("http://localhost/test", {
        headers: { "if-none-match": '"different"' },
      });

      expect(isNotModified(request, '"abc123"')).toBe(false);
    });

    it("should return false when no if-none-match header", () => {
      const request = new Request("http://localhost/test");

      expect(isNotModified(request, '"abc123"')).toBe(false);
    });
  });

  describe("Cache headers for static assets", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(cachingPlugin)
        .get("/assets/index-abc12345.js", () => "console.log('test');")
        .get("/assets/logo-xyz98765.png", () => "fake image data")
        .get("/static/app.js", () => "console.log('app');");
    });

    it("should set immutable cache for hashed assets", async () => {
      const response = await app.handle(
        new Request("http://localhost/assets/index-abc12345.js"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("immutable");
      expect(cacheControl).toContain("max-age=31536000");
    });

    it("should set shorter cache for non-hashed assets", async () => {
      const response = await app.handle(
        new Request("http://localhost/static/app.js"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("max-age=3600");
    });
  });

  describe("Cache headers for API endpoints", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(cachingPlugin)
        .get("/api/public/data", () => ({ data: "public" }))
        .get("/api/users/me", () => ({ user: "private" }))
        .post("/api/assets", () => ({ created: true }));
    });

    it("should set public cache for public endpoints", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/public/data"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("max-age=60");
    });

    it("should set private cache for user-specific endpoints", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/me"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("private");
    });

    it("should set no-store for mutations", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/assets", {
          method: "POST",
        }),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toBe("no-store");
    });
  });

  describe("Cache headers for 3D models", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(cachingPlugin)
        .get("/models/avatar.glb", () => "fake glb data");
    });

    it("should set long cache for .glb files", async () => {
      const response = await app.handle(
        new Request("http://localhost/models/avatar.glb"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("max-age=86400"); // 24 hours
    });
  });

  describe("Cache headers for image proxy", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(cachingPlugin)
        .get("/api/proxy/image", () => "fake image");
    });

    it("should set immutable cache for proxied images", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/proxy/image?url=example.com/img.jpg"),
      );

      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("immutable");
    });
  });

  describe("Vary header", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(cachingPlugin)
        .get("/api/data", () => ({ data: "test" }));
    });

    it("should include Authorization in Vary for API responses", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/data"),
      );

      const vary = response.headers.get("vary");
      expect(vary).toContain("Authorization");
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(cachingPlugin)
        .get("/test", () => ({ data: "test" }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });
  });
});
