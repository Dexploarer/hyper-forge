/**
 * Health Routes Tests
 * Tests for health check endpoints
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { healthRoutes } from "../../../../server/routes/health";

describe("Health Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(healthRoutes);
  });

  describe("GET /api/health/ready", () => {
    it("should return ready status with timestamp", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health/ready"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toBe("ready");
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe("string");

      // Validate timestamp is valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });

    it("should report database and qdrant status", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health/ready"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.checks).toBeDefined();
      expect(typeof data.checks.database).toBe("boolean");
      expect(typeof data.checks.qdrant).toBe("boolean");
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health/ready"),
      );

      expect(response.status).toBe(200);
      // No 401 error expected
    });

    it("should return correct content type", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health/ready"),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
    });

    it("should return status quickly (for Kubernetes probes)", async () => {
      const start = Date.now();

      const response = await app.handle(
        new Request("http://localhost/api/health/ready"),
      );

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Readiness checks DB, so allow 1s
    });
  });

  describe("GET /api/health/live", () => {
    it("should return OK status", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health/live"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toBe("ok");
      expect(data.timestamp).toBeDefined();
    });

    it("should return within 50ms (liveness is fast)", async () => {
      const start = Date.now();

      const response = await app.handle(
        new Request("http://localhost/api/health/live"),
      );

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(50);
    });
  });
});
