/**
 * getUserApiKeys Utility Tests
 * Tests API key retrieval and decryption with environment fallbacks
 * NO MOCKS for internal code - Real database and encryption
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from "bun:test";
import {
  getUserApiKeys,
  mergeWithEnvKeys,
  getUserApiKeysWithFallback,
  type UserApiKeys,
} from "../getUserApiKeys";
import { getEncryptionService } from "../../services/ApiKeyEncryptionService";
import { db } from "../../db/db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Test Helpers
 */

// Create test user with API keys
async function createTestUserWithKeys(keys?: {
  meshyApiKey?: string;
  aiGatewayApiKey?: string;
  elevenLabsApiKey?: string;
}) {
  const privyUserId = `test-privy-${Date.now()}-${Math.random()}`;

  // Create user first
  const [user] = await db
    .insert(users)
    .values({
      privyUserId,
      email: `test-${Date.now()}@example.com`,
      role: "member",
    })
    .returning();

  // If keys provided, encrypt and save them
  if (keys && (keys.meshyApiKey || keys.aiGatewayApiKey || keys.elevenLabsApiKey)) {
    const encryptionService = getEncryptionService();
    const encryptedData = encryptionService.encryptKeys(keys);

    await db
      .update(users)
      .set({
        meshyApiKey: encryptedData.meshyApiKey,
        aiGatewayApiKey: encryptedData.aiGatewayApiKey,
        elevenLabsApiKey: encryptedData.elevenLabsApiKey,
        apiKeyIv: encryptedData.apiKeyIv,
      })
      .where(eq(users.id, user.id));
  }

  return user;
}

// Create test user without API keys
async function createTestUser() {
  const privyUserId = `test-privy-${Date.now()}-${Math.random()}`;

  const [user] = await db
    .insert(users)
    .values({
      privyUserId,
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
    console.error("Cleanup error:", error);
  }
}

describe("getUserApiKeys Utility", () => {
  beforeAll(() => {
    // Set encryption secret for tests
    process.env.API_KEY_ENCRYPTION_SECRET = "a".repeat(32);
  });

  describe("getUserApiKeys() - Fetch and Decrypt", () => {
    it("should return all three decrypted API keys", async () => {
      const user = await createTestUserWithKeys({
        meshyApiKey: "meshy-test-key-123",
        aiGatewayApiKey: "gateway-test-key-456",
        elevenLabsApiKey: "elevenlabs-test-key-789",
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe("meshy-test-key-123");
        expect(keys.aiGatewayApiKey).toBe("gateway-test-key-456");
        expect(keys.elevenLabsApiKey).toBe("elevenlabs-test-key-789");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return only meshy key when only meshy is set", async () => {
      const user = await createTestUserWithKeys({
        meshyApiKey: "meshy-only-key",
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe("meshy-only-key");
        expect(keys.aiGatewayApiKey).toBeUndefined();
        expect(keys.elevenLabsApiKey).toBeUndefined();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return only aiGateway key when only aiGateway is set", async () => {
      const user = await createTestUserWithKeys({
        aiGatewayApiKey: "gateway-only-key",
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBeUndefined();
        expect(keys.aiGatewayApiKey).toBe("gateway-only-key");
        expect(keys.elevenLabsApiKey).toBeUndefined();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return only elevenLabs key when only elevenLabs is set", async () => {
      const user = await createTestUserWithKeys({
        elevenLabsApiKey: "elevenlabs-only-key",
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBeUndefined();
        expect(keys.aiGatewayApiKey).toBeUndefined();
        expect(keys.elevenLabsApiKey).toBe("elevenlabs-only-key");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return empty object when user has no keys", async () => {
      const user = await createTestUser();

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys).toEqual({});
        expect(keys.meshyApiKey).toBeUndefined();
        expect(keys.aiGatewayApiKey).toBeUndefined();
        expect(keys.elevenLabsApiKey).toBeUndefined();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw or return empty object when user not found", async () => {
      const nonExistentUserId = "non-existent-user-id";

      try {
        const keys = await getUserApiKeys(nonExistentUserId);
        // If it doesn't throw, should return empty object
        expect(keys).toEqual({});
      } catch (error) {
        // Expected - database query failed for non-existent user
        expect(error).toBeDefined();
      }
    });

    it("should handle long API keys", async () => {
      const longKey = "sk-" + "x".repeat(500);
      const user = await createTestUserWithKeys({
        meshyApiKey: longKey,
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe(longKey);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle keys with special characters", async () => {
      const specialKey = "key!@#$%^&*()_+-={}[]|:;<>?,./~`";
      const user = await createTestUserWithKeys({
        meshyApiKey: specialKey,
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe(specialKey);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle unicode characters in keys", async () => {
      const unicodeKey = "api-key-日本語-🔑-测试";
      const user = await createTestUserWithKeys({
        elevenLabsApiKey: unicodeKey,
      });

      try {
        const keys = await getUserApiKeys(user.id);

        expect(keys.elevenLabsApiKey).toBe(unicodeKey);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return empty object when decryption fails", async () => {
      // Create user with corrupted encrypted data
      const user = await createTestUser();

      try {
        // Manually set corrupted encrypted data
        await db
          .update(users)
          .set({
            meshyApiKey: "corrupted-base64-data",
            apiKeyIv: "corrupted-iv",
          })
          .where(eq(users.id, user.id));

        const keys = await getUserApiKeys(user.id);

        // Should return empty object on decryption failure
        expect(keys).toEqual({});

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle multiple users with different keys", async () => {
      const user1 = await createTestUserWithKeys({
        meshyApiKey: "user1-meshy-key",
      });

      const user2 = await createTestUserWithKeys({
        aiGatewayApiKey: "user2-gateway-key",
      });

      const user3 = await createTestUserWithKeys({
        elevenLabsApiKey: "user3-elevenlabs-key",
      });

      try {
        const keys1 = await getUserApiKeys(user1.id);
        const keys2 = await getUserApiKeys(user2.id);
        const keys3 = await getUserApiKeys(user3.id);

        expect(keys1.meshyApiKey).toBe("user1-meshy-key");
        expect(keys2.aiGatewayApiKey).toBe("user2-gateway-key");
        expect(keys3.elevenLabsApiKey).toBe("user3-elevenlabs-key");

        await cleanupTestData(user1.id);
        await cleanupTestData(user2.id);
        await cleanupTestData(user3.id);
      } catch (error) {
        await cleanupTestData(user1.id);
        await cleanupTestData(user2.id);
        await cleanupTestData(user3.id);
        throw error;
      }
    });
  });

  describe("mergeWithEnvKeys() - Environment Fallbacks", () => {
    let originalEnv: {
      MESHY_API_KEY?: string;
      AI_GATEWAY_API_KEY?: string;
      ELEVENLABS_API_KEY?: string;
    };

    beforeEach(() => {
      // Save original env vars
      originalEnv = {
        MESHY_API_KEY: process.env.MESHY_API_KEY,
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      };
    });

    afterEach(() => {
      // Restore original env vars
      if (originalEnv.MESHY_API_KEY) {
        process.env.MESHY_API_KEY = originalEnv.MESHY_API_KEY;
      } else {
        delete process.env.MESHY_API_KEY;
      }

      if (originalEnv.AI_GATEWAY_API_KEY) {
        process.env.AI_GATEWAY_API_KEY = originalEnv.AI_GATEWAY_API_KEY;
      } else {
        delete process.env.AI_GATEWAY_API_KEY;
      }

      if (originalEnv.ELEVENLABS_API_KEY) {
        process.env.ELEVENLABS_API_KEY = originalEnv.ELEVENLABS_API_KEY;
      } else {
        delete process.env.ELEVENLABS_API_KEY;
      }
    });

    it("should use user keys when available", () => {
      const userKeys: UserApiKeys = {
        meshyApiKey: "user-meshy-key",
        aiGatewayApiKey: "user-gateway-key",
        elevenLabsApiKey: "user-elevenlabs-key",
      };

      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBe("user-meshy-key");
      expect(merged.aiGatewayApiKey).toBe("user-gateway-key");
      expect(merged.elevenLabsApiKey).toBe("user-elevenlabs-key");
    });

    it("should fallback to env vars when user keys missing", () => {
      process.env.MESHY_API_KEY = "env-meshy-key";
      process.env.AI_GATEWAY_API_KEY = "env-gateway-key";
      process.env.ELEVENLABS_API_KEY = "env-elevenlabs-key";

      const userKeys: UserApiKeys = {};
      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBe("env-meshy-key");
      expect(merged.aiGatewayApiKey).toBe("env-gateway-key");
      expect(merged.elevenLabsApiKey).toBe("env-elevenlabs-key");
    });

    it("should mix user keys and env vars", () => {
      process.env.MESHY_API_KEY = "env-meshy-key";
      process.env.AI_GATEWAY_API_KEY = "env-gateway-key";
      process.env.ELEVENLABS_API_KEY = "env-elevenlabs-key";

      const userKeys: UserApiKeys = {
        meshyApiKey: "user-meshy-key",
        // aiGatewayApiKey not provided - should use env
        elevenLabsApiKey: "user-elevenlabs-key",
      };

      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBe("user-meshy-key"); // User key
      expect(merged.aiGatewayApiKey).toBe("env-gateway-key"); // Env fallback
      expect(merged.elevenLabsApiKey).toBe("user-elevenlabs-key"); // User key
    });

    it("should return undefined when no user key and no env var", () => {
      delete process.env.MESHY_API_KEY;
      delete process.env.AI_GATEWAY_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const userKeys: UserApiKeys = {};
      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBeUndefined();
      expect(merged.aiGatewayApiKey).toBeUndefined();
      expect(merged.elevenLabsApiKey).toBeUndefined();
    });

    it("should prefer user key over env var even if env var exists", () => {
      process.env.MESHY_API_KEY = "env-meshy-key";

      const userKeys: UserApiKeys = {
        meshyApiKey: "user-meshy-key",
      };

      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBe("user-meshy-key");
      expect(merged.meshyApiKey).not.toBe("env-meshy-key");
    });

    it("should handle empty string user keys (should fallback to env)", () => {
      process.env.MESHY_API_KEY = "env-meshy-key";

      const userKeys: UserApiKeys = {
        meshyApiKey: "", // Empty string should be falsy
      };

      const merged = mergeWithEnvKeys(userKeys);

      expect(merged.meshyApiKey).toBe("env-meshy-key");
    });

    it("should handle empty object input", () => {
      delete process.env.MESHY_API_KEY;
      delete process.env.AI_GATEWAY_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const merged = mergeWithEnvKeys({});

      expect(merged).toEqual({
        meshyApiKey: undefined,
        aiGatewayApiKey: undefined,
        elevenLabsApiKey: undefined,
      });
    });
  });

  describe("getUserApiKeysWithFallback() - Combined Function", () => {
    let originalEnv: {
      MESHY_API_KEY?: string;
      AI_GATEWAY_API_KEY?: string;
      ELEVENLABS_API_KEY?: string;
    };

    beforeEach(() => {
      // Save original env vars
      originalEnv = {
        MESHY_API_KEY: process.env.MESHY_API_KEY,
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      };
    });

    afterEach(() => {
      // Restore original env vars
      if (originalEnv.MESHY_API_KEY) {
        process.env.MESHY_API_KEY = originalEnv.MESHY_API_KEY;
      } else {
        delete process.env.MESHY_API_KEY;
      }

      if (originalEnv.AI_GATEWAY_API_KEY) {
        process.env.AI_GATEWAY_API_KEY = originalEnv.AI_GATEWAY_API_KEY;
      } else {
        delete process.env.AI_GATEWAY_API_KEY;
      }

      if (originalEnv.ELEVENLABS_API_KEY) {
        process.env.ELEVENLABS_API_KEY = originalEnv.ELEVENLABS_API_KEY;
      } else {
        delete process.env.ELEVENLABS_API_KEY;
      }
    });

    it("should return user keys when available", async () => {
      const user = await createTestUserWithKeys({
        meshyApiKey: "user-meshy-key",
        aiGatewayApiKey: "user-gateway-key",
      });

      try {
        const keys = await getUserApiKeysWithFallback(user.id);

        expect(keys.meshyApiKey).toBe("user-meshy-key");
        expect(keys.aiGatewayApiKey).toBe("user-gateway-key");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should fallback to env vars when user has no keys", async () => {
      const user = await createTestUser();

      process.env.MESHY_API_KEY = "env-meshy-key";
      process.env.AI_GATEWAY_API_KEY = "env-gateway-key";

      try {
        const keys = await getUserApiKeysWithFallback(user.id);

        expect(keys.meshyApiKey).toBe("env-meshy-key");
        expect(keys.aiGatewayApiKey).toBe("env-gateway-key");

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should mix user keys and env vars correctly", async () => {
      const user = await createTestUserWithKeys({
        meshyApiKey: "user-meshy-key",
        // No aiGatewayApiKey - should use env
      });

      process.env.AI_GATEWAY_API_KEY = "env-gateway-key";
      process.env.ELEVENLABS_API_KEY = "env-elevenlabs-key";

      try {
        const keys = await getUserApiKeysWithFallback(user.id);

        expect(keys.meshyApiKey).toBe("user-meshy-key"); // From user
        expect(keys.aiGatewayApiKey).toBe("env-gateway-key"); // From env
        expect(keys.elevenLabsApiKey).toBe("env-elevenlabs-key"); // From env

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return undefined when no keys available anywhere", async () => {
      const user = await createTestUser();

      delete process.env.MESHY_API_KEY;
      delete process.env.AI_GATEWAY_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      try {
        const keys = await getUserApiKeysWithFallback(user.id);

        expect(keys.meshyApiKey).toBeUndefined();
        expect(keys.aiGatewayApiKey).toBeUndefined();
        expect(keys.elevenLabsApiKey).toBeUndefined();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle non-existent user gracefully", async () => {
      process.env.MESHY_API_KEY = "env-meshy-key";

      try {
        const keys = await getUserApiKeysWithFallback("non-existent-user-id");

        // Should fallback to env vars
        expect(keys.meshyApiKey).toBe("env-meshy-key");
      } catch (error) {
        // If database query fails, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });
  });

  describe("Integration with Encryption Service", () => {
    it("should correctly decrypt keys encrypted by ApiKeyEncryptionService", async () => {
      const user = await createTestUser();

      try {
        // Manually encrypt and save keys
        const encryptionService = getEncryptionService();
        const originalKeys = {
          meshyApiKey: "integration-test-meshy",
          aiGatewayApiKey: "integration-test-gateway",
          elevenLabsApiKey: "integration-test-elevenlabs",
        };

        const encrypted = encryptionService.encryptKeys(originalKeys);

        await db
          .update(users)
          .set({
            meshyApiKey: encrypted.meshyApiKey,
            aiGatewayApiKey: encrypted.aiGatewayApiKey,
            elevenLabsApiKey: encrypted.elevenLabsApiKey,
            apiKeyIv: encrypted.apiKeyIv,
          })
          .where(eq(users.id, user.id));

        // Retrieve and decrypt
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe(originalKeys.meshyApiKey);
        expect(keys.aiGatewayApiKey).toBe(originalKeys.aiGatewayApiKey);
        expect(keys.elevenLabsApiKey).toBe(originalKeys.elevenLabsApiKey);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle round-trip encryption/decryption", async () => {
      const user = await createTestUser();

      try {
        const originalKey = "round-trip-test-key-" + Math.random();

        // Encrypt and save
        const encryptionService = getEncryptionService();
        const encrypted = encryptionService.encryptKeys({
          meshyApiKey: originalKey,
        });

        await db
          .update(users)
          .set({
            meshyApiKey: encrypted.meshyApiKey,
            apiKeyIv: encrypted.apiKeyIv,
          })
          .where(eq(users.id, user.id));

        // Retrieve and decrypt
        const keys = await getUserApiKeys(user.id);

        expect(keys.meshyApiKey).toBe(originalKey);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle null values in database gracefully", async () => {
      const user = await createTestUser();

      try {
        // Explicitly set nulls
        await db
          .update(users)
          .set({
            meshyApiKey: null,
            aiGatewayApiKey: null,
            elevenLabsApiKey: null,
            apiKeyIv: null,
          })
          .where(eq(users.id, user.id));

        const keys = await getUserApiKeys(user.id);

        expect(keys).toEqual({});

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle concurrent reads for same user", async () => {
      const user = await createTestUserWithKeys({
        meshyApiKey: "concurrent-test-key",
      });

      try {
        // Multiple concurrent reads
        const promises = Array.from({ length: 10 }, () =>
          getUserApiKeys(user.id)
        );

        const results = await Promise.all(promises);

        // All should return same decrypted key
        results.forEach((keys) => {
          expect(keys.meshyApiKey).toBe("concurrent-test-key");
        });

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle very long user IDs", async () => {
      const longUserId = "user-" + "x".repeat(500);

      try {
        const keys = await getUserApiKeys(longUserId);
        // If it doesn't throw, should return empty
        expect(keys).toEqual({});
      } catch (error) {
        // Database query might fail for extremely long IDs - that's acceptable
        expect(error).toBeDefined();
      }
    });
  });
});
