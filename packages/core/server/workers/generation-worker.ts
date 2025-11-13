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

      // Start the generation pipeline using the public API
      // Note: GenerationService.startPipeline creates its own pipeline ID,
      // so we poll for status and sync to our database job
      const response = await this.generationService.startPipeline(
        job.config as any,
      );

      // Poll for completion and sync progress
      let completed = false;
      while (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds

        const status = await this.generationService.getPipelineStatus(
          response.pipelineId,
        );

        // Update our database job with the status
        await this.jobService.updateJob(queueJob.pipelineId, {
          progress: status.progress,
          stages: status.stages as unknown as Record<string, unknown>,
        });

        // Publish progress to Redis
        await this.queueService.publishProgress(queueJob.pipelineId, {
          status: status.status,
          progress: status.progress,
          stage: status.status,
        });

        if (status.status === "completed" || status.status === "failed") {
          completed = true;

          if (status.status === "failed") {
            throw new Error(status.error || "Pipeline failed");
          }

          // Mark as completed
          await this.jobService.updateJob(queueJob.pipelineId, {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            stages: status.stages as unknown as Record<string, unknown>,
            results: status.results,
          });
        }
      }

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

      // Get current retry count from error message
      const errorMatch = job.error?.match(/Attempt (\d+) failed/);
      const currentRetry = errorMatch ? parseInt(errorMatch[1], 10) : 0;
      const retryCount = currentRetry + 1;

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
