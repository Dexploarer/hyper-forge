/**
 * API Key Encryption Service
 * Provides secure encryption/decryption for user API keys using AES-256-GCM
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Random IV (Initialization Vector) for each encryption
 * - Master encryption key from environment variable
 * - Authenticated encryption prevents tampering
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Encrypted data result
 */
export interface EncryptedData {
  ciphertext: string; // Base64-encoded encrypted data
  iv: string; // Base64-encoded initialization vector
}

/**
 * API Key Encryption Service
 * Thread-safe singleton service for encrypting/decrypting API keys
 */
export class ApiKeyEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly encryptionKey: Buffer;
  private static instance: ApiKeyEncryptionService;

  /**
   * Initialize encryption service with master key
   * @param encryptionSecret - Master encryption key (must be 32 bytes)
   */
  constructor(encryptionSecret: string) {
    if (!encryptionSecret) {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET is required for API key encryption"
      );
    }

    // Derive a 32-byte key from the secret
    // Use first 32 bytes of the secret (or hash it for variable length)
    const keyBuffer = Buffer.from(encryptionSecret, "utf-8");

    if (keyBuffer.length < 32) {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET must be at least 32 characters"
      );
    }

    this.encryptionKey = keyBuffer.slice(0, 32);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ApiKeyEncryptionService {
    if (!this.instance) {
      const secret = process.env.API_KEY_ENCRYPTION_SECRET;
      if (!secret) {
        throw new Error(
          "API_KEY_ENCRYPTION_SECRET environment variable is not set"
        );
      }
      this.instance = new ApiKeyEncryptionService(secret);
    }
    return this.instance;
  }

  /**
   * Encrypt a plaintext API key
   * @param plaintext - The API key to encrypt
   * @returns Encrypted data with ciphertext and IV
   */
  encrypt(plaintext: string): EncryptedData {
    if (!plaintext) {
      throw new Error("Cannot encrypt empty string");
    }

    // Generate random IV (12 bytes is standard for GCM)
    const iv = randomBytes(12);

    // Create cipher
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    // Encrypt the data
    let ciphertext = cipher.update(plaintext, "utf-8", "base64");
    ciphertext += cipher.final("base64");

    // Get authentication tag (GCM provides authenticated encryption)
    const authTag = cipher.getAuthTag();

    // Combine ciphertext and auth tag
    const combined = Buffer.concat([
      Buffer.from(ciphertext, "base64"),
      authTag,
    ]);

    return {
      ciphertext: combined.toString("base64"),
      iv: iv.toString("base64"),
    };
  }

  /**
   * Decrypt an encrypted API key
   * @param ciphertext - Base64-encoded encrypted data (includes auth tag)
   * @param iv - Base64-encoded initialization vector
   * @returns Decrypted plaintext API key
   */
  decrypt(ciphertext: string, iv: string): string {
    if (!ciphertext || !iv) {
      throw new Error("Ciphertext and IV are required for decryption");
    }

    try {
      // Decode the combined data
      const combined = Buffer.from(ciphertext, "base64");

      // Extract auth tag (last 16 bytes)
      const authTag = combined.slice(-16);
      const encryptedData = combined.slice(0, -16);

      // Decode IV
      const ivBuffer = Buffer.from(iv, "base64");

      // Create decipher
      const decipher = createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        ivBuffer
      );
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let plaintext = decipher.update(encryptedData, undefined, "utf-8");
      plaintext += decipher.final("utf-8");

      return plaintext;
    } catch (error) {
      console.error("[ApiKeyEncryption] Decryption failed:", error);
      throw new Error("Failed to decrypt API key - data may be corrupted");
    }
  }

  /**
   * Encrypt multiple API keys for storage
   */
  encryptKeys(keys: {
    meshyApiKey?: string;
    aiGatewayApiKey?: string;
    elevenLabsApiKey?: string;
  }): {
    meshyApiKey?: string;
    aiGatewayApiKey?: string;
    elevenLabsApiKey?: string;
    apiKeyIv: string;
  } {
    // Use same IV for all keys belonging to same user
    const iv = randomBytes(12).toString("base64");

    const result: {
      meshyApiKey?: string;
      aiGatewayApiKey?: string;
      elevenLabsApiKey?: string;
      apiKeyIv: string;
    } = { apiKeyIv: iv };

    if (keys.meshyApiKey) {
      const encrypted = this.encryptWithIv(keys.meshyApiKey, iv);
      result.meshyApiKey = encrypted.ciphertext;
    }

    if (keys.aiGatewayApiKey) {
      const encrypted = this.encryptWithIv(keys.aiGatewayApiKey, iv);
      result.aiGatewayApiKey = encrypted.ciphertext;
    }

    if (keys.elevenLabsApiKey) {
      const encrypted = this.encryptWithIv(keys.elevenLabsApiKey, iv);
      result.elevenLabsApiKey = encrypted.ciphertext;
    }

    return result;
  }

  /**
   * Decrypt multiple API keys from storage
   */
  decryptKeys(
    encryptedKeys: {
      meshyApiKey?: string | null;
      aiGatewayApiKey?: string | null;
      elevenLabsApiKey?: string | null;
      apiKeyIv?: string | null;
    }
  ): {
    meshyApiKey?: string;
    aiGatewayApiKey?: string;
    elevenLabsApiKey?: string;
  } {
    if (!encryptedKeys.apiKeyIv) {
      return {};
    }

    const result: {
      meshyApiKey?: string;
      aiGatewayApiKey?: string;
      elevenLabsApiKey?: string;
    } = {};

    if (encryptedKeys.meshyApiKey) {
      result.meshyApiKey = this.decrypt(
        encryptedKeys.meshyApiKey,
        encryptedKeys.apiKeyIv
      );
    }

    if (encryptedKeys.aiGatewayApiKey) {
      result.aiGatewayApiKey = this.decrypt(
        encryptedKeys.aiGatewayApiKey,
        encryptedKeys.apiKeyIv
      );
    }

    if (encryptedKeys.elevenLabsApiKey) {
      result.elevenLabsApiKey = this.decrypt(
        encryptedKeys.elevenLabsApiKey,
        encryptedKeys.apiKeyIv
      );
    }

    return result;
  }

  /**
   * Helper: Encrypt with provided IV (for batch operations)
   */
  private encryptWithIv(plaintext: string, ivBase64: string): EncryptedData {
    const iv = Buffer.from(ivBase64, "base64");
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    let ciphertext = cipher.update(plaintext, "utf-8", "base64");
    ciphertext += cipher.final("base64");

    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([
      Buffer.from(ciphertext, "base64"),
      authTag,
    ]);

    return {
      ciphertext: combined.toString("base64"),
      iv: ivBase64,
    };
  }
}

// Export singleton instance getter
export const getEncryptionService = () => ApiKeyEncryptionService.getInstance();
