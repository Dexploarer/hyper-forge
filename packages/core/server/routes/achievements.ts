/**
 * Achievements Routes
 * Manage user achievements and medals
 */

import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { achievementService } from "../services/AchievementService";

export const achievementsRoutes = new Elysia({ prefix: "/api/achievements" })
  // Get all available achievements
  .get(
    "/",
    async () => {
      const allAchievements = await achievementService.getAllAchievements();
      return { achievements: allAchievements };
    },
    {
      detail: {
        tags: ["Achievements"],
        summary: "Get all achievements",
        description: "Get a list of all available achievements in the system.",
      },
    },
  )

  // Get current user's achievements
  .get(
    "/me",
    async ({ request, headers }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const summary = await achievementService.getUserAchievementSummary(
        user.id,
      );

      return summary;
    },
    {
      detail: {
        tags: ["Achievements"],
        summary: "Get user achievements",
        description:
          "Get the current user's achievements, medals, and progress. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Get specific user's achievements (admin only, or self)
  .get(
    "/user/:userId",
    async ({ request, headers, params }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { userId } = params;

      // Users can only view their own achievements unless they're admin
      if (authUser.id !== userId && authUser.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
        });
      }

      const summary =
        await achievementService.getUserAchievementSummary(userId);

      return summary;
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Achievements"],
        summary: "Get user achievements by ID",
        description:
          "Get achievements for a specific user. Users can only view their own achievements unless admin. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Award an achievement to a user (admin only, or system)
  .post(
    "/award",
    async ({ request, headers, body }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { achievementCode, userId, progress, metadata } = body;

      // Users can only award achievements to themselves unless they're admin
      const targetUserId = userId || authUser.id;
      if (targetUserId !== authUser.id && authUser.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
        });
      }

      const result = await achievementService.awardAchievement(
        targetUserId,
        achievementCode,
        progress,
        metadata,
      );

      return result;
    },
    {
      body: t.Object({
        achievementCode: t.String(),
        userId: t.Optional(t.String()),
        progress: t.Optional(t.Number()),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["Achievements"],
        summary: "Award achievement",
        description:
          "Award an achievement to a user. Users can award to themselves, admins can award to anyone. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // Update progress for a progressive achievement
  .post(
    "/progress",
    async ({ request, headers, body }) => {
      const authResult = await requireAuth({ request, headers });

      // If auth failed, return the error response
      if (authResult instanceof Response) {
        return authResult;
      }

      const { user: authUser } = authResult;
      const { achievementCode, progress, metadata } = body;

      const result = await achievementService.updateProgress(
        authUser.id,
        achievementCode,
        progress,
        metadata,
      );

      return result;
    },
    {
      body: t.Object({
        achievementCode: t.String(),
        progress: t.Number(),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["Achievements"],
        summary: "Update achievement progress",
        description:
          "Update progress for a progressive achievement. Only updates for the current user. Requires Privy JWT.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
