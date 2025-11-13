/**
 * Debug CDN Route
 * CDN health check and storage statistics endpoint
 * Replaces legacy local filesystem debug endpoint
 */

import { Elysia } from "elysia";
import { db } from "../db";
import { assets, mediaAssets } from "../db/schema";
import { sql } from "drizzle-orm";

export const debugStorageRoute = new Elysia({ prefix: "/api/debug" })
  .get("/cdn-health", async () => {
    const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
    const CDN_API_KEY = process.env.CDN_API_KEY;

    // Check CDN health
    let cdnHealthy = false;
    let cdnError = null;

    try {
      const response = await fetch(`${CDN_URL}/api/health`);
      cdnHealthy = response.ok;
      if (!response.ok) {
        cdnError = `CDN returned status ${response.status}`;
      }
    } catch (error) {
      cdnError = error instanceof Error ? error.message : "Unknown error";
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
      // Count assets
      const assetCounts = await db
        .select({
          total: sql<number>`count(*)::int`,
          withCdnUrl: sql<number>`count(*) FILTER (WHERE cdn_url IS NOT NULL)::int`,
        })
        .from(assets);

      if (assetCounts[0]) {
        assetStats = {
          total: assetCounts[0].total,
          withCdnUrl: assetCounts[0].withCdnUrl,
          withoutCdnUrl: assetCounts[0].total - assetCounts[0].withCdnUrl,
        };
      }

      // Count media assets
      const mediaCounts = await db
        .select({
          total: sql<number>`count(*)::int`,
          withCdnUrl: sql<number>`count(*) FILTER (WHERE cdn_url IS NOT NULL)::int`,
        })
        .from(mediaAssets);

      if (mediaCounts[0]) {
        mediaStats = {
          total: mediaCounts[0].total,
          withCdnUrl: mediaCounts[0].withCdnUrl,
          withoutCdnUrl: mediaCounts[0].total - mediaCounts[0].withCdnUrl,
        };
      }
    } catch (error) {
      console.error("[Debug] Failed to get database stats:", error);
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
        assetsDir: process.env.ASSETS_DIR
          ? "DEPRECATED - Not used in CDN-first mode"
          : "Not configured (correct for CDN-first)",
      },
      statistics: {
        assets: assetStats,
        media: mediaStats,
        total: {
          all: assetStats.total + mediaStats.total,
          withCdnUrl: assetStats.withCdnUrl + mediaStats.withCdnUrl,
          withoutCdnUrl: assetStats.withoutCdnUrl + mediaStats.withoutCdnUrl,
        },
      },
      webhook: {
        enabled: process.env.CDN_WEBHOOK_ENABLED === "true",
        configured: !!process.env.WEBHOOK_SECRET,
      },
    };
  })
  .get("/storage-info", async () => {
    // Legacy endpoint - redirects to CDN health
    return {
      message:
        "This endpoint is deprecated. Asset-Forge now uses CDN-first architecture.",
      redirect: "/api/debug/cdn-health",
      info: "Local gdd-assets storage is no longer used. All assets are stored on CDN.",
    };
  });
