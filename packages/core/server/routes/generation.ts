/**
 * Generation Pipeline Routes
 * AI-powered 3D asset generation pipeline endpoints
 */

import { Elysia, t } from "elysia";
import type { GenerationService } from "../services/GenerationService";
import { optionalAuth } from "../middleware/auth";
import { userService } from "../services/UserService";
import * as Models from "../models";

export const createGenerationRoutes = (
  generationService: GenerationService,
) => {
  return new Elysia({ prefix: "/api/generation", name: "generation" })
    .derive(async (context) => {
      // Extract user from auth token if present (optional)
      const authResult = await optionalAuth(context);
      return { user: authResult.user };
    })
    .guard(
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
            async ({ body, set, user: authUser, request }) => {
              try {
                // Log auth status
                const authHeader = request.headers.get("authorization");
                console.log(`[Generation Route] Request received:`, {
                  hasAuthHeader: !!authHeader,
                  authHeaderPrefix: authHeader?.substring(0, 20) + "...",
                  hasAuthUser: !!authUser,
                  authUserId: authUser?.id,
                  bodyUserId: body.user?.userId,
                });

                // If we have an authenticated user from Privy token, use it
                // Otherwise, allow anonymous generation (for testing/demo)
                let userId: string;
                if (authUser) {
                  userId = authUser.id;
                  console.log(
                    `[Generation Route] Using authenticated user ID: ${userId}`,
                  );
                } else if (body.user?.userId) {
                  // Allow provided userId for testing (not recommended for production)
                  userId = body.user.userId;
                  console.log(
                    `[Generation Route] Using provided user ID (unauthenticated): ${userId}`,
                  );
                } else {
                  // Anonymous generation - use a test user ID
                  userId = "anonymous-" + Date.now();
                  console.log(
                    `[Generation Route] Using anonymous user ID: ${userId}`,
                  );
                }

                // Update body with verified or generated userId
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

                // Extract error message
                let errorMessage = "Failed to start generation pipeline";
                if (error instanceof Error) {
                  errorMessage = error.message;
                } else if (typeof error === "string") {
                  errorMessage = error;
                } else if (
                  error &&
                  typeof error === "object" &&
                  "message" in error
                ) {
                  errorMessage = String(error.message);
                }

                // Log full error details for debugging
                console.error("[Generation Route] Full error details:", {
                  message: errorMessage,
                  error,
                  stack: error instanceof Error ? error.stack : undefined,
                });

                set.status = 500;
                return {
                  error: errorMessage,
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
