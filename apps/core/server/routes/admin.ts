/**
 * Admin Routes
 * Routes for admin-only functionality like role management and activity logs
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { eq, desc, and } from "drizzle-orm";
import { db, activityLog } from "../db";
import {
  requireAuth,
  requireAdminGuard,
  authPlugin,
} from "../plugins/auth.plugin";
import { userService } from "../services/UserService";
import { ApiKeyService } from "../services/ApiKeyService";
import { MediaStorageService } from "../services/MediaStorageService";
import { importCDNAssets } from "../scripts/import-cdn-assets";
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} from "../errors";
import type { AuthUser } from "../types/auth";

const mediaStorageService = new MediaStorageService();

/**
 * Custom guard for import-cdn-assets endpoint
 * Allows EITHER admin JWT auth OR API key auth
 */
const importCdnAssetsGuard = new Elysia({
  name: "import-cdn-assets-guard",
}).derive(async ({ headers, request }) => {
  // Check for API key first
  const apiKey = headers["x-api-key"];
  const cdnApiKey = process.env.CDN_API_KEY;

  if (apiKey && cdnApiKey && apiKey === cdnApiKey) {
    logger.info({ context: "Admin" }, "Import CDN assets guard: API key auth");
    return { isSystemKey: true, user: null };
  }

  // Otherwise require admin JWT auth
  const result = await requireAuth({ request, headers });

  if (result instanceof Response) {
    throw new UnauthorizedError("Authentication required");
  }

  if (result.user.role !== "admin") {
    throw new BadRequestError("Admin access required");
  }

  logger.info({ context: "Admin" }, "Import CDN assets guard: Admin JWT auth");
  return { isSystemKey: false, user: result.user };
});

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  // JWT-based admin routes
  .group("", (app) =>
    app
      .use(requireAdminGuard)
      /**
       * Update user role (admin only)
       * PUT /api/admin/users/:id/role
       * Changes a user's role between admin and member
       */
      .put(
        "/users/:id/role",
        async (context) => {
          const { user, params, body } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;
          const { role } = body;

          // Don't allow demoting yourself
          if (id === user.id) {
            throw new BadRequestError("You cannot change your own role");
          }

          // Update user role
          try {
            const updatedUser = await userService.updateRole(id, role);

            // Log activity
            await db.insert(activityLog).values({
              userId: user.id,
              action: "role_change",
              entityType: "user",
              entityId: id,
              details: {
                newRole: role,
                targetUser: updatedUser.displayName || updatedUser.email || id,
              },
            });

            return { success: true, user: updatedUser };
          } catch (error) {
            throw new NotFoundError("User", id);
          }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            role: t.Union([t.Literal("admin"), t.Literal("member")]),
          }),
          detail: {
            tags: ["Admin"],
            summary: "Update user role (Admin only)",
            description:
              "Change a user's role between admin and member. Cannot change your own role.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Delete user (admin only)
       * DELETE /api/admin/users/:id
       * Permanently deletes a user and all their data
       */
      .delete(
        "/users/:id",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Don't allow deleting yourself
          if (id === user.id) {
            throw new BadRequestError("You cannot delete your own account");
          }

          // Get user details before deletion for logging
          const targetUser = await userService.findById(id);

          if (!targetUser) {
            throw new NotFoundError("User", id);
          }

          // Delete user (cascade will handle related data)
          await userService.deleteUser(id);

          // Log activity
          await db.insert(activityLog).values({
            userId: user.id,
            action: "user_delete",
            entityType: "user",
            entityId: id,
            details: {
              targetUser: targetUser.displayName || targetUser.email || id,
              targetRole: targetUser.role,
            },
          });

          return {
            success: true,
            message: "User deleted successfully",
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Admin"],
            summary: "Delete user (Admin only)",
            description:
              "Permanently delete a user and all their data. Cannot delete your own account.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Get activity log (admin only)
       * GET /api/admin/activity-log
       * Retrieve paginated activity log with optional filtering
       */
      .get(
        "/activity-log",
        async ({ query }) => {
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 50;
          const userId = query.userId as string | undefined;
          const action = query.action as string | undefined;

          // Build where clause
          const whereConditions = [];
          if (userId) {
            whereConditions.push(eq(activityLog.userId, userId));
          }
          if (action) {
            whereConditions.push(eq(activityLog.action, action));
          }

          // Query activity log
          const logs = await db.query.activityLog.findMany({
            where:
              whereConditions.length > 0 ? and(...whereConditions) : undefined,
            orderBy: [desc(activityLog.createdAt)],
            limit,
            offset: (page - 1) * limit,
            with: {
              user: {
                columns: {
                  id: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          });

          return {
            logs,
            page,
            limit,
            hasMore: logs.length === limit,
          };
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String()),
            userId: t.Optional(t.String()),
            action: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Admin"],
            summary: "Get activity log (Admin only)",
            description:
              "Retrieve paginated activity log with optional filtering by user or action.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Get media storage health (admin only)
       * GET /api/admin/media-storage/health
       * Check CDN health and media storage statistics
       */
      .get(
        "/media-storage/health",
        async () => {
          // Check CDN health and get storage statistics
          const cdnHealth = await mediaStorageService.verifyCDNHealth();
          const stats = await mediaStorageService.getStorageStats();

          return {
            success: true,
            architecture: "CDN-First",
            cdn: {
              healthy: cdnHealth.healthy,
              message: cdnHealth.message,
              url: process.env.CDN_URL,
            },
            statistics: {
              totalRecords: stats.totalRecords,
              withCdnUrl: stats.withCdnUrl,
              withoutCdnUrl: stats.withoutCdnUrl,
              healthPercentage:
                stats.totalRecords > 0
                  ? Math.round((stats.withCdnUrl / stats.totalRecords) * 100)
                  : 100,
            },
            warning:
              stats.withoutCdnUrl > 0
                ? `${stats.withoutCdnUrl} media assets without CDN URL`
                : null,
            note: "CDN-first architecture - all media uploaded directly to CDN",
          };
        },
        {
          detail: {
            tags: ["Admin"],
            summary: "Check media storage health (Admin only)",
            description:
              "Check CDN health and media storage statistics for CDN-first architecture.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  )

  /**
   * Import CDN assets to database
   * POST /api/admin/import-cdn-assets
   * Scans CDN and creates database records for missing assets
   * Special case: Accepts either JWT admin auth OR API key auth
   */
  .group("", (app) =>
    app
      .use(importCdnAssetsGuard)
      .post(
        "/import-cdn-assets",
        async (context) => {
          const { isSystemKey } = context as typeof context & {
            isSystemKey: boolean;
          };
          try {
            logger.info(
              { context: "Admin", authMethod: isSystemKey ? "API Key" : "JWT" },
              "Starting CDN asset import via API",
            );

            const result = await importCDNAssets();

            logger.info(
              { context: "Admin", result },
              "CDN asset import completed via API",
            );

            return {
              success: true,
              ...result,
              message: `Imported ${result.imported} assets, skipped ${result.skipped}, failed ${result.failed}`,
            };
          } catch (error) {
            logger.error({ context: "Admin", err: error }, "CDN import failed");
            throw new InternalServerError(
              error instanceof Error ? error.message : "Import failed",
            );
          }
        },
        {
          detail: {
            tags: ["Admin"],
            summary: "Import CDN assets to database (Admin only)",
            description:
              "Scans CDN for assets and creates database records for any missing assets. This fixes the issue where assets exist on CDN but not in database. Can be called with admin auth OR X-API-Key header.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // ============================================
      // API KEY MANAGEMENT ROUTES (Admin Only)
      // ============================================

      /**
       * Get all API keys across all users
       * GET /api/admin/api-keys
       */
      .get(
        "/api-keys",
        async ({ query }) => {
          const apiKeyService = new ApiKeyService();
          const result = await apiKeyService.getAllApiKeys({
            userId: query.userId,
            status: query.status as any,
            search: query.search,
            limit: query.limit ? parseInt(query.limit) : undefined,
            offset: query.offset ? parseInt(query.offset) : undefined,
          });

          return {
            success: true,
            keys: result.keys,
            total: result.total,
          };
        },
        {
          query: t.Object({
            userId: t.Optional(t.String()),
            status: t.Optional(
              t.Union([
                t.Literal("active"),
                t.Literal("revoked"),
                t.Literal("expired"),
                t.Literal("all"),
              ]),
            ),
            search: t.Optional(t.String()),
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Get all API keys (Admin only)",
            description:
              "Get all API keys across all users with optional filtering and search. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Get API key statistics
       * GET /api/admin/api-keys/stats
       */
      .get(
        "/api-keys/stats",
        async () => {
          const apiKeyService = new ApiKeyService();
          const stats = await apiKeyService.getSystemStats();

          return {
            success: true,
            stats,
          };
        },
        {
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Get API key statistics (Admin only)",
            description:
              "Get system-wide API key statistics including counts and usage. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Generate API key for a user
       * POST /api/admin/users/:userId/api-keys
       */
      .post(
        "/users/:userId/api-keys",
        async (context) => {
          const { user, params, body } = context as typeof context & {
            user: AuthUser;
          };
          const apiKeyService = new ApiKeyService();

          const { key, keyId } = await apiKeyService.adminGenerateApiKey(
            params.userId,
            {
              name: body.name,
              permissions: body.permissions,
              rateLimit: body.rateLimit,
              expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
            },
          );

          // Get user details for logging
          const targetUser = await userService.findById(params.userId);

          // Log activity
          await db.insert(activityLog).values({
            userId: user.id,
            action: "api_key_generated_for_user",
            entityType: "api_key",
            entityId: keyId,
            details: {
              targetUserId: params.userId,
              targetUserName:
                targetUser?.displayName || targetUser?.email || "Unknown",
              keyName: body.name,
              generatedBy: "admin",
            },
          });

          return {
            success: true,
            key, // ONLY shown once!
            keyId,
            prefix: key.substring(0, 16),
            userId: params.userId,
            message: "Save this key securely and deliver to user.",
          };
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          body: t.Object({
            name: t.String({ minLength: 1, maxLength: 255 }),
            permissions: t.Optional(t.Array(t.String())),
            expiresAt: t.Optional(t.String({ format: "date-time" })),
            rateLimit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Generate API key for user (Admin only)",
            description:
              "Generate a new API key for any user. The key is only shown once. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Get API keys for a specific user
       * GET /api/admin/users/:userId/api-keys
       */
      .get(
        "/users/:userId/api-keys",
        async ({ params }) => {
          const apiKeyService = new ApiKeyService();
          const result = await apiKeyService.getAllApiKeys({
            userId: params.userId,
          });

          // Get user details
          const targetUser = await userService.findById(params.userId);

          return {
            success: true,
            keys: result.keys,
            user: {
              id: params.userId,
              displayName: targetUser?.displayName || null,
              email: targetUser?.email || null,
            },
          };
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Get user's API keys (Admin only)",
            description: "Get all API keys for a specific user. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Get API key details
       * GET /api/admin/api-keys/:keyId
       */
      .get(
        "/api-keys/:keyId",
        async ({ params }) => {
          const apiKeyService = new ApiKeyService();
          const key = await apiKeyService.adminGetApiKey(params.keyId);

          if (!key) {
            throw new NotFoundError("API key", params.keyId);
          }

          return {
            success: true,
            key,
          };
        },
        {
          params: t.Object({
            keyId: t.String(),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Get API key details (Admin only)",
            description:
              "Get detailed information about a specific API key. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Revoke API key
       * DELETE /api/admin/api-keys/:keyId/revoke
       */
      .delete(
        "/api-keys/:keyId/revoke",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const apiKeyService = new ApiKeyService();

          // Get key details before revoking
          const keyDetails = await apiKeyService.adminGetApiKey(params.keyId);

          if (!keyDetails) {
            throw new NotFoundError("API key", params.keyId);
          }

          // Revoke the key
          const result = await apiKeyService.adminRevokeApiKey(params.keyId);

          // Log activity
          await db.insert(activityLog).values({
            userId: user.id,
            action: "api_key_revoked_by_admin",
            entityType: "api_key",
            entityId: params.keyId,
            details: {
              keyOwnerUserId: keyDetails.userId,
              keyOwnerName:
                keyDetails.userName || keyDetails.userEmail || "Unknown",
              keyName: keyDetails.name,
            },
          });

          return {
            success: true,
            message: "API key revoked successfully",
            key: {
              id: result.id,
              userId: result.userId,
              name: result.name,
              revokedAt: result.revokedAt.toISOString(),
            },
          };
        },
        {
          params: t.Object({
            keyId: t.String(),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Revoke API key (Admin only)",
            description:
              "Revoke any API key. The key will stop working immediately. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Delete API key permanently
       * DELETE /api/admin/api-keys/:keyId
       */
      .delete(
        "/api-keys/:keyId",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const apiKeyService = new ApiKeyService();

          // Get key details before deleting
          const keyDetails = await apiKeyService.adminGetApiKey(params.keyId);

          if (!keyDetails) {
            throw new NotFoundError("API key", params.keyId);
          }

          // Delete the key
          await apiKeyService.adminDeleteApiKey(params.keyId);

          // Log activity
          await db.insert(activityLog).values({
            userId: user.id,
            action: "api_key_deleted_by_admin",
            entityType: "api_key",
            entityId: params.keyId,
            details: {
              keyOwnerUserId: keyDetails.userId,
              keyOwnerName:
                keyDetails.userName || keyDetails.userEmail || "Unknown",
              keyName: keyDetails.name,
            },
          });

          return {
            success: true,
            message: "API key deleted permanently",
          };
        },
        {
          params: t.Object({
            keyId: t.String(),
          }),
          detail: {
            tags: ["Admin", "API Keys"],
            summary: "Delete API key (Admin only)",
            description:
              "Permanently delete any API key. This action cannot be undone. Admin only.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
