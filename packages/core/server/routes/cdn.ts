/**
 * CDN Routes
 * Endpoints for publishing assets to the CDN and receiving webhooks
 */

import { Elysia, t } from "elysia";
import { createHmac } from "crypto";
import { CDNPublishService } from "../services/CDNPublishService";
import { requireAuth } from "../middleware/auth";
import { getAssetFromPath, canPublishAsset } from "../middleware/assetAuth";
import { assetDatabaseService } from "../services/AssetDatabaseService";
import {
  extractAssetMetadata,
  toNewAsset,
  type WebhookPayload,
} from "../utils/cdn-metadata-extractor";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

export const createCDNRoutes = (assetsDir: string, cdnUrl: string) => {
  const cdnService = new CDNPublishService({
    cdnUrl,
    apiKey: process.env.CDN_API_KEY || "",
    assetsDir,
  });

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

      // Webhook receiver for CDN uploads
      // Receives notifications when files are uploaded to CDN
      // Creates/updates database records automatically
      .post(
        "/webhook/upload",
        async ({ body, headers, set }) => {
          const webhookEnabled = process.env.CDN_WEBHOOK_ENABLED === "true";
          const webhookSecret = process.env.WEBHOOK_SECRET;
          const systemUserId =
            process.env.WEBHOOK_SYSTEM_USER_ID ||
            "00000000-0000-0000-0000-000000000000";

          // Check if webhook feature is enabled
          if (!webhookEnabled) {
            set.status = 503;
            return {
              success: false,
              error: "CDN webhook receiver is disabled",
            };
          }

          try {
            // Verify webhook signature if secret is configured
            if (webhookSecret) {
              const signature = headers["x-webhook-signature"];
              if (!signature) {
                set.status = 401;
                return {
                  success: false,
                  error: "Missing webhook signature",
                };
              }

              // Verify signature
              const payload = body as WebhookPayload;
              const expectedSignature = createHmac("sha256", webhookSecret)
                .update(JSON.stringify(payload))
                .digest("hex");

              // Constant-time comparison to prevent timing attacks
              const signatureBuffer = Buffer.from(signature as string, "hex");
              const expectedBuffer = Buffer.from(expectedSignature, "hex");

              if (
                signatureBuffer.length !== expectedBuffer.length ||
                !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
              ) {
                set.status = 401;
                return {
                  success: false,
                  error: "Invalid webhook signature",
                };
              }
            }

            const payload = body as WebhookPayload;
            console.log(
              `[CDN Webhook] Received upload notification for asset: ${payload.assetId}`,
            );

            // Extract metadata from payload
            const metadata = extractAssetMetadata(payload);

            // Check if asset already exists in database
            const existingAssets = await db
              .select()
              .from(assets)
              .where(eq(assets.filePath, metadata.filePath))
              .limit(1);

            let action: "created" | "updated" | "skipped";
            let databaseId: string;

            if (existingAssets.length > 0) {
              // Asset exists - update CDN URLs
              const existing = existingAssets[0];
              console.log(
                `[CDN Webhook] Asset ${payload.assetId} already exists, updating CDN URLs`,
              );

              await db
                .update(assets)
                .set({
                  cdnUrl: metadata.cdnUrl,
                  cdnThumbnailUrl: metadata.cdnThumbnailUrl,
                  cdnConceptArtUrl: metadata.cdnConceptArtUrl,
                  cdnFiles: metadata.cdnFiles,
                  publishedToCdn: true,
                  cdnPublishedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(assets.id, existing.id));

              action = "updated";
              databaseId = existing.id;
            } else {
              // Asset doesn't exist - create new record
              console.log(
                `[CDN Webhook] Creating new database record for asset: ${payload.assetId}`,
              );

              const newAsset = toNewAsset(metadata, systemUserId);
              const [created] = await db
                .insert(assets)
                .values(newAsset)
                .returning();

              action = "created";
              databaseId = created.id;

              console.log(
                `[CDN Webhook] Created asset record with ID: ${databaseId}`,
              );
            }

            return {
              success: true,
              assetId: payload.assetId,
              action,
              databaseId,
            };
          } catch (error) {
            console.error("[CDN Webhook] Error processing webhook:", error);
            set.status = 500;
            return {
              success: false,
              assetId: (body as WebhookPayload).assetId,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown webhook processing error",
            };
          }
        },
        {
          body: t.Object({
            assetId: t.String(),
            directory: t.String(),
            files: t.Array(
              t.Object({
                name: t.String(),
                size: t.Number(),
                relativePath: t.String(),
                cdnUrl: t.String(),
              }),
            ),
            uploadedAt: t.String(),
            uploadedBy: t.Union([t.String(), t.Null()]),
          }),
          detail: {
            tags: ["CDN"],
            summary: "Webhook receiver for CDN uploads (Internal)",
            description:
              "Receives webhook notifications from CDN when files are uploaded. Automatically creates or updates asset database records. Requires webhook signature authentication. This is an internal endpoint called by the CDN server.",
          },
        },
      )
  );
};
