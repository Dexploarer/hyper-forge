/**
 * User Profile Routes
 * Manage user profiles and admin dashboard
 */

import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { userService } from "../services/UserService";

export const usersRoutes = new Elysia({ prefix: "/api/users" })
  // Get current user profile (requires authentication)
  .get(
    "/me",
    async ({ request, headers }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
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
    async ({ request, headers, body }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { displayName, email, discordUsername } = body;

      // Update profile (only set profileCompleted if not already set)
      const markCompleted = !authUser.profileCompleted;

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
        authUser.id,
        updateData,
        markCompleted,
      );

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

  // Get all users (admin only)
  .get(
    "/",
    async ({ request, headers, query }) => {
      const adminResult = await requireAdmin({ request, headers });

      // If admin check failed, return the error response
      if (adminResult instanceof Response) {
        return adminResult;
      }

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
  )

  // Update user settings (requires authentication)
  .post(
    "/settings",
    async ({ request, headers, body }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { settings } = body;

      const updatedUser = await userService.updateSettings(
        authUser.id,
        settings,
      );

      return { user: updatedUser };
    },
    {
      body: t.Object({
        settings: t.Record(t.String(), t.Any()),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update user settings",
        description:
          "Update user preferences and settings. Settings are merged with existing values. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
