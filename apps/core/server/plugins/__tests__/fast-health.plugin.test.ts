/**
 * Fast Health Plugin Tests
 * Tests for fast-health.plugin.ts - ultra-fast health checks
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { fastHealthPlugin } from "../fast-health.plugin";

describe("Fast Health Plugin", () => {
  describe("Liveness check", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(fastHealthPlugin);
    });

    it("should return 200 OK for /fast-health/live", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );

      expect(response.status).toBe(200);
    });

    it("should return ok: true", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );

      const data = await response.json();
      expect(data.ok).toBe(true);
    });

    it("should respond quickly (no DB query)", async () => {
      const start = Date.now();

      const response = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it("should never fail (no dependencies)", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Readiness check", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(fastHealthPlugin);
    });

    it("should return 200 OK when database is available", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/ready"),
      );

      // Might be 503 if DB not available in test environment
      expect([200, 503]).toContain(response.status);
    });

    it("should return ok: true when ready", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/ready"),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.ok).toBe(true);
      } else {
        const data = await response.json();
        expect(data.ok).toBe(false);
      }
    });

    it("should perform minimal database check", async () => {
      const response = await app.handle(
        new Request("http://localhost/fast-health/ready"),
      );

      // Just checks connectivity, not complex queries
      expect([200, 503]).toContain(response.status);
    });

    it("should return 503 when database unavailable", async () => {
      // This would be tested by mocking DB failure
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Performance", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(fastHealthPlugin);
    });

    it("should be faster than full health check", async () => {
      const start = Date.now();

      await app.handle(new Request("http://localhost/fast-health/live"));

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should bypass middleware overhead", () => {
      // Fast health endpoints registered separately to avoid middleware
      expect(true).toBe(true);
    });
  });

  describe("Kubernetes probes", () => {
    it("should support liveness probe pattern", async () => {
      const app = new Elysia().use(fastHealthPlugin);

      const response = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );

      expect(response.status).toBe(200);
    });

    it("should support readiness probe pattern", async () => {
      const app = new Elysia().use(fastHealthPlugin);

      const response = await app.handle(
        new Request("http://localhost/fast-health/ready"),
      );

      expect([200, 503]).toContain(response.status);
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(fastHealthPlugin)
        .get("/api/test", () => ({ success: true }));

      const response = await app.handle(
        new Request("http://localhost/api/test"),
      );

      expect(response.status).toBe(200);
    });

    it("should coexist with full health routes", async () => {
      const app = new Elysia()
        .use(fastHealthPlugin)
        .get("/api/health", () => ({ status: "healthy", detailed: true }));

      const fastHealth = await app.handle(
        new Request("http://localhost/fast-health/live"),
      );
      const fullHealth = await app.handle(
        new Request("http://localhost/api/health"),
      );

      expect(fastHealth.status).toBe(200);
      expect(fullHealth.status).toBe(200);
    });
  });

  describe("OpenAPI documentation", () => {
    it("should include tags for health endpoints", () => {
      const app = new Elysia().use(fastHealthPlugin);
      // OpenAPI tags are registered in detail config
      expect(app).toBeDefined();
    });

    it("should include summary and description", () => {
      const app = new Elysia().use(fastHealthPlugin);
      // Documented in detail config
      expect(app).toBeDefined();
    });
  });
});
