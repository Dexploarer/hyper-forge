/**
 * User Profile Routes
 * Manage user profiles and admin dashboard
 */

import { Elysia, t } from "elysia";
import { requireAuthGuard, requireAdminGuard } from "../plugins/auth.plugin";
import { userService } from "../services/UserService";
import { ActivityLogService } from "../services/ActivityLogService";
import type { AuthUser } from "../types/auth";

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  // Regular authenticated user routes
  .group("", (app) =>
    app
      .use(requireAuthGuard)
      // Get current user profile (requires authentication)
      .get(
        "/me",
        async (context) => {
          const { user } = context as typeof context & { user: AuthUser };
          return { user };
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get current user profile",
            description:
              "Gets the current authenticated user profile. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update/Complete user profile (requires authentication)
      .post(
        "/complete-profile",
        async (context) => {
          const { user, body, request } = context as typeof context & {
            user: AuthUser;
          };
          const { displayName, email, discordUsername } = body;

          // Update profile (only set profileCompleted if not already set)
          const markCompleted = !user.profileCompleted;

          // Build update object - only include discordUsername if provided
          const updateData: {
            displayName: string;
            email: string;
            discordUsername?: string;
          } = {
            displayName,
            email,
          };
          if (discordUsername !== undefined) {
            updateData.discordUsername = discordUsername;
          }

          const updatedUser = await userService.updateProfile(
            user.id,
            updateData,
            markCompleted,
          );

          // Log profile update
          const changes = Object.keys(updateData);
          if (markCompleted) changes.push("profileCompleted");
          await ActivityLogService.logProfileUpdated({
            userId: user.id,
            changes,
            request,
          });

          return { user: updatedUser };
        },
        {
          body: t.Object({
            displayName: t.String(),
            email: t.String(),
            discordUsername: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update user profile",
            description:
              "Save or update user profile information. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update user settings (requires authentication)
      .post(
        "/settings",
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const { settings } = body;

          const updatedUser = await userService.updateSettings(
            user.id,
            settings,
          );

          return { user: updatedUser };
        },
        {
          body: t.Object({
            // User settings is a key-value map with unknown structure
            settings: t.Record(t.String(), t.Unknown()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update user settings",
            description:
              "Update user preferences and settings. Settings are merged with existing values. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  )

  // Admin-only routes
  .group("", (app) =>
    app.use(requireAdminGuard).get(
      "/",
      async ({ query }) => {
        // Build filters from query params
        const filters: {
          role?: "admin" | "member";
          profileCompleted?: boolean;
          search?: string;
        } = {};

        if (query.role) {
          filters.role = query.role as "admin" | "member";
        }

        if (query.profileCompleted !== undefined) {
          filters.profileCompleted = query.profileCompleted === "true";
        }

        if (query.search) {
          filters.search = query.search;
        }

        const allUsers = await userService.getAllUsers(filters);

        return { users: allUsers };
      },
      {
        query: t.Object({
          role: t.Optional(t.Union([t.Literal("admin"), t.Literal("member")])),
          profileCompleted: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Users"],
          summary: "Get all users (Admin only)",
          description:
            "Get all users for admin dashboard with optional filtering by role, profile completion, and search (name/email/privyId). Requires admin role.",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  );
