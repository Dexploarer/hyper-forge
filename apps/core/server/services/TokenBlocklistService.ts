/**
 * Token Blocklist Service
 * Simple JWT invalidation via blocklist
 */

import { eq, lt } from "drizzle-orm";
import { db } from "../db/db";
import { tokenBlocklist } from "../db/schema";
import { logger } from "../utils/logger";
import { createHash } from "crypto";

export class TokenBlocklistService {
  /**
   * Hash a token for storage (don't store raw tokens)
   */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Check if a token is blocklisted
   */
  async isTokenBlocklisted(token: string): Promise<boolean> {
    const tokenId = this.hashToken(token);

    const result = await db
      .select({ id: tokenBlocklist.id })
      .from(tokenBlocklist)
      .where(eq(tokenBlocklist.tokenId, tokenId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Add a token to the blocklist
   */
  async blockToken(
    token: string,
    userId?: string,
    reason?: string,
    expiresAt?: Date,
  ): Promise<void> {
    const tokenId = this.hashToken(token);

    // Default expiry to 24 hours if not specified
    const expiry = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await db.insert(tokenBlocklist).values({
        tokenId,
        userId: userId || null,
        reason: reason || "logout",
        expiresAt: expiry,
      });

      logger.info(
        { tokenId: tokenId.substring(0, 16), reason, context: "auth" },
        "Token added to blocklist",
      );
    } catch (error: any) {
      // Ignore duplicate key errors (token already blocklisted)
      if (error.code === "23505") {
        return;
      }
      throw error;
    }
  }

  /**
   * Remove expired tokens from blocklist (cleanup)
   */
  async cleanupExpired(): Promise<number> {
    const result = await db
      .delete(tokenBlocklist)
      .where(lt(tokenBlocklist.expiresAt, new Date()));

    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      logger.info(
        { deletedCount, context: "auth" },
        "Cleaned up expired blocklist entries",
      );
    }

    return deletedCount;
  }

  /**
   * Block all tokens for a user (logout everywhere)
   * @deprecated This function is a placeholder and does not provide a secure "logout everywhere" implementation.
   * A robust solution requires a mechanism like a `tokensValidFrom` timestamp on the user model.
   */
  async blockUserTokens(userId: string, reason?: string): Promise<void> {
    // This is a critical security operation that is NOT implemented.
    // A proper implementation should invalidate all of a user's sessions,
    // for example by updating a `tokensValidFrom` timestamp in the user's database record
    // and checking it during token verification.
    // Leaving this as a no-op to prevent a false sense of security.
    logger.error(
      { userId, reason, context: "auth" },
      "CRITICAL: blockUserTokens is not implemented. User tokens were NOT invalidated.",
    );
    // To prevent accidental use, throw an error in non-production environments.
    if (process.env.NODE_ENV !== "production") {
      throw new Error("blockUserTokens is not implemented.");
    }
  }
}

// Singleton instance
export const tokenBlocklistService = new TokenBlocklistService();
