/**
 * VRM Conversion API Routes
 * Convert GLB files to VRM 1.0 format
 */

import { Elysia, t } from "elysia";
import { VRMConversionService } from "../services/VRMConversionService";
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from "../errors";
import { createChildLogger } from "../utils/logger";
import { authPlugin } from "../plugins/auth.plugin";

const logger = createChildLogger("VRMConversionRoutes");

export const vrmConversionRoutes = new Elysia({
  prefix: "/api/vrm",
  name: "vrm-conversion",
})

  // POST /api/vrm/convert - Convert GLB to VRM
  .post(
    "/convert",
    async ({ body }) => {
      const { file, glbUrl, options } = body as {
        file?: File;
        glbUrl?: string;
        options?: {
          avatarName?: string;
          author?: string;
          version?: string;
          commercialUsage?:
            | "personalNonProfit"
            | "personalProfit"
            | "corporation";
        };
      };

      logger.info(
        {
          hasFile: !!file,
          hasUrl: !!glbUrl,
          avatarName: options?.avatarName,
        },
        "VRM conversion request received",
      );

      // Validate input
      if (!file && !glbUrl) {
        throw new BadRequestError("Either 'file' or 'glbUrl' must be provided");
      }

      const vrmService = new VRMConversionService();

      try {
        let result;
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          logger.info(
            { fileSizeMB: (buffer.length / 1024 / 1024).toFixed(2) },
            "Converting from uploaded file",
          );
          result = await vrmService.convertGLBToVRM(buffer, options);
        } else if (glbUrl) {
          logger.info({ glbUrl }, "Converting from URL");
          result = await vrmService.convertGLBFromURL(glbUrl, options);
        }

        if (!result) {
          throw new InternalServerError("Conversion failed - no result");
        }

        logger.info(
          {
            vrmSizeMB: (result.vrmBuffer.length / 1024 / 1024).toFixed(2),
            bonesMapped: result.boneMappings.size,
            warnings: result.warnings.length,
          },
          "VRM conversion successful",
        );

        // Return VRM file as download (convert Buffer to Uint8Array for Blob)
        return new Response(
          new Blob([new Uint8Array(result.vrmBuffer)], {
            type: "application/octet-stream",
          }),
          {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${options?.avatarName || "avatar"}.vrm"`,
              "Content-Length": result.vrmBuffer.length.toString(),
              "X-VRM-Bones-Mapped": result.boneMappings.size.toString(),
              "X-VRM-Warnings": result.warnings.length.toString(),
              "X-VRM-Processing-Time-Ms":
                result.metadata.processingTimeMs.toString(),
            },
          },
        );
      } catch (error) {
        logger.error({ err: error }, "VRM conversion failed");
        throw new InternalServerError(
          `VRM conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      body: t.Object({
        file: t.Optional(t.File()),
        glbUrl: t.Optional(t.String({ format: "uri" })),
        options: t.Optional(
          t.Object({
            avatarName: t.Optional(t.String()),
            author: t.Optional(t.String()),
            version: t.Optional(t.String()),
            commercialUsage: t.Optional(
              t.Union([
                t.Literal("personalNonProfit"),
                t.Literal("personalProfit"),
                t.Literal("corporation"),
              ]),
            ),
          }),
        ),
      }),
      detail: {
        tags: ["VRM"],
        summary: "Convert GLB to VRM",
        description:
          "Converts a GLB file to VRM 1.0 format with standardized bone mappings, coordinate system, and T-pose normalization. Supports both file upload and URL input. Returns VRM file as binary download. (Auth optional - public API)",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "GLB file to convert (mutually exclusive with glbUrl)",
                  },
                  glbUrl: {
                    type: "string",
                    format: "uri",
                    description:
                      "URL to GLB file (mutually exclusive with file)",
                  },
                  options: {
                    type: "object",
                    properties: {
                      avatarName: { type: "string", example: "My Avatar" },
                      author: { type: "string", example: "John Doe" },
                      version: { type: "string", example: "1.0" },
                      commercialUsage: {
                        type: "string",
                        enum: [
                          "personalNonProfit",
                          "personalProfit",
                          "corporation",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "VRM file binary download",
            headers: {
              "Content-Type": {
                schema: { type: "string" },
                description: "application/octet-stream",
              },
              "Content-Disposition": {
                schema: { type: "string" },
                description: 'attachment; filename="avatar.vrm"',
              },
              "X-VRM-Bones-Mapped": {
                schema: { type: "string" },
                description: "Number of bones mapped to VRM standard",
              },
              "X-VRM-Warnings": {
                schema: { type: "string" },
                description: "Number of warnings during conversion",
              },
            },
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          400: {
            description: "Bad request - invalid input",
          },
          500: {
            description: "Internal server error during conversion",
          },
        },
      },
    },
  )

  // POST /api/vrm/convert-and-upload - Convert GLB to VRM and upload to CDN
  .use(authPlugin)
  .post(
    "/convert-and-upload",
    async ({ body, user }) => {
      // user is guaranteed to exist thanks to requireAuthGuard

      const { file, glbUrl, assetId, options } = body as {
        file?: File;
        glbUrl?: string;
        assetId: string;
        options?: {
          avatarName?: string;
          author?: string;
          version?: string;
          commercialUsage?:
            | "personalNonProfit"
            | "personalProfit"
            | "corporation";
        };
      };

      logger.info(
        {
          userId: user?.id || "anonymous",
          assetId,
          hasFile: !!file,
          hasUrl: !!glbUrl,
        },
        "VRM convert-and-upload request received",
      );

      // Validate input
      if (!file && !glbUrl) {
        throw new BadRequestError("Either 'file' or 'glbUrl' must be provided");
      }

      if (!assetId) {
        throw new BadRequestError("assetId is required");
      }

      const vrmService = new VRMConversionService();

      try {
        // Convert to VRM
        let result;
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          result = await vrmService.convertGLBToVRM(buffer, options);
        } else if (glbUrl) {
          result = await vrmService.convertGLBFromURL(glbUrl, options);
        }

        if (!result) {
          throw new InternalServerError("Conversion failed - no result");
        }

        logger.info(
          {
            assetId,
            vrmSizeMB: (result.vrmBuffer.length / 1024 / 1024).toFixed(2),
          },
          "VRM conversion complete, uploading to CDN",
        );

        // Upload to CDN
        const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
        const CDN_API_KEY = process.env.CDN_API_KEY;

        if (!CDN_API_KEY) {
          throw new InternalServerError(
            "CDN_API_KEY not configured for VRM uploads",
          );
        }

        const fileName = `${options?.avatarName || assetId}.vrm`;
        const cdnFormData = new FormData();
        const blob = new Blob([new Uint8Array(result.vrmBuffer)], {
          type: "application/octet-stream",
        });
        cdnFormData.append("files", blob, `${assetId}/${fileName}`);
        cdnFormData.append("directory", "models");

        const response = await fetch(`${CDN_URL}/api/upload`, {
          method: "POST",
          headers: {
            "X-API-Key": CDN_API_KEY,
          },
          body: cdnFormData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new InternalServerError(
            `Failed to upload VRM to CDN: ${errorText}`,
          );
        }

        const cdnUrl = `${CDN_URL}/models/${assetId}/${fileName}`;

        logger.info({ assetId, cdnUrl }, "VRM uploaded to CDN successfully");

        return {
          success: true,
          vrmUrl: cdnUrl,
          metadata: {
            originalSize: result.metadata.originalSize,
            convertedSize: result.metadata.convertedSize,
            bonesCount: result.metadata.bonesCount,
            bonesMapped: result.boneMappings.size,
            processingTimeMs: result.metadata.processingTimeMs,
          },
          warnings: result.warnings,
        };
      } catch (error) {
        logger.error({ err: error, assetId }, "VRM convert-and-upload failed");
        throw new InternalServerError(
          `VRM conversion or upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      body: t.Object({
        file: t.Optional(t.File()),
        glbUrl: t.Optional(t.String({ format: "uri" })),
        assetId: t.String({ minLength: 1, maxLength: 255 }),
        options: t.Optional(
          t.Object({
            avatarName: t.Optional(t.String()),
            author: t.Optional(t.String()),
            version: t.Optional(t.String()),
            commercialUsage: t.Optional(
              t.Union([
                t.Literal("personalNonProfit"),
                t.Literal("personalProfit"),
                t.Literal("corporation"),
              ]),
            ),
          }),
        ),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          vrmUrl: t.String(),
          metadata: t.Object({
            originalSize: t.Number(),
            convertedSize: t.Number(),
            bonesCount: t.Number(),
            bonesMapped: t.Number(),
            processingTimeMs: t.Number(),
          }),
          warnings: t.Array(t.String()),
        }),
        401: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        500: t.Object({
          error: t.String(),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["VRM"],
        summary: "Convert GLB to VRM and upload to CDN",
        description:
          "Converts GLB to VRM format and uploads the result to CDN. Returns CDN URL and conversion metadata. Requires authentication.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["assetId"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "GLB file to convert",
                  },
                  glbUrl: {
                    type: "string",
                    format: "uri",
                    description: "URL to GLB file",
                  },
                  assetId: {
                    type: "string",
                    description: "Asset ID for CDN organization",
                    example: "char-12345",
                  },
                  options: {
                    type: "object",
                    properties: {
                      avatarName: { type: "string" },
                      author: { type: "string" },
                      version: { type: "string" },
                      commercialUsage: {
                        type: "string",
                        enum: [
                          "personalNonProfit",
                          "personalProfit",
                          "corporation",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "VRM converted and uploaded successfully",
            content: {
              "application/json": {
                examples: {
                  success: {
                    summary: "Successful conversion and upload",
                    value: {
                      success: true,
                      vrmUrl:
                        "https://cdn.asset-forge.com/models/char-12345/warrior.vrm",
                      metadata: {
                        originalSize: 5242880,
                        convertedSize: 5300000,
                        bonesCount: 52,
                        bonesMapped: 24,
                        processingTimeMs: 1250,
                      },
                      warnings: [],
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Authentication required",
          },
          500: {
            description: "Conversion or upload failed",
          },
        },
      },
    },
  )

  // GET /api/vrm/info - Get GLB metadata for VRM conversion
  .get(
    "/info",
    async ({ query }) => {
      const { glbUrl } = query as { glbUrl?: string };

      if (!glbUrl) {
        throw new BadRequestError("glbUrl query parameter is required");
      }

      logger.info({ glbUrl }, "VRM info request received");

      try {
        // Download GLB file
        const response = await fetch(glbUrl);
        if (!response.ok) {
          throw new Error(`Failed to download GLB: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const glbBuffer = Buffer.from(arrayBuffer);

        // Create temporary VRM service just to analyze the GLB
        const vrmService = new VRMConversionService();

        // We'll load and analyze but not fully convert
        // This is a simplified version for metadata only
        logger.info(
          { fileSizeMB: (glbBuffer.length / 1024 / 1024).toFixed(2) },
          "Analyzing GLB structure",
        );

        return {
          success: true,
          fileSize: glbBuffer.length,
          fileSizeMB: (glbBuffer.length / 1024 / 1024).toFixed(2),
          message:
            "GLB file is accessible. Full conversion analysis requires conversion.",
          estimatedConversionTime: "5-15 seconds",
        };
      } catch (error) {
        logger.error({ err: error, glbUrl }, "VRM info check failed");
        throw new InternalServerError(
          `Failed to analyze GLB: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      query: t.Object({
        glbUrl: t.String({ format: "uri" }),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          fileSize: t.Number(),
          fileSizeMB: t.String(),
          message: t.String(),
          estimatedConversionTime: t.String(),
        }),
        400: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        500: t.Object({
          error: t.String(),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["VRM"],
        summary: "Get GLB metadata for VRM conversion",
        description:
          "Analyzes a GLB file and returns basic metadata about file size and conversion feasibility. Does not perform full conversion. (Auth optional - public API)",
        parameters: [
          {
            name: "glbUrl",
            in: "query",
            required: true,
            description: "URL to GLB file to analyze",
            schema: {
              type: "string",
              format: "uri",
              example:
                "https://cdn.asset-forge.com/models/char-123/character.glb",
            },
          },
        ],
        responses: {
          200: {
            description: "GLB metadata retrieved successfully",
            content: {
              "application/json": {
                examples: {
                  success: {
                    summary: "Valid GLB file",
                    value: {
                      success: true,
                      fileSize: 5242880,
                      fileSizeMB: "5.00",
                      message:
                        "GLB file is accessible. Full conversion analysis requires conversion.",
                      estimatedConversionTime: "5-15 seconds",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or invalid glbUrl parameter",
          },
          500: {
            description: "Failed to access or analyze GLB file",
          },
        },
      },
    },
  );
