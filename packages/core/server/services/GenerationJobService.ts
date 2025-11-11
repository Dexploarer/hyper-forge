/**
 * Generation Job Service
 * Manages persistent storage and retrieval of generation jobs
 */

import { db } from "../db";
import {
  generationJobs,
  type GenerationJob,
  type NewGenerationJob,
} from "../db/schema";
import { eq, and, lt, desc } from "drizzle-orm";

export interface PipelineConfig {
  description: string;
  assetId: string;
  name: string;
  type: string;
  subtype: string;
  generationType?: string;
  style?: string;
  quality?: string;
  enableRigging?: boolean;
  enableRetexturing?: boolean;
  enableSprites?: boolean;
  materialPresets?: unknown[];
  referenceImage?: unknown;
  riggingOptions?: unknown;
  customPrompts?: unknown;
  metadata?: unknown;
  user?: {
    userId: string;
    walletAddress?: string;
  };
}

export interface StageResult {
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  progress: number;
  result?: unknown;
  error?: string;
}

export interface Pipeline {
  id: string;
  config: PipelineConfig;
  status: "initializing" | "processing" | "completed" | "failed";
  progress: number;
  stages: {
    textInput: StageResult;
    promptOptimization: StageResult;
    imageGeneration: StageResult;
    image3D: StageResult;
    textureGeneration: StageResult;
    rigging?: StageResult;
    spriteGeneration?: StageResult;
  };
  results: Record<string, unknown>;
  error?: string;
  createdAt: string;
  completedAt?: string;
  finalAsset?: {
    id: string;
    name: string;
    modelUrl: string;
    conceptArtUrl: string;
    variants: unknown[];
  };
}

export class GenerationJobService {
  /**
   * Create a new generation job
   */
  async createJob(
    pipelineId: string,
    config: PipelineConfig,
  ): Promise<GenerationJob> {
    // Require authentication - users must be logged in to generate
    if (!config.user?.userId) {
      throw new Error(
        "Authentication required: You must be logged in to generate assets",
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Jobs expire after 24 hours

    // Initialize stages with proper structure matching GenerationService expectations
    const initialStages: Pipeline["stages"] = {
      textInput: {
        status: "completed",
        progress: 100,
        result: { description: config.description },
      },
      promptOptimization: { status: "pending", progress: 0 },
      imageGeneration: { status: "pending", progress: 0 },
      image3D: { status: "pending", progress: 0 },
      textureGeneration: { status: "pending", progress: 0 },
      ...(config.generationType === "avatar" && config.enableRigging
        ? { rigging: { status: "pending", progress: 0 } }
        : {}),
      ...(config.enableSprites
        ? { spriteGeneration: { status: "pending", progress: 0 } }
        : {}),
    };

    const newJob: NewGenerationJob = {
      pipelineId,
      assetId: config.assetId,
      assetName: config.name,
      userId: config.user.userId,
      config: config as unknown as Record<string, unknown>,
      status: "initializing",
      progress: 0,
      stages: initialStages as unknown as Record<string, unknown>,
      results: {},
      expiresAt,
    };

    try {
      const [job] = await db.insert(generationJobs).values(newJob).returning();
      return job;
    } catch (error: any) {
      // Enhanced error logging for database constraint violations
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || error?.errno || error?.sqlState;
      const errorDetail = error?.detail || error?.message;

      console.error("[GenerationJobService] Failed to create job:", {
        pipelineId,
        assetId: config.assetId,
        userId: config.user.userId,
        error: errorMessage,
        code: errorCode,
        constraint: error?.constraint,
        detail: errorDetail,
        hint: error?.hint,
        fullError: error,
      });

      // Check for foreign key violation (user_id constraint)
      // PostgreSQL error code 23503 = foreign key violation
      // Also check error message for common patterns
      const isForeignKeyViolation =
        errorCode === "23503" ||
        errorMessage?.includes("foreign key") ||
        errorMessage?.includes("violates foreign key") ||
        errorMessage?.includes("user_id") ||
        error?.constraint?.includes("user_id") ||
        error?.constraint?.includes("generation_jobs_user_id_users_id_fk");

      if (isForeignKeyViolation) {
        // Foreign key violation - most likely user doesn't exist
        throw new Error(
          `User not found: ${config.user.userId}. Please ensure you are logged in with a valid account. The user ID must exist in the database before creating a generation job.`,
        );
      }

      // Check for unique constraint violation (pipeline_id)
      if (
        errorCode === "23505" ||
        errorMessage?.includes("unique constraint") ||
        errorMessage?.includes("duplicate key")
      ) {
        throw new Error(
          `Pipeline ID already exists: ${pipelineId}. Please try again.`,
        );
      }

      // Check for NOT NULL constraint violation
      if (
        errorCode === "23502" ||
        errorMessage?.includes("null value") ||
        errorMessage?.includes("not null")
      ) {
        throw new Error(
          `Missing required field: ${error?.column || "unknown"}. Please check your request.`,
        );
      }

      // Re-throw with original message for other errors
      throw new Error(
        `Failed to create generation job: ${errorMessage || "Unknown database error"}`,
      );
    }
  }

  /**
   * Get a job by pipeline ID
   */
  async getJobByPipelineId(pipelineId: string): Promise<GenerationJob | null> {
    const [job] = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.pipelineId, pipelineId))
      .limit(1);

    return job || null;
  }

  /**
   * Get a job by ID
   */
  async getJobById(id: string): Promise<GenerationJob | null> {
    const [job] = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.id, id))
      .limit(1);

    return job || null;
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit = 50): Promise<GenerationJob[]> {
    return await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.userId, userId))
      .orderBy(desc(generationJobs.createdAt))
      .limit(limit);
  }

  /**
   * Update job status and progress
   */
  async updateJob(
    pipelineId: string,
    updates: {
      status?: string;
      progress?: number;
      stages?: Record<string, unknown>;
      results?: Record<string, unknown>;
      error?: string;
      finalAsset?: Record<string, unknown>;
      completedAt?: Date;
      startedAt?: Date;
    },
  ): Promise<GenerationJob | null> {
    const updateData: Partial<NewGenerationJob> = {
      ...updates,
      lastUpdatedAt: new Date(),
    };

    const [job] = await db
      .update(generationJobs)
      .set(updateData)
      .where(eq(generationJobs.pipelineId, pipelineId))
      .returning();

    return job || null;
  }

  /**
   * Convert Pipeline to GenerationJob format
   */
  pipelineToJob(pipeline: Pipeline): Partial<NewGenerationJob> {
    return {
      status: pipeline.status,
      progress: pipeline.progress,
      stages: pipeline.stages as unknown as Record<string, unknown>,
      results: pipeline.results,
      error: pipeline.error,
      finalAsset: pipeline.finalAsset as unknown as Record<string, unknown>,
      completedAt: pipeline.completedAt
        ? new Date(pipeline.completedAt)
        : undefined,
      lastUpdatedAt: new Date(),
    };
  }

  /**
   * Convert GenerationJob to Pipeline format
   */
  jobToPipeline(job: GenerationJob): Pipeline {
    return {
      id: job.pipelineId,
      config: job.config as unknown as PipelineConfig,
      status: job.status as
        | "initializing"
        | "processing"
        | "completed"
        | "failed",
      progress: job.progress,
      stages: job.stages as unknown as Pipeline["stages"],
      results: job.results as Record<string, unknown>,
      error: job.error || undefined,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      finalAsset: job.finalAsset as unknown as Pipeline["finalAsset"],
    };
  }

  /**
   * Clean up expired jobs
   */
  async cleanupExpiredJobs(): Promise<number> {
    const result = await db
      .delete(generationJobs)
      .where(
        and(
          lt(generationJobs.expiresAt, new Date()),
          eq(generationJobs.status, "completed"),
        ),
      )
      .returning({ id: generationJobs.id });

    return result.length;
  }

  /**
   * Delete old failed jobs (older than 7 days)
   */
  async cleanupOldFailedJobs(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .delete(generationJobs)
      .where(
        and(
          lt(generationJobs.createdAt, sevenDaysAgo),
          eq(generationJobs.status, "failed"),
        ),
      )
      .returning({ id: generationJobs.id });

    return result.length;
  }
}

// Export singleton instance
export const generationJobService = new GenerationJobService();
