/**
 * Retexture Routes
 * Asset retexturing and base model regeneration endpoints
 */

import { Elysia, t } from "elysia";
import path from "path";
import { RetextureService } from "../services/RetextureService";
import * as Models from "../models";
import { getUserApiKeysWithFallback } from "../utils/getUserApiKeys";
import { InternalServerError } from "../errors";

export const createRetextureRoutes = (
  rootDir: string,
  _retextureService: RetextureService, // Keep param for backward compatibility but don't use
  assetsDir: string,
) => {
  return (
    new Elysia({ prefix: "/api", name: "retexture" })
      .derive(() => ({ assetsDir }))
      // Retexture endpoint
      .post(
        "/retexture",
        async ({ body, user, assetsDir }) => {
          // Fetch user's API keys with env fallback
          const userApiKeys = user?.id
            ? await getUserApiKeysWithFallback(user.id)
            : { meshyApiKey: process.env.MESHY_API_KEY };

          // Check if Meshy key is configured
          if (!userApiKeys.meshyApiKey) {
            throw new InternalServerError(
              "Meshy API key not configured. Please add your API key in Settings → API Keys.",
            );
          }

          // Create RetextureService instance with user's API key
          const imageServerBaseUrl =
            process.env.IMAGE_SERVER_URL ||
            (() => {
              if (process.env.NODE_ENV === "production") {
                throw new Error(
                  "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
                );
              }
              return "http://localhost:8080";
            })();

          const retextureService = new RetextureService({
            meshyApiKey: userApiKeys.meshyApiKey,
            imageServerBaseUrl,
          });

          const result = await retextureService.retexture({
            baseAssetId: body.baseAssetId,
            materialPreset: body.materialPreset,
            customPrompt: body.customPrompt,
            imageUrl: body.imageUrl,
            artStyle: body.artStyle,
            outputName: body.outputName,
            assetsDir,
            user: body.user, // User context is already part of the body schema
          });

          return result;
        },
        {
          body: Models.RetextureRequest,
          response: Models.RetextureResponse,
          detail: {
            tags: ["Retexturing"],
            summary: "Generate material variant",
            description:
              "Creates a new material variant of an existing asset using Meshy AI. (Auth optional - authenticated users get ownership tracking)",
          },
        },
      )

      // Regenerate base model endpoint
      .post(
        "/regenerate-base/:baseAssetId",
        async ({ params: { baseAssetId }, user, assetsDir }) => {
          // Fetch user's API keys with env fallback
          const userApiKeys = user?.id
            ? await getUserApiKeysWithFallback(user.id)
            : { meshyApiKey: process.env.MESHY_API_KEY };

          // Check if Meshy key is configured
          if (!userApiKeys.meshyApiKey) {
            throw new InternalServerError(
              "Meshy API key not configured. Please add your API key in Settings → API Keys.",
            );
          }

          // Create RetextureService instance with user's API key
          const imageServerBaseUrl =
            process.env.IMAGE_SERVER_URL ||
            (() => {
              if (process.env.NODE_ENV === "production") {
                throw new Error(
                  "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
                );
              }
              return "http://localhost:8080";
            })();

          const retextureService = new RetextureService({
            meshyApiKey: userApiKeys.meshyApiKey,
            imageServerBaseUrl,
          });

          const result = await retextureService.regenerateBase({
            baseAssetId,
            assetsDir,
          });

          return result;
        },
        {
          params: t.Object({
            baseAssetId: t.String({ minLength: 1 }),
          }),
          response: Models.RegenerateBaseResponse,
          detail: {
            tags: ["Retexturing"],
            summary: "Regenerate base model",
            description:
              "Regenerates the base 3D model using Meshy AI. (Auth optional - authenticated users get ownership tracking)",
          },
        },
      )
  );
};
