/**
 * Generation Queue API Routes
 * Endpoints for managing and monitoring generation jobs
 */

import { Elysia, t } from "elysia";
import { generationJobService } from "../services/GenerationJobService";
import { redisQueueService } from "../services/RedisQueueService";

export const generationQueueRoutes = new Elysia({ prefix: "/api/generation" })
  /**
   * Get job status by pipeline ID
   */
  .get(
    "/jobs/:pipelineId",
    async ({ params: { pipelineId }, set }) => {
      const job = await generationJobService.getJobByPipelineId(pipelineId);

      if (!job) {
        set.status = 404;
        return { error: "Job not found" };
      }

      return {
        id: job.id,
        pipelineId: job.pipelineId,
        assetId: job.assetId,
        assetName: job.assetName,
        status: job.status,
        progress: job.progress,
        stages: job.stages,
        results: job.results,
        finalAsset: job.finalAsset,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        lastUpdatedAt: job.lastUpdatedAt,
      };
    },
    {
      params: t.Object({
        pipelineId: t.String(),
      }),
      response: {
        200: t.Object({
          id: t.String(),
          pipelineId: t.String(),
          assetId: t.Nullable(t.String()),
          assetName: t.Nullable(t.String()),
          status: t.String(),
          progress: t.Number(),
          stages: t.Any(),
          results: t.Any(),
          finalAsset: t.Any(),
          error: t.Nullable(t.String()),
          createdAt: t.Any(),
          startedAt: t.Nullable(t.Any()),
          completedAt: t.Nullable(t.Any()),
          lastUpdatedAt: t.Any(),
        }),
        404: t.Object({
          error: t.String(),
        }),
      },
    },
  )

  /**
   * Get job status with Server-Sent Events for real-time updates
   */
  .get(
    "/jobs/:pipelineId/stream",
    async ({ params: { pipelineId }, set }) => {
      const job = await generationJobService.getJobByPipelineId(pipelineId);

      if (!job) {
        set.status = 404;
        return { error: "Job not found" };
      }

      // Set SSE headers
      set.headers["content-type"] = "text/event-stream";
      set.headers["cache-control"] = "no-cache";
      set.headers["connection"] = "keep-alive";

      // Create a stream
      const stream = new ReadableStream({
        async start(controller) {
          // Send initial state
          controller.enqueue(
            `data: ${JSON.stringify({
              type: "initial",
              status: job.status,
              progress: job.progress,
              stages: job.stages,
            })}\n\n`,
          );

          // Subscribe to Redis pub/sub for updates
          await redisQueueService.subscribeToProgress(
            pipelineId,
            (data: any) => {
              controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

              // Close stream if job is completed or failed
              if (data.status === "completed" || data.status === "failed") {
                controller.close();
              }
            },
          );
        },
      });

      return new Response(stream);
    },
    {
      params: t.Object({
        pipelineId: t.String(),
      }),
    },
  )

  /**
   * Cancel a job
   */
  .delete(
    "/jobs/:pipelineId",
    async ({ params: { pipelineId }, set }) => {
      const job = await generationJobService.getJobByPipelineId(pipelineId);

      if (!job) {
        set.status = 404;
        return { error: "Job not found" };
      }

      // Can only cancel jobs that are initializing or processing
      if (job.status !== "initializing" && job.status !== "processing") {
        set.status = 400;
        return {
          error: `Cannot cancel job with status: ${job.status}`,
        };
      }

      // Remove from Redis queue
      await redisQueueService.removeJob(job.id);

      // Update database
      await generationJobService.updateJob(pipelineId, {
        status: "failed",
        error: "Cancelled by user",
        completedAt: new Date(),
      });

      // Publish cancellation
      await redisQueueService.publishProgress(pipelineId, {
        status: "failed",
        progress: 0,
        error: "Cancelled by user",
      });

      return {
        success: true,
        message: "Job cancelled",
      };
    },
    {
      params: t.Object({
        pipelineId: t.String(),
      }),
    },
  )

  /**
   * Get queue statistics
   */
  .get("/queue/stats", async () => {
    const stats = await redisQueueService.getStats();

    return {
      queues: {
        high: stats.high,
        normal: stats.normal,
        low: stats.low,
      },
      total: stats.total,
      timestamp: new Date().toISOString(),
    };
  })

  /**
   * Get user's jobs
   */
  .get(
    "/users/:userId/jobs",
    async ({ params: { userId }, query }) => {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const jobs = await generationJobService.getUserJobs(userId, limit);

      return {
        jobs: jobs.map((job) => ({
          id: job.id,
          pipelineId: job.pipelineId,
          assetId: job.assetId,
          assetName: job.assetName,
          status: job.status,
          progress: job.progress,
          error: job.error,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        })),
        total: jobs.length,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    },
  );
