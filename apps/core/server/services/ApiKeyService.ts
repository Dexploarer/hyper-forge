/**
 * API Key Service
 * Handles generation, validation, and management of API keys for programmatic access
 * NON-BREAKING: Works alongside existing Privy JWT authentication
 */

import crypto from "crypto";
import { db } from "../db/db";
import { apiKeys, users } from "../db/schema";
import { logger } from "../utils/logger";
import {
  eq,
  and,
  isNull,
  or,
  gt,
  sql,
  like,
  desc,
  count,
  inArray,
} from "drizzle-orm";
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
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");

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
    const keyHash = crypto.createHash("sha256").update(keyString).digest("hex");

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
        logger.error(
          { err, keyId: apiKey.id, userId: apiKey.userId },
          "Failed to update API key lastUsedAt",
        );
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

  // ============================================
  // ADMIN METHODS (Admin-only operations)
  // ============================================

  /**
   * Get all API keys across all users (admin only)
   *
   * @param filters - Optional filters
   * @returns Paginated list of all API keys with user info
   */
  async getAllApiKeys(filters?: {
    userId?: string;
    status?: "active" | "revoked" | "expired" | "all";
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    keys: Array<{
      id: string;
      userId: string;
      userName: string | null;
      userEmail: string | null;
      name: string;
      prefix: string;
      permissions: string[];
      rateLimit: number | null;
      expiresAt: Date | null;
      lastUsedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      revoked: boolean;
      revokedAt: Date | null;
    }>;
    total: number;
  }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build WHERE conditions
    const conditions = [];

    // Filter by user
    if (filters?.userId) {
      conditions.push(eq(apiKeys.userId, filters.userId));
    }

    // Filter by status
    if (filters?.status === "active") {
      conditions.push(
        isNull(apiKeys.revokedAt),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
      );
    } else if (filters?.status === "revoked") {
      conditions.push(sql`${apiKeys.revokedAt} IS NOT NULL`);
    } else if (filters?.status === "expired") {
      conditions.push(
        isNull(apiKeys.revokedAt),
        sql`${apiKeys.expiresAt} IS NOT NULL AND ${apiKeys.expiresAt} <= NOW()`,
      );
    }

    // Build query with user join
    // Combine all WHERE conditions into single array to avoid overwriting
    const allConditions = [...conditions];

    // Add search filter (searches user name and email)
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      allConditions.push(
        or(like(users.displayName, searchTerm), like(users.email, searchTerm)),
      );
    }

    let query = db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        userName: users.displayName,
        userEmail: users.email,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id));

    // Apply all conditions in single where() call
    if (allConditions.length > 0) {
      query = query.where(and(...allConditions)) as any;
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult?.count || 0;

    // Get paginated results
    const results = await query
      .orderBy(desc(apiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      keys: results.map((row) => ({
        ...row,
        permissions: (row.permissions as string[]) || [],
        revoked: row.revokedAt !== null,
      })),
      total,
    };
  }

  /**
   * Get system-wide API key statistics (admin only)
   *
   * @returns System-wide statistics
   */
  async getSystemStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    revokedKeys: number;
    expiredKeys: number;
    keysUsedLast24h: number;
    keysByUser: Array<{
      userId: string;
      userName: string | null;
      keyCount: number;
    }>;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all keys
    const allKeys = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        revokedAt: apiKeys.revokedAt,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys);

    const totalKeys = allKeys.length;
    const activeKeys = allKeys.filter(
      (k) => !k.revokedAt && (!k.expiresAt || k.expiresAt > now),
    ).length;
    const revokedKeys = allKeys.filter((k) => k.revokedAt).length;
    const expiredKeys = allKeys.filter(
      (k) => !k.revokedAt && k.expiresAt && k.expiresAt <= now,
    ).length;
    const keysUsedLast24h = allKeys.filter(
      (k) => k.lastUsedAt && k.lastUsedAt >= yesterday,
    ).length;

    // Get keys by user
    const keysByUserMap = new Map<string, number>();
    allKeys.forEach((k) => {
      const current = keysByUserMap.get(k.userId) || 0;
      keysByUserMap.set(k.userId, current + 1);
    });

    // Get user details
    const userIds = Array.from(keysByUserMap.keys());
    const userDetails = await db
      .select({
        id: users.id,
        displayName: users.displayName,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    const keysByUser = userDetails.map((user) => ({
      userId: user.id,
      userName: user.displayName,
      keyCount: keysByUserMap.get(user.id) || 0,
    }));

    return {
      totalKeys,
      activeKeys,
      revokedKeys,
      expiredKeys,
      keysUsedLast24h,
      keysByUser,
    };
  }

  /**
   * Admin revoke any API key (bypasses user ownership check)
   *
   * @param keyId - UUID of the key to revoke
   * @returns Revoked key details
   * @throws Error if key not found
   */
  async adminRevokeApiKey(keyId: string): Promise<{
    id: string;
    userId: string;
    name: string;
    revokedAt: Date;
  }> {
    const result = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (result.length === 0) {
      throw new Error("API key not found");
    }

    return {
      id: result[0].id,
      userId: result[0].userId,
      name: result[0].name,
      revokedAt: result[0].revokedAt!,
    };
  }

  /**
   * Admin delete any API key permanently (bypasses user ownership check)
   *
   * @param keyId - UUID of the key to delete
   * @throws Error if key not found
   */
  async adminDeleteApiKey(keyId: string): Promise<void> {
    const result = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (result.length === 0) {
      throw new Error("API key not found");
    }
  }

  /**
   * Admin get API key details (bypasses user ownership check)
   *
   * @param keyId - UUID of the key
   * @returns Key details with user info or null if not found
   */
  async adminGetApiKey(keyId: string): Promise<{
    id: string;
    userId: string;
    userName: string | null;
    userEmail: string | null;
    name: string;
    prefix: string;
    permissions: string[];
    rateLimit: number | null;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    revoked: boolean;
    revokedAt: Date | null;
  } | null> {
    const [result] = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        userName: users.displayName,
        userEmail: users.email,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id))
      .where(eq(apiKeys.id, keyId))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      permissions: (result.permissions as string[]) || [],
      revoked: result.revokedAt !== null,
    };
  }

  /**
   * Admin generate API key for any user
   *
   * @param targetUserId - UUID of the user to generate key for
   * @param options - Configuration options
   * @returns The generated key (shown only once!) and key ID
   */
  async adminGenerateApiKey(
    targetUserId: string,
    options: {
      name: string;
      permissions?: string[];
      rateLimit?: number;
      expiresAt?: Date;
    },
  ): Promise<{ key: string; keyId: string }> {
    // Use the existing generateApiKey method
    return this.generateApiKey(targetUserId, options);
  }
}
