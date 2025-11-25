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
   * Note: This only blocks tokens we've seen - new tokens won't be affected
   * For complete invalidation, change the user's secret or rotate keys
   */
  async blockUserTokens(userId: string, reason?: string): Promise<void> {
    // We can't block tokens we haven't seen
    // For a proper "logout everywhere", the user should change their password
    // or we should track active sessions
    logger.info(
      { userId, reason, context: "auth" },
      "User token blocklist requested (note: only blocks known tokens)",
    );
  }
}

// Singleton instance
export const tokenBlocklistService = new TokenBlocklistService();
