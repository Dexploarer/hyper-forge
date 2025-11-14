/**
 * Public Profile Routes
 * Public endpoints for viewing user profiles
 */

import { Elysia, t } from "elysia";
import { optionalAuth } from "../middleware/auth";
import { userService } from "../services/UserService";
import { projectService } from "../services/ProjectService";
import { db } from "../db/db";
import { assets } from "../db/schema/assets.schema";
import {
  userAchievements,
  achievements,
} from "../db/schema/achievements.schema";
import { eq, and } from "drizzle-orm";

export const publicProfilesRoutes = new Elysia({ prefix: "/api/public" })
  // Get public profile info
  .get(
    "/users/:userId/profile",
    async ({ params, request, headers, set }) => {
      // Use optional auth to detect if user is viewing their own profile
      const authContext = await optionalAuth({
        request,
        headers,
      });
      const isOwnProfile = authContext.user?.id === params.userId;

      const profile = await userService.getPublicProfile(params.userId);

      if (!profile) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Get user stats
      const stats = await userService.getUserStats(params.userId);

      return {
        profile: {
          ...profile,
          isOwnProfile,
        },
        stats,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Public Profiles"],
        summary: "Get user public profile",
        description:
          "Get public profile information for a user. No authentication required, but authenticated users will see if it's their own profile.",
      },
    },
  )

  // Get public assets for a user
  .get(
    "/users/:userId/assets",
    async ({ params, query, request, headers, set }) => {
      const authContext = await optionalAuth({ request, headers });
      const isOwnProfile = authContext.user?.id === params.userId;

      // Verify user exists
      const profile = await userService.getPublicProfile(params.userId);
      if (!profile) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Get user's assets
      const userAssets = await db.query.assets.findMany({
        where: eq(assets.ownerId, params.userId),
      });

      // Filter by visibility (if not own profile, only show public assets)
      const filteredAssets = isOwnProfile
        ? userAssets
        : userAssets.filter((a) => a.visibility === "public");

      // Apply optional type filter
      const finalAssets = query.type
        ? filteredAssets.filter((a) => a.type === query.type)
        : filteredAssets;

      return {
        assets: finalAssets,
        total: finalAssets.length,
        isOwnProfile,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      query: t.Object({
        type: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Public Profiles"],
        summary: "Get user's public assets",
        description:
          "Get public assets for a user. Authenticated users viewing their own profile will see all assets.",
      },
    },
  )

  // Get public projects for a user
  .get(
    "/users/:userId/projects",
    async ({ params, request, headers, set }) => {
      const authContext = await optionalAuth({ request, headers });
      const isOwnProfile = authContext.user?.id === params.userId;

      // Verify user exists
      const profile = await userService.getPublicProfile(params.userId);
      if (!profile) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Get projects based on visibility
      const projects = isOwnProfile
        ? await projectService.getUserProjects(params.userId, false)
        : await projectService.getPublicProjects(params.userId);

      return {
        projects,
        total: projects.length,
        isOwnProfile,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Public Profiles"],
        summary: "Get user's public projects",
        description:
          "Get public projects for a user. Authenticated users viewing their own profile will see all active projects.",
      },
    },
  )

  // Get user's achievements
  .get(
    "/users/:userId/achievements",
    async ({ params, request, headers, set }) => {
      const authContext = await optionalAuth({ request, headers });
      const isOwnProfile = authContext.user?.id === params.userId;

      // Verify user exists
      const profile = await userService.getPublicProfile(params.userId);
      if (!profile) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Get user achievements with full achievement details
      const userAchievementsData = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, params.userId),
        with: {
          achievementId: true,
        },
      });

      // Get full achievement details for each
      const achievementsWithDetails = await Promise.all(
        userAchievementsData.map(async (ua) => {
          const achievement = await db.query.achievements.findFirst({
            where: eq(achievements.id, ua.achievementId),
          });
          return {
            ...ua,
            achievement,
          };
        }),
      );

      return {
        achievements: achievementsWithDetails,
        total: achievementsWithDetails.length,
        isOwnProfile,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Public Profiles"],
        summary: "Get user's achievements",
        description: "Get achievements earned by a user. Visible to everyone.",
      },
    },
  )

  // Get user statistics
  .get(
    "/users/:userId/stats",
    async ({ params, request, headers, set }) => {
      const authContext = await optionalAuth({ request, headers });
      const isOwnProfile = authContext.user?.id === params.userId;

      // Verify user exists
      const profile = await userService.getPublicProfile(params.userId);
      if (!profile) {
        set.status = 404;
        return { error: "User not found" };
      }

      const stats = await userService.getUserStats(params.userId);

      return {
        stats,
        isOwnProfile,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Public Profiles"],
        summary: "Get user statistics",
        description:
          "Get aggregated statistics for a user (asset counts, project counts, achievements).",
      },
    },
  );
