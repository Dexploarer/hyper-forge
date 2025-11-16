/**
 * Achievements Routes
 * Manage user achievements and medals
 */

import { Elysia, t } from "elysia";
import { requireAuthGuard } from "../plugins/auth.plugin";
import { achievementService } from "../services/AchievementService";
import type { AuthUser } from "../types/auth";

export const achievementsRoutes = new Elysia({ prefix: "/api/achievements" })
  // Get all available achievements (public route)
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

  // Authenticated routes
  .group("", (app) =>
    app
      .use(requireAuthGuard)
      // Get current user's achievements
      .get(
        "/me",
        async (context) => {
          const { user } = context as typeof context & { user: AuthUser };
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
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { userId } = params;

          // Users can only view their own achievements unless they're admin
          if (user.id !== userId && user.role !== "admin") {
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
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const { achievementCode, userId, progress, metadata } = body;

          // Users can only award achievements to themselves unless they're admin
          const targetUserId = userId || user.id;
          if (targetUserId !== user.id && user.role !== "admin") {
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
            // Optional metadata for achievement context (custom data per achievement type)
            metadata: t.Optional(t.Record(t.String(), t.Unknown())),
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
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const { achievementCode, progress, metadata } = body;

          const result = await achievementService.updateProgress(
            user.id,
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
            // Optional metadata for progress tracking (custom data per achievement type)
            metadata: t.Optional(t.Record(t.String(), t.Unknown())),
          }),
          detail: {
            tags: ["Achievements"],
            summary: "Update achievement progress",
            description:
              "Update progress for a progressive achievement. Only updates for the current user. Requires Privy JWT.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
