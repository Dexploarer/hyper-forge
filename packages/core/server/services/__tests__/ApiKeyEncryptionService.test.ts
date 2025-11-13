/**
 * API Key Encryption Service Tests
 * Tests AES-256-GCM encryption/decryption for user API keys
 * NO MOCKS - Real encryption operations
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { ApiKeyEncryptionService } from "../ApiKeyEncryptionService";

describe("ApiKeyEncryptionService", () => {
  let service: ApiKeyEncryptionService;
  const testSecret = "a".repeat(32); // 32-byte key for AES-256

  beforeEach(() => {
    // Create new instance for each test
    service = new ApiKeyEncryptionService(testSecret);
  });

  describe("Constructor", () => {
    it("should initialize with valid 32-byte secret", () => {
      expect(() => {
        new ApiKeyEncryptionService(testSecret);
      }).not.toThrow();
    });

    it("should throw error for missing secret", () => {
      expect(() => {
        new ApiKeyEncryptionService("");
      }).toThrow("API_KEY_ENCRYPTION_SECRET is required");
    });

    it("should throw error for secret shorter than 32 bytes", () => {
      expect(() => {
        new ApiKeyEncryptionService("tooshort");
      }).toThrow("must be at least 32 characters");
    });

    it("should accept secret longer than 32 bytes", () => {
      const longSecret = "a".repeat(64);
      expect(() => {
        new ApiKeyEncryptionService(longSecret);
      }).not.toThrow();
    });
  });

  describe("encrypt() - Single Key Encryption", () => {
    it("should encrypt a simple API key", () => {
      const plaintext = "sk-test-1234567890";
      const result = service.encrypt(plaintext);

      expect(result).toHaveProperty("ciphertext");
      expect(result).toHaveProperty("iv");
      expect(typeof result.ciphertext).toBe("string");
      expect(typeof result.iv).toBe("string");
      expect(result.ciphertext.length).toBeGreaterThan(0);
      expect(result.iv.length).toBeGreaterThan(0);
    });

    it("should produce different ciphertext for same plaintext", () => {
      const plaintext = "sk-test-1234567890";
      const result1 = service.encrypt(plaintext);
      const result2 = service.encrypt(plaintext);

      // Same plaintext, different ciphertext (due to random IV)
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it("should encrypt long API keys", () => {
      const longKey = "sk-" + "x".repeat(500);
      const result = service.encrypt(longKey);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
    });

    it("should encrypt keys with special characters", () => {
      const specialKey = "api-key!@#$%^&*()_+-={}[]|:;<>?,./~`";
      const result = service.encrypt(specialKey);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
    });

    it("should encrypt unicode characters", () => {
      const unicodeKey = "api-key-日本語-🔑-测试";
      const result = service.encrypt(unicodeKey);

      expect(result.ciphertext).toBeDefined();
      expect(result.iv).toBeDefined();
    });

    it("should throw error for empty string", () => {
      expect(() => {
        service.encrypt("");
      }).toThrow("Cannot encrypt empty string");
    });

    it("should produce base64-encoded output", () => {
      const plaintext = "test-api-key";
      const result = service.encrypt(plaintext);

      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Pattern.test(result.ciphertext)).toBe(true);
      expect(base64Pattern.test(result.iv)).toBe(true);
    });
  });

  describe("decrypt() - Single Key Decryption", () => {
    it("should decrypt encrypted API key", () => {
      const plaintext = "sk-test-1234567890";
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(plaintext);
    });

    it("should decrypt long API keys", () => {
      const longKey = "sk-" + "x".repeat(500);
      const encrypted = service.encrypt(longKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(longKey);
    });

    it("should decrypt keys with special characters", () => {
      const specialKey = "api-key!@#$%^&*()_+-={}[]|:;<>?,./~`";
      const encrypted = service.encrypt(specialKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(specialKey);
    });

    it("should decrypt unicode characters", () => {
      const unicodeKey = "api-key-日本語-🔑-测试";
      const encrypted = service.encrypt(unicodeKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(unicodeKey);
    });

    it("should throw error for missing ciphertext", () => {
      const iv = "dGVzdGl2"; // random base64
      expect(() => {
        service.decrypt("", iv);
      }).toThrow("Ciphertext and IV are required");
    });

    it("should throw error for missing IV", () => {
      const ciphertext = "dGVzdGNpcGhlcnRleHQ="; // random base64
      expect(() => {
        service.decrypt(ciphertext, "");
      }).toThrow("Ciphertext and IV are required");
    });

    it("should throw error for corrupted ciphertext", () => {
      const plaintext = "test-api-key";
      const encrypted = service.encrypt(plaintext);
      const corruptedCiphertext = encrypted.ciphertext.slice(0, -5) + "XXXXX";

      expect(() => {
        service.decrypt(corruptedCiphertext, encrypted.iv);
      }).toThrow("Failed to decrypt API key");
    });

    it("should throw error for corrupted IV", () => {
      const plaintext = "test-api-key";
      const encrypted = service.encrypt(plaintext);
      const corruptedIv = "YmFkaXY="; // invalid IV

      expect(() => {
        service.decrypt(encrypted.ciphertext, corruptedIv);
      }).toThrow("Failed to decrypt API key");
    });

    it("should throw error for wrong encryption key", () => {
      const plaintext = "test-api-key";
      const encrypted = service.encrypt(plaintext);

      // Create service with different key
      const differentService = new ApiKeyEncryptionService("b".repeat(32));

      expect(() => {
        differentService.decrypt(encrypted.ciphertext, encrypted.iv);
      }).toThrow("Failed to decrypt API key");
    });

    it("should throw error for tampered auth tag", () => {
      const plaintext = "test-api-key";
      const encrypted = service.encrypt(plaintext);

      // Decode, modify last byte (auth tag), re-encode
      const buffer = Buffer.from(encrypted.ciphertext, "base64");
      buffer[buffer.length - 1] ^= 0xff; // Flip all bits in last byte
      const tamperedCiphertext = buffer.toString("base64");

      expect(() => {
        service.decrypt(tamperedCiphertext, encrypted.iv);
      }).toThrow("Failed to decrypt API key");
    });
  });

  describe("IV Uniqueness", () => {
    it("should generate unique IV for each encryption", () => {
      const plaintext = "test-api-key";
      const ivSet = new Set<string>();

      // Generate 100 encryptions
      for (let i = 0; i < 100; i++) {
        const result = service.encrypt(plaintext);
        ivSet.add(result.iv);
      }

      // All IVs should be unique
      expect(ivSet.size).toBe(100);
    });

    it("should produce 12-byte IV (16 characters base64)", () => {
      const plaintext = "test-api-key";
      const result = service.encrypt(plaintext);
      const ivBuffer = Buffer.from(result.iv, "base64");

      expect(ivBuffer.length).toBe(12);
    });
  });

  describe("encryptKeys() - Multiple Keys", () => {
    it("should encrypt single meshy key", () => {
      const result = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
      });

      expect(result).toHaveProperty("meshyApiKey");
      expect(result).toHaveProperty("apiKeyIv");
      expect(result.meshyApiKey).toBeDefined();
      expect(result.apiKeyIv).toBeDefined();
      expect(result.aiGatewayApiKey).toBeUndefined();
      expect(result.elevenLabsApiKey).toBeUndefined();
    });

    it("should encrypt single aiGateway key", () => {
      const result = service.encryptKeys({
        aiGatewayApiKey: "gateway-test-key",
      });

      expect(result).toHaveProperty("aiGatewayApiKey");
      expect(result).toHaveProperty("apiKeyIv");
      expect(result.aiGatewayApiKey).toBeDefined();
      expect(result.apiKeyIv).toBeDefined();
      expect(result.meshyApiKey).toBeUndefined();
      expect(result.elevenLabsApiKey).toBeUndefined();
    });

    it("should encrypt single elevenLabs key", () => {
      const result = service.encryptKeys({
        elevenLabsApiKey: "elevenlabs-test-key",
      });

      expect(result).toHaveProperty("elevenLabsApiKey");
      expect(result).toHaveProperty("apiKeyIv");
      expect(result.elevenLabsApiKey).toBeDefined();
      expect(result.apiKeyIv).toBeDefined();
      expect(result.meshyApiKey).toBeUndefined();
      expect(result.aiGatewayApiKey).toBeUndefined();
    });

    it("should encrypt all three keys with same IV", () => {
      const result = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
        aiGatewayApiKey: "gateway-test-key",
        elevenLabsApiKey: "elevenlabs-test-key",
      });

      expect(result.meshyApiKey).toBeDefined();
      expect(result.aiGatewayApiKey).toBeDefined();
      expect(result.elevenLabsApiKey).toBeDefined();
      expect(result.apiKeyIv).toBeDefined();

      // All keys should use the same IV
      expect(typeof result.apiKeyIv).toBe("string");
    });

    it("should skip undefined keys", () => {
      const result = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
        aiGatewayApiKey: undefined,
        elevenLabsApiKey: "elevenlabs-test-key",
      });

      expect(result.meshyApiKey).toBeDefined();
      expect(result.aiGatewayApiKey).toBeUndefined();
      expect(result.elevenLabsApiKey).toBeDefined();
      expect(result.apiKeyIv).toBeDefined();
    });

    it("should generate different IVs for multiple calls", () => {
      const result1 = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
      });
      const result2 = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
      });

      expect(result1.apiKeyIv).not.toBe(result2.apiKeyIv);
      expect(result1.meshyApiKey).not.toBe(result2.meshyApiKey);
    });

    it("should handle empty keys object", () => {
      const result = service.encryptKeys({});

      expect(result).toHaveProperty("apiKeyIv");
      expect(result.meshyApiKey).toBeUndefined();
      expect(result.aiGatewayApiKey).toBeUndefined();
      expect(result.elevenLabsApiKey).toBeUndefined();
    });
  });

  describe("decryptKeys() - Multiple Keys", () => {
    it("should decrypt single meshy key", () => {
      const encrypted = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
      });

      const decrypted = service.decryptKeys(encrypted);

      expect(decrypted.meshyApiKey).toBe("meshy-test-key");
      expect(decrypted.aiGatewayApiKey).toBeUndefined();
      expect(decrypted.elevenLabsApiKey).toBeUndefined();
    });

    it("should decrypt single aiGateway key", () => {
      const encrypted = service.encryptKeys({
        aiGatewayApiKey: "gateway-test-key",
      });

      const decrypted = service.decryptKeys(encrypted);

      expect(decrypted.aiGatewayApiKey).toBe("gateway-test-key");
      expect(decrypted.meshyApiKey).toBeUndefined();
      expect(decrypted.elevenLabsApiKey).toBeUndefined();
    });

    it("should decrypt single elevenLabs key", () => {
      const encrypted = service.encryptKeys({
        elevenLabsApiKey: "elevenlabs-test-key",
      });

      const decrypted = service.decryptKeys(encrypted);

      expect(decrypted.elevenLabsApiKey).toBe("elevenlabs-test-key");
      expect(decrypted.meshyApiKey).toBeUndefined();
      expect(decrypted.aiGatewayApiKey).toBeUndefined();
    });

    it("should decrypt all three keys", () => {
      const originalKeys = {
        meshyApiKey: "meshy-test-key",
        aiGatewayApiKey: "gateway-test-key",
        elevenLabsApiKey: "elevenlabs-test-key",
      };

      const encrypted = service.encryptKeys(originalKeys);
      const decrypted = service.decryptKeys(encrypted);

      expect(decrypted.meshyApiKey).toBe(originalKeys.meshyApiKey);
      expect(decrypted.aiGatewayApiKey).toBe(originalKeys.aiGatewayApiKey);
      expect(decrypted.elevenLabsApiKey).toBe(originalKeys.elevenLabsApiKey);
    });

    it("should return empty object when apiKeyIv is missing", () => {
      const result = service.decryptKeys({
        meshyApiKey: "encrypted-data",
        aiGatewayApiKey: "encrypted-data",
        elevenLabsApiKey: "encrypted-data",
        apiKeyIv: null,
      });

      expect(result).toEqual({});
    });

    it("should handle null values for keys", () => {
      const encrypted = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
      });

      const decrypted = service.decryptKeys({
        meshyApiKey: encrypted.meshyApiKey,
        aiGatewayApiKey: null,
        elevenLabsApiKey: null,
        apiKeyIv: encrypted.apiKeyIv,
      });

      expect(decrypted.meshyApiKey).toBe("meshy-test-key");
      expect(decrypted.aiGatewayApiKey).toBeUndefined();
      expect(decrypted.elevenLabsApiKey).toBeUndefined();
    });

    it("should skip decryption for missing keys", () => {
      const encrypted = service.encryptKeys({
        meshyApiKey: "meshy-test-key",
        elevenLabsApiKey: "elevenlabs-test-key",
      });

      const decrypted = service.decryptKeys({
        meshyApiKey: encrypted.meshyApiKey,
        elevenLabsApiKey: encrypted.elevenLabsApiKey,
        apiKeyIv: encrypted.apiKeyIv,
      });

      expect(decrypted.meshyApiKey).toBe("meshy-test-key");
      expect(decrypted.aiGatewayApiKey).toBeUndefined();
      expect(decrypted.elevenLabsApiKey).toBe("elevenlabs-test-key");
    });
  });

  describe("Round-trip Encryption/Decryption", () => {
    it("should maintain data integrity through multiple rounds", () => {
      const plaintext = "sk-test-key-12345";

      // Round 1
      const encrypted1 = service.encrypt(plaintext);
      const decrypted1 = service.decrypt(encrypted1.ciphertext, encrypted1.iv);
      expect(decrypted1).toBe(plaintext);

      // Round 2
      const encrypted2 = service.encrypt(decrypted1);
      const decrypted2 = service.decrypt(encrypted2.ciphertext, encrypted2.iv);
      expect(decrypted2).toBe(plaintext);

      // Round 3
      const encrypted3 = service.encrypt(decrypted2);
      const decrypted3 = service.decrypt(encrypted3.ciphertext, encrypted3.iv);
      expect(decrypted3).toBe(plaintext);
    });

    it("should handle all key types in round-trip", () => {
      const originalKeys = {
        meshyApiKey: "meshy-key-" + "x".repeat(50),
        aiGatewayApiKey: "gateway-key-" + "y".repeat(50),
        elevenLabsApiKey: "elevenlabs-key-" + "z".repeat(50),
      };

      const encrypted = service.encryptKeys(originalKeys);
      const decrypted = service.decryptKeys(encrypted);

      expect(decrypted).toEqual(originalKeys);
    });
  });

  describe("Various Key Lengths", () => {
    it("should handle very short keys (1 character)", () => {
      const shortKey = "x";
      const encrypted = service.encrypt(shortKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(shortKey);
    });

    it("should handle medium keys (50 characters)", () => {
      const mediumKey = "k".repeat(50);
      const encrypted = service.encrypt(mediumKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(mediumKey);
    });

    it("should handle long keys (500 characters)", () => {
      const longKey = "k".repeat(500);
      const encrypted = service.encrypt(longKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(longKey);
    });

    it("should handle very long keys (5000 characters)", () => {
      const veryLongKey = "k".repeat(5000);
      const encrypted = service.encrypt(veryLongKey);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(veryLongKey);
    });
  });

  describe("Singleton getInstance()", () => {
    it("should return singleton instance when env var is set", () => {
      // Set env var
      process.env.API_KEY_ENCRYPTION_SECRET = "a".repeat(32);

      const instance1 = ApiKeyEncryptionService.getInstance();
      const instance2 = ApiKeyEncryptionService.getInstance();

      expect(instance1).toBe(instance2);
    });

    // Note: Cannot test missing env var scenario because singleton instance
    // is already created by other tests in this suite. In production, the
    // getInstance() method will throw if API_KEY_ENCRYPTION_SECRET is not set
    // on first instantiation.
  });

  describe("Security Properties", () => {
    it("should not reveal plaintext in encrypted output", () => {
      const plaintext = "sk-secret-api-key-12345";
      const encrypted = service.encrypt(plaintext);

      // Encrypted data should not contain plaintext
      expect(encrypted.ciphertext).not.toContain(plaintext);
      expect(encrypted.ciphertext).not.toContain("secret");
      expect(encrypted.ciphertext).not.toContain("12345");
    });

    it("should produce authenticated encryption (GCM)", () => {
      const plaintext = "test-key";
      const encrypted = service.encrypt(plaintext);

      // Decode ciphertext to check auth tag is present (last 16 bytes)
      const buffer = Buffer.from(encrypted.ciphertext, "base64");
      expect(buffer.length).toBeGreaterThan(16);

      // Auth tag makes ciphertext longer than plaintext
      const plaintextBuffer = Buffer.from(plaintext, "utf-8");
      expect(buffer.length).toBeGreaterThan(plaintextBuffer.length);
    });

    it("should use AES-256 (32-byte key)", () => {
      // This is tested by constructor requirements
      expect(() => {
        new ApiKeyEncryptionService("a".repeat(32));
      }).not.toThrow();

      expect(() => {
        new ApiKeyEncryptionService("a".repeat(31));
      }).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle newlines in API keys", () => {
      const keyWithNewlines = "line1\nline2\nline3";
      const encrypted = service.encrypt(keyWithNewlines);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(keyWithNewlines);
    });

    it("should handle tabs and spaces", () => {
      const keyWithWhitespace = "key\twith\tspaces  and\ttabs";
      const encrypted = service.encrypt(keyWithWhitespace);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(keyWithWhitespace);
    });

    it("should handle null bytes", () => {
      const keyWithNull = "key\x00with\x00nulls";
      const encrypted = service.encrypt(keyWithNull);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(keyWithNull);
    });

    it("should handle emoji in API keys", () => {
      const keyWithEmoji = "🔑-api-key-🚀-test-🎉";
      const encrypted = service.encrypt(keyWithEmoji);
      const decrypted = service.decrypt(encrypted.ciphertext, encrypted.iv);

      expect(decrypted).toBe(keyWithEmoji);
    });
  });
});
