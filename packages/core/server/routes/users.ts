/**
 * User Profile Routes
 * Manage user profiles and admin dashboard
 */

import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db, users } from "../db";

export const usersRoutes = new Elysia({ prefix: "/users" })
  // Get current user profile (creates if doesn't exist)
  .get(
    "/me",
    async ({ query }) => {
      const { sessionId } = query;

      if (!sessionId) {
        return { user: null };
      }

      // For simple auth, use sessionId as identifier
      // Find or create user
      let user = await db.query.users.findFirst({
        where: eq(users.privyUserId, sessionId),
      });

      if (!user) {
        // Create new user on first access
        const [newUser] = await db
          .insert(users)
          .values({
            privyUserId: sessionId,
            role: "admin", // Everyone with access is admin
          })
          .returning();
        user = newUser;
      }

      return { user };
    },
    {
      query: t.Object({
        sessionId: t.String(),
      }),
      detail: {
        tags: ["Users"],
        summary: "Get current user profile",
        description: "Gets the current user profile, creates if doesn't exist",
      },
    }
  )

  // Update/Complete user profile
  .post(
    "/complete-profile",
    async ({ body }) => {
      const { sessionId, displayName, email, discordUsername } = body;

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.privyUserId, sessionId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Update profile (only set profileCompleted if not already set)
      const updateData: any = {
        displayName,
        email,
        discordUsername,
        updatedAt: new Date(),
      };

      // Only set profileCompleted timestamp on first completion
      if (!user.profileCompleted) {
        updateData.profileCompleted = new Date();
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      return { user: updatedUser };
    },
    {
      body: t.Object({
        sessionId: t.String(),
        displayName: t.String(),
        email: t.String(),
        discordUsername: t.String(),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update user profile",
        description: "Save or update user profile information",
      },
    }
  )

  // Get all users (admin dashboard)
  .get(
    "/",
    async () => {
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      return { users: allUsers };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get all users",
        description: "Get all users for admin dashboard",
      },
    }
  );
