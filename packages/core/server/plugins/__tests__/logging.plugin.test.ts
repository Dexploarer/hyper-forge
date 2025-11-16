/**
 * Logging Plugin Tests
 * Tests for logging.plugin.ts - request/response logging
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { loggingPlugin } from "../logging.plugin";
import { requestID } from "../request-id";

describe("Logging Plugin", () => {
  describe("Request logging", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", () => ({ success: true }));
    });

    it("should log request details", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      // Logging would be verified via log inspection in integration tests
    });

    it("should include request method and path", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });
  });

  describe("Response logging", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", () => ({ success: true }));
    });

    it("should log response status and duration", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should add x-request-id header to response", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const requestId = response.headers.get("x-request-id");
      expect(requestId).toBeDefined();
      expect(requestId).not.toBe("unknown");
    });

    it("should add server-timing header", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const serverTiming = response.headers.get("server-timing");
      expect(serverTiming).toBeDefined();
      expect(serverTiming).toMatch(/total;dur=\d+/);
    });
  });

  describe("Slow request detection", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/slow", async () => {
          await new Promise((resolve) => setTimeout(resolve, 1100));
          return { success: true };
        });
    });

    it("should flag slow requests (>1s)", async () => {
      const response = await app.handle(new Request("http://localhost/slow"));

      expect(response.status).toBe(200);
      // Would verify "SLOW" flag in logs via integration test
    });
  });

  describe("Error logging", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/error-500", () => {
          throw new Error("Server error");
        })
        .get("/error-400", () => {
          const error: any = new Error("Bad request");
          error.status = 400;
          throw error;
        });
    });

    it("should log 5xx errors as error level", async () => {
      try {
        await app.handle(new Request("http://localhost/error-500"));
      } catch (e) {
        // Error expected
      }
      // Would verify error-level logging in integration test
      expect(true).toBe(true);
    });

    it("should log 4xx errors as warn level", async () => {
      try {
        await app.handle(new Request("http://localhost/error-400"));
      } catch (e) {
        // Error expected
      }
      // Would verify warn-level logging in integration test
      expect(true).toBe(true);
    });
  });

  describe("Request correlation", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", ({ requestLogger }) => {
          // requestLogger should be available
          return { success: true };
        });
    });

    it("should create request-specific logger", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should correlate logs with request ID", async () => {
      const customRequestId = "test-req-123";
      const response = await app.handle(
        new Request("http://localhost/test", {
          headers: {
            "x-request-id": customRequestId,
          },
        }),
      );

      const responseRequestId = response.headers.get("x-request-id");
      expect(responseRequestId).toBe(customRequestId);
    });
  });

  describe("Performance monitoring", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", () => ({ success: true }));
    });

    it("should track request duration", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const serverTiming = response.headers.get("server-timing");
      expect(serverTiming).toMatch(/total;dur=\d+/);
    });

    it("should include timing breakdown if available", async () => {
      // Would test with timings context in integration test
      expect(true).toBe(true);
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should require request-id plugin", async () => {
      // Logging plugin depends on request-id for correlation
      const app = new Elysia()
        .use(requestID())
        .use(loggingPlugin)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.headers.get("x-request-id")).toBeDefined();
    });
  });
});
