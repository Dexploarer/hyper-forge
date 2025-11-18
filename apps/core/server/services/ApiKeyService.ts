/**
 * API Key Service
 * Handles generation, validation, and management of API keys for programmatic access
 * NON-BREAKING: Works alongside existing Privy JWT authentication
 */

import crypto from "crypto";
import { timingSafeEqual } from "node:crypto";
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

/**
 * Metadata structure for API keys
 * Provides type safety for the JSONB metadata field
 */
interface ApiKeyMetadata {
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
  };
  allowedOrigins?: string[];
  customFields?: Record<string, unknown>;
}

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
   * Validate an API key with constant-time comparison to prevent timing attacks
   * Checks hash, expiration, and revocation status
   * Updates lastUsedAt timestamp
   *
   * @param keyString - The API key to validate
   * @returns User ID and permissions if valid, null if invalid
   */
  async validateApiKey(
    keyString: string,
  ): Promise<{ userId: string; permissions: string[] } | null> {
    // Hash the provided key
    const hashedInput = crypto
      .createHash("sha256")
      .update(keyString)
      .digest("hex");

    // Extract prefix for faster lookup (optional optimization)
    const keyPrefix = keyString.substring(0, 16);

    // Find all non-revoked, non-expired keys with matching prefix
    // We fetch all candidates to prevent timing attacks based on DB query time
    const candidates = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyPrefix, keyPrefix),
          isNull(apiKeys.revokedAt), // Not revoked
          or(
            isNull(apiKeys.expiresAt), // No expiration
            gt(apiKeys.expiresAt, new Date()), // Or not yet expired
          ),
        ),
      );

    // Use constant-time comparison to prevent timing attacks
    // This ensures that comparison time doesn't leak information about the key
    let matchedKey: (typeof candidates)[0] | null = null;

    for (const candidate of candidates) {
      const inputBuffer = Buffer.from(hashedInput, "utf-8");
      const storedBuffer = Buffer.from(candidate.keyHash, "utf-8");

      // Constant-time comparison prevents timing-based side-channel attacks
      if (
        inputBuffer.length === storedBuffer.length &&
        timingSafeEqual(inputBuffer, storedBuffer)
      ) {
        matchedKey = candidate;
        // Don't break early - continue to prevent timing analysis
      }
    }

    if (!matchedKey) {
      return null; // Invalid key
    }

    // Update last used timestamp (async, don't wait)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, matchedKey.id))
      .catch((err) => {
        logger.error(
          { err, keyId: matchedKey!.id, userId: matchedKey!.userId },
          "Failed to update API key lastUsedAt",
        );
      });

    return {
      userId: matchedKey.userId,
      permissions: Array.isArray(matchedKey.permissions)
        ? (matchedKey.permissions as string[])
        : [],
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
      permissions: Array.isArray(key.permissions)
        ? (key.permissions as string[])
        : [],
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revoked: key.revokedAt !== null,
    }));
  }

  /**
   * Revoke an API key (soft delete) with transaction safety
   *
   * @param userId - UUID of the user (for authorization)
   * @param keyId - UUID of the key to revoke
   * @throws Error if key not found or not owned by user
   */
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const result = await tx
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new Error("API key not found or unauthorized");
      }
    });
  }

  /**
   * Delete an API key permanently with transaction safety
   *
   * @param userId - UUID of the user (for authorization)
   * @param keyId - UUID of the key to delete
   * @throws Error if key not found or not owned by user
   */
  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const result = await tx
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new Error("API key not found or unauthorized");
      }
    });
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
      permissions: Array.isArray(key.permissions)
        ? (key.permissions as string[])
        : [],
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

    // Build query - apply where() conditionally to avoid type errors
    const baseQuery = db
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


    // Apply conditions if any exist
    const queryWithFilters =
      allConditions.length > 0
        ? baseQuery.where(and(...allConditions))
        : baseQuery;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult?.count || 0;

    // Get paginated results
    const results = await queryWithFilters
      .orderBy(desc(apiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      keys: results.map((row) => ({
        ...row,
        permissions: Array.isArray(row.permissions)
          ? (row.permissions as string[])
          : [],
        revoked: row.revokedAt !== null,
      })),
      total,
    };
  }

  /**
   * Get system-wide API key statistics (admin only)
   * Optimized to use SQL aggregation instead of loading all keys into memory
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

    // Use SQL aggregation for efficient counting (P2-MEDIUM fix)
    const [stats] = await db
      .select({
        totalKeys: sql<number>`count(*)::int`,
        activeKeys: sql<number>`count(*) filter (where ${apiKeys.revokedAt} is null and (${apiKeys.expiresAt} is null or ${apiKeys.expiresAt} > now()))::int`,
        revokedKeys: sql<number>`count(*) filter (where ${apiKeys.revokedAt} is not null)::int`,
        expiredKeys: sql<number>`count(*) filter (where ${apiKeys.revokedAt} is null and ${apiKeys.expiresAt} is not null and ${apiKeys.expiresAt} <= now())::int`,
        keysUsedLast24h: sql<number>`count(*) filter (where ${apiKeys.lastUsedAt} >= ${yesterday})::int`,
      })
      .from(apiKeys);

    // Get keys per user with aggregation
    const keysByUserResults = await db
      .select({
        userId: apiKeys.userId,
        userName: users.displayName,
        keyCount: sql<number>`count(*)::int`,
      })
      .from(apiKeys)
      .leftJoin(users, eq(apiKeys.userId, users.id))
      .groupBy(apiKeys.userId, users.displayName);

    return {
      totalKeys: stats.totalKeys,
      activeKeys: stats.activeKeys,
      revokedKeys: stats.revokedKeys,
      expiredKeys: stats.expiredKeys,
      keysUsedLast24h: stats.keysUsedLast24h,
      keysByUser: keysByUserResults,
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
      permissions: Array.isArray(result.permissions)
        ? (result.permissions as string[])
        : [],
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
