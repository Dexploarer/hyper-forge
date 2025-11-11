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
    async ({ request }) => {
      const authResult = await requireAuth({ request });

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
    async ({ request, body }) => {
      const authResult = await requireAuth({ request });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { displayName, email, discordUsername } = body;

      // Update profile (only set profileCompleted if not already set)
      const markCompleted = !authUser.profileCompleted;

      const updatedUser = await userService.updateProfile(
        authUser.id,
        { displayName, email, discordUsername },
        markCompleted,
      );

      return { user: updatedUser };
    },
    {
      body: t.Object({
        displayName: t.String(),
        email: t.String(),
        discordUsername: t.String(),
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
    async ({ request }) => {
      const adminResult = await requireAdmin({ request });

      // If admin check failed, return the error response
      if (adminResult instanceof Response) {
        return adminResult;
      }

      const allUsers = await userService.getAllUsers();

      return { users: allUsers };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get all users (Admin only)",
        description: "Get all users for admin dashboard. Requires admin role.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
