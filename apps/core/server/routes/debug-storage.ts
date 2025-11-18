/**
 * Debug CDN Route
 * CDN health check and storage statistics endpoint
 * Replaces legacy local filesystem debug endpoint
 *
 * SECURITY:
 * - /cdn-health: Public endpoint for health checks and monitoring
 * - /storage-info: Admin-only (deprecated endpoint)
 */

import { Elysia } from "elysia";
import { logger } from "../utils/logger";
import { db } from "../db";
import { assets, mediaAssets } from "../db/schema";
import { count, isNotNull } from "drizzle-orm";
import { requireAdminGuard } from "../plugins/auth.plugin";
import type { AuthUser } from "../types/auth";

export const debugStorageRoute = new Elysia({ prefix: "/api/debug" })
  // CDN health endpoint is public (for monitoring/health checks)
  .get(
    "/cdn-health",
    async (context) => {
      const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
      const CDN_API_KEY = process.env.CDN_API_KEY;

      logger.info(
        { context: "Debug" },
        "Checking CDN health",
      );

      // Check CDN health
      let cdnHealthy = false;
      let cdnError = null;

      try {
        const response = await fetch(`${CDN_URL}/health/ready`);
        cdnHealthy = response.ok;
        if (!response.ok) {
          cdnError = `CDN returned status ${response.status}`;
        }
      } catch (error) {
        cdnError = error instanceof Error ? error.message : "Unknown error";
        logger.error(
          { err: error, context: "Debug" },
          "Failed to check CDN health",
        );
      }

      // Get database statistics
      let assetStats = {
        total: 0,
        withCdnUrl: 0,
        withoutCdnUrl: 0,
      };

      let mediaStats = {
        total: 0,
        withCdnUrl: 0,
        withoutCdnUrl: 0,
      };

      try {
        // Count all assets using modern Drizzle count() API
        const [totalAssetsResult] = await db
          .select({ count: count() })
          .from(assets);
        const totalAssets = Number(totalAssetsResult.count);

        // Count assets with CDN URL using Drizzle isNotNull operator
        const [assetsWithCdnResult] = await db
          .select({ count: count() })
          .from(assets)
          .where(isNotNull(assets.cdnUrl));
        const assetsWithCdnCount = Number(assetsWithCdnResult.count);

        assetStats = {
          total: totalAssets,
          withCdnUrl: assetsWithCdnCount,
          withoutCdnUrl: totalAssets - assetsWithCdnCount,
        };

        // Count all media assets using modern Drizzle count() API
        const [totalMediaResult] = await db
          .select({ count: count() })
          .from(mediaAssets);
        const totalMedia = Number(totalMediaResult.count);

        // Count media assets with CDN URL using Drizzle isNotNull operator
        const [mediaWithCdnResult] = await db
          .select({ count: count() })
          .from(mediaAssets)
          .where(isNotNull(mediaAssets.cdnUrl));
        const mediaWithCdnCount = Number(mediaWithCdnResult.count);

        mediaStats = {
          total: totalMedia,
          withCdnUrl: mediaWithCdnCount,
          withoutCdnUrl: totalMedia - mediaWithCdnCount,
        };

        logger.info(
          {
            context: "Debug",
            assetStats,
            mediaStats,
          },
          "Retrieved database statistics",
        );
      } catch (error) {
        logger.error(
          { err: error, context: "Debug" },
          "Failed to get database stats",
        );
      }

      return {
        architecture: "CDN-First",
        cdn: {
          url: CDN_URL,
          healthy: cdnHealthy,
          error: cdnError,
          configured: !!CDN_API_KEY,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          isProduction: process.env.NODE_ENV === "production",
          isRailway: !!process.env.RAILWAY_ENVIRONMENT,
          railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || null,
        },
        storage: {
          mode: "CDN-First",
        },
        statistics: {
          assets: assetStats,
          media: mediaStats,
          total: {
            all: assetStats.total + mediaStats.total,
            withCdnUrl: assetStats.withCdnUrl + mediaStats.withCdnUrl,
            withoutCdnUrl:
              assetStats.withoutCdnUrl + mediaStats.withoutCdnUrl,
          },
        },
        webhook: {
          enabled: process.env.CDN_WEBHOOK_ENABLED === "true",
          configured: !!process.env.WEBHOOK_SECRET,
        },
      };
    },
    {
      detail: {
        tags: ["Debug"],
        summary: "Check CDN health and storage statistics (Public)",
        description:
          "Returns CDN health status, database statistics, and storage architecture information. Used for monitoring and debugging the CDN-first storage system. Public endpoint for health checks.",
      },
    },
  )
  // Admin-only routes
  .group("", (app) =>
    app
      .use(requireAdminGuard)
      .get(
        "/storage-info",
        async (context) => {
          const { user } = context as typeof context & { user: AuthUser };

          logger.info(
            { userId: user.id, context: "Debug" },
            "Admin accessing deprecated storage info endpoint",
          );

          return {
            message:
              "This endpoint is deprecated. Asset-Forge now uses CDN-first architecture.",
            redirect: "/api/debug/cdn-health",
            info: "All assets are stored on CDN.",
          };
        },
        {
          detail: {
            tags: ["Debug"],
            summary: "Storage info endpoint (Admin only)",
            description:
              "Redirects to /api/debug/cdn-health. Asset-Forge uses CDN-first architecture. Requires admin authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
