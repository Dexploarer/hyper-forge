/**
 * User API Keys Utility
 *
 * Fetches and decrypts user-provided API keys from the database.
 * Provides fallback to environment variables for development/testing.
 *
 * Usage:
 *   const userKeys = await getUserApiKeys(userId);
 *   const keys = mergeWithEnvKeys(userKeys);
 *   // Use keys.meshyApiKey, keys.aiGatewayApiKey, etc.
 */

import { getEncryptionService } from "../services/ApiKeyEncryptionService";
import { db } from "../db/db";
import { users } from "../db/schema/users.schema";
import { eq } from "drizzle-orm";
import { createChildLogger } from "./logger";

const logger = createChildLogger("getUserApiKeys");

/**
 * User API Keys interface
 * Contains decrypted API keys for various services
 */
export interface UserApiKeys {
  meshyApiKey?: string;
  aiGatewayApiKey?: string;
  elevenLabsApiKey?: string;
}

/**
 * Fetch and decrypt user's API keys from database
 *
 * @param userId - User ID to fetch keys for
 * @returns Decrypted API keys object (empty if user has no keys)
 *
 * @example
 * const userKeys = await getUserApiKeys('user-123');
 * if (userKeys.meshyApiKey) {
 *   // Use user's Meshy API key
 * }
 */
export async function getUserApiKeys(userId: string): Promise<UserApiKeys> {
  try {
    // Fetch user record with encrypted API keys
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        meshyApiKey: true,
        aiGatewayApiKey: true,
        elevenLabsApiKey: true,
        apiKeyIv: true,
      },
    });

    // User not found
    if (!user) {
      logger.warn({ userId }, "User not found when fetching API keys");
      return {};
    }

    // User has no encrypted keys
    if (!user.apiKeyIv) {
      logger.debug({ userId }, "User has no encrypted API keys");
      return {};
    }

    // Decrypt user's API keys
    try {
      const encryptionService = getEncryptionService();
      const decryptedKeys = encryptionService.decryptKeys({
        meshyApiKey: user.meshyApiKey,
        aiGatewayApiKey: user.aiGatewayApiKey,
        elevenLabsApiKey: user.elevenLabsApiKey,
        apiKeyIv: user.apiKeyIv,
      });

      // Log which keys were successfully decrypted (without revealing the keys)
      const availableKeys = Object.keys(decryptedKeys).filter(
        (key) => decryptedKeys[key as keyof UserApiKeys]
      );

      if (availableKeys.length > 0) {
        logger.info(
          { userId, keys: availableKeys },
          "Successfully decrypted user API keys"
        );
      }

      return decryptedKeys;
    } catch (error) {
      logger.error(
        { userId, error },
        "Failed to decrypt user API keys - returning empty keys"
      );
      return {};
    }
  } catch (error) {
    logger.error(
      { userId, error },
      "Failed to fetch user API keys from database"
    );
    throw error;
  }
}

/**
 * Merge user keys with environment variable fallbacks
 *
 * Priority order:
 * 1. User-provided keys (from database)
 * 2. Environment variable keys (fallback)
 *
 * This allows users to override global API keys with their own,
 * while falling back to environment variables for convenience.
 *
 * @param userKeys - User's API keys from database
 * @returns Merged keys object with env fallbacks
 *
 * @example
 * const userKeys = await getUserApiKeys(userId);
 * const keys = mergeWithEnvKeys(userKeys);
 * // keys.meshyApiKey will be user's key if available, else env var
 */
export function mergeWithEnvKeys(userKeys: UserApiKeys): UserApiKeys {
  const merged: UserApiKeys = {
    meshyApiKey: userKeys.meshyApiKey || process.env.MESHY_API_KEY,
    aiGatewayApiKey: userKeys.aiGatewayApiKey || process.env.AI_GATEWAY_API_KEY,
    elevenLabsApiKey:
      userKeys.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY,
  };

  // Log which keys are being used (helpful for debugging)
  const keySource = {
    meshyApiKey: userKeys.meshyApiKey ? "user" : merged.meshyApiKey ? "env" : "none",
    aiGatewayApiKey: userKeys.aiGatewayApiKey ? "user" : merged.aiGatewayApiKey ? "env" : "none",
    elevenLabsApiKey: userKeys.elevenLabsApiKey ? "user" : merged.elevenLabsApiKey ? "env" : "none",
  };

  logger.debug(
    { keySource },
    "Merged user keys with environment variables"
  );

  return merged;
}

/**
 * Helper function to get user API keys with env fallbacks in one call
 *
 * @param userId - User ID to fetch keys for
 * @returns Merged API keys with env fallbacks
 *
 * @example
 * const keys = await getUserApiKeysWithFallback('user-123');
 * // Ready to use - will have user keys or env vars
 */
export async function getUserApiKeysWithFallback(
  userId: string
): Promise<UserApiKeys> {
  const userKeys = await getUserApiKeys(userId);
  return mergeWithEnvKeys(userKeys);
}
