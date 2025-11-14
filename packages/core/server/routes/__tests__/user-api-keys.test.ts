/**
 * User API Keys Routes Tests
 * Tests all API key management endpoints with real database operations
 * NO MOCKS for internal code - Real Elysia server and encryption
 * MOCK only external Privy authentication in test mode
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "bun:test";
import { Elysia } from "elysia";
import { userApiKeysRoutes } from "../user-api-keys";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createMockJWT } from "../../../__tests__/helpers/auth";
import { logger } from "../../utils/logger";

/**
 * Test Helpers
 */

// Create test user
async function createTestUser(privyUserId?: string) {
  const userId = privyUserId || `test-privy-${Date.now()}-${Math.random()}`;
  const [user] = await db
    .insert(users)
    .values({
      privyUserId: userId,
      email: `test-${Date.now()}@example.com`,
      role: "member",
    })
    .returning();
  return user;
}

// Cleanup test data
async function cleanupTestData(userId?: string) {
  try {
    if (userId) {
      await db.delete(users).where(eq(users.id, userId));
    }
  } catch (error) {
    logger.error({ context: "Test Cleanup", err: error }, "Cleanup error");
  }
}

/**
 * User API Keys Routes Tests
 */

describe("User API Keys Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    // Set test mode for auth bypass
    process.env.NODE_ENV = "test";

    // Set encryption secret for tests
    process.env.API_KEY_ENCRYPTION_SECRET = "a".repeat(32);

    // Create Elysia app with routes
    app = new Elysia().use(userApiKeysRoutes);
  });

  describe("POST /api/users/api-keys", () => {
    it("should save all three API keys successfully", async () => {
      const user = await createTestUser();

      try {
        // Create auth token
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "meshy-test-key-123",
              aiGatewayApiKey: "gateway-test-key-456",
              elevenLabsApiKey: "elevenlabs-test-key-789",
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.message).toBe("API keys saved successfully");
        expect(data.keysConfigured.meshyApiKey).toBe(true);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(true);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(true);

        // Verify keys are encrypted in database
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        expect(updatedUser.meshyApiKey).toBeDefined();
        expect(updatedUser.aiGatewayApiKey).toBeDefined();
        expect(updatedUser.elevenLabsApiKey).toBeDefined();
        expect(updatedUser.apiKeyIv).toBeDefined();

        // Keys should be encrypted (not plaintext)
        expect(updatedUser.meshyApiKey).not.toBe("meshy-test-key-123");
        expect(updatedUser.aiGatewayApiKey).not.toBe("gateway-test-key-456");
        expect(updatedUser.elevenLabsApiKey).not.toBe(
          "elevenlabs-test-key-789",
        );

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should save only meshy API key", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "meshy-only-key",
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.keysConfigured.meshyApiKey).toBe(true);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(false);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should save only aiGateway API key", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              aiGatewayApiKey: "gateway-only-key",
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.keysConfigured.meshyApiKey).toBe(false);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(true);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should save only elevenLabs API key", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              elevenLabsApiKey: "elevenlabs-only-key",
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.keysConfigured.meshyApiKey).toBe(false);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(false);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update existing API keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Save initial keys
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "old-meshy-key",
            }),
          }),
        );

        // Update with new keys
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "new-meshy-key",
              aiGatewayApiKey: "new-gateway-key",
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.keysConfigured.meshyApiKey).toBe(true);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return 400 when no keys provided", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }),
        );

        expect(response.status).toBe(400);
        const data = await response.json();

        expect(data.error).toBe("At least one API key must be provided");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meshyApiKey: "test-key",
          }),
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer invalid-token",
          },
          body: JSON.stringify({
            meshyApiKey: "test-key",
          }),
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });

    it("should handle long API keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });
        const longKey = "sk-" + "x".repeat(500);

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: longKey,
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle keys with special characters", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });
        const specialKey = "key!@#$%^&*()_+-={}[]|:;<>?,./~`";

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: specialKey,
            }),
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update updatedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });
        const beforeUpdate = new Date();

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));

        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "test-key",
            }),
          }),
        );

        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        expect(updatedUser.updatedAt).toBeDefined();
        expect(updatedUser.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("GET /api/users/api-keys/status", () => {
    it("should return status of all configured keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Save keys first
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "meshy-key",
              elevenLabsApiKey: "elevenlabs-key",
            }),
          }),
        );

        // Get status
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.keysConfigured.meshyApiKey).toBe(true);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(false);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(true);
        expect(data.hasAnyKeys).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return false for all keys when none configured", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.keysConfigured.meshyApiKey).toBe(false);
        expect(data.keysConfigured.aiGatewayApiKey).toBe(false);
        expect(data.keysConfigured.elevenLabsApiKey).toBe(false);
        expect(data.hasAnyKeys).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should not return actual API keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Save keys
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "secret-meshy-key-12345",
            }),
          }),
        );

        // Get status
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        const responseString = JSON.stringify(data);

        // Should not contain actual key
        expect(responseString).not.toContain("secret-meshy-key-12345");
        expect(responseString).not.toContain("secret");
        expect(responseString).not.toContain("12345");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys/status", {
          method: "GET",
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys/status", {
          method: "GET",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/api-keys", () => {
    it("should delete all API keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Save keys first
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "meshy-key",
              aiGatewayApiKey: "gateway-key",
              elevenLabsApiKey: "elevenlabs-key",
            }),
          }),
        );

        // Delete keys
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.message).toBe("API keys deleted successfully");

        // Verify keys are deleted in database
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        expect(updatedUser.meshyApiKey).toBeNull();
        expect(updatedUser.aiGatewayApiKey).toBeNull();
        expect(updatedUser.elevenLabsApiKey).toBeNull();
        expect(updatedUser.apiKeyIv).toBeNull();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should succeed even when no keys exist", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Delete keys (none exist)
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys", {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/api-keys", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        }),
      );

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
    });

    it("should update updatedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Save keys
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "test-key",
            }),
          }),
        );

        const beforeDelete = new Date();
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Delete keys
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        expect(updatedUser.updatedAt).toBeDefined();
        expect(updatedUser.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeDelete.getTime(),
        );

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Complete Workflow", () => {
    it("should support complete save -> status -> delete workflow", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // 1. Save keys
        const saveResponse = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "meshy-key",
              aiGatewayApiKey: "gateway-key",
            }),
          }),
        );

        expect(saveResponse.status).toBe(200);
        const saveData = await saveResponse.json();
        expect(saveData.success).toBe(true);

        // 2. Check status
        const statusResponse = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(statusResponse.status).toBe(200);
        const statusData = await statusResponse.json();
        expect(statusData.keysConfigured.meshyApiKey).toBe(true);
        expect(statusData.keysConfigured.aiGatewayApiKey).toBe(true);
        expect(statusData.hasAnyKeys).toBe(true);

        // 3. Delete keys
        const deleteResponse = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(deleteResponse.status).toBe(200);
        const deleteData = await deleteResponse.json();
        expect(deleteData.success).toBe(true);

        // 4. Verify status after delete
        const finalStatusResponse = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        expect(finalStatusResponse.status).toBe(200);
        const finalStatusData = await finalStatusResponse.json();
        expect(finalStatusData.hasAnyKeys).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should support multiple updates to same keys", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Update 1
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "key-version-1",
            }),
          }),
        );

        // Update 2
        await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "key-version-2",
            }),
          }),
        );

        // Update 3
        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              meshyApiKey: "key-version-3",
            }),
          }),
        );

        expect(response.status).toBe(200);

        // Verify final state
        const statusResponse = await app.handle(
          new Request("http://localhost/api/users/api-keys/status", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        );

        const statusData = await statusResponse.json();
        expect(statusData.keysConfigured.meshyApiKey).toBe(true);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Content Type Validation", () => {
    it("should require JSON content type for POST", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        const response = await app.handle(
          new Request("http://localhost/api/users/api-keys", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              // Missing Content-Type header
            },
            body: JSON.stringify({
              meshyApiKey: "test-key",
            }),
          }),
        );

        // Elysia should handle this validation
        expect(response.status).toBeGreaterThanOrEqual(400);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle concurrent key updates", async () => {
      const user = await createTestUser();

      try {
        const token = createMockJWT({ sub: user.privyUserId });

        // Send multiple concurrent requests
        const requests = Array.from({ length: 5 }, (_, i) =>
          app.handle(
            new Request("http://localhost/api/users/api-keys", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                meshyApiKey: `concurrent-key-${i}`,
              }),
            }),
          ),
        );

        const responses = await Promise.all(requests);

        // All should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });
});
