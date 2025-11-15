/**
 * Generation Pipeline Routes
 * AI-powered 3D asset generation pipeline endpoints
 */

import { Elysia, t } from "elysia";
import type { GenerationService } from "../services/GenerationService";
import { optionalAuth } from "../middleware/auth";
import * as Models from "../models";
import {
  UnauthorizedError,
  InternalServerError,
  NotFoundError,
} from "../errors";
import { createChildLogger } from "../utils/logger";
import { generationJobService } from "../services/GenerationJobService";
import { redisQueueService } from "../services/RedisQueueService";
import { ActivityLogService } from "../services/ActivityLogService";

const logger = createChildLogger("GenerationRoutes");

export const createGenerationRoutes = (generationService: GenerationService) =>
  new Elysia({ prefix: "/api/generation", name: "generation" })
    .derive(async (context) => {
      // Extract user from auth token if present (optional)
      const authResult = await optionalAuth({
        request: context.request,
        headers: context.headers,
      });
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

              // Generate unique pipeline ID
              const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              // Update body with verified userId
              const configWithUser = {
                ...body,
                user: {
                  ...body.user,
                  userId,
                },
              };

              // Create job in database
              await generationJobService.createJob(
                pipelineId,
                configWithUser as any,
              );

              // Enqueue job for worker processing
              // Use high priority for paid tiers, normal for default
              const priority = body.tier && body.tier >= 4 ? "high" : "normal";
              await redisQueueService.enqueue(pipelineId, pipelineId, priority);

              logger.info(
                { pipelineId, userId, priority },
                "Pipeline job queued successfully",
              );

              // Log generation started
              await ActivityLogService.logGenerationStarted({
                userId,
                pipelineId,
                generationType: body.type || "3d-asset",
                assetName: body.name,
                request,
              });

              // Return immediately with queued status
              return {
                pipelineId,
                status: "queued",
                message: "Generation pipeline queued successfully",
                stages: {
                  conceptArt: "pending",
                  model3D: "pending",
                  processing: "pending",
                },
              };
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
                            summary: "Pipeline queued",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "queued",
                              message:
                                "Generation pipeline queued successfully",
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
              // Get job from generation_jobs table (where POST creates it)
              const job =
                await generationJobService.getJobByPipelineId(pipelineId);

              if (!job) {
                throw new NotFoundError("Pipeline", pipelineId);
              }

              // Convert job to pipeline format for API response
              const status = generationJobService.jobToPipeline(job);
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
                                "https://cdn.asset-forge.com/models/dragon-blade-tier3/dragon-blade-tier3.glb",
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
          )

          // SSE endpoint for real-time pipeline status
          .get(
            "/:pipelineId/status/stream",
            async ({ params: { pipelineId }, set }) => {
              // Set SSE headers
              set.headers["content-type"] = "text/event-stream";
              set.headers["cache-control"] = "no-cache";
              set.headers["connection"] = "keep-alive";

              // Create a stream
              const stream = new ReadableStream({
                async start(controller) {
                  const sendUpdate = async () => {
                    try {
                      // Get job from generation_jobs table (same as GET endpoint)
                      const job =
                        await generationJobService.getJobByPipelineId(
                          pipelineId,
                        );

                      if (!job) {
                        const errorMessage = `event: error\ndata: ${JSON.stringify({ error: "Pipeline not found" })}\n\n`;
                        controller.enqueue(
                          new TextEncoder().encode(errorMessage),
                        );
                        controller.close();
                        return true; // Stop polling
                      }

                      // Convert job to pipeline format
                      const status = generationJobService.jobToPipeline(job);

                      // Send update
                      const message = `event: pipeline-update\ndata: ${JSON.stringify(status)}\nid: ${Date.now()}\n\n`;
                      controller.enqueue(new TextEncoder().encode(message));

                      // Close stream if completed or failed
                      if (
                        status.status === "completed" ||
                        status.status === "failed"
                      ) {
                        controller.close();
                        return true; // Stop polling
                      }

                      return false; // Continue polling
                    } catch (error) {
                      logger.error(
                        { context: "SSE", err: error },
                        "Error fetching pipeline status",
                      );
                      const errorMessage = `event: error\ndata: ${JSON.stringify({ error: "Failed to fetch status" })}\n\n`;
                      controller.enqueue(
                        new TextEncoder().encode(errorMessage),
                      );
                      return false;
                    }
                  };

                  // Send initial status
                  const shouldStop = await sendUpdate();
                  if (shouldStop) return;

                  // Poll every 2 seconds
                  const pollInterval = setInterval(async () => {
                    const shouldStop = await sendUpdate();
                    if (shouldStop) {
                      clearInterval(pollInterval);
                    }
                  }, 2000);

                  // Cleanup on client disconnect
                  // Note: ReadableStream doesn't have a built-in cancel handler,
                  // but the interval will be garbage collected when stream closes
                },
              });

              return new Response(stream);
            },
            {
              params: t.Object({
                pipelineId: t.String({ minLength: 1 }),
              }),
              detail: {
                tags: ["Generation"],
                summary: "Stream pipeline status via Server-Sent Events",
                description:
                  "Real-time updates for generation pipeline progress using SSE. Automatically closes connection when pipeline completes or fails. Updates sent every 2 seconds. (Auth optional - accessible by anyone with pipeline ID)",
                parameters: [
                  {
                    name: "pipelineId",
                    in: "path",
                    description: "Unique pipeline identifier",
                    required: true,
                    schema: {
                      type: "string",
                      example: "pipe_abc123xyz",
                    },
                  },
                ],
                responses: {
                  200: {
                    description: "SSE stream established",
                    content: {
                      "text/event-stream": {
                        schema: {
                          type: "string",
                          description:
                            "Server-sent events stream with pipeline-update events",
                        },
                        examples: {
                          sseEvent: {
                            summary: "SSE event format",
                            value:
                              'event: pipeline-update\ndata: {"id":"pipe_abc123xyz","status":"processing","progress":45}\nid: 1699564823000\n\n',
                          },
                        },
                      },
                    },
                  },
                  404: {
                    description: "Pipeline not found",
                  },
                },
              },
            },
          ),
    );
