/**
 * Asset Routes
 * Asset management endpoints including CRUD operations, file serving, and sprite generation
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import * as Models from "../models";
import { requireAuthGuard } from "../plugins/auth.plugin";
import { ActivityLogService } from "../services/ActivityLogService";
import { assetDatabaseService } from "../services/AssetDatabaseService";
import type { AuthUser } from "../types/auth";

export const createAssetRoutes = (rootDir: string) => {
  return (
    new Elysia({ prefix: "/api/assets", name: "assets" })
      .guard(
        {
          beforeHandle: ({ request }) => {
            const url = new URL(request.url);
            logger.info(
              { context: "Assets", method: request.method, path: url.pathname },
              "Assets request",
            );
          },
        },
        (app) => app,
      )

      // ==================== AUTHENTICATED ROUTES ====================
      .use(requireAuthGuard)

      // Asset listing endpoint
      .get(
        "",
        async (context) => {
          const { query, user } = context as typeof context & {
            user: AuthUser;
          };

          // Get all assets from database (includes CDN URLs)
          const allAssets = await assetDatabaseService.listAssets();

          // Admins see all assets, regular users see only their own
          const userAssets = user.isAdmin
            ? allAssets
            : allAssets.filter((asset) => asset.ownerId === user.id);

          // Apply projectId filter if provided
          if (query.projectId) {
            return userAssets.filter(
              (asset) => asset.metadata.projectId === query.projectId,
            );
          }

          return userAssets;
        },
        {
          query: t.Object({
            projectId: t.Optional(t.String()),
          }),
          response: {
            200: Models.AssetListResponse,
            401: Models.ErrorResponse,
          },
          detail: {
            tags: ["Assets"],
            summary: "List user's assets",
            description:
              "Returns a list of assets owned by the authenticated user with optional filtering by project. Requires authentication.",
          },
        },
      )

      // Delete asset endpoint
      .delete(
        "/:id",
        async (context) => {
          const { params, query, user } = context as typeof context & {
            user: AuthUser;
          };
          const id = params.id;

          // Get asset details before deleting for logging
          const assets = await assetDatabaseService.listAssets();
          const asset = assets.find((a) => a.id === id);

          const includeVariants = query.includeVariants === "true";
          await assetDatabaseService.deleteAssetRecord(id, includeVariants);

          // Log asset deletion
          if (asset) {
            await ActivityLogService.logAssetDeleted({
              userId: user.id,
              assetId: id,
              assetName: asset.metadata.name || id,
              assetType: asset.metadata.type || "unknown",
              request: context.request,
            });
          }

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
              "Deletes an asset and optionally its variants. (Auth required - all authenticated users can delete any asset)",
          },
        },
      )

      // Update asset metadata
      .patch(
        "/:id",
        async (context) => {
          const { params, body, set, user } = context as typeof context & {
            user: AuthUser;
          };
          const id = params.id;

          // Get current asset from database
          const currentAsset = await assetDatabaseService.getAssetWithOwner(id);
          if (!currentAsset) {
            set.status = 404;
            return { error: "Asset not found" };
          }

          const currentMetadata = currentAsset.metadata as any;

          // Build updated metadata with new values
          const updatedMetadata = {
            ...currentMetadata,
            ...body.metadata,
            updatedAt: new Date().toISOString(),
          };

          // Handle direct field updates
          if (body.isFavorite !== undefined) {
            updatedMetadata.isFavorite = body.isFavorite;
          }
          if (body.notes !== undefined) {
            updatedMetadata.notes = body.notes;
          }
          if (body.status !== undefined) {
            updatedMetadata.status = body.status;
          }

          // Default isPublic to true if not set
          if (updatedMetadata.isPublic === undefined) {
            updatedMetadata.isPublic = true;
          }

          // Handle type change if provided
          if (body.type && body.type !== currentMetadata.type) {
            updatedMetadata.type = body.type;
          }

          // Handle name change if provided (including ID update)
          if (body.name && body.name !== id) {
            updatedMetadata.name = body.name;
            updatedMetadata.gameId = body.name;

            // Update database record with new name and ID
            await assetDatabaseService.updateAssetRecord(id, {
              id: body.name,
              name: body.name,
              type: body.type || currentAsset.type,
              metadata: updatedMetadata,
            });

            // Get updated asset with new ID
            const updatedAsset = await assetDatabaseService.getAssetWithOwner(
              body.name,
            );

            if (!updatedAsset) {
              set.status = 500;
              return { error: "Failed to retrieve updated asset" };
            }

            // Log asset update
            await ActivityLogService.log({
              userId: user.id,
              action: "asset_updated",
              entityType: "asset",
              entityId: body.name,
              details: {
                assetName: updatedAsset.name,
                assetType: updatedAsset.type,
                updatedFields: Object.keys(body),
                idChanged: true,
              },
              request: context.request,
            });

            // Return formatted response
            return {
              id: updatedAsset.id,
              name: updatedAsset.name,
              description: updatedAsset.description || "",
              type: updatedAsset.type,
              metadata: updatedAsset.metadata,
              hasModel: !!updatedAsset.cdnUrl,
              modelFile: updatedAsset.cdnUrl
                ? updatedAsset.cdnUrl.split("/").pop()
                : undefined,
              generatedAt: updatedAsset.createdAt.toISOString(),
              cdnUrl: updatedAsset.cdnUrl || null,
              cdnThumbnailUrl: updatedAsset.cdnThumbnailUrl,
              cdnConceptArtUrl: updatedAsset.cdnConceptArtUrl,
            };
          } else {
            // Just update metadata in database
            await assetDatabaseService.updateAssetRecord(id, {
              name: body.name || currentAsset.name,
              description: currentAsset.description,
              type: body.type || currentAsset.type,
              metadata: updatedMetadata,
            });

            // Get updated asset
            const updatedAsset =
              await assetDatabaseService.getAssetWithOwner(id);

            if (!updatedAsset) {
              set.status = 500;
              return { error: "Failed to retrieve updated asset" };
            }

            // Log asset update
            await ActivityLogService.log({
              userId: user.id,
              action: "asset_updated",
              entityType: "asset",
              entityId: id,
              details: {
                assetName: updatedAsset.name,
                assetType: updatedAsset.type,
                updatedFields: Object.keys(body),
              },
              request: context.request,
            });

            // Return formatted response
            return {
              id: updatedAsset.id,
              name: updatedAsset.name,
              description: updatedAsset.description || "",
              type: updatedAsset.type,
              metadata: updatedAsset.metadata,
              hasModel: !!updatedAsset.cdnUrl,
              modelFile: updatedAsset.cdnUrl
                ? updatedAsset.cdnUrl.split("/").pop()
                : undefined,
              generatedAt: updatedAsset.createdAt.toISOString(),
              cdnUrl: updatedAsset.cdnUrl || null,
              cdnThumbnailUrl: updatedAsset.cdnThumbnailUrl,
              cdnConceptArtUrl: updatedAsset.cdnConceptArtUrl,
            };
          }
        },
        {
          params: t.Object({
            id: t.String({ minLength: 1 }),
          }),
          body: Models.AssetUpdate,
          response: {
            200: Models.AssetMetadata,
            401: Models.ErrorResponse,
            404: Models.ErrorResponse,
          },
          detail: {
            tags: ["Assets"],
            summary: "Update asset metadata",
            description:
              "Updates asset metadata like name, type, tier, etc. (Auth required - all authenticated users can update any asset)",
          },
        },
      )

      // Bulk update assets
      .post(
        "/bulk-update",
        async (context) => {
          const { body, set, user } = context as typeof context & {
            user: AuthUser;
          };
          const { assetIds, updates } = body;

          logger.info(
            {
              context: "Bulk Update",
              assetCount: assetIds.length,
              updates,
            },
            "Updating assets",
          );

          let updated = 0;
          let failed = 0;
          const errors: Array<{ assetId: string; error: string }> = [];

          for (const assetId of assetIds) {
            try {
              // Get current asset
              const currentAsset =
                await assetDatabaseService.getAssetWithOwner(assetId);
              if (!currentAsset) {
                failed++;
                errors.push({ assetId, error: "Asset not found" });
                continue;
              }

              const currentMetadata = currentAsset.metadata as any;

              // Build updated metadata
              const updatedMetadata = {
                ...currentMetadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString(),
              };

              // Handle direct field updates
              if (updates.isFavorite !== undefined) {
                updatedMetadata.isFavorite = updates.isFavorite;
              }
              if (updates.notes !== undefined) {
                updatedMetadata.notes = updates.notes;
              }
              if (updates.status !== undefined) {
                updatedMetadata.status = updates.status;
              }

              // Update in database
              await assetDatabaseService.updateAssetRecord(assetId, {
                name: updates.name || currentAsset.name,
                type: updates.type || currentAsset.type,
                metadata: updatedMetadata,
              });

              updated++;
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
              "Updates multiple assets at once. Currently supports status and favorite updates. (Auth required - all authenticated users can update any asset)",
          },
        },
      )

      // ==================== PUBLIC ROUTES ====================
      // These routes work without authentication
      .post(
        "/:id/sprites",
        async ({ params: { id }, body }) => {
          const { sprites, config } = body;

          logger.info(
            {
              context: "Sprites",
              spriteCount: sprites.length,
              assetId: id,
            },
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

      // Get asset model file (with CDN redirect fallback)
      .get(
        "/:id/model",
        async ({ params, set }) => {
          const { id } = params;

          // Get asset from database to check for CDN URL
          const assets = await assetDatabaseService.listAssets();
          const asset = assets.find((a) => a.id === id);

          if (!asset) {
            set.status = 404;
            return { error: "Asset not found" };
          }

          // If asset has CDN URL, redirect to it
          if (asset.cdnUrl) {
            set.status = 302;
            set.headers["Location"] = asset.cdnUrl;
            return new Response(null, {
              status: 302,
              headers: { Location: asset.cdnUrl },
            });
          }

          // No CDN URL - asset not available
          logger.warn(
            { assetId: id },
            "Asset has no CDN URL - model not available",
          );
          set.status = 404;
          return {
            error: "Model file not available - asset must be uploaded to CDN",
            assetId: id,
          };
        },
        {
          params: t.Object({
            id: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["Assets"],
            summary: "Get asset 3D model",
            description:
              "Returns the GLB model file for an asset. Redirects to CDN if available, falls back to legacy storage. (Auth optional)",
          },
        },
      )

      // HEAD endpoint for model existence check
      .head(
        "/:id/model",
        async ({ params }) => {
          const { id } = params;

          // Get asset from database to check for CDN URL
          const assets = await assetDatabaseService.listAssets();
          const asset = assets.find((a) => a.id === id);

          if (!asset) {
            return new Response(null, { status: 404 });
          }

          // If asset has CDN URL, it exists
          if (asset.cdnUrl) {
            return new Response(null, {
              status: 200,
              headers: { "Content-Type": "model/gltf-binary" },
            });
          }

          // No CDN URL - model does not exist
          return new Response(null, { status: 404 });
        },
        {
          params: t.Object({
            id: t.String({ minLength: 1 }),
          }),
          detail: {
            tags: ["Assets"],
            summary: "Check if asset model exists",
            description:
              "HEAD request to check if a model file exists for an asset. (Auth optional)",
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
            {
              context: "VRM Upload",
              path: `models/${assetId}/${filename}`,
            },
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
  );
};
