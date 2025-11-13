/**
 * Asset Routes
 * Asset management endpoints including CRUD operations, file serving, and sprite generation
 */

import { Elysia, t } from "elysia";
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
        console.log(`[Assets] ${request.method} request`);
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
            const authResult = await optionalAuth(context);
            const user = authResult.user;

            // Get all assets from filesystem
            let assets = await assetService.listAssets();

            // Filter assets based on visibility and ownership
            const filteredAssets = [];
            for (const asset of assets) {
              // Get database record for visibility check
              const dbAsset = await getAssetFromPath(asset.id);

              if (!dbAsset) {
                // Asset not in database - include for backward compatibility
                filteredAssets.push(asset);
                continue;
              }

              // Check if user can view this asset
              if (canViewAsset(dbAsset, user)) {
                filteredAssets.push(asset);
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

        // Get single asset model
        // SECURED: Checks visibility and ownership
        .get("/:id/model", async (context) => {
          const { params, set } = context;
          const id = params.id;

          // Check authentication (optional)
          const authResult = await optionalAuth(context);
          const user = authResult.user;

          // Get asset from database to check visibility
          const asset = await getAssetFromPath(id);

          if (!asset) {
            // Asset not in database - allow for backward compatibility
            console.warn(
              `[Model Serving] Asset ${id} not found in database, serving without auth check`,
            );
          } else if (!canViewAsset(asset, user)) {
            // User not authorized to view this private asset
            set.status = 403;
            return {
              error: "Forbidden",
              message: "You do not have permission to access this asset",
            };
          }

          const modelPath = await assetService.getModelPath(id);
          const modelFile = Bun.file(modelPath);

          if (!(await modelFile.exists())) {
            set.status = 404;
            return { error: `Model not found for asset ${id}` };
          }

          // Set correct content-type for GLB files to prevent JSON parsing
          // This is critical - without the correct content-type, browsers/interceptors
          // may try to parse binary GLB files as JSON, causing parse errors
          const ext = modelPath.toLowerCase().split(".").pop();
          if (ext === "glb") {
            set.headers["Content-Type"] = "model/gltf-binary";
          } else if (ext === "gltf") {
            set.headers["Content-Type"] = "model/gltf+json";
          } else {
            // Fallback to binary for unknown extensions to prevent JSON parsing
            set.headers["Content-Type"] = "application/octet-stream";
          }

          // Wrap Bun.file() in Response for proper HEAD request handling
          return new Response(modelFile);
        })
        .head("/:id/model", async (context) => {
          try {
            const { params, set } = context;
            const id = params.id;

            // Check authentication (optional)
            const authResult = await optionalAuth(context);
            const user = authResult.user;

            // Get asset from database to check visibility
            const asset = await getAssetFromPath(id);

            if (asset && !canViewAsset(asset, user)) {
              // User not authorized to view this private asset
              set.status = 403;
              return null;
            }

            const modelPath = await assetService.getModelPath(id);
            const modelFile = Bun.file(modelPath);

            if (!(await modelFile.exists())) {
              set.status = 404;
            } else {
              set.status = 200;

              // Set correct content-type header for HEAD requests too
              const ext = modelPath.toLowerCase().split(".").pop();
              if (ext === "glb") {
                set.headers["Content-Type"] = "model/gltf-binary";
              } else if (ext === "gltf") {
                set.headers["Content-Type"] = "model/gltf+json";
              } else {
                set.headers["Content-Type"] = "application/octet-stream";
              }
            }

            return null;
          } catch (error) {
            const id = context.params.id;
            console.error(`[HEAD /:id/model] Error for asset ${id}:`, error);
            context.set.status = 500;
            return null;
          }
        })

        // Serve any file from an asset directory
        // SECURED: Checks visibility and ownership
        .get("/:id/*", async (context) => {
          const { params, set } = context;
          const assetId = params.id;
          const filePath = params["*"]; // Everything after the asset ID

          // Check authentication (optional)
          const authResult = await optionalAuth(context);
          const user = authResult.user;

          // Get asset from database to check visibility
          const asset = await getAssetFromPath(assetId);

          if (!asset) {
            // Asset not in database - allow for backward compatibility
            console.warn(
              `[File Serving] Asset ${assetId} not found in database, serving without auth check`,
            );
          } else if (!canViewAsset(asset, user)) {
            // User not authorized to view this private asset
            set.status = 403;
            return {
              error: "Forbidden",
              message: "You do not have permission to access this asset",
            };
          }

          const fullPath = path.join(rootDir, "gdd-assets", assetId, filePath);

          // Security check to prevent directory traversal
          const normalizedPath = path.normalize(fullPath);
          const assetDir = path.join(rootDir, "gdd-assets", assetId);

          if (!normalizedPath.startsWith(assetDir)) {
            set.status = 403;
            return { error: "Access denied" };
          }

          const file = Bun.file(fullPath);

          if (!(await file.exists())) {
            set.status = 404;
            return { error: "File not found" };
          }

          // Wrap Bun.file() in Response for proper HEAD request handling
          return new Response(file);
        })
        .head("/:id/*", async (context) => {
          try {
            const { params, set } = context;
            const assetId = params.id;
            const filePath = params["*"]; // Everything after the asset ID

            // Check authentication (optional)
            const authResult = await optionalAuth(context);
            const user = authResult.user;

            // Get asset from database to check visibility
            const asset = await getAssetFromPath(assetId);

            if (asset && !canViewAsset(asset, user)) {
              // User not authorized to view this private asset
              set.status = 403;
              return null;
            }

            const fullPath = path.join(
              rootDir,
              "gdd-assets",
              assetId,
              filePath,
            );

            // Security check to prevent directory traversal
            const normalizedPath = path.normalize(fullPath);
            const assetDir = path.join(rootDir, "gdd-assets", assetId);

            if (!normalizedPath.startsWith(assetDir)) {
              set.status = 403;
              return null;
            }

            const file = Bun.file(fullPath);

            if (!(await file.exists())) {
              set.status = 404;
            } else {
              set.status = 200;
            }

            return null;
          } catch (error) {
            console.error(`[HEAD /:id/*] Error:`, error);
            context.set.status = 500;
            return null;
          }
        })

        // Delete asset endpoint
        // SECURED: Requires authentication and ownership check
        .delete(
          "/:id",
          async (context) => {
            const { params, query, set } = context;
            const id = params.id;

            // Require authentication
            const authResult = await requireAuth(context);
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
            const authResult = await requireAuth(context);
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

            console.log(
              `[Sprites] Saving ${sprites.length} sprites for asset: ${id}`,
            );

            // Create sprites directory
            const assetDir = path.join(rootDir, "gdd-assets", id);
            const spritesDir = path.join(assetDir, "sprites");

            console.log(`[Sprites] Creating directory: ${spritesDir}`);
            await fs.promises.mkdir(spritesDir, { recursive: true });

            // Save each sprite image
            for (const sprite of sprites) {
              const { angle, imageData } = sprite;

              // Extract base64 data from data URL
              const base64Data = imageData.replace(
                /^data:image\/\w+;base64,/,
                "",
              );
              const buffer = Buffer.from(base64Data, "base64");

              // Save as PNG file using Bun.write
              const filename = `${angle}deg.png`;
              const filepath = path.join(spritesDir, filename);
              await Bun.write(filepath, buffer);
              console.log(
                `[Sprites] Saved: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`,
              );
            }

            // Save sprite metadata
            const spriteMetadata = {
              assetId: id,
              config: config || {},
              angles: sprites.map((s) => s.angle),
              spriteCount: sprites.length,
              status: "completed",
              generatedAt: new Date().toISOString(),
            };

            const metadataPath = path.join(assetDir, "sprite-metadata.json");
            await Bun.write(
              metadataPath,
              JSON.stringify(spriteMetadata, null, 2),
            );
            console.log(`[Sprites] Saved sprite-metadata.json`);

            // Update asset metadata to indicate sprites are available
            const assetMetadataPath = path.join(assetDir, "metadata.json");
            const currentMetadata = JSON.parse(
              await fs.promises.readFile(assetMetadataPath, "utf-8"),
            );

            // Update with sprite info
            const updatedMetadata = {
              ...currentMetadata,
              hasSpriteSheet: true,
              spriteCount: sprites.length,
              spriteConfig: config,
              lastSpriteGeneration: new Date().toISOString(),
              thumbnailPath: "sprites/0deg.png", // Use the first sprite (0 degrees) as thumbnail
              updatedAt: new Date().toISOString(),
            };

            await Bun.write(
              assetMetadataPath,
              JSON.stringify(updatedMetadata, null, 2),
            );
            console.log(`[Sprites] Updated asset metadata with sprite info`);

            return {
              success: true,
              message: `${sprites.length} sprites saved successfully`,
              spritesDir: `gdd-assets/${id}/sprites`,
              spriteFiles: sprites.map((s) => `${s.angle}deg.png`),
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

            console.log(
              `[VRM Upload] Uploading ${filename} for asset: ${assetId}`,
            );
            console.log(
              `[VRM Upload] File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
            );

            // Save VRM to asset directory
            const assetDir = path.join(rootDir, "gdd-assets", assetId);

            // Create directory if it doesn't exist
            await fs.promises.mkdir(assetDir, { recursive: true });

            // Save VRM file
            const vrmPath = path.join(assetDir, filename);
            await Bun.write(vrmPath, file);

            console.log(`[VRM Upload] Saved to: ${vrmPath}`);

            // Return success with URL
            const url = `/gdd-assets/${assetId}/${filename}`;
            return {
              success: true,
              url,
              message: `VRM uploaded successfully to ${url}`,
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

            console.log(
              `[Bulk Update] Updating ${assetIds.length} assets with:`,
              updates,
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
                console.error(
                  `[Bulk Update] Failed to update ${assetId}:`,
                  err.message,
                );
              }
            }

            console.log(
              `[Bulk Update] Complete: ${updated} updated, ${failed} failed`,
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
