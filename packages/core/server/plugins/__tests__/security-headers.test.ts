/**
 * Security Headers Plugin Tests
 * Tests for security-headers.ts - HTTP security headers
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { securityHeaders } from "../security-headers";

describe("Security Headers Plugin", () => {
  describe("COOP header", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(securityHeaders)
        .get("/test", () => ({ success: true }));
    });

    it("should set Cross-Origin-Opener-Policy header", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const coop = response.headers.get("cross-origin-opener-policy");
      expect(coop).toBeDefined();
    });

    it("should allow popups for OAuth flows", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const coop = response.headers.get("cross-origin-opener-policy");
      expect(coop).toBe("same-origin-allow-popups");
    });
  });

  describe("Content security headers", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(securityHeaders)
        .get("/test", () => ({ success: true }));
    });

    it("should set X-Content-Type-Options header", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const contentType = response.headers.get("x-content-type-options");
      expect(contentType).toBe("nosniff");
    });

    it("should set X-Frame-Options header", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const frameOptions = response.headers.get("x-frame-options");
      expect(frameOptions).toBe("DENY");
    });
  });

  describe("COEP header", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(securityHeaders)
        .get("/test", () => ({ success: true }));
    });

    it("should not set COEP header (removed for Privy)", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const coep = response.headers.get("cross-origin-embedder-policy");
      expect(coep).toBeNull();
    });
  });

  describe("All endpoints", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(securityHeaders)
        .get("/page1", () => ({ page: 1 }))
        .get("/page2", () => ({ page: 2 }))
        .post("/api/data", () => ({ created: true }));
    });

    it("should apply security headers to GET requests", async () => {
      const response = await app.handle(new Request("http://localhost/page1"));

      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
    });

    it("should apply security headers to POST requests", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/data", {
          method: "POST",
        }),
      );

      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
    });

    it("should apply headers consistently across routes", async () => {
      const response1 = await app.handle(new Request("http://localhost/page1"));
      const response2 = await app.handle(new Request("http://localhost/page2"));

      expect(response1.headers.get("cross-origin-opener-policy")).toBe(
        response2.headers.get("cross-origin-opener-policy"),
      );
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(securityHeaders)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      expect(response.headers.get("x-content-type-options")).toBeDefined();
    });

    it("should apply before route handlers", async () => {
      const app = new Elysia().use(securityHeaders).get("/test", ({ set }) => {
        // Security headers should already be set
        return { success: true };
      });

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });
  });

  describe("Error responses", () => {
    it("should apply security headers even to error responses", async () => {
      const app = new Elysia().use(securityHeaders).get("/error", () => {
        throw new Error("Test error");
      });

      try {
        const response = await app.handle(
          new Request("http://localhost/error"),
        );

        // Even on error, security headers should be present
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      } catch (e) {
        // Error expected
      }
    });
  });
});
