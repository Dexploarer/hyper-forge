/**
 * Generation API Client
 * Handles communication with the backend generation service
 */

import { ExtendedImportMeta } from "../../types";
import { GenerationConfig } from "../../types/generation";
import { TypedEventEmitter } from "../../utils/TypedEventEmitter";

import { api } from "@/lib/api-client";

// Define pipeline types matching backend
export interface APIPipelineStage {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
}

export interface PipelineStages {
  generation: APIPipelineStage;
  retexturing: APIPipelineStage;
  sprites: APIPipelineStage;
}

export interface PipelineResults {
  image3D?: {
    localPath?: string;
    cdnUrl?: string;
  };
  rigging?: {
    localPath?: string;
    cdnUrl?: string;
  };
  textureGeneration?: {
    variants?: Array<{ name: string; cdnUrl: string }>;
  };
  spriteGeneration?: {
    status?: string;
    sprites?: Array<{ angle: number; imageUrl: string }>;
  };
}

export interface APIPipelineResult {
  id: string;
  status: "initializing" | "processing" | "completed" | "failed";
  progress: number;
  stages: PipelineStages;
  config: GenerationConfig;
  results: PipelineResults;
  error?: string;
  baseAsset?: {
    id: string;
    name: string;
    cdnUrl?: string;
    conceptArtUrl?: string;
  };
  variants?: Array<{ name: string; cdnUrl: string }>;
  sprites?: Array<{ angle: number; imageUrl: string }>;
}

// Event map for type-safe event handling
export interface GenerationAPIEvents {
  "pipeline:started": { pipelineId: string };
  progress: { pipelineId: string; progress: number };
  statusChange: { pipelineId: string; status: string };
  update: APIPipelineResult;
  "pipeline:completed": APIPipelineResult;
  "pipeline:failed": { pipelineId: string; error?: string };
  error: {
    pipelineId: string;
    error: Error | string | { message: string; code?: string };
  };
}

// Type helper to extract event arguments
type EventArgs<T extends keyof GenerationAPIEvents> = GenerationAPIEvents[T];

export class GenerationAPIClient extends TypedEventEmitter<GenerationAPIEvents> {
  private apiUrl: string;
  private pollInterval: number = 2000; // Poll every 2 seconds
  private pipelineConfigs: Map<string, GenerationConfig> = new Map();
  private activePipelines: Map<string, APIPipelineResult> = new Map();

  constructor(apiUrl?: string) {
    super();
    // Use environment variable if available, otherwise use relative URL (Vite proxy handles /api in dev)
    const envApiUrl = (import.meta as ExtendedImportMeta).env
      ?.VITE_GENERATION_API_URL;
    this.apiUrl = apiUrl || envApiUrl || "/api";
  }

  /**
   * Start a new generation pipeline
   * @param config Generation configuration
   * @param accessToken Optional Privy access token for authentication (Note: Eden Treaty handles auth automatically)
   */
  async startPipeline(
    config: GenerationConfig,
    accessToken?: string,
  ): Promise<string> {
    const { data, error } = await api.api.generation.pipeline.post(
      config as any,
    );

    if (error) {
      console.error("Failed to start pipeline:", error);
      throw new Error(
        typeof error === "object" && error !== null && "error" in error
          ? (error.error as string)
          : "Failed to start pipeline",
      );
    }

    const result = data as any;

    // Store config for later retrieval
    this.pipelineConfigs.set(result.pipelineId, config);

    // Create and store initial pipeline result
    const pipelineResult: APIPipelineResult = {
      id: result.pipelineId,
      status: "initializing",
      progress: 0,
      stages: {
        generation: { status: "pending", progress: 0 },
        retexturing: { status: "pending", progress: 0 },
        sprites: { status: "pending", progress: 0 },
      },
      config,
      results: {},
    };

    this.activePipelines.set(result.pipelineId, pipelineResult);

    // Emit pipeline started event
    this.emit("pipeline:started", { pipelineId: result.pipelineId });

    // Start polling for status updates
    this.pollPipelineStatus(result.pipelineId);

    return result.pipelineId;
  }

  /**
   * Fetch pipeline status from API
   */
  async fetchPipelineStatus(pipelineId: string): Promise<APIPipelineResult> {
    const { data, error } = await api.api.generation
      .pipeline({ pipelineId })
      .get();

    if (error) {
      console.error("Failed to get pipeline status:", error);
      throw new Error(
        typeof error === "object" && error !== null && "error" in error
          ? (error.error as string)
          : "Failed to get pipeline status",
      );
    }

    const status = data as any;

    // Retrieve stored config
    const config =
      this.pipelineConfigs.get(pipelineId) || ({} as GenerationConfig);

    // Convert backend format to frontend format
    return {
      id: status.id,
      status: status.status,
      progress: status.progress,
      stages: status.stages,
      config,
      results: status.results || {},
      error: status.error,
    };
  }

  /**
   * Poll pipeline status and emit events
   */
  private async pollPipelineStatus(pipelineId: string) {
    let previousStatus = "";
    let previousProgress = 0;

    const poll = async () => {
      try {
        const status = await this.fetchPipelineStatus(pipelineId);

        // Update local cache
        this.activePipelines.set(pipelineId, status);

        // Emit progress updates
        if (status.progress !== previousProgress) {
          this.emit("progress", { pipelineId, progress: status.progress });
          previousProgress = status.progress;
        }

        // Emit status changes
        if (status.status !== previousStatus) {
          this.emit("statusChange", { pipelineId, status: status.status });
          previousStatus = status.status;
        }

        // Emit stage updates
        this.emit("update", status);

        // Stop polling if complete or failed
        if (status.status === "completed") {
          this.emit("pipeline:completed", status);
          return;
        } else if (status.status === "failed") {
          this.emit("pipeline:failed", { pipelineId, error: status.error });
          return;
        }

        // Continue polling
        setTimeout(poll, this.pollInterval);
      } catch (error) {
        console.error("Error polling pipeline status:", error);
        this.emit("error", { pipelineId, error: error as Error });
      }
    };

    // Start polling
    poll();
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await api.api.health.get();
      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Get all active pipelines
   */
  getActivePipelines(): APIPipelineResult[] {
    return Array.from(this.activePipelines.values());
  }

  /**
   * Get cached pipeline status (synchronous)
   */
  getPipelineStatus(pipelineId: string): APIPipelineResult | undefined {
    return this.activePipelines.get(pipelineId);
  }

  /**
   * Clear completed or failed pipelines
   */
  clearInactivePipelines(): void {
    for (const [id, pipeline] of this.activePipelines.entries()) {
      if (pipeline.status === "completed" || pipeline.status === "failed") {
        this.activePipelines.delete(id);
        this.pipelineConfigs.delete(id);
      }
    }
  }

  /**
   * Remove event listener (alias for removeListener)
   */
  off<K extends keyof GenerationAPIEvents>(
    event: K,
    listener: (data: EventArgs<K>) => void,
  ): this {
    return this.removeListener(event, listener);
  }
}
