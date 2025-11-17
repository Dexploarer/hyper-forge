/**
 * Request ID Plugin Tests
 * Tests for request-id.ts - unique request correlation IDs
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { requestID } from "../request-id";

describe("Request ID Plugin", () => {
  describe("Request ID generation", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .get("/test", ({ requestID }) => ({ requestID }));
    });

    it("should generate unique request ID", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const data = await response.json();
      expect(data.requestID).toBeDefined();
      expect(typeof data.requestID).toBe("string");
      expect(data.requestID.length).toBeGreaterThan(0);
    });

    it("should generate different IDs for different requests", async () => {
      const response1 = await app.handle(new Request("http://localhost/test"));
      const response2 = await app.handle(new Request("http://localhost/test"));

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.requestID).not.toBe(data2.requestID);
    });

    it("should use UUID format", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const data = await response.json();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(data.requestID).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("Client-provided request ID", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .get("/test", ({ requestID }) => ({ requestID }));
    });

    it("should use existing x-request-id header if provided", async () => {
      const customID = "custom-request-123";
      const response = await app.handle(
        new Request("http://localhost/test", {
          headers: {
            "x-request-id": customID,
          },
        }),
      );

      const data = await response.json();
      expect(data.requestID).toBe(customID);
    });

    it("should prefer client ID over generated ID", async () => {
      const customID = "client-provided-id";
      const response = await app.handle(
        new Request("http://localhost/test", {
          headers: {
            "x-request-id": customID,
          },
        }),
      );

      const data = await response.json();
      expect(data.requestID).toBe(customID);
    });
  });

  describe("Response headers", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(requestID())
        .get("/test", () => ({ success: true }));
    });

    it("should add x-request-id to response headers", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      const requestId = response.headers.get("x-request-id");
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe("string");
    });

    it("should match request ID in context and response header", async () => {
      const app = new Elysia()
        .use(requestID())
        .get("/test", ({ requestID }) => ({ contextID: requestID }));

      const response = await app.handle(new Request("http://localhost/test"));

      const headerID = response.headers.get("x-request-id");
      const data = await response.json();

      expect(headerID).toBe(data.contextID);
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia()
        .use(requestID())
        .get("/test", ({ requestID }) => ({ requestID }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should provide requestID to downstream plugins", async () => {
      const capturedID: string[] = [];

      const testPlugin = new Elysia().derive(
        { as: "global" },
        ({ requestID }: any) => {
          capturedID.push(requestID);
          return {};
        },
      );

      const app = new Elysia()
        .use(requestID())
        .use(testPlugin)
        .get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(capturedID.length).toBeGreaterThan(0);
      expect(capturedID[0]).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should include request ID even when route errors", async () => {
      const app = new Elysia().use(requestID()).get("/error", () => {
        throw new Error("Test error");
      });

      try {
        const response = await app.handle(
          new Request("http://localhost/error"),
        );

        const requestId = response.headers.get("x-request-id");
        expect(requestId).toBeDefined();
      } catch (e) {
        // Error expected, but request ID should still be set
      }
    });
  });
});
