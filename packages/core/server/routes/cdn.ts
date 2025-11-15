/**
 * CDN Routes
 * Webhook receiver for CDN uploads (CDN-first architecture)
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { createHmac, timingSafeEqual } from "crypto";
import {
  extractAssetMetadata,
  toNewAsset,
  type WebhookPayload,
} from "../utils/cdn-metadata-extractor";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";
import { env } from "../config/env";

export const createCDNRoutes = (cdnUrl: string) => {
  return (
    new Elysia({ prefix: "/api/cdn", name: "cdn" })
      // Check CDN health
      .get(
        "/health",
        async () => {
          try {
            const response = await fetch(`${cdnUrl}/api/health`);
            const isHealthy = response.ok;

            return {
              cdn: "asset-forge-cdn",
              url: cdnUrl,
              healthy: isHealthy,
              timestamp: new Date().toISOString(),
            };
          } catch {
            return {
              cdn: "asset-forge-cdn",
              url: cdnUrl,
              healthy: false,
              timestamp: new Date().toISOString(),
            };
          }
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
          const webhookEnabled = env.CDN_WEBHOOK_ENABLED;
          const webhookSecret = env.WEBHOOK_SECRET;
          const systemUserId =
            env.WEBHOOK_SYSTEM_USER_ID ||
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
                !timingSafeEqual(signatureBuffer, expectedBuffer)
              ) {
                set.status = 401;
                return {
                  success: false,
                  error: "Invalid webhook signature",
                };
              }
            }

            const payload = body as WebhookPayload;
            logger.info(
              { context: "CDN Webhook", assetId: payload.assetId },
              "Received upload notification",
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
              logger.info(
                { context: "CDN Webhook", assetId: payload.assetId },
                "Asset already exists, updating CDN URLs",
              );

              await db
                .update(assets)
                .set({
                  cdnUrl: metadata.cdnUrl,
                  cdnThumbnailUrl: metadata.cdnThumbnailUrl,
                  cdnConceptArtUrl: metadata.cdnConceptArtUrl,
                  cdnFiles: metadata.cdnFiles,
                  updatedAt: new Date(),
                })
                .where(eq(assets.id, existing.id));

              action = "updated";
              databaseId = existing.id;
            } else {
              // Asset doesn't exist - create new record
              logger.info(
                { context: "CDN Webhook", assetId: payload.assetId },
                "Creating new database record",
              );

              const newAsset = toNewAsset(metadata, systemUserId);
              const [created] = await db
                .insert(assets)
                .values(newAsset)
                .returning();

              action = "created";
              databaseId = created.id;

              logger.info(
                { context: "CDN Webhook", databaseId },
                "Created asset record",
              );
            }

            return {
              success: true,
              assetId: payload.assetId,
              action,
              databaseId,
            };
          } catch (error) {
            logger.error(
              { err: error },
              "[CDN Webhook] Error processing webhook:",
            );
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
