/**
 * Generation Pipeline Repository
 * Database operations for AI generation pipeline state management
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import {
  generationPipelines,
  type GenerationPipeline,
  type NewGenerationPipeline,
} from "../db/schema/generation-pipelines.schema";
import { eq, and, lte, desc, inArray } from "drizzle-orm";
import { BaseRepository } from "./BaseRepository";

export interface PipelineFilters {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class GenerationPipelineRepository extends BaseRepository<
  typeof generationPipelines
> {
  constructor() {
    super(generationPipelines, "GenerationPipelineRepository");
  }

  /**
   * Find pipelines by user ID
   */
  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<GenerationPipeline[]> {
    return this.findMany(
      { userId: eq(generationPipelines.userId, userId) },
      options,
    );
  }

  /**
   * Find pipelines by status
   */
  async findByStatus(status: string): Promise<GenerationPipeline[]> {
    return this.findMany({
      status: eq(generationPipelines.status, status as any),
    });
  }

  /**
   * Find pipeline by Meshy task ID
   */
  async findByMeshyTaskId(taskId: string): Promise<GenerationPipeline | null> {
    return this.findOne({
      meshyTaskId: eq(generationPipelines.meshyTaskId, taskId),
    });
  }

  /**
   * Update pipeline progress
   */
  async updateProgress(
    id: string,
    progress: number,
    currentStage?: string,
  ): Promise<GenerationPipeline | null> {
    const updateData: any = {
      progress,
    };

    if (currentStage) {
      updateData.currentStage = currentStage;
    }

    return this.update(id, updateData);
  }

  /**
   * Update pipeline status
   */
  async updateStatus(
    id: string,
    status: string,
    error?: string,
  ): Promise<GenerationPipeline | null> {
    return this.executeQuery(async () => {
      const updateData: any = {
        status: status as any,
      };

      if (error) {
        updateData.error = error;
      }

      if (status === "completed" || status === "failed") {
        updateData.completedAt = new Date();
      }

      if (status === "processing" && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }

      return this.update(id, updateData);
    }, "updateStatus");
  }

  /**
   * Find expired pipelines
   */
  async findExpired(): Promise<GenerationPipeline[]> {
    return this.executeQuery(async () => {
      const now = new Date();

      const pipelines = await db
        .select()
        .from(generationPipelines)
        .where(
          and(
            lte(generationPipelines.expiresAt, now),
            inArray(generationPipelines.status, [
              "completed",
              "failed",
              "cancelled",
            ]),
          ),
        );

      return pipelines;
    }, "findExpired");
  }

  /**
   * Clean up old completed pipelines
   * Removes pipelines older than the threshold
   */
  async cleanupOldPipelines(olderThan: Date): Promise<number> {
    return this.executeQuery(async () => {
      const result = await db
        .delete(generationPipelines)
        .where(
          and(
            lte(generationPipelines.completedAt, olderThan),
            inArray(generationPipelines.status, [
              "completed",
              "failed",
              "cancelled",
            ]),
          ),
        )
        .returning({ id: generationPipelines.id });

      const deletedCount = result.length;

      logger.info(
        { deletedCount, olderThan },
        "[GenerationPipelineRepository] Cleaned up old pipelines",
      );

      return deletedCount;
    }, "cleanupOldPipelines");
  }

  /**
   * Get pipeline statistics for a user
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    successRate: number;
  }> {
    return this.executeQuery(async () => {
      const pipelines = await db
        .select()
        .from(generationPipelines)
        .where(eq(generationPipelines.userId, userId));

      const total = pipelines.length;
      const completed = pipelines.filter(
        (p) => p.status === "completed",
      ).length;
      const failed = pipelines.filter((p) => p.status === "failed").length;
      const processing = pipelines.filter(
        (p) => p.status === "processing" || p.status === "initializing",
      ).length;

      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        failed,
        processing,
        successRate,
      };
    }, "getStatistics");
  }

  /**
   * Find pipelines with filters
   */
  async findManyWithFilters(
    filters: PipelineFilters,
  ): Promise<GenerationPipeline[]> {
    const conditions: Record<string, any> = {};

    if (filters.userId) {
      conditions.userId = eq(generationPipelines.userId, filters.userId);
    }

    if (filters.status) {
      conditions.status = eq(generationPipelines.status, filters.status as any);
    }

    return this.findMany(conditions, {
      limit: filters.limit,
      offset: filters.offset,
    });
  }
}

// Export singleton instance
export const generationPipelineRepository = new GenerationPipelineRepository();
