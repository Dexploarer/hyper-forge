/**
 * Admin Routes
 * Routes for admin-only functionality like role management and activity logs
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { eq, desc, and } from "drizzle-orm";
import { db, activityLog } from "../db";
import { requireAdmin } from "../middleware/requireAdmin";
import { userService } from "../services/UserService";
import { MediaStorageService } from "../services/MediaStorageService";
import { importCDNAssets } from "../scripts/import-cdn-assets";

const mediaStorageService = new MediaStorageService();

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  /**
   * Update user role (admin only)
   * PUT /api/admin/users/:id/role
   * Changes a user's role between admin and member
   */
  .put(
    "/users/:id/role",
    async ({ request, headers, params, body }) => {
      const adminResult = await requireAdmin({ request, headers });

      // If admin check failed, return the error response
      if (adminResult instanceof Response) {
        return adminResult;
      }

      const { user: adminUser } = adminResult;
      const { id } = params;
      const { role } = body as { role: string };

      // Validate role
      if (!["admin", "member"].includes(role)) {
        return new Response(
          JSON.stringify({
            error: "Invalid role",
            message: 'Role must be either "admin" or "member"',
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Don't allow demoting yourself
      if (id === adminUser.id) {
        return new Response(
          JSON.stringify({
            error: "Cannot modify own role",
            message: "You cannot change your own role",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Update user role
      try {
        const updatedUser = await userService.updateRole(
          id,
          role as "admin" | "member",
        );

        // Log activity
        await db.insert(activityLog).values({
          userId: adminUser.id,
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
        return new Response(
          JSON.stringify({
            error: "User not found",
            message: "The specified user does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
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
    async ({ request, headers, params }) => {
      const adminResult = await requireAdmin({ request, headers });

      // If admin check failed, return the error response
      if (adminResult instanceof Response) {
        return adminResult;
      }

      const { user: adminUser } = adminResult;
      const { id } = params;

      // Don't allow deleting yourself
      if (id === adminUser.id) {
        return new Response(
          JSON.stringify({
            error: "Cannot delete own account",
            message: "You cannot delete your own account",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      try {
        // Get user details before deletion for logging
        const targetUser = await userService.findById(id);

        if (!targetUser) {
          return new Response(
            JSON.stringify({
              error: "User not found",
              message: "The specified user does not exist",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Delete user (cascade will handle related data)
        await userService.deleteUser(id);

        // Log activity
        await db.insert(activityLog).values({
          userId: adminUser.id,
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
      } catch (error) {
        logger.error({ err: error }, "[AdminRoutes] Failed to delete user:");
        return new Response(
          JSON.stringify({
            error: "Delete failed",
            message: "Failed to delete user",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
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
    async ({ request, headers, query }) => {
      const adminResult = await requireAdmin({ request, headers });

      // If admin check failed, return the error response
      if (adminResult instanceof Response) {
        return adminResult;
      }

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
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
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
    async ({ request, headers }) => {
      const adminResult = await requireAdmin({ request, headers });

      if (adminResult instanceof Response) {
        return adminResult;
      }

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
  )

  /**
   * Import CDN assets to database
   * POST /api/admin/import-cdn-assets
   * Scans CDN and creates database records for missing assets
   */
  .post(
    "/import-cdn-assets",
    async ({ request, headers, set }) => {
      // Allow either admin auth OR system API key for one-time import
      const apiKey = headers["x-api-key"];
      const isSystemKey = apiKey === process.env.CDN_API_KEY;

      if (!isSystemKey) {
        const adminResult = await requireAdmin({ request, headers });

        if (adminResult instanceof Response) {
          return adminResult;
        }
      }

      try {
        logger.info({ context: "Admin" }, "Starting CDN asset import via API");

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
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Import failed",
        };
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
  );
