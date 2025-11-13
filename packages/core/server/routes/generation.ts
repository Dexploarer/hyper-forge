/**
 * Generation Pipeline Routes
 * AI-powered 3D asset generation pipeline endpoints
 */

import { Elysia, t } from "elysia";
import type { GenerationService } from "../services/GenerationService";
import { optionalAuth } from "../middleware/auth";
import * as Models from "../models";
import { UnauthorizedError, InternalServerError } from "../errors";
import { createChildLogger } from "../utils/logger";

const logger = createChildLogger("GenerationRoutes");

export const createGenerationRoutes = (generationService: GenerationService) =>
  new Elysia({ prefix: "/api/generation", name: "generation" })
    .derive(async (context) => {
      // Extract user from auth token if present (optional)
      const authResult = await optionalAuth(context as any);
      return { user: authResult.user };
    })
    .guard(
      {
        beforeHandle: ({ request }) => {
          logger.debug(
            { method: request.method },
            "Generation pipeline request",
          );
        },
      },
      (app) =>
        app
          // Start generation pipeline
          .post(
            "/pipeline",
            async ({ body, user: authUser, request }) => {
              // Log auth status
              const authHeader = request.headers.get("authorization");
              logger.info(
                {
                  hasAuthHeader: !!authHeader,
                  hasAuthUser: !!authUser,
                  authUserId: authUser?.id,
                },
                "Pipeline start request received",
              );

              // If we have an authenticated user from Privy token, use it
              // This is the simplest and most secure approach
              if (!authUser) {
                throw new UnauthorizedError(
                  "Authentication required. Please log in with Privy to create generation jobs.",
                  { hasAuthHeader: !!authHeader },
                );
              }

              const userId = authUser.id;
              logger.info(
                { userId },
                "Starting pipeline for authenticated user",
              );

              // Update body with verified userId
              const configWithUser = {
                ...body,
                user: {
                  ...body.user,
                  userId,
                },
              };

              // Cast to GenerationService's PipelineConfig type which has slightly different user field typing
              const result = await generationService.startPipeline(
                configWithUser as Parameters<
                  typeof generationService.startPipeline
                >[0],
              );

              if (!result || !result.pipelineId) {
                throw new InternalServerError(
                  "Failed to start pipeline - no pipeline ID returned",
                );
              }

              logger.info(
                { pipelineId: result.pipelineId, userId },
                "Pipeline started successfully",
              );
              return result;
            },
            {
              body: Models.PipelineConfig,
              response: {
                200: Models.PipelineResponse,
                500: Models.ErrorResponse,
              },
              detail: {
                tags: ["Generation"],
                summary: "Start generation pipeline",
                description:
                  "Initiates a new AI-powered 3D asset generation pipeline. (Auth optional - authenticated users get ownership tracking)",
              },
            },
          )

          // Get pipeline status
          .get(
            "/pipeline/:pipelineId",
            async ({ params: { pipelineId } }) => {
              const status =
                await generationService.getPipelineStatus(pipelineId);
              return status;
            },
            {
              params: t.Object({
                pipelineId: t.String({ minLength: 1 }),
              }),
              response: {
                200: Models.PipelineStatus,
                404: Models.ErrorResponse,
              },
              detail: {
                tags: ["Generation"],
                summary: "Get pipeline status",
                description:
                  "Returns the current status and progress of a generation pipeline. (Auth optional)",
              },
            },
          ),
    );
