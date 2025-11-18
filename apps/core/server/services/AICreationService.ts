/**
 * AI Creation Service for Server
 * Provides image generation and Meshy integration with TypeScript
 */

import { getGenerationPrompts } from "../utils/promptLoader";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import {
  aiApiCallsCounter,
  aiApiLatency,
  MetricsTimer,
} from "../metrics/business";

// Type for fetch function (compatible with both global fetch and node-fetch)
type FetchFunction = typeof fetch;

// ==================== Configuration Interfaces ====================

interface OpenAIConfig {
  apiKey: string;
  aiGatewayApiKey?: string;
  model?: string;
  imageServerBaseUrl?: string;
  fetchFn?: FetchFunction;
}

interface MeshyConfig {
  apiKey: string;
  baseUrl?: string;
  fetchFn?: FetchFunction;
}

interface AIServiceConfig {
  openai: OpenAIConfig;
  meshy: MeshyConfig;
  fetchFn?: FetchFunction;
}

// ==================== Image Generation Interfaces ====================

interface ImageMetadata {
  model: string;
  resolution: string;
  quality: string;
  timestamp: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: ImageMetadata;
}

interface OpenAIImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

// ==================== Meshy API Interfaces ====================

interface ImageTo3DOptions {
  enable_pbr?: boolean;
  ai_model?: string;
  topology?: string;
  targetPolycount?: number;
  texture_resolution?: number;
}

interface RetextureInput {
  inputTaskId?: string;
  modelUrl?: string;
}

interface RetextureStyle {
  textStylePrompt?: string;
  imageStyleUrl?: string;
}

interface RetextureOptions {
  artStyle?: string;
  aiModel?: string;
  enableOriginalUV?: boolean;
}

interface RiggingInput {
  inputTaskId?: string;
  modelUrl?: string;
}

interface RiggingOptions {
  heightMeters?: number;
}

// ==================== Meshy Task Creation Response ====================

/**
 * Response from Meshy task creation endpoints
 * (image-to-3d, retexture, rigging)
 */
interface MeshyTaskResponse {
  task_id?: string;
  id?: string;
  result?: {
    task_id?: string;
    id?: string;
  };
}

// ==================== Meshy Task Status Response ====================

/**
 * Base interface for all Meshy task status responses
 */
interface MeshyBaseStatusResponse {
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  progress?: number;
  error?: string;
}

/**
 * Image-to-3D task status response
 */
interface MeshyImageTo3DStatusResponse extends MeshyBaseStatusResponse {
  model_urls?: {
    glb?: string;
    fbx?: string;
    usdz?: string;
    obj?: string;
    mtl?: string;
  };
  thumbnail_url?: string;
  video_url?: string;
  polycount?: number;
  texture_urls?: Array<{
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  }>;
}

/**
 * Retexture task status response
 */
interface MeshyRetextureStatusResponse extends MeshyBaseStatusResponse {
  model_urls?: {
    glb?: string;
    fbx?: string;
    usdz?: string;
    obj?: string;
    mtl?: string;
  };
  thumbnail_url?: string;
  video_url?: string;
}

/**
 * Rigging task status response
 */
interface MeshyRiggingStatusResponse extends MeshyBaseStatusResponse {
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

// ==================== Generation Prompts Interface ====================
// Re-use the interface from promptLoader to avoid type mismatches
import type { GenerationPrompts } from "../utils/promptLoader";

// ==================== Main Service Class ====================

export class AICreationService {
  private config: AIServiceConfig;
  private imageService: ImageGenerationService;
  private meshyService: MeshyService;

  constructor(config: AIServiceConfig) {
    this.config = config;
    // Pass fetchFn to child services, defaulting to global fetch
    const fetchFn = config.fetchFn || fetch;
    this.imageService = new ImageGenerationService({
      ...config.openai,
      fetchFn,
    });
    this.meshyService = new MeshyService({ ...config.meshy, fetchFn });
  }

  getImageService(): ImageGenerationService {
    return this.imageService;
  }

  getMeshyService(): MeshyService {
    return this.meshyService;
  }
}

// ==================== Image Generation Service ====================

class ImageGenerationService {
  private apiKey: string;
  private aiGatewayApiKey?: string;
  private model: string;
  private imageServerBaseUrl?: string;
  private fetchFn: FetchFunction;

  constructor(config: OpenAIConfig) {
    // Validate API keys
    if (!config.apiKey && !config.aiGatewayApiKey) {
      throw new Error(
        "ImageGenerationService requires either apiKey or aiGatewayApiKey",
      );
    }

    // Validate API keys are non-empty strings if provided
    if (config.apiKey && typeof config.apiKey !== "string") {
      throw new Error("OpenAI API key must be a string");
    }
    if (config.aiGatewayApiKey && typeof config.aiGatewayApiKey !== "string") {
      throw new Error("AI Gateway API key must be a string");
    }

    // Validate model name if provided
    if (config.model && typeof config.model !== "string") {
      throw new Error("Model name must be a string");
    }

    // Validate image server URL if provided
    if (config.imageServerBaseUrl) {
      try {
        new URL(config.imageServerBaseUrl);
      } catch {
        throw new Error("Image server base URL must be a valid URL");
      }
    }

    this.apiKey = config.apiKey;
    this.aiGatewayApiKey = config.aiGatewayApiKey;
    this.model = config.model || "gpt-image-1";
    this.imageServerBaseUrl = config.imageServerBaseUrl;
    this.fetchFn = config.fetchFn || fetch;

    logger.info(
      {
        context: "ImageGenerationService",
        hasOpenAIKey: !!this.apiKey,
        hasAIGatewayKey: !!this.aiGatewayApiKey,
        model: this.model,
      },
      "Image generation service initialized",
    );
  }

  async generateImage(
    description: string,
    assetType: string,
    style?: string,
  ): Promise<ImageGenerationResult> {
    // Check for Vercel AI Gateway or direct OpenAI API
    // Use instance variable if available, otherwise fall back to validated environment variable
    const useAIGateway = !!(this.aiGatewayApiKey || env.AI_GATEWAY_API_KEY);
    const useDirectOpenAI = !!(this.apiKey || env.OPENAI_API_KEY);

    if (!useAIGateway && !useDirectOpenAI) {
      throw new Error(
        "AI_GATEWAY_API_KEY or OPENAI_API_KEY required for image generation",
      );
    }

    // Map asset type to appropriate image dimensions
    const dimensionMap: Record<string, string> = {
      portrait: "1024x1024", // Square for circular avatars
      banner: "1792x1024", // Wide landscape for banners (16:9 ratio)
    };
    const imageDimensions = dimensionMap[assetType] || "1024x1024";

    // Load generation prompts
    const generationPrompts: GenerationPrompts | null =
      await getGenerationPrompts();
    const promptTemplate: string =
      generationPrompts?.imageGeneration?.base ||
      '${description}. ${style || "game-ready"} style, ${assetType}, clean geometry suitable for 3D conversion.';

    // Replace template variables
    const prompt = promptTemplate
      .replace("${description}", description)
      .replace('${style || "game-ready"}', style || "game-ready")
      .replace("${assetType}", assetType);

    // AI Gateway uses chat completions for image generation (gpt-5-nano, gemini-2.5-flash-image)
    // Direct OpenAI uses images/generations endpoint (dall-e, gpt-image-1)
    const endpoint = useAIGateway
      ? "https://ai-gateway.vercel.sh/v1/chat/completions"
      : "https://api.openai.com/v1/images/generations";

    // Get API key from instance or validated environment
    const apiKey = useAIGateway
      ? this.aiGatewayApiKey || env.AI_GATEWAY_API_KEY || ""
      : this.apiKey || env.OPENAI_API_KEY || "";

    if (!apiKey) {
      throw new Error(
        useAIGateway
          ? "AI_GATEWAY_API_KEY is required but not configured"
          : "OPENAI_API_KEY is required but not configured",
      );
    }

    // Use google/gemini-2.5-flash-image for AI Gateway, gpt-image-1 for direct OpenAI
    const modelName = useAIGateway
      ? "google/gemini-2.5-flash-image"
      : this.model;

    logger.info(
      `🎨 Using ${useAIGateway ? "Vercel AI Gateway" : "direct OpenAI API"} for image generation (model: ${modelName}, size: ${imageDimensions})`,
    );

    // Build request body based on endpoint type
    const requestBody = useAIGateway
      ? {
          model: modelName,
          messages: [
            {
              role: "user",
              content: `Generate an image: ${prompt}`,
            },
          ],
        }
      : {
          model: modelName,
          prompt: prompt,
          size: imageDimensions,
          quality: "high",
        };

    const providerLabel = useAIGateway ? "vercel_ai_gateway" : "openai";
    const latencyTimer = new MetricsTimer();
    let latencyObserved = false;
    const observeLatency = () => {
      if (!latencyObserved) {
        latencyTimer.observe(aiApiLatency, {
          provider: providerLabel,
          model: modelName,
        });
        latencyObserved = true;
      }
    };

    try {
      const response = await this.fetchFn(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            context: "ImageGenerationService",
            provider: providerLabel,
            model: modelName,
            statusCode: response.status,
            errorPreview: errorText.substring(0, 200),
          },
          "Image generation API request failed",
        );
        throw new Error(
          `Image generation failed with status ${response.status}`,
        );
      }

      interface AIGatewayImageResponse {
        choices?: Array<{
          message?: {
            images?: Array<{
              image_url: { url: string };
            }>;
          };
        }>;
        data?: Array<{
          url?: string;
          b64_json?: string;
        }>;
      }

      const data = (await response.json()) as AIGatewayImageResponse;
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelName,
        status: "success",
      });

      let imageUrl: string;

      if (useAIGateway) {
        // Log the full response to debug
        logger.info(
          { context: "AICreation", data: JSON.stringify(data, null, 2) },
          "AI Gateway response:",
        );

        // AI Gateway returns images in choices[0].message.images array
        const images = data.choices?.[0]?.message?.images;
        if (images && images.length > 0) {
          imageUrl = images[0].image_url.url;
        } else {
          logger.error(
            { err: data },
            "No images found in response. Full data:",
          );
          throw new Error("No image data returned from AI Gateway");
        }
      } else {
        // Direct OpenAI returns images in data array
        const imageData = data.data?.[0];
        if (imageData?.b64_json) {
          imageUrl = `data:image/png;base64,${imageData.b64_json}`;
        } else if (imageData?.url) {
          imageUrl = imageData.url;
        } else {
          throw new Error("No image data returned from OpenAI API");
        }
      }

      return {
        imageUrl: imageUrl,
        prompt: prompt,
        metadata: {
          model: modelName,
          resolution: imageDimensions,
          quality: "high",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelName,
        status: "failure",
      });
      throw error;
    }
  }
}

// ==================== Meshy Service ====================

class MeshyService {
  private apiKey: string;
  private baseUrl: string;
  private fetchFn: FetchFunction;

  constructor(config: MeshyConfig) {
    // Validate API key
    if (!config.apiKey) {
      throw new Error("MeshyService requires an API key");
    }
    if (typeof config.apiKey !== "string" || config.apiKey.trim() === "") {
      throw new Error("Meshy API key must be a non-empty string");
    }

    // Validate base URL if provided
    if (config.baseUrl) {
      try {
        new URL(config.baseUrl);
      } catch {
        throw new Error("Meshy base URL must be a valid URL");
      }
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.meshy.ai";
    this.fetchFn = config.fetchFn || fetch;

    logger.info(
      {
        context: "MeshyService",
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
      },
      "Meshy service initialized",
    );
  }

  async startImageTo3D(
    imageUrl: string,
    options: ImageTo3DOptions,
  ): Promise<string | MeshyTaskResponse> {
    const providerLabel = "meshy";
    const modelLabel = options.ai_model || "meshy-4";
    const latencyTimer = new MetricsTimer();
    let latencyObserved = false;
    const observeLatency = () => {
      if (!latencyObserved) {
        latencyTimer.observe(aiApiLatency, {
          provider: providerLabel,
          model: modelLabel,
        });
        latencyObserved = true;
      }
    };

    try {
      const response = await this.fetchFn(
        `${this.baseUrl}/openapi/v1/image-to-3d`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            enable_pbr: options.enable_pbr ?? false,
            ai_model: modelLabel,
            topology: options.topology || "quad",
            target_polycount: options.targetPolycount || 2000,
            texture_resolution: options.texture_resolution || 512,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            context: "MeshyService",
            method: "startImageTo3D",
            statusCode: response.status,
            errorPreview: errorText.substring(0, 200),
          },
          "Meshy image-to-3D API request failed",
        );
        throw new Error(
          `Meshy image-to-3D failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as MeshyTaskResponse;
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "success",
      });

      // Normalize to task id string for polling
      const taskId =
        data.task_id ||
        data.id ||
        (data.result && (data.result.task_id || data.result.id));
      if (!taskId) {
        // Fallback to previous behavior but this will likely break polling
        return data.result || data;
      }
      return taskId;
    } catch (error) {
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "failure",
      });
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<MeshyImageTo3DStatusResponse> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/image-to-3d/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          context: "MeshyService",
          taskId,
          statusCode: response.status,
        },
        "Failed to get Meshy task status",
      );
      throw new Error(`Meshy API returned status ${response.status}`);
    }

    return (await response.json()) as MeshyImageTo3DStatusResponse;
  }

  async startRetextureTask(
    input: RetextureInput,
    style: RetextureStyle,
    options: RetextureOptions,
  ): Promise<string | MeshyTaskResponse> {
    const providerLabel = "meshy";
    const modelLabel = options.aiModel || "meshy-5";
    const latencyTimer = new MetricsTimer();
    let latencyObserved = false;
    const observeLatency = () => {
      if (!latencyObserved) {
        latencyTimer.observe(aiApiLatency, {
          provider: providerLabel,
          model: modelLabel,
        });
        latencyObserved = true;
      }
    };

    const body: Record<string, unknown> = {
      art_style: options.artStyle || "realistic",
      ai_model: modelLabel,
      enable_original_uv: options.enableOriginalUV ?? true,
    };

    if (input.inputTaskId) {
      body.input_task_id = input.inputTaskId;
    } else {
      body.model_url = input.modelUrl;
    }

    if (style.textStylePrompt) {
      body.text_style_prompt = style.textStylePrompt;
    } else {
      body.image_style_url = style.imageStyleUrl;
    }

    try {
      const response = await this.fetchFn(
        `${this.baseUrl}/openapi/v1/retexture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            context: "MeshyService",
            method: "startRetextureTask",
            statusCode: response.status,
            errorPreview: errorText.substring(0, 200),
          },
          "Meshy retexture API request failed",
        );
        throw new Error(
          `Meshy retexture failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as MeshyTaskResponse;
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "success",
      });

      // Normalize to task id string for polling
      const taskId =
        data.task_id ||
        data.id ||
        (data.result && (data.result.task_id || data.result.id));
      if (!taskId) {
        return data.result || data;
      }
      return taskId;
    } catch (error) {
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "failure",
      });
      throw error;
    }
  }

  async getRetextureTaskStatus(
    taskId: string,
  ): Promise<MeshyRetextureStatusResponse> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/retexture/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          context: "MeshyService",
          taskId,
          statusCode: response.status,
        },
        "Failed to get Meshy retexture task status",
      );
      throw new Error(`Meshy API returned status ${response.status}`);
    }

    return (await response.json()) as MeshyRetextureStatusResponse;
  }

  // Rigging methods for auto-rigging avatars
  async startRiggingTask(
    input: RiggingInput,
    options: RiggingOptions = {},
  ): Promise<string | MeshyTaskResponse> {
    const providerLabel = "meshy";
    const modelLabel = "meshy-rigging";
    const latencyTimer = new MetricsTimer();
    let latencyObserved = false;
    const observeLatency = () => {
      if (!latencyObserved) {
        latencyTimer.observe(aiApiLatency, {
          provider: providerLabel,
          model: modelLabel,
        });
        latencyObserved = true;
      }
    };

    const body: Record<string, unknown> = {
      height_meters: options.heightMeters || 1.7,
    };

    if (input.inputTaskId) {
      body.input_task_id = input.inputTaskId;
    } else if (input.modelUrl) {
      body.model_url = input.modelUrl;
    } else {
      throw new Error("Either inputTaskId or modelUrl must be provided");
    }

    try {
      const response = await this.fetchFn(
        `${this.baseUrl}/openapi/v1/rigging`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            context: "MeshyService",
            method: "startRiggingTask",
            statusCode: response.status,
            errorPreview: errorText.substring(0, 200),
          },
          "Meshy rigging API request failed",
        );
        throw new Error(`Meshy rigging failed with status ${response.status}`);
      }

      const data = (await response.json()) as MeshyTaskResponse;
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "success",
      });

      // Normalize to task id string for polling
      const taskId =
        data.task_id ||
        data.id ||
        (data.result && (data.result.task_id || data.result.id));
      if (!taskId) {
        return data.result || data;
      }
      return taskId;
    } catch (error) {
      observeLatency();
      aiApiCallsCounter.inc({
        provider: providerLabel,
        model: modelLabel,
        status: "failure",
      });
      throw error;
    }
  }

  async getRiggingTaskStatus(
    taskId: string,
  ): Promise<MeshyRiggingStatusResponse> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/rigging/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          context: "MeshyService",
          taskId,
          statusCode: response.status,
        },
        "Failed to get Meshy rigging task status",
      );
      throw new Error(`Meshy API returned status ${response.status}`);
    }

    return (await response.json()) as MeshyRiggingStatusResponse;
  }
}

// ==================== Type Exports ====================

export type {
  AIServiceConfig,
  OpenAIConfig,
  MeshyConfig,
  ImageGenerationResult,
  ImageMetadata,
  ImageTo3DOptions,
  RetextureInput,
  RetextureStyle,
  RetextureOptions,
  RiggingInput,
  RiggingOptions,
};
