/**
 * Generation Pipeline Repository
 * Handles database operations for AI generation pipelines
 * Replaces in-memory Map storage with persistent database state
 */

import { BaseRepository } from "./BaseRepository";
import { db } from "../db/db";
import {
  generationPipelines,
  pipelineStages,
  type GenerationPipeline,
  type NewGenerationPipeline,
  type PipelineStage,
  type NewPipelineStage,
} from "../db/schema/generation-pipelines.schema";
import { eq, and, desc, asc, sql, lt, inArray } from "drizzle-orm";
import { logger } from "../utils/logger";

/**
 * Pipeline with stages
 */
export interface PipelineWithStages extends GenerationPipeline {
  stages: PipelineStage[];
}

/**
 * Generation Pipeline Repository
 */
export class GenerationPipelineRepository extends BaseRepository<
  typeof generationPipelines,
  GenerationPipeline,
  NewGenerationPipeline
> {
  constructor() {
    super(generationPipelines);
  }

  /**
   * Find pipelines by user ID with pagination
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string[];
    },
  ): Promise<GenerationPipeline[]> {
    try {
      const conditions = [eq(generationPipelines.userId, userId)];

      if (options?.status && options.status.length > 0) {
        conditions.push(
          inArray(generationPipelines.status, options.status as any),
        );
      }

      return this.findMany({
        where: and(...conditions),
        orderBy: desc(generationPipelines.createdAt),
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      });
    } catch (err) {
      logger.error({ err, userId }, "Failed to find pipelines by user ID");
      throw err;
    }
  }

  /**
   * Find pipelines by status
   */
  async findByStatus(status: string | string[]): Promise<GenerationPipeline[]> {
    try {
      const statusArray = Array.isArray(status) ? status : [status];
      return this.findMany({
        where: inArray(generationPipelines.status, statusArray as any),
        orderBy: asc(generationPipelines.createdAt),
      });
    } catch (err) {
      logger.error({ err, status }, "Failed to find pipelines by status");
      throw err;
    }
  }

  /**
   * Find pipeline by Meshy task ID
   */
  async findByMeshyTaskId(
    taskId: string,
  ): Promise<GenerationPipeline | undefined> {
    try {
      return this.findOne(eq(generationPipelines.meshyTaskId, taskId));
    } catch (err) {
      logger.error({ err, taskId }, "Failed to find pipeline by Meshy task ID");
      throw err;
    }
  }

  /**
   * Find pipeline with all stages
   */
  async findWithStages(id: string): Promise<PipelineWithStages | undefined> {
    try {
      const pipeline = await this.findById(id);
      if (!pipeline) {
        return undefined;
      }

      const stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, id))
        .orderBy(asc(pipelineStages.stageOrder));

      return {
        ...pipeline,
        stages,
      };
    } catch (err) {
      logger.error({ err, id }, "Failed to find pipeline with stages");
      throw err;
    }
  }

  /**
   * Create pipeline with stages in a transaction
   */
  async createWithStages(
    pipelineData: NewGenerationPipeline,
    stagesData: Omit<NewPipelineStage, "pipelineId">[],
  ): Promise<PipelineWithStages> {
    try {
      return await this.transaction(async (tx) => {
        // Create pipeline
        const [pipeline] = await tx
          .insert(generationPipelines)
          .values(pipelineData)
          .returning();

        // Create stages
        const stages = await tx
          .insert(pipelineStages)
          .values(
            stagesData.map((stage, index) => ({
              ...stage,
              pipelineId: pipeline.id,
              stageOrder: index,
            })),
          )
          .returning();

        return {
          ...pipeline,
          stages,
        };
      });
    } catch (err) {
      logger.error(
        { err, pipelineData, stagesCount: stagesData.length },
        "Failed to create pipeline with stages",
      );
      throw err;
    }
  }

  /**
   * Update pipeline progress
   */
  async updateProgress(
    id: string,
    progress: number,
    currentStage?: string,
  ): Promise<GenerationPipeline | undefined> {
    try {
      const updates: Partial<NewGenerationPipeline> = {
        progress,
        updatedAt: new Date(),
      };

      if (currentStage) {
        updates.currentStage = currentStage;
      }

      return this.update(id, updates);
    } catch (err) {
      logger.error({ err, id, progress }, "Failed to update pipeline progress");
      throw err;
    }
  }

  /**
   * Update pipeline status
   */
  async updateStatus(
    id: string,
    status: string,
    error?: string,
    errorStage?: string,
    errorDetails?: any,
  ): Promise<GenerationPipeline | undefined> {
    try {
      const updates: Partial<NewGenerationPipeline> = {
        status: status as any,
        updatedAt: new Date(),
      };

      if (status === "processing" && !updates.startedAt) {
        updates.startedAt = new Date();
      }

      if (status === "completed" || status === "failed") {
        updates.completedAt = new Date();
      }

      if (error) {
        updates.error = error;
      }

      if (errorStage) {
        updates.errorStage = errorStage;
      }

      if (errorDetails) {
        updates.errorDetails = errorDetails;
      }

      return this.update(id, updates);
    } catch (err) {
      logger.error({ err, id, status }, "Failed to update pipeline status");
      throw err;
    }
  }

  /**
   * Update stage status
   */
  async updateStage(
    stageId: string,
    updates: Partial<NewPipelineStage>,
  ): Promise<PipelineStage | undefined> {
    try {
      const [stage] = await db
        .update(pipelineStages)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(pipelineStages.id, stageId))
        .returning();

      return stage;
    } catch (err) {
      logger.error({ err, stageId, updates }, "Failed to update stage");
      throw err;
    }
  }

  /**
   * Find expired pipelines
   */
  async findExpired(): Promise<GenerationPipeline[]> {
    try {
      return this.findMany({
        where: and(
          sql`${generationPipelines.expiresAt} IS NOT NULL`,
          lt(generationPipelines.expiresAt, new Date()),
        ),
      });
    } catch (err) {
      logger.error({ err }, "Failed to find expired pipelines");
      throw err;
    }
  }

  /**
   * Clean up old completed pipelines
   */
  async cleanupOldPipelines(olderThan: Date): Promise<number> {
    try {
      return this.deleteMany(
        and(
          inArray(generationPipelines.status, [
            "completed",
            "failed",
            "cancelled",
          ]),
          lt(generationPipelines.completedAt, olderThan),
        ),
      );
    } catch (err) {
      logger.error({ err, olderThan }, "Failed to cleanup old pipelines");
      throw err;
    }
  }

  /**
   * Get pipeline statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageDuration: number;
    successRate: number;
  }> {
    try {
      const where = userId ? eq(generationPipelines.userId, userId) : undefined;

      const pipelines = await this.findMany({
        where,
      });

      const byStatus: Record<string, number> = {};
      let totalDuration = 0;
      let completedCount = 0;

      for (const pipeline of pipelines) {
        byStatus[pipeline.status] = (byStatus[pipeline.status] || 0) + 1;

        if (pipeline.completedAt && pipeline.startedAt) {
          const duration =
            pipeline.completedAt.getTime() - pipeline.startedAt.getTime();
          totalDuration += duration;
          completedCount++;
        }
      }

      const successCount = byStatus["completed"] || 0;
      const failedCount = byStatus["failed"] || 0;
      const totalFinished = successCount + failedCount;

      return {
        total: pipelines.length,
        byStatus,
        averageDuration:
          completedCount > 0 ? totalDuration / completedCount : 0,
        successRate: totalFinished > 0 ? successCount / totalFinished : 0,
      };
    } catch (err) {
      logger.error({ err, userId }, "Failed to get pipeline statistics");
      throw err;
    }
  }
}

// Export singleton instance
export const generationPipelineRepository = new GenerationPipelineRepository();
