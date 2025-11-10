/**
 * Redis Queue Service
 * Manages job queuing using Bun's native Redis client
 */

export type QueuePriority = "high" | "normal" | "low";

export interface QueueJob {
  jobId: string;
  pipelineId: string;
  priority: QueuePriority;
  enqueuedAt: string;
}

export class RedisQueueService {
  private redis: ReturnType<typeof Bun.redis>;
  private readonly queues = {
    high: "generation:high",
    normal: "generation:normal",
    low: "generation:low",
  };
  private readonly progressChannel = "generation:progress";

  constructor() {
    // Bun.redis automatically uses REDIS_URL or defaults to localhost:6379
    this.redis = Bun.redis();
  }

  /**
   * Enqueue a job with priority
   */
  async enqueue(
    jobId: string,
    pipelineId: string,
    priority: QueuePriority = "normal",
  ): Promise<void> {
    const job: QueueJob = {
      jobId,
      pipelineId,
      priority,
      enqueuedAt: new Date().toISOString(),
    };

    const queueKey = this.queues[priority];
    await this.redis.lpush(queueKey, JSON.stringify(job));

    console.log(`[Queue] Enqueued job ${jobId} to ${queueKey}`);
  }

  /**
   * Dequeue next job (blocking operation)
   * Checks high priority first, then normal, then low
   */
  async dequeue(timeoutSeconds = 5): Promise<QueueJob | null> {
    try {
      // BRPOP checks queues in order and blocks until a job is available
      const result = (await this.redis.send("BRPOP", [
        this.queues.high,
        this.queues.normal,
        this.queues.low,
        timeoutSeconds.toString(),
      ])) as [string, string] | null;

      if (!result) return null;

      const [_queueKey, jobData] = result;
      const job = JSON.parse(jobData) as QueueJob;

      console.log(`[Queue] Dequeued job ${job.jobId}`);
      return job;
    } catch (error) {
      console.error("[Queue] Dequeue error:", error);
      return null;
    }
  }

  /**
   * Get queue length for a specific priority
   */
  async getQueueLength(priority: QueuePriority): Promise<number> {
    const queueKey = this.queues[priority];
    const length = await this.redis.send("LLEN", [queueKey]);
    return typeof length === "number" ? length : 0;
  }

  /**
   * Get total queue length across all priorities
   */
  async getTotalQueueLength(): Promise<number> {
    const [high, normal, low] = await Promise.all([
      this.getQueueLength("high"),
      this.getQueueLength("normal"),
      this.getQueueLength("low"),
    ]);
    return high + normal + low;
  }

  /**
   * Publish job progress update
   */
  async publishProgress(
    pipelineId: string,
    progress: {
      status: string;
      progress: number;
      stage?: string;
      error?: string;
    },
  ): Promise<void> {
    const message = JSON.stringify({
      pipelineId,
      ...progress,
      timestamp: new Date().toISOString(),
    });

    await this.redis.publish(`job:${pipelineId}:progress`, message);
    await this.redis.publish(this.progressChannel, message);
  }

  /**
   * Subscribe to job progress updates
   */
  async subscribeToProgress(
    pipelineId: string,
    callback: (data: unknown) => void,
  ): Promise<void> {
    await this.redis.subscribe(`job:${pipelineId}:progress`, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error("[Queue] Failed to parse progress message:", error);
      }
    });
  }

  /**
   * Subscribe to all progress updates
   */
  async subscribeToAllProgress(
    callback: (data: unknown) => void,
  ): Promise<void> {
    await this.redis.subscribe(this.progressChannel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error("[Queue] Failed to parse progress message:", error);
      }
    });
  }

  /**
   * Remove job from queue (for cancellation)
   */
  async removeJob(jobId: string): Promise<boolean> {
    for (const queueKey of Object.values(this.queues)) {
      const items = (await this.redis.send("LRANGE", [
        queueKey,
        "0",
        "-1",
      ])) as string[];

      for (let i = 0; i < items.length; i++) {
        const job = JSON.parse(items[i]) as QueueJob;
        if (job.jobId === jobId) {
          await this.redis.send("LREM", [queueKey, "1", items[i]]);
          console.log(`[Queue] Removed job ${jobId} from ${queueKey}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    high: number;
    normal: number;
    low: number;
    total: number;
  }> {
    const [high, normal, low] = await Promise.all([
      this.getQueueLength("high"),
      this.getQueueLength("normal"),
      this.getQueueLength("low"),
    ]);

    return {
      high,
      normal,
      low,
      total: high + normal + low,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    // Bun.redis doesn't have an explicit close method in the current API
    // The connection will be cleaned up automatically
    console.log("[Queue] Redis connection closed");
  }
}

// Export singleton instance
export const redisQueueService = new RedisQueueService();
