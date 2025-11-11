/**
 * Admin Routes
 * Routes for admin-only functionality like role management and activity logs
 */

import { Elysia, t } from "elysia";
import { eq, desc, and } from "drizzle-orm";
import { db, activityLog } from "../db";
import { requireAdmin } from "../middleware/requireAdmin";
import { userService } from "../services/UserService";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  // Update user role (admin only)
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
        role: t.String(),
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

  // Get activity log (admin only)
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
  );
