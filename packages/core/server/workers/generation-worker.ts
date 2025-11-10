/**
 * Generation Worker
 * Background worker that processes generation jobs from Redis queue
 */

import { RedisQueueService } from "../services/RedisQueueService";
import { GenerationJobService } from "../services/GenerationJobService";
import { GenerationService } from "../services/GenerationService";

const MAX_RETRIES = parseInt(process.env.MAX_JOB_RETRIES || "3", 10);
const POLL_TIMEOUT = parseInt(process.env.QUEUE_POLL_TIMEOUT || "5", 10);

export class GenerationWorker {
  private queueService: RedisQueueService;
  private jobService: GenerationJobService;
  private generationService: GenerationService;
  private isRunning = false;
  private workerId: string;

  constructor(workerId: string) {
    this.workerId = workerId;
    this.queueService = new RedisQueueService();
    this.jobService = new GenerationJobService();
    this.generationService = new GenerationService();

    console.log(`[Worker ${this.workerId}] Initialized`);
  }

  /**
   * Start the worker loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[Worker ${this.workerId}] Starting...`);

    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error(`[Worker ${this.workerId}] Unexpected error:`, error);
        // Wait before retrying to avoid tight loop on persistent errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log(`[Worker ${this.workerId}] Stopped`);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    console.log(`[Worker ${this.workerId}] Stopping...`);
    this.isRunning = false;
  }

  /**
   * Process the next job from the queue
   */
  private async processNextJob(): Promise<void> {
    // Dequeue with blocking timeout
    const queueJob = await this.queueService.dequeue(POLL_TIMEOUT);

    if (!queueJob) {
      // Timeout reached, no job available - loop will continue
      return;
    }

    console.log(
      `[Worker ${this.workerId}] Processing job ${queueJob.pipelineId}`,
    );

    // Load full job from database
    const job = await this.jobService.getJobByPipelineId(queueJob.pipelineId);

    if (!job) {
      console.error(
        `[Worker ${this.workerId}] Job ${queueJob.pipelineId} not found in database`,
      );
      return;
    }

    // Check if job is already being processed or completed
    if (job.status !== "initializing" && job.status !== "processing") {
      console.log(
        `[Worker ${this.workerId}] Job ${queueJob.pipelineId} is ${job.status}, skipping`,
      );
      return;
    }

    try {
      // Mark as processing
      await this.jobService.updateJob(queueJob.pipelineId, {
        status: "processing",
        startedAt: new Date(),
      });

      await this.queueService.publishProgress(queueJob.pipelineId, {
        status: "processing",
        progress: 0,
      });

      // Convert job to pipeline format
      const pipeline = this.jobService.jobToPipeline(job);

      // Process the generation pipeline
      await this.generationService.processPipeline(
        queueJob.pipelineId,
        pipeline,
        {
          onProgress: async (progress, stage) => {
            // Update database
            await this.jobService.updateJob(queueJob.pipelineId, {
              progress,
              stages: pipeline.stages as unknown as Record<string, unknown>,
            });

            // Publish to Redis for real-time updates
            await this.queueService.publishProgress(queueJob.pipelineId, {
              status: "processing",
              progress,
              stage,
            });
          },
        },
      );

      // Mark as completed
      await this.jobService.updateJob(queueJob.pipelineId, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        stages: pipeline.stages as unknown as Record<string, unknown>,
        results: pipeline.results,
        finalAsset: pipeline.finalAsset as unknown as Record<string, unknown>,
      });

      await this.queueService.publishProgress(queueJob.pipelineId, {
        status: "completed",
        progress: 100,
      });

      console.log(
        `[Worker ${this.workerId}] Job ${queueJob.pipelineId} completed successfully`,
      );
    } catch (error) {
      console.error(
        `[Worker ${this.workerId}] Job ${queueJob.pipelineId} failed:`,
        error,
      );

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Get current retry count
      const currentMetadata = (job.metadata as { retryCount?: number }) || {};
      const retryCount = (currentMetadata.retryCount || 0) + 1;

      if (retryCount < MAX_RETRIES) {
        // Re-queue for retry
        console.log(
          `[Worker ${this.workerId}] Re-queuing job ${queueJob.pipelineId} (attempt ${retryCount}/${MAX_RETRIES})`,
        );

        await this.jobService.updateJob(queueJob.pipelineId, {
          status: "processing", // Keep as processing for retry
          error: `Attempt ${retryCount} failed: ${errorMessage}`,
        });

        // Re-enqueue with exponential backoff delay
        const delayMs = Math.min(1000 * 2 ** retryCount, 60000); // Max 1 minute
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        await this.queueService.enqueue(
          job.id,
          queueJob.pipelineId,
          queueJob.priority,
        );
      } else {
        // Max retries reached, mark as failed
        await this.jobService.updateJob(queueJob.pipelineId, {
          status: "failed",
          error: errorMessage,
          completedAt: new Date(),
        });

        await this.queueService.publishProgress(queueJob.pipelineId, {
          status: "failed",
          progress: 0,
          error: errorMessage,
        });

        console.error(
          `[Worker ${this.workerId}] Job ${queueJob.pipelineId} failed after ${MAX_RETRIES} attempts`,
        );
      }
    }
  }
}

// If run directly (not as module), start a single worker
if (import.meta.main) {
  const workerId = process.env.WORKER_ID || "standalone";
  const worker = new GenerationWorker(workerId);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log(`[Worker ${workerId}] Received SIGTERM`);
    worker.stop();
  });

  process.on("SIGINT", () => {
    console.log(`[Worker ${workerId}] Received SIGINT`);
    worker.stop();
  });

  worker.start().catch((error) => {
    console.error(`[Worker ${workerId}] Fatal error:`, error);
    process.exit(1);
  });
}
