/**
 * API Key Service
 * Handles generation, validation, and management of API keys for programmatic access
 * NON-BREAKING: Works alongside existing Privy JWT authentication
 */

import crypto from "crypto";
import { db } from "../db/db";
import { apiKeys } from "../db/schema";
import { eq, and, isNull, or, gt, sql } from "drizzle-orm";
import type { ApiKey } from "../db/schema";

export class ApiKeyService {
  /**
   * Generate a new API key for a user
   * Format: af_live_<32 hex chars> or af_test_<32 hex chars>
   * 
   * @param userId - UUID of the user
   * @param options - Configuration options
   * @returns The generated key (shown only once!) and key ID
   */
  async generateApiKey(
    userId: string,
    options: {
      name: string;
      permissions?: string[];
      rateLimit?: number;
      expiresAt?: Date;
    },
  ): Promise<{ key: string; keyId: string }> {
    // Generate random key
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const env = process.env.NODE_ENV === "production" ? "live" : "test";
    const key = `af_${env}_${randomBytes}`;

    // Hash key for storage (SHA-256)
    const keyHash = crypto
      .createHash("sha256")
      .update(key)
      .digest("hex");

    // Store prefix for display (first 16 chars)
    const keyPrefix = key.substring(0, 16);

    // Insert into database
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        userId,
        keyHash,
        keyPrefix,
        name: options.name,
        permissions: options.permissions || [],
        rateLimit: options.rateLimit,
        expiresAt: options.expiresAt,
      })
      .returning();

    return {
      key, // ONLY returned once!
      keyId: apiKey.id,
    };
  }

  /**
   * Validate an API key
   * Checks hash, expiration, and revocation status
   * Updates lastUsedAt timestamp
   * 
   * @param keyString - The API key to validate
   * @returns User ID if valid, null if invalid
   */
  async validateApiKey(
    keyString: string,
  ): Promise<{ userId: string; permissions: string[] } | null> {
    // Hash the provided key
    const keyHash = crypto
      .createHash("sha256")
      .update(keyString)
      .digest("hex");

    // Find matching key
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          isNull(apiKeys.revokedAt), // Not revoked
          or(
            isNull(apiKeys.expiresAt), // No expiration
            gt(apiKeys.expiresAt, new Date()), // Or not yet expired
          ),
        ),
      )
      .limit(1);

    if (!apiKey) {
      return null; // Invalid key
    }

    // Update last used timestamp (async, don't wait)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .catch((err) => {
        console.error("Failed to update API key lastUsedAt:", err);
      });

    return {
      userId: apiKey.userId,
      permissions: (apiKey.permissions as string[]) || [],
    };
  }

  /**
   * List all API keys for a user
   * Does NOT return actual keys or hashes
   * 
   * @param userId - UUID of the user
   * @returns Array of API key metadata
   */
  async listApiKeys(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      prefix: string;
      permissions: string[];
      rateLimit: number | null;
      expiresAt: Date | null;
      lastUsedAt: Date | null;
      createdAt: Date;
      revoked: boolean;
    }>
  > {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(sql`${apiKeys.createdAt} DESC`);

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      permissions: (key.permissions as string[]) || [],
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revoked: key.revokedAt !== null,
    }));
  }

  /**
   * Revoke an API key (soft delete)
   * 
   * @param userId - UUID of the user (for authorization)
   * @param keyId - UUID of the key to revoke
   * @throws Error if key not found or not owned by user
   */
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const result = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error("API key not found or unauthorized");
    }
  }

  /**
   * Delete an API key permanently
   * 
   * @param userId - UUID of the user (for authorization)
   * @param keyId - UUID of the key to delete
   * @throws Error if key not found or not owned by user
   */
  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error("API key not found or unauthorized");
    }
  }

  /**
   * Get detailed information about a specific API key
   * 
   * @param userId - UUID of the user (for authorization)
   * @param keyId - UUID of the key
   * @returns Key metadata or null if not found
   */
  async getApiKey(
    userId: string,
    keyId: string,
  ): Promise<{
    id: string;
    name: string;
    prefix: string;
    permissions: string[];
    rateLimit: number | null;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    revoked: boolean;
  } | null> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!key) {
      return null;
    }

    return {
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,
      permissions: (key.permissions as string[]) || [],
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      revoked: key.revokedAt !== null,
    };
  }
}
