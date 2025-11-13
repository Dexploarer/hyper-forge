/**
 * Admin Routes
 * Routes for admin-only functionality like role management and activity logs
 */

import { Elysia, t } from "elysia";
import { eq, desc, and } from "drizzle-orm";
import { db, activityLog } from "../db";
import { requireAdmin } from "../middleware/requireAdmin";
import { userService } from "../services/UserService";
import { MediaStorageService } from "../services/MediaStorageService";

const mediaStorageService = new MediaStorageService();

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  /**
   * Update user role (admin only)
   * PUT /api/admin/users/:id/role
   * Changes a user's role between admin and member
   */
  .put(
    "/users/:id/role",
    async ({ request, params, body }) => {
      const adminResult = await requireAdmin({ request });

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
    async ({ request, params }) => {
      const adminResult = await requireAdmin({ request });

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
        console.error("[AdminRoutes] Failed to delete user:", error);
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
    async ({ request, query }) => {
      const adminResult = await requireAdmin({ request });

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
   * Check for orphaned database records and storage issues
   */
  .get(
    "/media-storage/health",
    async ({ request }) => {
      const adminResult = await requireAdmin({ request });

      if (adminResult instanceof Response) {
        return adminResult;
      }

      const health = await mediaStorageService.verifyStorageHealth();

      return {
        success: true,
        health: {
          totalRecords: health.totalRecords,
          validFiles: health.validFiles,
          orphanedRecords: health.orphanedRecords,
          healthPercentage:
            health.totalRecords > 0
              ? Math.round((health.validFiles / health.totalRecords) * 100)
              : 100,
        },
        warning:
          health.orphanedRecords > 0
            ? `${health.orphanedRecords} orphaned records found. Consider running cleanup.`
            : null,
        volumeConfigured: !!process.env.RAILWAY_VOLUME_MOUNT_PATH,
        volumeWarning: !process.env.RAILWAY_VOLUME_MOUNT_PATH
          ? "Railway volume not detected. Media files may be lost on deployment. See RAILWAY_VOLUME_SETUP.md"
          : null,
      };
    },
    {
      detail: {
        tags: ["Admin"],
        summary: "Check media storage health (Admin only)",
        description:
          "Verify media storage integrity and detect orphaned database records without corresponding files.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Cleanup orphaned media records (admin only)
   * POST /api/admin/media-storage/cleanup
   * Remove database records for files that don't exist
   */
  .post(
    "/media-storage/cleanup",
    async ({ request }) => {
      const adminResult = await requireAdmin({ request });

      if (adminResult instanceof Response) {
        return adminResult;
      }

      const { user: adminUser } = adminResult;

      console.log(
        `[AdminRoutes] Starting media storage cleanup by admin: ${adminUser.id}`,
      );

      const result = await mediaStorageService.cleanupOrphanedRecords();

      // Log activity
      await db.insert(activityLog).values({
        userId: adminUser.id,
        action: "media_cleanup",
        entityType: "system",
        entityId: "media-storage",
        details: {
          removedCount: result.removedCount,
          removedIds: result.removedIds,
        },
      });

      return {
        success: true,
        message: `Removed ${result.removedCount} orphaned media records`,
        removedCount: result.removedCount,
      };
    },
    {
      detail: {
        tags: ["Admin"],
        summary: "Cleanup orphaned media records (Admin only)",
        description:
          "Remove database records for media files that don't exist on disk. Use after checking health status.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
