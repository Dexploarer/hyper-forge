/**
 * User API Keys Routes
 * Manage user-provided API keys for AI services
 * Keys are encrypted before storage using AES-256-GCM
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { requireAuth } from "../middleware/auth";
import { getEncryptionService } from "../services/ApiKeyEncryptionService";
import { db } from "../db";
import { users } from "../db/schema/users.schema";
import { eq } from "drizzle-orm";

export const userApiKeysRoutes = new Elysia({ prefix: "/api/users" })
  // Save user API keys (encrypted)
  .post(
    "/api-keys",
    async ({ request, headers, body }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { meshyApiKey, aiGatewayApiKey, elevenLabsApiKey } = body;

      // Validate at least one key is provided
      if (!meshyApiKey && !aiGatewayApiKey && !elevenLabsApiKey) {
        return new Response(
          JSON.stringify({
            error: "At least one API key must be provided",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      try {
        // Encrypt the API keys
        const encryptionService = getEncryptionService();
        const encryptedData = encryptionService.encryptKeys({
          meshyApiKey,
          aiGatewayApiKey,
          elevenLabsApiKey,
        });

        // Update user record with encrypted keys
        await db
          .update(users)
          .set({
            meshyApiKey: encryptedData.meshyApiKey,
            aiGatewayApiKey: encryptedData.aiGatewayApiKey,
            elevenLabsApiKey: encryptedData.elevenLabsApiKey,
            apiKeyIv: encryptedData.apiKeyIv,
            updatedAt: new Date(),
          })
          .where(eq(users.id, authUser.id));

        logger.info(
          {
            context: "UserApiKeys",
            userId: authUser.id,
            meshy: !!meshyApiKey,
            aiGateway: !!aiGatewayApiKey,
            elevenLabs: !!elevenLabsApiKey,
          },
          "User updated API keys",
        );

        return {
          success: true,
          message: "API keys saved successfully",
          keysConfigured: {
            meshyApiKey: !!meshyApiKey,
            aiGatewayApiKey: !!aiGatewayApiKey,
            elevenLabsApiKey: !!elevenLabsApiKey,
          },
        };
      } catch (error) {
        logger.error({ err: error }, "[UserApiKeys] Failed to save API keys:");
        return new Response(
          JSON.stringify({
            error: "Failed to save API keys",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    },
    {
      body: t.Object({
        meshyApiKey: t.Optional(t.String()),
        aiGatewayApiKey: t.Optional(t.String()),
        elevenLabsApiKey: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Users"],
        summary: "Save user API keys",
        description:
          "Save encrypted API keys for the authenticated user. Keys are encrypted before storage. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Get API key configuration status (doesn't return actual keys)
  .get(
    "/api-keys/status",
    async ({ request, headers }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;

      try {
        // Fetch user's encrypted API keys
        const [userRecord] = await db
          .select({
            meshyApiKey: users.meshyApiKey,
            aiGatewayApiKey: users.aiGatewayApiKey,
            elevenLabsApiKey: users.elevenLabsApiKey,
            apiKeyIv: users.apiKeyIv,
          })
          .from(users)
          .where(eq(users.id, authUser.id));

        if (!userRecord) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Return status of which keys are configured (not the actual keys)
        return {
          keysConfigured: {
            meshyApiKey: !!userRecord.meshyApiKey,
            aiGatewayApiKey: !!userRecord.aiGatewayApiKey,
            elevenLabsApiKey: !!userRecord.elevenLabsApiKey,
          },
          hasAnyKeys: !!(
            userRecord.meshyApiKey ||
            userRecord.aiGatewayApiKey ||
            userRecord.elevenLabsApiKey
          ),
        };
      } catch (error) {
        logger.error(
          { err: error },
          "[UserApiKeys] Failed to fetch API key status:",
        );
        return new Response(
          JSON.stringify({
            error: "Failed to fetch API key status",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get API key status",
        description:
          "Check which API keys are configured for the authenticated user. Does not return actual keys. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Delete user API keys
  .delete(
    "/api-keys",
    async ({ request, headers }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;

      try {
        // Clear all API keys
        await db
          .update(users)
          .set({
            meshyApiKey: null,
            aiGatewayApiKey: null,
            elevenLabsApiKey: null,
            apiKeyIv: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, authUser.id));

        logger.info(
          { context: "UserApiKeys" },
          "User ${authUser.id} deleted all API keys",
        );

        return {
          success: true,
          message: "API keys deleted successfully",
        };
      } catch (error) {
        logger.error(
          { err: error },
          "[UserApiKeys] Failed to delete API keys:",
        );
        return new Response(
          JSON.stringify({
            error: "Failed to delete API keys",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Delete user API keys",
        description:
          "Delete all API keys for the authenticated user. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
