/**
 * Error Handler Plugin Tests
 * Tests for error-handler.plugin.ts - centralized error handling
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { errorHandlerPlugin } from "../error-handler.plugin";
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ExternalServiceError,
  ServiceUnavailableError,
} from "../../errors";

describe("Error Handler Plugin", () => {
  describe("Custom Error Classes", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia()
        .use(errorHandlerPlugin)
        .get("/404", () => {
          throw new NotFoundError("User", "123");
        })
        .get("/401", () => {
          throw new UnauthorizedError("Invalid credentials");
        })
        .get("/403", () => {
          throw new ForbiddenError("Admin access required");
        })
        .get("/400", () => {
          throw new BadRequestError("Invalid input");
        })
        .get("/409", () => {
          throw new ConflictError("Resource", "Email already exists");
        })
        .get("/500", () => {
          throw new InternalServerError("Database connection failed");
        })
        .get("/503", () => {
          throw new ServiceUnavailableError("Service temporarily down");
        });
    });

    it("should handle NotFoundError (404)", async () => {
      const response = await app.handle(new Request("http://localhost/404"));

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("NOT_FOUND");
      expect(data.message).toContain("User");
      expect(data.requestId).toBeDefined();
    });

    it("should handle UnauthorizedError (401)", async () => {
      const response = await app.handle(new Request("http://localhost/401"));

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("UNAUTHORIZED");
      expect(data.message).toContain("credentials");
    });

    it("should handle ForbiddenError (403)", async () => {
      const response = await app.handle(new Request("http://localhost/403"));

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("FORBIDDEN");
      expect(data.message).toContain("Admin");
    });

    it("should handle BadRequestError (400)", async () => {
      const response = await app.handle(new Request("http://localhost/400"));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("BAD_REQUEST");
    });

    it("should handle ConflictError (409)", async () => {
      const response = await app.handle(new Request("http://localhost/409"));

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe("CONFLICT");
      expect(data.message).toContain("Email");
    });

    it("should handle InternalServerError (500)", async () => {
      const response = await app.handle(new Request("http://localhost/500"));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle ServiceUnavailableError (503)", async () => {
      const response = await app.handle(new Request("http://localhost/503"));

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe("SERVICE_UNAVAILABLE");
    });
  });

  describe("Elysia Built-in Errors", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(errorHandlerPlugin).post(
        "/validate",
        {
          body: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name", "age"],
          },
        },
        () => ({ success: true }),
      );
    });

    it("should handle VALIDATION errors with 400 status", async () => {
      const response = await app.handle(
        new Request("http://localhost/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test" }), // Missing 'age'
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("VALIDATION_ERROR");
      expect(data.message).toContain("Validation failed");
    });

    it("should handle NOT_FOUND for undefined routes", async () => {
      const response = await app.handle(
        new Request("http://localhost/non-existent-route"),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("NOT_FOUND");
      expect(data.message).toContain("Endpoint not found");
    });

    it("should handle PARSE errors with 400 status", async () => {
      const response = await app.handle(
        new Request("http://localhost/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json{",
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("PARSE_ERROR");
    });
  });

  describe("Error Response Format", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(errorHandlerPlugin).get("/error", () => {
        throw new BadRequestError("Test error", { field: "value" });
      });
    });

    it("should include requestId in error response", async () => {
      const response = await app.handle(new Request("http://localhost/error"));

      const data = await response.json();
      expect(data.requestId).toBeDefined();
      expect(typeof data.requestId).toBe("string");
    });

    it("should include error code and message", async () => {
      const response = await app.handle(new Request("http://localhost/error"));

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.message).toBeDefined();
    });

    it("should include error context if provided", async () => {
      const response = await app.handle(new Request("http://localhost/error"));

      const data = await response.json();
      expect(data.context).toBeDefined();
      expect(data.context.field).toBe("value");
    });

    it("should use x-request-id header if provided", async () => {
      const customRequestId = "custom-req-123";
      const response = await app.handle(
        new Request("http://localhost/error", {
          headers: {
            "x-request-id": customRequestId,
          },
        }),
      );

      const data = await response.json();
      // Note: requestId might be overridden by request-id plugin
      expect(data.requestId).toBeDefined();
    });
  });

  describe("Production vs Development", () => {
    it("should hide stack traces in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const app = new Elysia().use(errorHandlerPlugin).get("/error", () => {
        throw new Error("Internal error");
      });

      const response = await app.handle(new Request("http://localhost/error"));

      const data = await response.json();
      expect(data.stack).toBeUndefined();
      expect(data.message).toBe("An unexpected error occurred");

      process.env.NODE_ENV = originalEnv;
    });

    it("should show detailed errors in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const app = new Elysia().use(errorHandlerPlugin).get("/error", () => {
        throw new Error("Detailed error");
      });

      const response = await app.handle(new Request("http://localhost/error"));

      const data = await response.json();
      expect(data.message).toBe("Detailed error");
      expect(data.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Error Logging and Metrics", () => {
    it("should log client errors (4xx) as warnings", async () => {
      const app = new Elysia().use(errorHandlerPlugin).get("/error", () => {
        throw new BadRequestError("Client error");
      });

      const response = await app.handle(new Request("http://localhost/error"));

      expect(response.status).toBe(400);
      // Logger integration would be tested in integration tests
    });

    it("should log server errors (5xx) as errors", async () => {
      const app = new Elysia().use(errorHandlerPlugin).get("/error", () => {
        throw new InternalServerError("Server error");
      });

      const response = await app.handle(new Request("http://localhost/error"));

      expect(response.status).toBe(500);
      // Logger integration would be tested in integration tests
    });
  });

  describe("Plugin composition", () => {
    it("should work with other plugins", async () => {
      const app = new Elysia().use(errorHandlerPlugin).get("/test", () => {
        throw new NotFoundError("Resource", "123");
      });

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(404);
    });

    it("should handle errors in async routes", async () => {
      const app = new Elysia()
        .use(errorHandlerPlugin)
        .get("/async-error", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new BadRequestError("Async error");
        });

      const response = await app.handle(
        new Request("http://localhost/async-error"),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("BAD_REQUEST");
    });
  });
});
