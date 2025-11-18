/**
 * Generation Pipeline Routes
 * AI-powered 3D asset generation pipeline endpoints
 */

import { Elysia, t } from "elysia";
import type { GenerationService } from "../services/GenerationService";
import { optionalAuth } from "../plugins/auth.plugin";
import * as Models from "../models";
import { UnauthorizedError, NotFoundError } from "../errors";
import { createChildLogger } from "../utils/logger";
import { generationPipelineService } from "../services/GenerationPipelineService";
import { ActivityLogService } from "../services/ActivityLogService";

const logger = createChildLogger("GenerationRoutes");

export const createGenerationRoutes = (
  getGenerationService: () => GenerationService,
) =>
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

              // Generate unique pipeline ID (UUID)
              const id = crypto.randomUUID();

              // Apply smart defaults for optional fields
              const configWithDefaults = {
                ...body,
                // Auto-generate assetId from name if not provided
                assetId:
                  body.assetId ||
                  `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
                // Use provided type or default to "item"
                type: body.type || "item",
                // Use provided subtype or default to "general"
                subtype: body.subtype || "general",
                // Apply other defaults
                tier: body.tier ?? 1,
                quality: body.quality || "balanced",
                style: body.style || "fantasy",
                enableRigging: body.enableRigging ?? false,
                enableRetexturing: body.enableRetexturing ?? false,
                enableSprites: body.enableSprites ?? false,
                // Inject user context from authentication
                user: {
                  userId,
                  walletAddress: authUser.walletAddress || undefined,
                  isAdmin: authUser.isAdmin || false,
                },
              };

              logger.info(
                {
                  providedFields: Object.keys(body),
                  generatedAssetId: !body.assetId,
                  appliedDefaults: {
                    type: !body.type,
                    subtype: !body.subtype,
                    tier: body.tier === undefined,
                  },
                },
                "Applied smart defaults to pipeline config",
              );

              // Create pipeline in database
              const pipeline = await generationPipelineService.createPipeline(
                id,
                configWithDefaults as any,
              );

              logger.info(
                { pipelineId: id, userId },
                "Pipeline created, starting processing",
              );

              // Log generation started
              await ActivityLogService.logGenerationStarted({
                userId,
                pipelineId: id,
                generationType: body.type || "3d-asset",
                assetName: body.name,
                request,
              });

              // Get GenerationService instance (lazy-loaded on first use)
              const generationService = getGenerationService();

              // Start processing asynchronously (no worker queue needed)
              generationService
                .processPipelineFromJob(pipeline)
                .catch(async (error) => {
                  logger.error(
                    { err: error, pipelineId: id },
                    "Pipeline processing failed",
                  );
                  await generationPipelineService.updateJob(id, {
                    status: "failed",
                    error: error.message,
                    completedAt: new Date(),
                  });

                  // Log generation failed
                  await ActivityLogService.logGenerationCompleted({
                    userId,
                    pipelineId: id,
                    success: false,
                  });
                });

              // Return immediately with processing status
              return {
                pipelineId: id,
                status: "processing",
                message: "Generation pipeline started successfully",
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
                  description:
                    "Pipeline configuration for asset generation. Only name and description are required - all other fields have smart defaults.",
                  content: {
                    "application/json": {
                      examples: {
                        minimal: {
                          summary: "Minimal request (recommended)",
                          value: {
                            name: "Quest Giver",
                            description:
                              "Quest giver NPC in T-pose, wearing ornate robes with mystical symbols, RuneScape 3 style",
                          },
                        },
                        weapon: {
                          summary: "Generate a fantasy sword",
                          value: {
                            name: "Dragon Blade",
                            description:
                              "A glowing dragon-themed sword with red runes and intricate patterns",
                            type: "weapon",
                            subtype: "sword",
                            tier: 3,
                            style: "fantasy",
                          },
                        },
                        withOptions: {
                          summary: "With optional settings",
                          value: {
                            name: "Quantum Armor",
                            description:
                              "Futuristic energy-based chest armor with blue glow",
                            type: "armor",
                            subtype: "chest",
                            tier: 5,
                            style: "sci-fi",
                            quality: "high",
                            enableRigging: true,
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
                            summary: "Pipeline started",
                            value: {
                              pipelineId: "pipe_abc123xyz",
                              status: "processing",
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
            async (context) => {
              const { pipelineId } = context.params;

              // Get job from generation_jobs table (where POST creates it)
              const job =
                await generationPipelineService.getJobByPipelineId(pipelineId);

              if (!job) {
                throw new NotFoundError("Pipeline", pipelineId);
              }

              // Convert job to pipeline format for API response
              const status = generationPipelineService.jobToPipeline(job);
              return status;
            },
            {
              params: t.Object({
                pipelineId: t.String({ minLength: 1 }),
              }),
              response: {
                // Don't enforce response type - let Elysia infer the actual type
                // The jobToPipeline method returns Pipeline type which has a different structure
                // than PipelineStatus (stages don't have 'name' property)
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
            async (context) => {
              const { pipelineId } = context.params;
              const { set } = context;

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
                        await generationPipelineService.getJobByPipelineId(
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
                      const status =
                        generationPipelineService.jobToPipeline(job);

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
