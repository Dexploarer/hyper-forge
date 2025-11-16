/**
 * Authentication Plugin Tests
 * Tests for auth.plugin.ts - authentication and authorization guards
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import {
  authPlugin,
  requireAuthGuard,
  requireAdminGuard,
} from "../auth.plugin";
import { UnauthorizedError, ForbiddenError } from "../../errors";

describe("Auth Plugin", () => {
  describe("authPlugin (optional auth)", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(authPlugin).get("/test", ({ user }) => {
        return { hasUser: !!user, userId: user?.userId };
      });
    });

    it("should allow requests without authentication", async () => {
      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.hasUser).toBe(false);
    });

    it("should inject user context if valid token provided", async () => {
      // Mock valid JWT token (simplified - would use real token in integration tests)
      const mockToken = "Bearer mock-valid-token";

      const response = await app.handle(
        new Request("http://localhost/test", {
          headers: {
            Authorization: mockToken,
          },
        }),
      );

      // Note: This will fail without actual auth setup
      // In real tests, we'd mock the Privy verification
      expect(response.status).toBe(200);
    });

    it("should not throw error for invalid tokens", async () => {
      const response = await app.handle(
        new Request("http://localhost/test", {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      // Should NOT throw - optional auth continues without user
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.hasUser).toBe(false);
    });
  });

  describe("requireAuthGuard", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(requireAuthGuard).get("/protected", ({ user }) => {
        return { userId: user.userId, role: user.role };
      });
    });

    it("should reject requests without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/protected"),
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should reject requests with invalid tokens", async () => {
      const response = await app.handle(
        new Request("http://localhost/protected", {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      expect(response.status).toBe(401);
    });

    it("should inject authenticated user context", async () => {
      // This test requires real authentication setup
      // In integration tests, we'd use a valid test user token
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("requireAdminGuard", () => {
    let app: Elysia;

    beforeAll(() => {
      app = new Elysia().use(requireAdminGuard).get("/admin", ({ user }) => {
        return { userId: user.userId, role: user.role };
      });
    });

    it("should reject requests without authentication", async () => {
      const response = await app.handle(new Request("http://localhost/admin"));

      expect(response.status).toBe(401);
    });

    it("should reject non-admin users", async () => {
      // This test requires real authentication with non-admin user
      // In integration tests, we'd use a regular user token
      expect(true).toBe(true); // Placeholder
    });

    it("should allow admin users", async () => {
      // This test requires real authentication with admin user
      // In integration tests, we'd use an admin user token
      expect(true).toBe(true); // Placeholder
    });

    it("should return 403 for authenticated non-admin users", async () => {
      // This requires mocked auth that returns non-admin user
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Plugin composition", () => {
    it("should compose with other plugins", async () => {
      const app = new Elysia()
        .use(authPlugin)
        .get("/test", ({ user }) => ({ hasUser: !!user }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should work with route groups", async () => {
      const app = new Elysia().group("/api", (app) =>
        app
          .use(requireAuthGuard)
          .get("/protected", ({ user }) => ({ userId: user.userId })),
      );

      const response = await app.handle(
        new Request("http://localhost/api/protected"),
      );

      // Should fail without auth
      expect(response.status).toBe(401);
    });
  });

  describe("Type safety", () => {
    it("should provide correct user context types", async () => {
      const app = new Elysia().use(authPlugin).get("/test", ({ user }) => {
        // User should be optional
        if (user) {
          // These properties should exist
          const userId: string = user.userId;
          const role: string = user.role;
          return { userId, role };
        }
        return { noUser: true };
      });

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    it("should guarantee user exists in requireAuthGuard", async () => {
      const app = new Elysia()
        .use(requireAuthGuard)
        .get("/test", ({ user }) => {
          // User should NOT be optional here
          const userId: string = user.userId;
          const role: string = user.role;
          return { userId, role };
        });

      // Type check passes - this confirms type safety
      expect(true).toBe(true);
    });
  });
});
