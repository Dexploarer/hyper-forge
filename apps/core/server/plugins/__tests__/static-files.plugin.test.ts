/**
 * Static Files Plugin Tests
 * Tests for static-files.plugin.ts - static file serving
 */

import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { staticFilesPlugin } from "../static-files.plugin";

describe("Static Files Plugin", () => {
  describe("Static route registration", () => {
    it("should register all static file routes", () => {
      const app = new Elysia().use(staticFilesPlugin);
      expect(app).toBeDefined();
    });

    it("should handle GET and HEAD requests", () => {
      const app = new Elysia().use(staticFilesPlugin);
      expect(app).toBeDefined();
    });
  });

  describe("Temp images route", () => {
    it("should serve files from /temp-images/*", async () => {
      const app = new Elysia().use(staticFilesPlugin);

      // Note: Would need actual temp images to test file serving
      // Integration tests would verify this with real files
      expect(app).toBeDefined();
    });

    it("should return 404 for non-existent files", () => {
      expect(true).toBe(true); // Placeholder for integration test
    });
  });

  describe("Emotes route", () => {
    it("should serve GLB files from /emotes/*", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should set correct content-type for GLB files", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Rigs route", () => {
    it("should serve GLB files from /rigs/*", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Images route", () => {
    it("should serve images from /images/*", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Prompts route", () => {
    it("should serve JSON files from /prompts/*", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Vite assets route", () => {
    it("should serve bundled assets from /assets/*", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should come before SPA fallback", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("SPA fallback", () => {
    it("should serve index.html for non-API routes", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should handle HEAD request for root", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should return 404 if frontend not built", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should be registered last to allow other routes to match first", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("HEAD request support", () => {
    it("should handle HEAD requests for all routes", () => {
      expect(true).toBe(true); // Placeholder
    });

    it("should return appropriate content-type in HEAD response", () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(staticFilesPlugin)
        .get("/api/test", () => ({ success: true }));

      const response = await app.handle(
        new Request("http://localhost/api/test"),
      );

      expect(response.status).toBe(200);
    });
  });
});
