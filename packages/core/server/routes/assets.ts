/**
 * Asset Routes
 * Asset management endpoints including CRUD operations, file serving, and sprite generation
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs";
import type { AssetService } from "../services/AssetService";
import * as Models from "../models";
import { optionalAuth, requireAuth } from "../middleware/auth";
import {
  getAssetFromPath,
  canViewAsset,
  canModifyAsset,
} from "../middleware/assetAuth";

export const createAssetRoutes = (
  rootDir: string,
  assetService: AssetService,
) => {
  return new Elysia({ prefix: "/api/assets", name: "assets" }).guard(
    {
      beforeHandle: ({ request }) => {
        const url = new URL(request.url);
        logger.info(
          { context: "Assets", method: request.method, path: url.pathname },
          "Assets request",
        );
      },
    },
    (app) =>
      app
        // Asset listing endpoint
        // SECURED: Filters based on visibility and ownership
        .get(
          "",
          async (context) => {
            const { query } = context;

            // Check authentication (optional)
            const authResult = await optionalAuth({
              request: context.request,
              headers: context.headers,
            });
            const user = authResult.user;

            // Get all assets from filesystem
            let assets = await assetService.listAssets();

            // Filter assets based on visibility and ownership
            // AND merge CDN URLs from database
            const filteredAssets = [];
            for (const asset of assets) {
              // Get database record for visibility check AND CDN URLs
              const dbAsset = await getAssetFromPath(asset.id);

              if (!dbAsset) {
                // Asset not in database - include for backward compatibility
                filteredAssets.push(asset);
                continue;
              }

              // Check if user can view this asset
              if (canViewAsset(dbAsset, user)) {
                // Merge CDN URLs from database into asset response
                const assetWithCDN = {
                  ...asset,
                  cdnUrl: dbAsset.cdnUrl,
                  cdnThumbnailUrl: dbAsset.cdnThumbnailUrl,
                  cdnConceptArtUrl: dbAsset.cdnConceptArtUrl,
                  cdnFiles: dbAsset.cdnFiles,
                };
                filteredAssets.push(assetWithCDN);
              }
            }

            // Apply projectId filter if provided
            if (query.projectId) {
              return filteredAssets.filter(
                (asset) => asset.metadata.projectId === query.projectId,
              );
            }

            return filteredAssets;
          },
          {
            query: t.Object({
              projectId: t.Optional(t.String()),
            }),
            response: Models.AssetListResponse,
            detail: {
              tags: ["Assets"],
              summary: "List all assets",
              description:
                "Returns a list of all generated 3D assets with optional filtering by project. (Auth optional - shows public assets, authenticated users see their own assets)",
            },
          },
        )

        // Delete asset endpoint
        // SECURED: Requires authentication and ownership check
        .delete(
          "/:id",
          async (context) => {
            const { params, query, set } = context;
            const id = params.id;

            // Require authentication
            const authResult = await requireAuth({
              request: context.request,
              headers: context.headers,
            });
            if (authResult instanceof Response) {
              set.status = 401;
              return { error: "Unauthorized" };
            }
            const user = authResult.user;

            // Get asset from database to check ownership
            const dbAsset = await getAssetFromPath(id);

            if (!dbAsset) {
              set.status = 404;
              return { error: "Asset not found" };
            }

            // Check if user can modify this asset
            if (!canModifyAsset(dbAsset, user)) {
              set.status = 403;
              return {
                error: "Forbidden",
                message:
                  "You do not have permission to delete this asset. Only the owner or admins can delete assets.",
              };
            }

            const includeVariants = query.includeVariants === "true";
            await assetService.deleteAsset(id, includeVariants);

            return {
              success: true,
              message: `Asset ${id} deleted successfully`,
            };
          },
          {
            params: t.Object({
              id: t.String({ minLength: 1 }),
            }),
            query: Models.DeleteAssetQuery,
            response: {
              200: Models.DeleteAssetResponse,
              401: Models.ErrorResponse,
              403: Models.ErrorResponse,
              404: Models.ErrorResponse,
            },
            detail: {
              tags: ["Assets"],
              summary: "Delete an asset",
              description:
                "Deletes an asset and optionally its variants. (Auth required - users can only delete their own assets, admins can delete any asset)",
            },
          },
        )

        // Update asset metadata
        // SECURED: Requires authentication and ownership check
        .patch(
          "/:id",
          async (context) => {
            const { params, body, set } = context;
            const id = params.id;

            // Require authentication
            const authResult = await requireAuth({
              request: context.request,
              headers: context.headers,
            });
            if (authResult instanceof Response) {
              set.status = 401;
              return { error: "Unauthorized" };
            }
            const user = authResult.user;

            // Get asset from database to check ownership
            const dbAsset = await getAssetFromPath(id);

            if (!dbAsset) {
              set.status = 404;
              return { error: "Asset not found" };
            }

            // Check if user can modify this asset
            if (!canModifyAsset(dbAsset, user)) {
              set.status = 403;
              return {
                error: "Forbidden",
                message:
                  "You do not have permission to update this asset. Only the owner or admins can modify assets.",
              };
            }

            const updatedAsset = await assetService.updateAsset(id, body);

            if (!updatedAsset) {
              set.status = 404;
              return { error: "Asset not found" };
            }

            return updatedAsset;
          },
          {
            params: t.Object({
              id: t.String({ minLength: 1 }),
            }),
            body: Models.AssetUpdate,
            response: {
              200: Models.AssetMetadata,
              401: Models.ErrorResponse,
              403: Models.ErrorResponse,
              404: Models.ErrorResponse,
            },
            detail: {
              tags: ["Assets"],
              summary: "Update asset metadata",
              description:
                "Updates asset metadata like name, type, tier, etc. (Auth required - users can only update their own assets, admins can update any asset)",
            },
          },
        )

        // Save sprites for an asset
        .post(
          "/:id/sprites",
          async ({ params: { id }, body }) => {
            const { sprites, config } = body;

            logger.info(
              { context: "Sprites", spriteCount: sprites.length, assetId: id },
              "Uploading sprites to CDN",
            );

            const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
            const CDN_API_KEY = process.env.CDN_API_KEY;

            if (!CDN_API_KEY) {
              throw new Error(
                "CDN_API_KEY must be configured for sprite uploads",
              );
            }

            // Prepare files for CDN upload
            const filesToUpload: Array<{
              buffer: Buffer;
              name: string;
              type: string;
            }> = [];

            // Add each sprite image
            for (const sprite of sprites) {
              const { angle, imageData } = sprite;

              // Extract base64 data from data URL
              const base64Data = imageData.replace(
                /^data:image\/\w+;base64,/,
                "",
              );
              const buffer = Buffer.from(base64Data, "base64");
              const filename = `${angle}deg.png`;

              filesToUpload.push({
                buffer,
                name: filename,
                type: "image/png",
              });

              logger.debug(
                {
                  context: "Sprites",
                  filename,
                  sizeKB: (buffer.length / 1024).toFixed(2),
                },
                "Sprite prepared",
              );
            }

            // Add sprite metadata
            const spriteMetadata = {
              assetId: id,
              config: config || {},
              angles: sprites.map((s) => s.angle),
              spriteCount: sprites.length,
              status: "completed",
              generatedAt: new Date().toISOString(),
            };

            filesToUpload.push({
              buffer: Buffer.from(JSON.stringify(spriteMetadata, null, 2)),
              name: "sprite-metadata.json",
              type: "application/json",
            });

            // Upload to CDN
            const formData = new FormData();

            for (const file of filesToUpload) {
              // Convert Buffer to Uint8Array for Blob compatibility
              const uint8Array = new Uint8Array(file.buffer);
              const blob = new Blob([uint8Array], { type: file.type });
              // Store sprites in sprites/{assetId}/ directory
              formData.append("files", blob, `${id}/sprites/${file.name}`);
            }

            formData.append("directory", "sprites");

            logger.info(
              { context: "Sprites", fileCount: filesToUpload.length },
              "Uploading files to CDN",
            );

            const response = await fetch(`${CDN_URL}/api/upload`, {
              method: "POST",
              headers: {
                "X-API-Key": CDN_API_KEY,
              },
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `CDN upload failed (${response.status}): ${errorText}`,
              );
            }

            const result = await response.json();
            logger.info(
              { context: "Sprites", result },
              "Successfully uploaded to CDN:",
            );

            // Build CDN URLs for response
            const cdnUrls = sprites.map(
              (s) => `${CDN_URL}/sprites/${id}/sprites/${s.angle}deg.png`,
            );

            return {
              success: true,
              message: `${sprites.length} sprites uploaded to CDN successfully`,
              spritesDir: `${CDN_URL}/sprites/${id}/sprites`, // Deprecated but keep for backward compatibility
              cdnSpritesDir: `${CDN_URL}/sprites/${id}/sprites`,
              spriteFiles: sprites.map((s) => `${s.angle}deg.png`),
              cdnUrls,
            };
          },
          {
            params: t.Object({
              id: t.String({ minLength: 1 }),
            }),
            body: Models.SpriteSaveRequest,
            response: Models.SpriteSaveResponse,
            detail: {
              tags: ["Sprites"],
              summary: "Save sprite images",
              description:
                "Saves generated sprite images and metadata for an asset. (Auth optional)",
            },
          },
        )

        // Upload VRM file
        .post(
          "/upload-vrm",
          async ({ body }) => {
            const formData = body as { file?: File; assetId?: string };
            const file = formData.file!;
            const assetId = formData.assetId!;
            const filename = file.name;

            logger.info(
              {
                context: "VRM Upload",
                filename,
                assetId,
                sizeMB: (file.size / 1024 / 1024).toFixed(2),
              },
              "Uploading VRM to CDN",
            );

            const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
            const CDN_API_KEY = process.env.CDN_API_KEY;

            if (!CDN_API_KEY) {
              throw new Error("CDN_API_KEY must be configured for VRM uploads");
            }

            // Upload VRM to CDN
            const cdnFormData = new FormData();

            // Read file as buffer
            const fileBuffer = await file.arrayBuffer();
            const blob = new Blob([fileBuffer], {
              type: "application/octet-stream",
            });

            // Store VRM in models/{assetId}/ directory alongside GLB
            cdnFormData.append("files", blob, `${assetId}/${filename}`);
            cdnFormData.append("directory", "models");

            logger.info(
              { context: "VRM Upload", path: `models/${assetId}/${filename}` },
              "Uploading to CDN",
            );

            const response = await fetch(`${CDN_URL}/api/upload`, {
              method: "POST",
              headers: {
                "X-API-Key": CDN_API_KEY,
              },
              body: cdnFormData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `CDN upload failed (${response.status}): ${errorText}`,
              );
            }

            const result = await response.json();
            logger.info(
              { context: "VRM Upload", result },
              "Successfully uploaded to CDN:",
            );

            // Return success with CDN URL
            const cdnUrl = `${CDN_URL}/models/${assetId}/${filename}`;
            return {
              success: true,
              url: cdnUrl,
              message: `VRM uploaded successfully to CDN`,
            };
          },
          {
            response: Models.VRMUploadResponse,
            detail: {
              tags: ["VRM"],
              summary: "Upload VRM file",
              description:
                "Uploads a VRM file for an asset. (Auth optional - authenticated users get ownership tracking)",
            },
          },
        )

        // Bulk update assets
        .post(
          "/bulk-update",
          async ({ body, set }) => {
            const { assetIds, updates } = body;

            logger.info(
              { context: "Bulk Update", assetCount: assetIds.length, updates },
              "Updating assets",
            );

            let updated = 0;
            let failed = 0;
            const errors: Array<{ assetId: string; error: string }> = [];

            for (const assetId of assetIds) {
              try {
                const result = await assetService.updateAsset(assetId, updates);
                if (result) {
                  updated++;
                } else {
                  failed++;
                  errors.push({ assetId, error: "Asset not found" });
                }
              } catch (error) {
                failed++;
                const err = error as Error;
                errors.push({ assetId, error: err.message });
                logger.error(
                  { context: "Bulk Update", assetId, err: err.message },
                  "Failed to update asset",
                );
              }
            }

            logger.info(
              { context: "Bulk Update", updated, failed },
              "Bulk update complete",
            );

            return {
              success: updated > 0,
              updated,
              failed,
              errors: errors.length > 0 ? errors : undefined,
            };
          },
          {
            body: Models.BulkUpdateRequest,
            response: Models.BulkUpdateResponse,
            detail: {
              tags: ["Assets"],
              summary: "Bulk update assets",
              description:
                "Updates multiple assets at once. Currently supports status and favorite updates. (Auth required - users can only update their own assets)",
            },
          },
        ),
  );
};
