/**
 * Generation Service
 * Handles AI-powered asset generation pipelines
 */

import EventEmitter from "events";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import type { UserContextType } from "../models";
import { AICreationService } from "./AICreationService";
import { ImageHostingService } from "./ImageHostingService";
import { assetDatabaseService } from "./AssetDatabaseService";
import {
  getGenerationPrompts,
  getGPT4EnhancementPrompts,
} from "../utils/promptLoader";
import type { Static } from "elysia";
import { MaterialPreset } from "../models";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import {
  assetGenerationCounter,
  assetGenerationDuration,
  assetGenerationErrors,
  MetricsTimer,
} from "../metrics/business";
import { cdnUploadService } from "../utils/CDNUploadService";

// ==================== Type Definitions ====================

// Database types from repository layer
interface DbPipeline {
  id: string;
  userId: string;
  assetId: string | null;
  config: unknown; // JSONB field - will be cast to PipelineConfig
  status: "initializing" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStage: string | null;
  error: string | null;
  errorStage: string | null;
  errorDetails: unknown;
  results: unknown; // JSONB field
  meshyTaskId: string | null;
  riggingTaskId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  expiresAt: Date | null;
}

// Repository update payload types
interface DbPipelineUpdate {
  status?: "initializing" | "processing" | "completed" | "failed" | "cancelled";
  progress?: number;
  currentStage?: string;
  error?: string;
  errorStage?: string;
  errorDetails?: unknown;
  results?: unknown;
  meshyTaskId?: string;
  riggingTaskId?: string;
  completedAt?: Date;
  startedAt?: Date;
}

// Use a compatible fetch function type (node-fetch doesn't have preconnect method)
interface FetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

type FetchFunction = (
  url: string | URL,
  init?: Record<string, unknown>,
) => Promise<FetchResponse>;
type MaterialPresetType = Static<typeof MaterialPreset>;

interface ReferenceImage {
  url?: string;
  dataUrl?: string;
}

interface RiggingOptions {
  heightMeters?: number;
}

interface CustomPrompts {
  gameStyle?: string;
}

interface AssetMetadata {
  characterHeight?: number;
  useGPT4Enhancement?: boolean;
}

interface PipelineConfig {
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
  materialPresets?: MaterialPresetType[];
  referenceImage?: ReferenceImage;
  riggingOptions?: RiggingOptions;
  customPrompts?: CustomPrompts;
  metadata?: AssetMetadata;
  user?: {
    userId: string;
    walletAddress?: string;
  };
  visibility?: "public" | "private";
}

interface StageResult {
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  progress: number;
  result?: unknown;
  error?: string;
  normalized?: boolean;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

interface Pipeline {
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
    variants: VariantResult[];
  };
}

interface StartPipelineResponse {
  pipelineId: string;
  status: string;
  message: string;
}

interface PipelineStageWithName {
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface PipelineStatusResponse {
  id: string;
  status: string;
  progress: number;
  stages: Record<string, PipelineStageWithName>;
  results: Record<string, unknown>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface PromptEnhancementResult {
  originalPrompt: string;
  optimizedPrompt: string;
  model?: string;
  keywords?: string[];
  error?: string;
}

interface MeshyResult {
  status: string;
  progress?: number;
  error?: string;
  model_urls: {
    glb: string;
  };
  polycount?: number;
}

interface RetextureResult {
  status: string;
  error?: string;
  model_urls: {
    glb: string;
  };
}

interface RiggingResult {
  status: string;
  progress?: number;
  task_error?: {
    message: string;
  };
  result?: {
    basic_animations?: {
      walking_glb_url?: string;
      running_glb_url?: string;
    };
  };
}

interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: {
    model: string;
    resolution: string;
    quality: string;
    timestamp: string;
  };
}

interface VariantResult {
  id: string;
  name: string;
  modelUrl?: string;
  success: boolean;
  error?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ==================== Service Class ====================

export class GenerationService extends EventEmitter {
  public aiService: AICreationService;
  private imageHostingService: ImageHostingService;
  private fetchFn: FetchFunction;
  private pipelineRepo: import("../repositories/GenerationPipelineRepository").GenerationPipelineRepository;
  private aiGatewayApiKey: string;
  private openaiApiKey: string;

  constructor(config?: {
    fetchFn?: FetchFunction;
    meshyApiKey?: string;
    aiGatewayApiKey?: string;
    elevenLabsApiKey?: string;
    pipelineRepo?: import("../repositories/GenerationPipelineRepository").GenerationPipelineRepository;
  }) {
    super();

    // CRITICAL: Add error handler to prevent process crashes from unhandled error events
    // EventEmitter will crash Node.js process if error event emitted without listener
    this.on("error", (error: Error) => {
      logger.error(
        { err: error },
        "[GenerationService] EventEmitter error caught",
      );
    });

    this.fetchFn = (config?.fetchFn || fetch) as FetchFunction;

    // Determine which API keys to use (user-provided or validated environment variables)
    const meshyApiKey = config?.meshyApiKey || env.MESHY_API_KEY || "";
    this.aiGatewayApiKey =
      config?.aiGatewayApiKey || env.AI_GATEWAY_API_KEY || "";
    this.openaiApiKey = env.OPENAI_API_KEY || "";
    const elevenLabsApiKey =
      config?.elevenLabsApiKey || env.ELEVENLABS_API_KEY || "";

    // Log which key sources are being used
    logger.info(
      {
        meshySource: config?.meshyApiKey ? "user-provided" : "environment",
        aiGatewaySource: config?.aiGatewayApiKey
          ? "user-provided"
          : "environment",
        openaiSource: "environment",
        elevenLabsSource: config?.elevenLabsApiKey
          ? "user-provided"
          : "environment",
      },
      "Initializing GenerationService with API keys",
    );

    // Check for required API keys
    if ((!this.aiGatewayApiKey && !this.openaiApiKey) || !meshyApiKey) {
      logger.warn(
        "[GenerationService] Missing API keys - generation features will be limited",
      );
    }

    // Initialize AI service with validated environment variables
    const imageServerBaseUrl =
      env.IMAGE_SERVER_URL ||
      (() => {
        if (env.NODE_ENV === "production") {
          throw new Error(
            "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
          );
        }
        return "http://localhost:8080";
      })();

    this.aiService = new AICreationService({
      openai: {
        apiKey: this.openaiApiKey,
        aiGatewayApiKey: this.aiGatewayApiKey,
        model: "gpt-image-1",
        imageServerBaseUrl,
      },
      meshy: {
        apiKey: meshyApiKey,
        baseUrl: "https://api.meshy.ai",
      },
      // node-fetch is compatible with our FetchFunction type but lacks preconnect property
      // @ts-expect-error - node-fetch doesn't have preconnect but is otherwise compatible
      fetchFn: this.fetchFn,
    });

    // Initialize image hosting service
    this.imageHostingService = new ImageHostingService();

    // Initialize repository (use injected or create new instance)
    if (config?.pipelineRepo) {
      this.pipelineRepo = config.pipelineRepo;
    } else {
      // Dynamic import to avoid circular dependency
      const {
        GenerationPipelineRepository,
      } = require("../repositories/GenerationPipelineRepository");
      this.pipelineRepo = new GenerationPipelineRepository();
    }
  }

  /**
   * Start a new generation pipeline
   */
  async startPipeline(config: PipelineConfig): Promise<StartPipelineResponse> {
    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial pipeline state
    const pipeline: Pipeline = {
      id: pipelineId,
      config,
      status: "initializing",
      progress: 0,
      stages: {
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
      },
      results: {},
      createdAt: new Date().toISOString(),
    };

    // Store pipeline in database (via repository)
    await this.pipelineRepo.create({
      id: pipelineId,
      userId: config.user?.userId || "anonymous",
      config: config as unknown, // JSONB field accepts unknown
      status: "initializing",
      progress: 0,
      results: {} as unknown, // JSONB field accepts unknown
      createdAt: new Date(),
    });
    logger.info({ pipelineId }, "Pipeline stored in database");

    // Start processing asynchronously
    logger.info({ pipelineId }, "Starting async processing...");
    this.processPipeline(pipelineId).catch(async (error) => {
      logger.error({ err: error, pipelineId }, "Pipeline failed");
      try {
        const updatePayload: DbPipelineUpdate = {
          status: "failed",
          error: error.message,
        };
        await this.pipelineRepo.update(pipelineId, updatePayload);
      } catch (updateError) {
        logger.error(
          { err: updateError, pipelineId },
          "Failed to update pipeline error status",
        );
      }
    });

    return {
      pipelineId,
      status: pipeline.status,
      message: "Pipeline started successfully",
    };
  }

  /**
   * Process a pipeline from an existing GenerationJob (no worker queue needed)
   * This is called directly from the route handler for synchronous processing
   */
  async processPipelineFromJob(
    job: import("../db/schema").GenerationJob,
  ): Promise<void> {
    const { generationJobService } = await import(
      "../services/GenerationJobService"
    );
    const { ActivityLogService } = await import(
      "../services/ActivityLogService"
    );

    const pipelineId = job.pipelineId;
    const config = job.config as PipelineConfig; // Type assertion for JSONB field

    logger.info({ pipelineId }, "processPipelineFromJob() called");

    // Update job to processing
    await generationJobService.updateJob(pipelineId, {
      status: "processing",
      startedAt: new Date(),
    });

    try {
      // Create pipeline record in pipelineRepo for processPipeline() to work with
      // This is a bridge until we fully migrate away from pipelineRepo
      await this.pipelineRepo.create({
        id: pipelineId,
        userId: config.user?.userId || "anonymous",
        config: config as unknown, // JSONB field accepts unknown
        status: "processing",
        progress: 0,
        results: {} as unknown, // JSONB field accepts unknown
        createdAt: new Date(),
      });

      // Run the actual processing logic
      await this.processPipeline(pipelineId);

      // Get final results from pipeline
      const dbPipeline = await this.pipelineRepo.findById(pipelineId);

      // Sync results back to job
      await generationJobService.updateJob(pipelineId, {
        status: "completed",
        progress: 100,
        results: (dbPipeline?.results as Record<string, unknown>) || {},
        completedAt: new Date(),
      });

      // Clean up pipeline record (we only needed it for processing)
      await this.pipelineRepo.delete(pipelineId);

      // Log success
      const userId = config.user?.userId;
      if (userId) {
        await ActivityLogService.logGenerationCompleted({
          userId,
          pipelineId,
          success: true,
        });
      }
    } catch (error) {
      // Update job as failed
      await generationJobService.updateJob(pipelineId, {
        status: "failed",
        error: (error as Error).message,
        completedAt: new Date(),
      });

      // Clean up pipeline record if it exists
      try {
        await this.pipelineRepo.delete(pipelineId);
      } catch {
        // Ignore cleanup errors
      }

      throw error; // Re-throw for route handler's catch block
    }
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(pipelineId: string): Promise<PipelineStatusResponse> {
    // Load pipeline from database
    const dbPipeline = await this.pipelineRepo.findById(pipelineId);

    if (!dbPipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Parse config and results from database
    const config = dbPipeline.config as PipelineConfig; // Type assertion for JSONB field
    const results = (dbPipeline.results as Record<string, unknown>) || {};

    // Reconstruct stages from database state
    // Note: The database stores simplified state, we reconstruct the full stages object here
    // Stages may be stored in config JSONB, type it carefully
    const configWithStages = config as PipelineConfig & {
      stages?: Record<string, StageResult>;
    };
    const stages = configWithStages.stages || {
      textInput: { status: "completed", progress: 100 },
      promptOptimization: { status: "pending", progress: 0 },
      imageGeneration: { status: "pending", progress: 0 },
      image3D: { status: "pending", progress: 0 },
      textureGeneration: { status: "pending", progress: 0 },
    };

    // Convert stages to Record format with name property for each stage
    const stagesWithNames: Record<string, PipelineStageWithName> = {};
    for (const [stageName, stageData] of Object.entries(stages)) {
      const data = stageData as StageResult;
      stagesWithNames[stageName] = {
        name: stageName,
        status: data.status as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        progress: data.progress,
        error: data.error,
      };
    }

    return {
      id: dbPipeline.id,
      status: dbPipeline.status,
      progress: dbPipeline.progress,
      stages: stagesWithNames,
      results: results,
      error: dbPipeline.error || undefined,
      createdAt: dbPipeline.createdAt.toISOString(),
      completedAt: dbPipeline.completedAt?.toISOString(),
    };
  }

  /**
   * Process a pipeline through all stages
   */
  private async processPipeline(pipelineId: string): Promise<void> {
    logger.info({ pipelineId }, "processPipeline() called");

    // Load pipeline from database
    const dbPipeline = await this.pipelineRepo.findById(pipelineId);
    if (!dbPipeline) {
      logger.error({ pipelineId }, "Pipeline not found in database");
      return;
    }

    // Reconstruct pipeline state from database
    const dbConfig = dbPipeline.config as PipelineConfig; // Type assertion for JSONB field
    const pipeline: Pipeline = {
      id: dbPipeline.id,
      config: dbConfig,
      status: dbPipeline.status as Pipeline["status"],
      progress: dbPipeline.progress,
      stages: (dbConfig as { stages?: Pipeline["stages"] }).stages || {
        textInput: { status: "completed", progress: 100 },
        promptOptimization: { status: "pending", progress: 0 },
        imageGeneration: { status: "pending", progress: 0 },
        image3D: { status: "pending", progress: 0 },
        textureGeneration: { status: "pending", progress: 0 },
      },
      results: (dbPipeline.results as Record<string, unknown>) || {},
      error: dbPipeline.error || undefined,
      createdAt: dbPipeline.createdAt.toISOString(),
      completedAt: dbPipeline.completedAt?.toISOString(),
    };

    // Cast the config to our local PipelineConfig type for proper typing
    const config = pipeline.config as PipelineConfig;
    const metricType = this.getAssetMetricType(config);
    const generationTimer = new MetricsTimer();
    let metricStatus: "success" | "failure" = "failure";

    try {
      logger.info({ pipelineId }, "Setting status to processing");
      pipeline.status = "processing";
      const updatePayload: DbPipelineUpdate = {
        status: "processing",
      };
      await this.pipelineRepo.update(pipelineId, updatePayload);

      let enhancedPrompt = config.description;
      let imageUrl: string | null = null;
      let meshyTaskId: string | null = null;
      let baseModelPath: string | null = null;

      // Stage 1: GPT-4 Prompt Enhancement (honor toggle; skip if explicitly disabled)
      logger.info(
        { pipelineId, stage: "promptOptimization" },
        "Stage 1: Prompt Optimization",
      );
      if (config.metadata?.useGPT4Enhancement !== false) {
        pipeline.stages.promptOptimization.status = "processing";
        logger.info(
          { pipelineId, stage: "promptOptimization" },
          "Running GPT-4 enhancement",
        );

        try {
          const optimizationResult = await this.enhancePromptWithGPT4(config);
          enhancedPrompt = optimizationResult.optimizedPrompt;

          pipeline.stages.promptOptimization.status = "completed";
          pipeline.stages.promptOptimization.progress = 100;
          pipeline.stages.promptOptimization.result = optimizationResult;
          pipeline.results.promptOptimization = optimizationResult;
          logger.info({ pipelineId }, "GPT-4 enhancement completed");
        } catch (error) {
          logger.warn(
            { err: error, pipelineId },
            "GPT-4 enhancement failed, using original prompt",
          );
          pipeline.stages.promptOptimization.status = "completed";
          pipeline.stages.promptOptimization.progress = 100;
          pipeline.stages.promptOptimization.result = {
            originalPrompt: config.description,
            optimizedPrompt: config.description,
            error: (error as Error).message,
          };
        }

        pipeline.progress = 10;
        logger.info(
          { pipelineId, progress: pipeline.progress },
          "Pipeline progress updated",
        );
      } else {
        logger.info(
          { pipelineId, stage: "promptOptimization" },
          "GPT-4 enhancement skipped",
        );
        pipeline.stages.promptOptimization.status = "skipped";
        pipeline.progress = 10; // CRITICAL FIX: Update progress even when skipped
      }

      // Stage 2: Image Source (User-provided or AI-generated)
      logger.info(
        { pipelineId, stage: "imageGeneration" },
        "Stage 2: Image Generation",
      );
      const hasUserRef = !!(
        config.referenceImage &&
        (config.referenceImage.url || config.referenceImage.dataUrl)
      );
      if (hasUserRef) {
        // Use user-provided reference image; skip auto image generation
        logger.info(
          { pipelineId, stage: "imageGeneration" },
          "Using user-provided image",
        );
        imageUrl =
          config.referenceImage!.dataUrl || config.referenceImage!.url!;
        pipeline.stages.imageGeneration.status = "skipped";
        pipeline.stages.imageGeneration.progress = 0;
        pipeline.stages.imageGeneration.result = { source: "user-provided" };
        pipeline.results.imageGeneration =
          pipeline.stages.imageGeneration.result;
        pipeline.progress = 20;
        logger.info(
          { pipelineId, progress: pipeline.progress },
          "Pipeline progress updated",
        );
      } else {
        logger.info(
          { pipelineId, stage: "imageGeneration" },
          "Generating concept art",
        );
        pipeline.stages.imageGeneration.status = "processing";

        try {
          // Load generation prompts
          const generationPrompts = await getGenerationPrompts();

          // For avatars, ensure T-pose is in the prompt
          // For armor, ensure it's standalone with hollow openings
          // Build effective style text from custom prompts when available
          // Also, if HQ cues are present, sanitize prompt from low-poly cues and add HQ details
          const effectiveStyle =
            config.customPrompts && config.customPrompts.gameStyle
              ? config.customPrompts.gameStyle
              : config.style || "game-ready";

          const wantsHQPrompt =
            /\b(4k|ultra|high\s*quality|realistic|cinematic|photoreal|pbr)\b/i.test(
              effectiveStyle,
            );
          let imagePrompt = enhancedPrompt;
          if (wantsHQPrompt) {
            imagePrompt = imagePrompt
              .replace(
                /\b(low-?poly|stylized|minimalist|blocky|simplified)\b/gi,
                "",
              )
              .trim();
            imagePrompt = `${imagePrompt} highly detailed, realistic, sharp features, high-resolution textures`;
          }
          if (
            config.generationType === "avatar" ||
            config.type === "character"
          ) {
            const tposePrompt =
              generationPrompts?.posePrompts?.avatar?.tpose ||
              "standing in T-pose with arms stretched out horizontally";
            imagePrompt = `${enhancedPrompt} ${tposePrompt}`;
          } else if (config.type === "armor") {
            const isChest =
              config.subtype?.toLowerCase().includes("chest") ||
              config.subtype?.toLowerCase().includes("body");
            if (isChest) {
              const chestPrompt =
                generationPrompts?.posePrompts?.armor?.chest ||
                'floating chest armor SHAPED FOR T-POSE BODY - shoulder openings must point STRAIGHT OUT SIDEWAYS at 90 degrees like a scarecrow (NOT angled down), wide "T" shape when viewed from front, ends at shoulders with no arm extensions, torso-only armor piece, hollow shoulder openings pointing horizontally, no armor stand';
              imagePrompt = `${enhancedPrompt} ${chestPrompt}`;
            } else {
              const genericArmorPrompt =
                generationPrompts?.posePrompts?.armor?.generic ||
                "floating armor piece shaped for T-pose body fitting, openings positioned at correct angles for T-pose (horizontal for shoulders), hollow openings, no armor stand or mannequin";
              imagePrompt = `${enhancedPrompt} ${genericArmorPrompt}`;
            }
          }

          const imageResult = await this.aiService
            .getImageService()
            .generateImage(imagePrompt, config.type, effectiveStyle);

          imageUrl = imageResult.imageUrl;

          pipeline.stages.imageGeneration.status = "completed";
          pipeline.stages.imageGeneration.progress = 100;
          pipeline.stages.imageGeneration.result = imageResult;
          pipeline.results.imageGeneration = imageResult;
          pipeline.progress = 25;
          logger.info(
            { pipelineId, stage: "imageGeneration" },
            "Image generation completed",
          );
          logger.info(
            { pipelineId, progress: pipeline.progress },
            "Pipeline progress updated",
          );
        } catch (error) {
          logger.error({ err: error, pipelineId }, "Image generation failed");
          pipeline.stages.imageGeneration.status = "failed";
          pipeline.stages.imageGeneration.error = (error as Error).message;
          throw error;
        }
      }

      // Stage 3: Image to 3D with Meshy AI
      logger.info(
        { pipelineId, stage: "image3D" },
        "Stage 3: Image to 3D Conversion",
      );
      pipeline.stages.image3D.status = "processing";

      try {
        // Save image to disk first if it's a data URL
        let imageUrlForMeshy = imageUrl!;
        if (imageUrl!.startsWith("data:")) {
          const imageData = imageUrl!.split(",")[1];
          const imageBuffer = Buffer.from(imageData, "base64");
          const imagePath = path.join(
            "temp-images",
            `${config.assetId}-concept.png`,
          );
          await fs.mkdir("temp-images", { recursive: true });
          await fs.writeFile(imagePath, imageBuffer);

          // If we have an image server, use it
          if (env.IMAGE_SERVER_URL) {
            imageUrlForMeshy = `${env.IMAGE_SERVER_URL}/${path.basename(imagePath)}`;
          } else {
            // Need to upload to a public URL for Meshy
            logger.warn(
              "No IMAGE_SERVER_URL configured, Meshy needs a public URL",
            );
          }
        }

        // Ensure we have a publicly accessible URL for Meshy
        logger.info({ imageUrlForMeshy, pipelineId }, "Initial image URL");

        // Meshy can't access localhost, 127.0.0.1, or data URIs - rehost if needed
        if (
          imageUrlForMeshy.startsWith("data:") ||
          imageUrlForMeshy.includes("localhost") ||
          imageUrlForMeshy.includes("127.0.0.1")
        ) {
          logger.warn(
            "⚠️ Non-public image reference detected - uploading to public hosting...",
          );

          // Use the image hosting service to get a public URL
          try {
            imageUrlForMeshy = await this.imageHostingService.uploadImage(
              imageUrl!,
            );
            logger.info(
              { imageUrlForMeshy, pipelineId },
              "Image uploaded to public URL",
            );
          } catch (uploadError) {
            logger.error({ err: uploadError }, "❌ Failed to upload image");
            logger.info(ImageHostingService.getSetupInstructions());
            throw new Error(
              "Cannot make image publicly accessible. See instructions above.",
            );
          }
        }

        // Determine quality settings based on explicit config, style cues, and avatar type
        const styleText =
          (config.customPrompts && config.customPrompts.gameStyle) || "";
        const wantsHighQuality =
          /\b(4k|ultra|high\s*quality|realistic|cinematic|marvel|skyrim)\b/i.test(
            styleText,
          );
        const isAvatar =
          config.generationType === "avatar" || config.type === "character";

        const quality =
          config.quality ||
          (wantsHighQuality || isAvatar ? "ultra" : "standard");
        const targetPolycount =
          quality === "ultra" ? 20000 : quality === "high" ? 12000 : 6000;
        const textureResolution =
          quality === "ultra" ? 4096 : quality === "high" ? 2048 : 1024;
        const enablePbr = quality !== "standard";

        // Use default model from validated env
        const aiModel = env.MESHY_MODEL_DEFAULT || "meshy-5";

        const meshyTaskResult = await this.aiService
          .getMeshyService()
          .startImageTo3D(imageUrlForMeshy, {
            enable_pbr: enablePbr,
            ai_model: aiModel,
            topology: "quad",
            targetPolycount: targetPolycount,
            texture_resolution: textureResolution,
          });

        // Handle both string and MeshyTaskResponse types
        meshyTaskId =
          typeof meshyTaskResult === "string"
            ? meshyTaskResult
            : String(meshyTaskResult);

        // Poll for completion - following Meshy best practices
        let meshyResult: MeshyResult | null = null;
        let attempts = 0;

        // Best practice: 10 second polling interval (not too aggressive)
        const pollIntervalMs = env.MESHY_POLL_INTERVAL_MS || 10000;

        // Quality-based timeouts as per documentation:
        // Standard: 5 minutes, High: 10 minutes, Ultra: 20 minutes
        const defaultTimeouts: Record<string, number> = {
          STANDARD: 300000, // 5 minutes
          HIGH: 600000, // 10 minutes
          ULTRA: 1200000, // 20 minutes
        };

        const timeoutMs = env.MESHY_TIMEOUT_MS || defaultTimeouts.HIGH;
        const maxAttempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));

        logger.info(
          { quality, aiModel, pollIntervalMs, timeoutMs, maxAttempts },
          "Meshy polling configured",
        );
        logger.info(
          { meshyTaskId },
          "Meshy Task ID stored for retexturing/rigging",
        );

        while (attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

          if (!meshyTaskId) {
            throw new Error("Meshy task ID is null - cannot poll task status");
          }

          try {
            const statusResponse = await this.aiService
              .getMeshyService()
              .getTaskStatus(meshyTaskId);

            const status = statusResponse as MeshyResult;

            // Update progress
            pipeline.stages.image3D.progress =
              status.progress || (attempts / maxAttempts) * 100;

            // Log status
            logger.info(
              {
                meshyTaskId,
                status: status.status,
                progress: Math.round(pipeline.stages.image3D.progress),
                attempts,
                maxAttempts,
              },
              "Meshy task status update",
            );

            if (status.status === "SUCCEEDED") {
              meshyResult = status;
              logger.info(
                { polycount: meshyResult.polycount || "N/A" },
                "Meshy conversion succeeded",
              );
              break;
            } else if (status.status === "FAILED") {
              throw new Error(
                status.error || "Meshy conversion failed without error message",
              );
            }
            // Continue polling for PENDING or IN_PROGRESS
          } catch (error) {
            logger.error(
              { err: error, attempts, maxAttempts },
              "Error polling Meshy task",
            );
            // Continue polling unless it's the last attempt
            if (attempts >= maxAttempts) {
              throw error;
            }
          }
        }

        if (!meshyResult) {
          throw new Error(
            `Meshy conversion timed out after ${timeoutMs}ms (${maxAttempts} attempts). Try lowering quality or simplifying the image.`,
          );
        }

        // Download the model
        const modelBuffer = await this.downloadFile(meshyResult.model_urls.glb);

        // Use temp directory for normalization processing
        const tempDir = path.join("/tmp", `asset-${config.assetId}`);
        await fs.mkdir(tempDir, { recursive: true });

        try {
          // Save raw model to temp
          const rawModelPath = path.join(tempDir, `${config.assetId}_raw.glb`);
          await fs.writeFile(rawModelPath, modelBuffer);

          // Normalize the model based on type
          let normalizedBuffer: Buffer;
          let normalizedModelPath = path.join(tempDir, `${config.assetId}.glb`);

          if (config.type === "character") {
            // Normalize character height
            logger.info(
              { pipelineId, type: "character" },
              "Normalizing character model",
            );
            try {
              const { AssetNormalizationService } = await import(
                "../../src/services/processing/AssetNormalizationService"
              );
              const normalizer = new AssetNormalizationService();

              const targetHeight =
                config.metadata?.characterHeight ||
                config.riggingOptions?.heightMeters ||
                1.83;

              const normalized = await normalizer.normalizeCharacter(
                rawModelPath,
                targetHeight,
              );
              normalizedBuffer = Buffer.from(normalized.glb);
              await fs.writeFile(normalizedModelPath, normalizedBuffer);

              logger.info({ pipelineId, targetHeight }, "Character normalized");

              // Update with normalized dimensions
              (pipeline.stages.image3D as StageResult).normalized = true;
              (pipeline.stages.image3D as StageResult).dimensions =
                normalized.metadata.dimensions;
            } catch (error) {
              logger.warn(
                { err: error },
                "⚠️ Normalization failed, using raw model",
              );
              normalizedBuffer = modelBuffer;
              await fs.writeFile(normalizedModelPath, normalizedBuffer);
            }
          } else if (config.type === "weapon") {
            // Normalize weapon with grip at origin
            logger.info(
              { pipelineId, type: "weapon" },
              "Normalizing weapon model",
            );
            try {
              const { WeaponHandleDetector } = await import(
                "../../src/services/processing/WeaponHandleDetector"
              );
              const detector = new WeaponHandleDetector();

              const result =
                await detector.exportNormalizedWeapon(rawModelPath);
              normalizedBuffer = Buffer.from(result.normalizedGlb);
              await fs.writeFile(normalizedModelPath, normalizedBuffer);

              logger.info(
                { pipelineId, type: "weapon" },
                "Weapon normalized with grip at origin",
              );

              // Update with normalized dimensions
              (pipeline.stages.image3D as StageResult).normalized = true;
              (pipeline.stages.image3D as StageResult).dimensions = {
                width: result.dimensions.width,
                height: result.dimensions.height,
                depth: result.dimensions.length,
              };
            } catch (error) {
              logger.warn(
                { err: error },
                "⚠️ Weapon normalization failed, using raw model",
              );
              normalizedBuffer = modelBuffer;
              await fs.writeFile(normalizedModelPath, normalizedBuffer);
            }
          } else {
            // For other types, use raw model
            normalizedBuffer = modelBuffer;
            await fs.writeFile(normalizedModelPath, normalizedBuffer);
          }

          // Prepare files for CDN upload
          const filesToUpload: Array<{
            buffer: Buffer;
            name: string;
            type?: string;
          }> = [];

          // Main normalized model
          filesToUpload.push({
            buffer: normalizedBuffer,
            name: `${config.assetId}.glb`,
            type: "model/gltf-binary",
          });

          // Raw model
          filesToUpload.push({
            buffer: modelBuffer,
            name: `${config.assetId}_raw.glb`,
            type: "model/gltf-binary",
          });

          // Concept art (if exists)
          if (imageUrl!.startsWith("data:")) {
            const imageData = imageUrl!.split(",")[1];
            const conceptArtBuffer = Buffer.from(imageData, "base64");
            filesToUpload.push({
              buffer: conceptArtBuffer,
              name: "concept-art.png",
              type: "image/png",
            });
          }

          // Metadata - EXACT structure from arrows-base reference
          const metadata = {
            id: config.assetId,
            name: config.assetId,
            gameId: config.assetId,
            type: config.type,
            subtype: config.subtype,
            description: config.description,
            detailedPrompt: enhancedPrompt,
            generatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            isBaseModel: true,
            materialVariants: config.materialPresets
              ? config.materialPresets.map((preset) => preset.id)
              : [],
            isPlaceholder: false,
            hasModel: true,
            hasConceptArt: true,
            modelPath: `${config.assetId}.glb`,
            conceptArtUrl: "./concept-art.png",
            conceptArtPath: "concept-art.png",
            gddCompliant: true,
            workflow: "GPT-4 → GPT-Image-1 → Meshy Image-to-3D (Base Model)",
            meshyTaskId: meshyTaskId,
            meshyStatus: "completed",
            variants: [],
            variantCount: 0,
            lastVariantGenerated: undefined,
            updatedAt: new Date().toISOString(),
            // Normalization info
            normalized:
              (pipeline.stages.image3D as StageResult).normalized || false,
            normalizationDate: (pipeline.stages.image3D as StageResult)
              .normalized
              ? new Date().toISOString()
              : undefined,
            dimensions:
              (pipeline.stages.image3D as StageResult).dimensions || undefined,
            // Ownership tracking (Phase 1)
            createdBy: config.user?.userId || null,
            walletAddress: config.user?.walletAddress || null,
            isPublic: config.visibility === "public",
          };

          filesToUpload.push({
            buffer: Buffer.from(JSON.stringify(metadata, null, 2)),
            name: "metadata.json",
            type: "application/json",
          });

          // Upload to CDN (webhook will create database record)
          await this.uploadToCDN(config.assetId, filesToUpload);

          baseModelPath = `models/${config.assetId}/${config.assetId}.glb`;
        } finally {
          // Clean up temp files
          await fs
            .rm(tempDir, { recursive: true, force: true })
            .catch((err) =>
              logger.warn({ err, tempDir }, "Failed to cleanup temp dir"),
            );
        }

        pipeline.stages.image3D.status = "completed";
        pipeline.stages.image3D.progress = 100;
        pipeline.stages.image3D.result = {
          taskId: meshyTaskId,
          modelUrl: meshyResult.model_urls.glb,
          polycount: meshyResult.polycount,
          localPath: baseModelPath,
        };
        pipeline.results.image3D = pipeline.stages.image3D.result;
        pipeline.progress = 50;
      } catch (error) {
        logger.error({ err: error }, "Image to 3D conversion failed:");
        pipeline.stages.image3D.status = "failed";
        pipeline.stages.image3D.error = (error as Error).message;
        throw error;
      }

      // Stage 4: Material Variant Generation (Retexturing)
      if (config.enableRetexturing && config.materialPresets?.length! > 0) {
        pipeline.stages.textureGeneration.status = "processing";

        const variants: VariantResult[] = [];
        const totalVariants = config.materialPresets!.length;

        for (let i = 0; i < totalVariants; i++) {
          const preset = config.materialPresets![i] as MaterialPresetType;

          try {
            logger.info(
              {
                variantIndex: i + 1,
                totalVariants,
                presetName: preset.displayName,
              },
              "Generating variant",
            );

            // Update progress
            pipeline.stages.textureGeneration.progress = Math.round(
              (i / totalVariants) * 100,
            );

            // Use Meshy retexture API
            const retextureTaskResult = await this.aiService
              .getMeshyService()
              .startRetextureTask(
                { inputTaskId: meshyTaskId! },
                { textStylePrompt: preset.stylePrompt },
                {
                  artStyle: "realistic",
                  aiModel: "meshy-5",
                  enableOriginalUV: true,
                },
              );

            // Handle both string and MeshyTaskResponse types
            const retextureTaskId =
              typeof retextureTaskResult === "string"
                ? retextureTaskResult
                : String(retextureTaskResult);

            // Wait for completion
            let retextureResult: RetextureResult | null = null;
            let retextureAttempts = 0;
            const maxRetextureAttempts = 60;

            while (retextureAttempts < maxRetextureAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 5000));

              const statusResponse = await this.aiService
                .getMeshyService()
                .getRetextureTaskStatus(retextureTaskId);

              const status = statusResponse as RetextureResult;

              if (status.status === "SUCCEEDED") {
                retextureResult = status;
                break;
              } else if (status.status === "FAILED") {
                throw new Error(status.error || "Retexture failed");
              }

              retextureAttempts++;
            }

            if (!retextureResult) {
              throw new Error("Retexture timed out");
            }

            // Save variant
            const variantId = `${config.assetId}-${preset.id}`;

            const variantBuffer = await this.downloadFile(
              retextureResult.model_urls.glb,
            );

            // Prepare files for CDN upload
            const variantFilesToUpload: Array<{
              buffer: Buffer;
              name: string;
              type?: string;
            }> = [];

            // Variant model
            variantFilesToUpload.push({
              buffer: variantBuffer,
              name: `${variantId}.glb`,
              type: "model/gltf-binary",
            });

            // Concept art (copy from base asset via CDN_URL)
            // Note: We'll include concept-art reference in metadata but not re-upload
            // The webhook handler can fetch it from the base asset if needed

            // Save variant metadata - EXACT structure from arrows-bronze reference
            const variantMetadata = {
              id: variantId,
              gameId: variantId,
              name: variantId,
              type: config.type,
              subtype: config.subtype,
              isBaseModel: false,
              isVariant: true,
              parentBaseModel: config.assetId,
              materialPreset: {
                id: preset.id,
                displayName: preset.displayName,
                category: preset.category,
                tier: preset.tier,
                color: preset.color,
                stylePrompt: preset.stylePrompt,
              },
              workflow: "Meshy AI Retexture",
              baseModelTaskId: meshyTaskId,
              retextureTaskId: retextureTaskId,
              retextureStatus: "completed",
              modelPath: `${variantId}.glb`,
              conceptArtPath: null,
              hasModel: true,
              hasConceptArt: true,
              generatedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              description: config.description,
              isPlaceholder: false,
              gddCompliant: true,
              // Ownership tracking (Phase 1) - inherit from parent
              createdBy: config.user?.userId || null,
              walletAddress: config.user?.walletAddress || null,
              isPublic: config.visibility === "public",
            };

            variantFilesToUpload.push({
              buffer: Buffer.from(JSON.stringify(variantMetadata, null, 2)),
              name: "metadata.json",
              type: "application/json",
            });

            // Upload variant to CDN
            await this.uploadToCDN(variantId, variantFilesToUpload);

            variants.push({
              id: variantId,
              name: preset.displayName,
              modelUrl: retextureResult.model_urls.glb,
              success: true,
            });
          } catch (error) {
            logger.error(
              { err: error, presetName: preset.displayName },
              "Failed to generate variant",
            );
            variants.push({
              id: `${config.assetId}-${preset.id}`,
              name: preset.displayName,
              success: false,
              error: (error as Error).message,
            });
          }
        }

        pipeline.stages.textureGeneration.status = "completed";
        pipeline.stages.textureGeneration.progress = 100;
        pipeline.stages.textureGeneration.result = { variants, totalVariants };
        pipeline.results.textureGeneration =
          pipeline.stages.textureGeneration.result;
        pipeline.progress = 75;

        // Note: Base model metadata will be updated by the CDN webhook handler
        // when it receives the variant upload notifications
      } else {
        pipeline.stages.textureGeneration.status = "skipped";
      }

      // Stage 5: Auto-Rigging (for avatars only)
      if (
        config.generationType === "avatar" &&
        config.enableRigging &&
        meshyTaskId
      ) {
        pipeline.stages.rigging = { status: "processing", progress: 0 };

        try {
          logger.info(
            { pipelineId, stage: "rigging" },
            "Starting auto-rigging for avatar",
          );

          // Start rigging task
          const riggingTaskResult = await this.aiService
            .getMeshyService()
            .startRiggingTask(
              { inputTaskId: meshyTaskId },
              {
                heightMeters: config.riggingOptions?.heightMeters || 1.7,
              },
            );

          // Handle both string and MeshyTaskResponse types
          const riggingTaskId =
            typeof riggingTaskResult === "string"
              ? riggingTaskResult
              : String(riggingTaskResult);

          logger.info({ pipelineId, riggingTaskId }, "Rigging task started");

          // Poll for rigging completion
          let riggingResult: RiggingResult | null = null;
          let riggingAttempts = 0;
          const maxRiggingAttempts = 60; // 5 minutes

          while (riggingAttempts < maxRiggingAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const statusResponse = await this.aiService
              .getMeshyService()
              .getRiggingTaskStatus(riggingTaskId);

            const status = statusResponse as RiggingResult;
            pipeline.stages.rigging!.progress =
              status.progress || (riggingAttempts / maxRiggingAttempts) * 100;

            if (status.status === "SUCCEEDED") {
              riggingResult = status;
              break;
            } else if (status.status === "FAILED") {
              throw new Error(status.task_error?.message || "Rigging failed");
            }

            riggingAttempts++;
          }

          if (!riggingResult) {
            throw new Error("Rigging timed out");
          }

          // Download rigged model and animations
          const riggedAssets: Record<string, string> = {};
          const riggingFilesToUpload: Array<{
            buffer: Buffer;
            name: string;
            type?: string;
          }> = [];

          // IMPORTANT: For rigged avatars, we DON'T replace the main model
          // We keep the original T-pose model and save animations separately
          // This prevents the T-pose + animation layering issue
          logger.info(
            { pipelineId, stage: "rigging" },
            "Processing rigged character assets",
          );

          // Use temp directory for T-pose extraction
          const tempRiggingDir = path.join("/tmp", `rigging-${config.assetId}`);
          await fs.mkdir(tempRiggingDir, { recursive: true });

          try {
            // Download animations if available
            if (riggingResult.result && riggingResult.result.basic_animations) {
              const animations = riggingResult.result.basic_animations;

              // CRITICAL: First, get the rigged model from the walking animation
              // This contains the model with bones that we need for animations
              if (animations.walking_glb_url) {
                logger.info(
                  { pipelineId, stage: "rigging" },
                  "Downloading rigged model and animations",
                );
                const walkingBuffer = await this.downloadFile(
                  animations.walking_glb_url,
                );

                // Add walking animation to upload
                riggingFilesToUpload.push({
                  buffer: walkingBuffer,
                  name: "animations/walking.glb",
                  type: "model/gltf-binary",
                });
                riggedAssets.walking = "animations/walking.glb";

                // Extract T-pose from the walking animation
                logger.info(
                  { pipelineId, stage: "rigging" },
                  "Extracting T-pose from walking animation",
                );
                try {
                  const walkingTempPath = path.join(
                    tempRiggingDir,
                    "walking.glb",
                  );
                  const tposeTempPath = path.join(tempRiggingDir, "t-pose.glb");
                  await fs.writeFile(walkingTempPath, walkingBuffer);
                  await this.extractTPoseFromAnimation(
                    walkingTempPath,
                    tposeTempPath,
                  );

                  const tposeBuffer = await fs.readFile(tposeTempPath);
                  riggingFilesToUpload.push({
                    buffer: tposeBuffer,
                    name: "t-pose.glb",
                    type: "model/gltf-binary",
                  });
                  riggedAssets.tpose = "t-pose.glb";
                  logger.info(
                    { pipelineId, stage: "rigging" },
                    "T-pose extracted successfully",
                  );
                } catch (tposeError) {
                  logger.error(
                    { err: tposeError },
                    "⚠️ Failed to extract T-pose",
                  );
                  // Continue anyway - not critical for the pipeline
                }

                // IMPORTANT: Save rigged T-pose model for animation player
                // The walking GLB contains a rigged model in T-pose on frame 0, followed by walking animation
                riggingFilesToUpload.push({
                  buffer: walkingBuffer,
                  name: `${config.assetId}_rigged.glb`,
                  type: "model/gltf-binary",
                });
                logger.info(
                  { pipelineId, stage: "rigging" },
                  "Prepared rigged model for animation player",
                );
              }

              // Download running animation GLB
              if (animations.running_glb_url) {
                const runningBuffer = await this.downloadFile(
                  animations.running_glb_url,
                );
                riggingFilesToUpload.push({
                  buffer: runningBuffer,
                  name: "animations/running.glb",
                  type: "model/gltf-binary",
                });
                riggedAssets.running = "animations/running.glb";
              }
            }

            // Prepare updated metadata with rigging information
            // Note: We need to fetch the current metadata, update it, and re-upload
            const updatedMetadata = {
              isRigged: true,
              riggingTaskId: riggingTaskId,
              riggingStatus: "completed",
              rigType: "humanoid-standard",
              characterHeight: config.riggingOptions?.heightMeters || 1.7,
              animations: {
                basic: riggedAssets,
              },
              riggedModelPath: `${config.assetId}_rigged.glb`,
              tposeModelPath: riggedAssets.tpose || null,
              supportsAnimation: true,
              animationCompatibility: ["mixamo", "unity", "unreal"],
              updatedAt: new Date().toISOString(),
            };

            riggingFilesToUpload.push({
              buffer: Buffer.from(JSON.stringify(updatedMetadata, null, 2)),
              name: "rigging-metadata.json",
              type: "application/json",
            });

            // Upload rigging files to CDN
            await this.uploadToCDN(config.assetId, riggingFilesToUpload);
          } finally {
            // Clean up temp files
            await fs
              .rm(tempRiggingDir, { recursive: true, force: true })
              .catch((err) =>
                logger.warn(
                  { err, tempRiggingDir },
                  "Failed to cleanup temp rigging dir",
                ),
              );
          }

          pipeline.stages.rigging!.status = "completed";
          pipeline.stages.rigging!.progress = 100;
          pipeline.stages.rigging!.result = {
            taskId: riggingTaskId,
            animations: riggedAssets,
          };
          pipeline.results.rigging = pipeline.stages.rigging!.result;
          pipeline.progress = 85;
        } catch (error) {
          logger.error(
            { err: error, pipelineId, stage: "rigging" },
            "Rigging failed",
          );
          logger.error({ err: error }, "Full rigging error");

          // Upload failed rigging metadata to CDN
          try {
            const failedMetadata = {
              isRigged: false,
              riggingStatus: "failed",
              riggingError: (error as Error).message,
              riggingAttempted: true,
              updatedAt: new Date().toISOString(),
            };

            await this.uploadToCDN(config.assetId, [
              {
                buffer: Buffer.from(JSON.stringify(failedMetadata, null, 2)),
                name: "rigging-metadata.json",
                type: "application/json",
              },
            ]);
          } catch (metadataError) {
            logger.error(
              { err: metadataError },
              "Failed to upload metadata after rigging failure",
            );
          }

          pipeline.stages.rigging!.status = "failed";
          pipeline.stages.rigging!.error = (error as Error).message;
          pipeline.stages.rigging!.progress = 0;

          // Continue without rigging - don't fail the entire pipeline
          logger.info(
            "⚠️  Continuing without rigging - avatar will not have animations",
          );
        }
      }

      // Note: CDN upload is now handled inline during each stage
      // The webhook handler will create/update database records automatically
      logger.info(
        { pipelineId },
        "All files uploaded to CDN, webhook notifications sent",
      );

      // Complete
      pipeline.status = "completed";
      pipeline.completedAt = new Date().toISOString();
      pipeline.progress = 100;

      // Compile final asset info
      const textureResult = pipeline.results.textureGeneration as
        | { variants: VariantResult[]; totalVariants: number }
        | undefined;

      pipeline.finalAsset = {
        id: config.assetId,
        name: config.name,
        modelUrl: `/assets/${config.assetId}/${config.assetId}.glb`,
        conceptArtUrl: `/assets/${config.assetId}/concept-art.png`,
        variants: textureResult?.variants || [],
      };
      metricStatus = "success";
    } catch (error) {
      pipeline.status = "failed";
      pipeline.error = (error as Error).message;
      assetGenerationErrors.inc({
        type: metricType,
        error_type: this.getAssetErrorLabel(error),
      });
      throw error;
    } finally {
      assetGenerationCounter.inc({
        type: metricType,
        status: metricStatus,
      });
      generationTimer.observe(assetGenerationDuration, { type: metricType });
    }
  }

  /**
   * Enhance prompt with GPT-4 (via Vercel AI Gateway or direct OpenAI)
   */
  private async enhancePromptWithGPT4(
    config: PipelineConfig,
  ): Promise<PromptEnhancementResult> {
    // Check for AI Gateway or direct OpenAI API key
    const useAIGateway = !!this.aiGatewayApiKey;
    const useDirectOpenAI = !!this.openaiApiKey;

    if (!useAIGateway && !useDirectOpenAI) {
      throw new Error(
        "AI_GATEWAY_API_KEY or OPENAI_API_KEY required for GPT-4 enhancement",
      );
    }

    // Load GPT-4 enhancement prompts
    const gpt4Prompts = await getGPT4EnhancementPrompts();

    const isAvatar =
      config.generationType === "avatar" || config.type === "character";
    const isArmor = config.type === "armor";
    const isChestArmor =
      isArmor &&
      (config.subtype?.toLowerCase().includes("chest") ||
        config.subtype?.toLowerCase().includes("body"));

    // Build system prompt from loaded prompts
    let systemPrompt =
      gpt4Prompts?.systemPrompt?.base ||
      `You are an expert at optimizing prompts for 3D asset generation.
Your task is to enhance the user's description to create better results with image generation and 3D conversion.`;

    if (isAvatar) {
      systemPrompt +=
        "\n" +
        (gpt4Prompts?.typeSpecific?.avatar?.critical ||
          `CRITICAL for characters: The character MUST be in a T-pose (arms stretched out horizontally, legs slightly apart) for proper rigging. The character must have EMPTY HANDS - no weapons, tools, or held items. Always add "standing in T-pose with empty hands" to the description.`);
    }

    if (isArmor) {
      systemPrompt +=
        "\n" +
        (gpt4Prompts?.typeSpecific?.armor?.base ||
          `CRITICAL for armor pieces: The armor must be shown ALONE without any armor stand, mannequin, or body inside.`);
      if (isChestArmor) {
        systemPrompt +=
          " " +
          (gpt4Prompts?.typeSpecific?.armor?.chest ||
            "EXTRA IMPORTANT for chest/body armor: This MUST be shaped for a SCARECROW POSE (T-POSE) - imagine a scarecrow with arms sticking STRAIGHT OUT SIDEWAYS...");
      }
      systemPrompt +=
        " " +
        (gpt4Prompts?.typeSpecific?.armor?.positioning ||
          "The armor MUST be positioned and SHAPED for a SCARECROW/T-POSE body...");
    }

    // Add focus points
    const focusPoints = gpt4Prompts?.systemPrompt?.focusPoints || [
      "Clear, specific visual details",
      "Material and texture descriptions",
      "Geometric shape and form",
      `Style consistency (especially for ${config.style || "low-poly RuneScape"} style)`,
    ];

    systemPrompt +=
      "\nFocus on:\n" +
      focusPoints
        .map(
          (point) =>
            "- " +
            point.replace(
              "${config.style || 'low-poly RuneScape'}",
              config.style || "low-poly RuneScape",
            ),
        )
        .join("\n");

    if (isAvatar) {
      systemPrompt +=
        "\n" +
        (gpt4Prompts?.typeSpecific?.avatar?.focus ||
          "- T-pose stance with empty hands for rigging compatibility");
    }

    if (isArmor) {
      const armorFocus = gpt4Prompts?.typeSpecific?.armor?.focus || [
        "- Armor SHAPED for T-pose body (shoulder openings pointing straight sideways, not down)",
        '- Chest armor should form a "T" or cross shape when viewed from above',
        "- Shoulder openings at 180° angle to each other (straight line across)",
      ];
      systemPrompt += "\n" + armorFocus.join("\n");
    }

    systemPrompt +=
      "\n" +
      (gpt4Prompts?.systemPrompt?.closingInstruction ||
        "Keep the enhanced prompt concise but detailed.");

    // Include custom game style text (if present) ahead of the description for better style adherence
    const stylePrefix = config.customPrompts?.gameStyle
      ? `${config.customPrompts.gameStyle} — `
      : "";
    const baseDescription = `${stylePrefix}${config.description}`;
    const userPrompt = isArmor
      ? (gpt4Prompts?.typeSpecific?.armor?.enhancementPrefix ||
          `Enhance this armor piece description for 3D generation. CRITICAL: The armor must be SHAPED FOR A T-POSE BODY - shoulder openings must point STRAIGHT SIDEWAYS at 90 degrees (like a scarecrow), NOT angled downward! Should look like a wide "T" shape. Ends at shoulders (no arm extensions), hollow openings, no armor stand: `) +
        `"${baseDescription}"`
      : `Enhance this ${config.type} asset description for 3D generation: "${baseDescription}"`;

    try {
      // Select endpoint and auth based on available API keys
      const endpoint = useAIGateway
        ? "https://ai-gateway.vercel.sh/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const apiKey = useAIGateway ? this.aiGatewayApiKey : this.openaiApiKey;

      const modelName = useAIGateway
        ? "openai/gpt-4o" // AI Gateway uses provider/model format
        : "gpt-4"; // Direct OpenAI uses just the model name

      logger.info(
        { source: useAIGateway ? "Vercel AI Gateway" : "direct OpenAI API" },
        "Using GPT-4 enhancement",
      );

      const response = await this.fetchFn(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT-4 API error: ${response.status}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const optimizedPrompt = data.choices[0].message.content.trim();

      return {
        originalPrompt: config.description,
        optimizedPrompt,
        model: "gpt-4",
        keywords: this.extractKeywords(optimizedPrompt),
      };
    } catch (error) {
      logger.error({ err: error }, "GPT-4 enhancement failed:");
      // Load generation prompts for fallback
      const generationPrompts = await getGenerationPrompts();
      const fallbackTemplate =
        generationPrompts?.imageGeneration?.fallbackEnhancement ||
        '${config.description}. ${config.style || "game-ready"} style, clean geometry, game-ready 3D asset.';

      // Replace template variables
      const fallbackPrompt = fallbackTemplate
        .replace("${config.description}", config.description)
        .replace(
          '${config.style || "game-ready"}',
          config.style || "game-ready",
        );

      return {
        originalPrompt: config.description,
        optimizedPrompt: fallbackPrompt,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Upload files directly to CDN
   * @param assetId - Asset ID for directory structure
   * @param files - Array of files to upload
   * @returns CDN upload response
   */
  private async uploadToCDN(
    assetId: string,
    files: Array<{ buffer: ArrayBuffer | Buffer; name: string; type?: string }>,
  ): Promise<{
    success: boolean;
    files: Array<{ path: string; url: string; size: number }>;
  }> {
    // Use shared CDN upload service
    return cdnUploadService.upload(
      files.map((f) => ({
        buffer: f.buffer,
        fileName: f.name,
        mimeType: f.type,
      })),
      {
        assetId,
        directory: "models",
      },
    );
  }

  /**
   * Extract keywords from prompt
   */
  private extractKeywords(prompt: string): string[] {
    const keywords: string[] = [];
    const patterns = [
      /\b(bronze|steel|iron|mithril|adamant|rune)\b/gi,
      /\b(sword|shield|bow|staff|armor|helmet)\b/gi,
      /\b(leather|metal|wood|crystal|bone)\b/gi,
      /\b(low-poly|high-poly|realistic|stylized)\b/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = prompt.match(pattern);
      if (matches) {
        keywords.push(...matches.map((m) => m.toLowerCase()));
      }
    });

    return [...new Set(keywords)];
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<Buffer> {
    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Extract T-pose from an animation GLB file by removing animations
   */
  private async extractTPoseFromAnimation(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const inputBuffer = await fs.readFile(inputPath);

    // Verify GLB magic number
    const magic = inputBuffer.readUInt32LE(0);
    if (magic !== 0x46546c67) {
      // 'glTF' in little-endian
      throw new Error("Not a valid GLB file");
    }

    const version = inputBuffer.readUInt32LE(4);
    const totalLength = inputBuffer.readUInt32LE(8);

    // Parse chunks
    let offset = 12; // Skip header
    const chunks: Array<{ type: string; data: Buffer }> = [];

    while (offset < inputBuffer.length) {
      const chunkLength = inputBuffer.readUInt32LE(offset);
      const chunkType = inputBuffer.readUInt32BE(offset + 4);

      const typeStr = String.fromCharCode(
        (chunkType >> 24) & 0xff,
        (chunkType >> 16) & 0xff,
        (chunkType >> 8) & 0xff,
        chunkType & 0xff,
      );

      const chunkData = inputBuffer.slice(offset + 8, offset + 8 + chunkLength);
      chunks.push({ type: typeStr, data: chunkData });

      // Chunks are padded to 4-byte boundaries
      const paddedLength = Math.ceil(chunkLength / 4) * 4;
      offset += 8 + paddedLength;
    }

    // Find and modify the JSON chunk to remove animations
    const jsonChunk = chunks.find((c) => c.type === "JSON");
    if (!jsonChunk) {
      throw new Error("No JSON chunk found in GLB");
    }

    // Parse the glTF JSON
    const gltfJson = JSON.parse(jsonChunk.data.toString());

    // Remove animations
    delete gltfJson.animations;

    // Convert back to buffer
    const newJsonStr = JSON.stringify(gltfJson);
    const newJsonBuffer = Buffer.from(newJsonStr);

    // Pad to 4-byte boundary with spaces (0x20) as per glTF spec
    const paddedLength = Math.ceil(newJsonBuffer.length / 4) * 4;
    const paddedJsonBuffer = Buffer.alloc(paddedLength, 0x20); // Fill with spaces
    newJsonBuffer.copy(paddedJsonBuffer);

    // Update JSON chunk
    jsonChunk.data = paddedJsonBuffer;

    // Reconstruct GLB
    let newTotalLength = 12; // header
    chunks.forEach((chunk) => {
      newTotalLength += 8 + chunk.data.length; // chunk header + data
    });

    // Create output buffer
    const outputBuffer = Buffer.alloc(newTotalLength);

    // Write header
    outputBuffer.writeUInt32LE(0x46546c67, 0); // magic
    outputBuffer.writeUInt32LE(version, 4);
    outputBuffer.writeUInt32LE(newTotalLength, 8);

    // Write chunks
    offset = 12;
    chunks.forEach((chunk) => {
      // Chunk header
      outputBuffer.writeUInt32LE(chunk.data.length, offset);

      // Convert type string back to uint32
      let typeInt = 0;
      for (let i = 0; i < 4; i++) {
        typeInt |= chunk.type.charCodeAt(i) << (24 - i * 8);
      }
      outputBuffer.writeUInt32BE(typeInt, offset + 4);

      // Chunk data
      chunk.data.copy(outputBuffer, offset + 8);

      offset += 8 + chunk.data.length;
    });

    // Write output file
    await fs.writeFile(outputPath, outputBuffer);
  }

  /**
   * Clean up old pipelines from database
   * Removes completed pipelines older than 24 hours and failed pipelines older than 1 hour
   */
  async cleanupOldPipelines(): Promise<void> {
    const now = new Date();
    const completedThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const failedThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    try {
      // Clean up old completed pipelines
      const completedCount =
        await this.pipelineRepo.cleanupOldPipelines(completedThreshold);
      logger.info(
        { count: completedCount, threshold: completedThreshold },
        "Cleaned up completed pipelines",
      );

      // Note: The repository's cleanupOldPipelines handles completed, failed, and cancelled
      // so we don't need a separate call for failed pipelines
    } catch (error) {
      logger.error({ err: error }, "Failed to cleanup old pipelines");
      throw error;
    }
  }

  private getAssetMetricType(config: PipelineConfig): string {
    return (
      config.type?.toLowerCase() ||
      config.generationType?.toLowerCase() ||
      "unknown"
    );
  }

  private getAssetErrorLabel(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("timeout")) return "timeout";
      if (message.includes("auth")) return "authentication";
      if (message.includes("network")) return "network";
      if (message.includes("mesh")) return "meshy";
      if (message.includes("gpt") || message.includes("openai"))
        return "openai";
      return error.name || "error";
    }
    return "unknown";
  }
}
