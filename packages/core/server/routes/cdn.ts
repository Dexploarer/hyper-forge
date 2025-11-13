/**
 * CDN Routes
 * Endpoints for publishing assets to the CDN
 */

import { Elysia, t } from "elysia";
import { CDNPublishService } from "../services/CDNPublishService";
import { requireAuth } from "../middleware/auth";
import { getAssetFromPath, canPublishAsset } from "../middleware/assetAuth";

export const createCDNRoutes = (assetsDir: string, cdnUrl: string) => {
  const cdnService = new CDNPublishService(cdnUrl, assetsDir);

  return (
    new Elysia({ prefix: "/api/cdn", name: "cdn" })
      // Publish single asset to CDN
      // SECURED: Requires authentication and ownership check
      .post(
        "/publish/:assetId",
        async (context) => {
          const { params } = context;
          const assetId = params.assetId;

          // Require authentication
          const authResult = await requireAuth(context);
          if (authResult instanceof Response) {
            return authResult; // Return 401 if not authenticated
          }
          const user = authResult.user;

          // Get asset from database to check ownership
          const asset = await getAssetFromPath(assetId);

          if (!asset) {
            return {
              success: false,
              assetId,
              filesPublished: [],
              error: "Asset not found in database",
            };
          }

          // Check if user can publish this asset
          if (!canPublishAsset(asset, user)) {
            return {
              success: false,
              assetId,
              filesPublished: [],
              error:
                "You do not have permission to publish this asset. Only the owner or admins can publish to CDN.",
            };
          }

          const result = await cdnService.publishAsset(assetId);

          return {
            success: result.success,
            assetId: result.assetId,
            filesPublished: result.filesPublished,
            error: result.error,
          };
        },
        {
          params: t.Object({
            assetId: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["CDN"],
            summary: "Publish asset to CDN",
            description:
              "Publishes a stable asset from asset-forge to the CDN for production use. (Auth required - only owner or admin can publish)",
          },
        },
      )

      // Publish multiple assets to CDN
      // SECURED: Requires authentication and ownership check for each asset
      .post(
        "/publish-batch",
        async (context) => {
          const { body } = context;
          const { assetIds } = body as { assetIds: string[] };

          // Require authentication
          const authResult = await requireAuth(context);
          if (authResult instanceof Response) {
            return authResult; // Return 401 if not authenticated
          }
          const user = authResult.user;

          // Check ownership for each asset before publishing
          const results = [];
          for (const assetId of assetIds) {
            // Get asset from database to check ownership
            const asset = await getAssetFromPath(assetId);

            if (!asset) {
              results.push({
                success: false,
                assetId,
                filesPublished: [],
                error: "Asset not found in database",
              });
              continue;
            }

            // Check if user can publish this asset
            if (!canPublishAsset(asset, user)) {
              results.push({
                success: false,
                assetId,
                filesPublished: [],
                error:
                  "Permission denied. Only the owner or admins can publish to CDN.",
              });
              continue;
            }

            // User has permission - publish the asset
            const result = await cdnService.publishAsset(assetId);
            results.push(result);
          }

          return {
            success: true,
            results,
            published: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          };
        },
        {
          body: t.Object({
            assetIds: t.Array(t.String()),
          }),
          detail: {
            tags: ["CDN"],
            summary: "Publish multiple assets to CDN",
            description:
              "Publishes multiple stable assets to the CDN in batch. (Auth required - only owner or admin can publish)",
          },
        },
      )

      // Check CDN health
      .get(
        "/health",
        async () => {
          const isHealthy = await cdnService.checkCDNHealth();

          return {
            cdn: "asset-forge-cdn",
            url: cdnUrl,
            healthy: isHealthy,
            timestamp: new Date().toISOString(),
          };
        },
        {
          detail: {
            tags: ["CDN"],
            summary: "Check CDN health",
            description: "Checks if the CDN is reachable and healthy. (Public)",
          },
        },
      )
  );
};
