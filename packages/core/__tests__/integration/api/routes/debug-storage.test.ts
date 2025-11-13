/**
 * Debug CDN Routes Tests
 * Tests for CDN health check and storage statistics
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { debugStorageRoute } from "../../../../server/routes/debug-storage";

describe("Debug CDN Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(debugStorageRoute);
  });

  describe("GET /api/debug/cdn-health", () => {
    it("should return CDN health information", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("architecture");
      expect(data.architecture).toBe("CDN-First");
      expect(data).toHaveProperty("cdn");
      expect(data).toHaveProperty("environment");
      expect(data).toHaveProperty("statistics");
      expect(data).toHaveProperty("webhook");
    });

    it("should return CDN configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      const data = await response.json();
      expect(data.cdn).toHaveProperty("url");
      expect(data.cdn).toHaveProperty("healthy");
      expect(data.cdn).toHaveProperty("configured");
    });

    it("should return environment information", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      const data = await response.json();
      expect(data.environment).toHaveProperty("NODE_ENV");
      expect(data.environment).toHaveProperty("isProduction");
      expect(data.environment).toHaveProperty("isRailway");
    });

    it("should return asset and media statistics", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      const data = await response.json();
      expect(data.statistics).toHaveProperty("assets");
      expect(data.statistics).toHaveProperty("media");
      expect(data.statistics).toHaveProperty("total");

      expect(data.statistics.assets).toHaveProperty("total");
      expect(data.statistics.assets).toHaveProperty("withCdnUrl");
      expect(data.statistics.assets).toHaveProperty("withoutCdnUrl");

      expect(data.statistics.total).toHaveProperty("all");
      expect(data.statistics.total).toHaveProperty("withCdnUrl");
    });

    it("should return webhook configuration", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      const data = await response.json();
      expect(data.webhook).toHaveProperty("enabled");
      expect(data.webhook).toHaveProperty("configured");
      expect(typeof data.webhook.enabled).toBe("boolean");
      expect(typeof data.webhook.configured).toBe("boolean");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/cdn-health"),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/debug/storage-info (deprecated)", () => {
    it("should return deprecation notice", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("message");
      expect(data.message).toContain("deprecated");
      expect(data.message).toContain("CDN-first");
      expect(data).toHaveProperty("redirect");
      expect(data.redirect).toBe("/api/debug/cdn-health");
    });

    it("should inform about CDN-first architecture", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/debug/storage-info"),
      );

      const data = await response.json();
      expect(data).toHaveProperty("info");
      expect(data.info).toContain("CDN");
    });
  });
});
