/**
 * Generation Pipeline Routes
 * AI-powered 3D asset generation pipeline endpoints
 */

import { Elysia, t } from "elysia";
import type { GenerationService } from "../services/GenerationService";
import * as Models from "../models";

export const createGenerationRoutes = (
  generationService: GenerationService,
) => {
  return new Elysia({ prefix: "/api/generation", name: "generation" }).guard(
    {
      beforeHandle: ({ request }) => {
        console.log(`[Generation Pipeline] ${request.method} operation`);
      },
    },
    (app) =>
      app
        // Start generation pipeline
        .post(
          "/pipeline",
          async ({ body, set }) => {
            try {
              // User context is already part of the body schema
              // Cast to GenerationService's PipelineConfig type which has slightly different user field typing
              const result = await generationService.startPipeline(
                body as Parameters<typeof generationService.startPipeline>[0],
              );

              if (!result || !result.pipelineId) {
                set.status = 500;
                return {
                  error: "Failed to start pipeline - no pipeline ID returned",
                };
              }

              return result;
            } catch (error) {
              console.error(
                "[Generation Route] Error starting pipeline:",
                error,
              );
              set.status = 500;
              return {
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to start generation pipeline",
              };
            }
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
};
