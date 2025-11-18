/**
 * CDN Routes
 * Webhook receiver for CDN uploads (CDN-first architecture)
 * Asset publishing routes for uploading assets to CDN
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
import {
  ServiceUnavailableError,
  UnauthorizedError,
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} from "../errors";
import { requireAuthGuard } from "../plugins/auth.plugin";
import { cdnUploadService } from "../utils/CDNUploadService";
import type { AuthUser } from "../types/auth";
import fs from "fs/promises";
import path from "path";

export const createCDNRoutes = (
  assetsDir: string,
  cdnUrl: string,
) => {
  return (
    new Elysia({ prefix: "/api/cdn", name: "cdn" })
      .derive(() => ({ cdnUrl, assetsDir }))
      // Check CDN health
      .get(
        "/health",
        async ({ cdnUrl }) => {
          try {
            const response = await fetch(`${cdnUrl}/health/ready`);
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
        async ({ body, headers }) => {
          const webhookEnabled = env.CDN_WEBHOOK_ENABLED;
          const webhookSecret = env.WEBHOOK_SECRET;
          const systemUserId =
            env.WEBHOOK_SYSTEM_USER_ID ||
            "00000000-0000-0000-0000-000000000000";

          // Check if webhook feature is enabled
          if (!webhookEnabled) {
            throw new ServiceUnavailableError(
              "CDN webhook receiver",
              "CDN webhook receiver is disabled",
            );
          }

          // Verify webhook signature if secret is configured
          if (webhookSecret) {
            const signature = headers["x-webhook-signature"];
            if (!signature) {
              throw new UnauthorizedError("Missing webhook signature");
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
              throw new UnauthorizedError("Invalid webhook signature");
            }
          }

          try {
            const payload = body as WebhookPayload;
            logger.info(
              { context: "CDN Webhook", assetId: payload.assetId },
              "Received upload notification",
            );

            // Extract metadata from payload
            const metadata = extractAssetMetadata(payload);

            // Check if asset already exists in database by assetId
            const existingAssets = await db
              .select()
              .from(assets)
              .where(eq(assets.id, metadata.assetId))
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
            throw new InternalServerError(
              error instanceof Error
                ? error.message
                : "Unknown webhook processing error",
              {
                assetId: (body as WebhookPayload).assetId,
                originalError: error,
              },
            );
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

      // ==================== ASSET PUBLISHING ROUTES ====================
      // These routes allow users to publish their assets to CDN

      .use(requireAuthGuard)
      // Publish a single asset to CDN
      .post(
        "/publish/:assetId",
        async ({ params: { assetId }, user, cdnUrl, assetsDir }) => {
          const authUser = user as AuthUser;

          try {
            // Get asset from database
            const [asset] = await db
              .select()
              .from(assets)
              .where(eq(assets.id, assetId))
              .limit(1);

            if (!asset) {
              return {
                success: false,
                assetId,
                error: "Asset not found",
              };
            }

            // Check ownership (user owns asset OR user is admin)
            if (asset.ownerId !== authUser.id && authUser.role !== "admin") {
              return {
                success: false,
                assetId,
                error: "Permission denied: You do not own this asset",
              };
            }

            // Check if asset has filePath
            if (!asset.filePath) {
              return {
                success: false,
                assetId,
                error: "Asset has no file path to publish",
              };
            }

            // Read asset files from filesystem
            const assetPath = path.join(assetsDir, asset.filePath);
            const assetDir = path.dirname(assetPath);

            try {
              // Read directory contents
              const files = await fs.readdir(assetDir);
              const filesToUpload = [];

              for (const fileName of files) {
                const filePath = path.join(assetDir, fileName);
                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                  const buffer = await fs.readFile(filePath);
                  const ext = path.extname(fileName).toLowerCase();
                  let mimeType = "application/octet-stream";

                  // Determine MIME type
                  if (ext === ".glb") {
                    mimeType = "model/gltf-binary";
                  } else if (ext === ".png") {
                    mimeType = "image/png";
                  } else if (ext === ".jpg" || ext === ".jpeg") {
                    mimeType = "image/jpeg";
                  } else if (ext === ".json") {
                    mimeType = "application/json";
                  }

                  filesToUpload.push({
                    buffer,
                    fileName,
                    mimeType,
                  });
                }
              }

              if (filesToUpload.length === 0) {
                return {
                  success: false,
                  assetId,
                  error: "No files found to upload",
                };
              }

              // Upload to CDN
              const uploadResult = await cdnUploadService.upload(
                filesToUpload.map((f) => ({
                  buffer: f.buffer,
                  fileName: f.fileName,
                  mimeType: f.mimeType,
                })),
                {
                  assetId: asset.id,
                  directory: "models",
                  userId: authUser.id,
                  metadata: {
                    name: asset.name,
                    type: asset.type,
                    ownerId: asset.ownerId,
                  },
                },
              );

              // Update asset with CDN URLs
              const primaryFile = uploadResult.files[0];
              if (primaryFile) {
                await db
                  .update(assets)
                  .set({
                    cdnUrl: primaryFile.url,
                    cdnFiles: uploadResult.files.map((f) => f.url),
                    publishedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(assets.id, asset.id));
              }

              return {
                success: true,
                assetId: asset.id,
                filesPublished: uploadResult.files.length,
                cdnUrls: uploadResult.files.map((f) => f.url),
              };
            } catch (fsError) {
              logger.error(
                { err: fsError, assetId, assetPath },
                "Failed to read asset files from filesystem",
              );
              return {
                success: false,
                assetId,
                error:
                  fsError instanceof Error
                    ? fsError.message
                    : "Failed to read asset files",
              };
            }
          } catch (error) {
            logger.error(
              { err: error, assetId },
              "Failed to publish asset to CDN",
            );
            return {
              success: false,
              assetId,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            };
          }
        },
        {
          params: t.Object({
            assetId: t.String(),
          }),
          detail: {
            tags: ["CDN"],
            summary: "Publish asset to CDN",
            description:
              "Publishes a single asset to CDN by reading files from local storage and uploading them. Requires authentication and ownership (or admin role).",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Batch publish multiple assets
      .post(
        "/publish-batch",
        async ({ body, user, cdnUrl, assetsDir }) => {
          const authUser = user as AuthUser;
          const { assetIds } = body as { assetIds: string[] };

          if (!Array.isArray(assetIds)) {
            return {
              success: false,
              error: "assetIds must be an array",
              published: 0,
              failed: 0,
              results: [],
            };
          }

          if (assetIds.length === 0) {
            return {
              success: true,
              published: 0,
              failed: 0,
              results: [],
            };
          }

          const results = [];
          let published = 0;
          let failed = 0;

          for (const assetId of assetIds) {
            try {
              // Get asset from database
              const [asset] = await db
                .select()
                .from(assets)
                .where(eq(assets.id, assetId))
                .limit(1);

              if (!asset) {
                results.push({
                  assetId,
                  success: false,
                  error: "Asset not found",
                });
                failed++;
                continue;
              }

              // Check ownership (user owns asset OR user is admin)
              if (
                asset.ownerId !== authUser.id &&
                authUser.role !== "admin"
              ) {
                results.push({
                  assetId,
                  success: false,
                  error: "Permission denied",
                });
                failed++;
                continue;
              }

              // Check if asset has filePath
              if (!asset.filePath) {
                results.push({
                  assetId,
                  success: false,
                  error: "Asset has no file path",
                });
                failed++;
                continue;
              }

              // Read and upload files (simplified - same logic as single publish)
              const assetPath = path.join(assetsDir, asset.filePath);
              const assetDir = path.dirname(assetPath);

              try {
                const files = await fs.readdir(assetDir);
                const filesToUpload = [];

                for (const fileName of files) {
                  const filePath = path.join(assetDir, fileName);
                  const stats = await fs.stat(filePath);

                  if (stats.isFile()) {
                    const buffer = await fs.readFile(filePath);
                    const ext = path.extname(fileName).toLowerCase();
                    let mimeType = "application/octet-stream";

                    if (ext === ".glb") {
                      mimeType = "model/gltf-binary";
                    } else if (ext === ".png") {
                      mimeType = "image/png";
                    } else if (ext === ".jpg" || ext === ".jpeg") {
                      mimeType = "image/jpeg";
                    } else if (ext === ".json") {
                      mimeType = "application/json";
                    }

                    filesToUpload.push({
                      buffer,
                      fileName,
                      mimeType,
                    });
                  }
                }

                if (filesToUpload.length === 0) {
                  results.push({
                    assetId,
                    success: false,
                    error: "No files found",
                  });
                  failed++;
                  continue;
                }

                // Upload to CDN
                const uploadResult = await cdnUploadService.upload(
                  filesToUpload.map((f) => ({
                    buffer: f.buffer,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                  })),
                  {
                    assetId: asset.id,
                    directory: "models",
                    userId: authUser.id,
                  },
                );

                // Update asset with CDN URLs
                const primaryFile = uploadResult.files[0];
                if (primaryFile) {
                  await db
                    .update(assets)
                    .set({
                      cdnUrl: primaryFile.url,
                      cdnFiles: uploadResult.files.map((f) => f.url),
                      publishedAt: new Date(),
                      updatedAt: new Date(),
                    })
                    .where(eq(assets.id, asset.id));
                }

                results.push({
                  assetId,
                  success: true,
                  filesPublished: uploadResult.files.length,
                });
                published++;
              } catch (fsError) {
                results.push({
                  assetId,
                  success: false,
                  error:
                    fsError instanceof Error
                      ? fsError.message
                      : "Failed to read files",
                });
                failed++;
              }
            } catch (error) {
              results.push({
                assetId,
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown error",
              });
              failed++;
            }
          }

          return {
            success: true,
            published,
            failed,
            results,
          };
        },
        {
          body: t.Object({
            assetIds: t.Array(t.String()),
          }),
          detail: {
            tags: ["CDN"],
            summary: "Batch publish assets to CDN",
            description:
              "Publishes multiple assets to CDN in a single request. Returns per-asset results. Requires authentication and ownership (or admin role).",
            security: [{ BearerAuth: [] }],
          },
        },
      )
  );
};
