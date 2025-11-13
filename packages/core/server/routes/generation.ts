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
                401: Models.ErrorResponse,
                500: Models.ErrorResponse,
              },
              detail: {
                tags: ["Generation"],
                summary: "Start generation pipeline",
                description:
                  "Initiates a new AI-powered 3D asset generation pipeline using Meshy AI and OpenAI. The pipeline generates concept art, creates 3D models, and tracks generation progress. Requires Privy authentication for ownership tracking and job management.",
                security: [{ BearerAuth: [] }],
                requestBody: {
                  description: "Pipeline configuration for asset generation",
                  content: {
                    "application/json": {
                      examples: {
                        weapon: {
                          summary: "Generate a fantasy sword",
                          value: {
                            name: "Dragon Blade",
                            type: "weapon",
                            subtype: "sword",
                            tier: 3,
                            prompt:
                              "A glowing dragon-themed sword with red runes",
                            style: "fantasy",
                            artStyle: "realistic",
                            user: {
                              userId: "user_123456",
                            },
                          },
                        },
                        armor: {
                          summary: "Generate sci-fi armor",
                          value: {
                            name: "Quantum Armor",
                            type: "armor",
                            subtype: "chest",
                            tier: 5,
                            prompt:
                              "Futuristic energy-based chest armor with blue glow",
                            style: "sci-fi",
                            artStyle: "stylized",
                            projectId: "proj_abc123",
                            user: {
                              userId: "user_123456",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                responses: {
                  200: {
                    description: "Pipeline started successfully",
                    content: {
                      "application/json": {
                        examples: {
                          success: {
                            summary: "Pipeline created",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "started",
                              message:
                                "Generation pipeline started successfully",
                              stages: {
                                conceptArt: "pending",
                                model3D: "pending",
                                processing: "pending",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  401: {
                    description: "Authentication required",
                    content: {
                      "application/json": {
                        examples: {
                          unauthorized: {
                            summary: "Missing or invalid token",
                            value: {
                              error: "UNAUTHORIZED",
                              message:
                                "Authentication required. Please log in with Privy to create generation jobs.",
                            },
                          },
                        },
                      },
                    },
                  },
                  500: {
                    description:
                      "Internal server error during pipeline creation",
                    content: {
                      "application/json": {
                        examples: {
                          pipelineError: {
                            summary: "Pipeline creation failed",
                            value: {
                              error: "INTERNAL_SERVER_ERROR",
                              message:
                                "Failed to start pipeline - no pipeline ID returned",
                            },
                          },
                        },
                      },
                    },
                  },
                },
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
                  "Returns the current status and progress of a generation pipeline. Use this endpoint to poll for pipeline completion. Stages include: concept art generation, 3D model creation, and post-processing. (Auth optional - accessible by anyone with pipeline ID)",
                parameters: [
                  {
                    name: "pipelineId",
                    in: "path",
                    description:
                      "Unique pipeline identifier returned from pipeline creation",
                    required: true,
                    schema: {
                      type: "string",
                      example: "pipe_abc123xyz",
                    },
                  },
                ],
                responses: {
                  200: {
                    description: "Pipeline status retrieved successfully",
                    content: {
                      "application/json": {
                        examples: {
                          inProgress: {
                            summary: "Pipeline in progress",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "processing",
                              progress: 45,
                              currentStage: "model3D",
                              stages: {
                                conceptArt: "completed",
                                model3D: "processing",
                                processing: "pending",
                              },
                              createdAt: "2025-11-12T10:30:00.000Z",
                              updatedAt: "2025-11-12T10:32:15.000Z",
                            },
                          },
                          completed: {
                            summary: "Pipeline completed",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "completed",
                              progress: 100,
                              currentStage: "completed",
                              stages: {
                                conceptArt: "completed",
                                model3D: "completed",
                                processing: "completed",
                              },
                              assetId: "dragon-blade-tier3",
                              assetUrl:
                                "/gdd-assets/dragon-blade-tier3/model.glb",
                              createdAt: "2025-11-12T10:30:00.000Z",
                              updatedAt: "2025-11-12T10:35:42.000Z",
                              completedAt: "2025-11-12T10:35:42.000Z",
                            },
                          },
                          failed: {
                            summary: "Pipeline failed",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "failed",
                              progress: 30,
                              currentStage: "model3D",
                              error:
                                "Meshy AI generation failed: Invalid prompt",
                              stages: {
                                conceptArt: "completed",
                                model3D: "failed",
                                processing: "pending",
                              },
                              createdAt: "2025-11-12T10:30:00.000Z",
                              updatedAt: "2025-11-12T10:32:15.000Z",
                              failedAt: "2025-11-12T10:32:15.000Z",
                            },
                          },
                        },
                      },
                    },
                  },
                  404: {
                    description: "Pipeline not found",
                    content: {
                      "application/json": {
                        examples: {
                          notFound: {
                            summary: "Invalid pipeline ID",
                            value: {
                              error: "NOT_FOUND",
                              message:
                                "Pipeline not found with ID: pipe_invalid",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ),
    );
