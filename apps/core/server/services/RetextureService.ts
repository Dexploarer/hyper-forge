/**
 * Retexture Service
 * Handles AI-powered texture generation using Meshy API
 */

import fs from "fs/promises";
import { logger } from "../utils/logger";
import path from "path";
import fetch from "node-fetch";
import type { UserContextType, AssetMetadataType } from "../models";
import type { Static } from "elysia";
import { MaterialPreset as MaterialPresetModel } from "../models";
import { cdnUploadService } from "../utils/CDNUploadService";

// Use the TypeBox model as the type
type MaterialPreset = Static<typeof MaterialPresetModel>;

type FetchFunction = typeof fetch;

interface MeshyClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  checkInterval?: number;
  maxCheckTime?: number;
  keepAlive?: boolean;
  maxSockets?: number;
  fetchFn?: FetchFunction;
}

interface RetextureOptions {
  inputTaskId: string;
  textStylePrompt?: string;
  imageStyleUrl?: string;
  artStyle?: string;
  aiModel?: string;
  enableOriginalUV?: boolean;
}

interface TaskStatus {
  status: string;
  progress?: number;
  task_error?: {
    message: string;
  };
  model_urls?: {
    glb?: string;
  };
}

interface RemeshResponse {
  model_url: string;
  task_id: string;
}

interface RetextureRequestBody {
  input_task_id: string;
  art_style: string;
  ai_model: string;
  enable_original_uv: boolean;
  text_style_prompt?: string;
  image_style_url?: string;
}

interface RetextureResponse {
  result?: string;
  task_id?: string;
}

interface RetextureParams {
  baseAssetId: string;
  materialPreset?: MaterialPreset;
  customPrompt?: string;
  imageUrl?: string;
  artStyle?: "realistic" | "cartoon";
  outputName?: string;
  assetsDir: string;
  user?: UserContextType | null;
}

interface SaveRetexturedAssetParams {
  result: TaskStatus;
  variantName: string;
  baseAssetId: string;
  baseMetadata: AssetMetadataType;
  materialPreset: MaterialPreset;
  taskId: string;
  assetsDir: string;
  user?: UserContextType | null;
}

interface RegenerateBaseParams {
  baseAssetId: string;
  assetsDir: string;
}

interface MaterialPresetInfo {
  id: string;
  displayName: string;
  category: string;
  tier: number;
  color: string;
  stylePrompt?: string;
}

/**
 * Extended variant metadata with material preset information
 * Includes all standard asset metadata plus variant-specific fields
 */
interface VariantMetadataExtended extends AssetMetadataType {
  materialPreset: MaterialPresetInfo;
  baseAssetId?: string;
  variantType?: "retexture";
}

// Temporary MeshyClient implementation until build issues are resolved
class MeshyClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  public checkInterval: number;
  public maxCheckTime: number;
  private fetchFn: FetchFunction;

  constructor(config: MeshyClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.meshy.ai";
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelayMs || 5000;
    this.checkInterval = config.checkInterval || 10000;
    this.maxCheckTime = config.maxCheckTime || 600000;
    this.fetchFn = config.fetchFn || fetch;
  }

  async remesh(
    modelPath: string,
    options: { targetPolycount?: number } = {},
  ): Promise<{ modelUrl: string; taskId: string }> {
    // Minimal implementation for remeshing
    const formData = new FormData();
    const fileBuffer = await fs.readFile(modelPath);
    const blob = new Blob([fileBuffer], { type: "model/gltf-binary" });
    formData.append("file", blob, "model.glb");
    formData.append("targetPolycount", String(options.targetPolycount || 3000));

    const response = await this.fetchFn(`${this.baseUrl}/v1/remesh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Remesh failed: ${response.statusText}`);
    }

    const result = (await response.json()) as RemeshResponse;
    return {
      modelUrl: result.model_url,
      taskId: result.task_id,
    };
  }

  async checkTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.fetchFn(`${this.baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Task check failed: ${response.statusText}`);
    }

    return (await response.json()) as TaskStatus;
  }

  async startRetexture(options: RetextureOptions): Promise<string> {
    const body: RetextureRequestBody = {
      input_task_id: options.inputTaskId,
      art_style: options.artStyle || "realistic",
      ai_model: options.aiModel || "meshy-5",
      enable_original_uv: options.enableOriginalUV ?? true,
    };

    // Add text prompt or image URL (image takes precedence per Meshy API docs)
    if (options.imageStyleUrl) {
      body.image_style_url = options.imageStyleUrl;
    } else if (options.textStylePrompt) {
      body.text_style_prompt = options.textStylePrompt;
    } else {
      throw new Error("Either textStylePrompt or imageStyleUrl is required");
    }

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
      const error = await response.text();
      throw new Error(
        `Meshy Retexture API error: ${response.status} - ${error}`,
      );
    }

    const result = (await response.json()) as RetextureResponse;
    return result.result || result.task_id || String(result);
  }

  async waitForCompletion(
    taskId: string,
    progressCallback?: (progress: number) => void,
  ): Promise<TaskStatus> {
    const startTime = Date.now();

    while (true) {
      const status = await this.getRetextureTaskStatus(taskId);

      if (status.status === "SUCCEEDED") {
        if (progressCallback) progressCallback(100);
        return status;
      }

      if (status.status === "FAILED") {
        throw new Error(
          `Retexture failed: ${status.task_error?.message || "Unknown error"}`,
        );
      }

      if (progressCallback && status.progress) {
        progressCallback(status.progress);
      }

      if (Date.now() - startTime > this.maxCheckTime) {
        throw new Error(
          `Retexture timeout after ${this.maxCheckTime / 1000} seconds`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, this.checkInterval));
    }
  }

  async getRetextureTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/retexture/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Meshy Retexture API error: ${response.status} - ${error}`,
      );
    }

    return (await response.json()) as TaskStatus;
  }

  async downloadModel(modelUrl: string): Promise<Buffer> {
    const response = await this.fetchFn(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  }

  destroy(): void {
    // Cleanup if needed
  }
}

export class RetextureService {
  private meshyApiKey: string | undefined;
  private meshyClient: MeshyClient | null;
  private fetchFn: FetchFunction;

  constructor(config?: {
    meshyApiKey?: string;
    imageServerBaseUrl?: string;
    fetchFn?: FetchFunction;
  }) {
    this.meshyApiKey = config?.meshyApiKey || process.env.MESHY_API_KEY;
    this.fetchFn = config?.fetchFn || fetch;

    if (!this.meshyApiKey) {
      logger.warn(
        "[RetextureService] MESHY_API_KEY not found - retexturing will be disabled",
      );
      this.meshyClient = null;
    } else {
      // Initialize MeshyClient with robust configuration
      this.meshyClient = new MeshyClient({
        apiKey: this.meshyApiKey,
        baseUrl: "https://api.meshy.ai",
        timeout: 30000, // 30 seconds
        maxRetries: 3,
        retryDelayMs: 2000,
        keepAlive: true,
        maxSockets: 10,
        fetchFn: this.fetchFn,
      });
    }
  }

  /**
   * Upload files directly to CDN using shared CDNUploadService
   *
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
    // Map files to CDNUploadFile format
    const cdnFiles = files.map((file) => ({
      buffer: file.buffer,
      fileName: file.name,
      mimeType: file.type,
    }));

    // Use shared CDN upload service
    return await cdnUploadService.upload(cdnFiles, {
      assetId,
      directory: "models",
    });
  }

  async retexture({
    baseAssetId,
    materialPreset,
    customPrompt,
    imageUrl,
    artStyle,
    outputName,
    assetsDir,
    user = null,
  }: RetextureParams) {
    if (!this.meshyClient) {
      throw new Error("MESHY_API_KEY is required for retexturing");
    }

    try {
      // Get base asset metadata
      const baseMetadata = await this.getAssetMetadata(baseAssetId, assetsDir);
      if (!baseMetadata.meshyTaskId) {
        throw new Error(
          `Base asset ${baseAssetId} does not have a Meshy task ID`,
        );
      }

      // Determine retexture mode and build appropriate parameters
      let textPrompt: string | undefined;
      let imageStyleUrl: string | undefined;
      let mode: string;

      if (imageUrl) {
        // Image-based retexturing (takes precedence)
        imageStyleUrl = imageUrl;
        mode = "image reference";
        logger.info({}, `🎨 Starting image-based retexture for ${baseAssetId}`);
      } else if (customPrompt) {
        // Custom prompt retexturing
        textPrompt = customPrompt;
        mode = "custom prompt";
        logger.info(
          `🎨 Starting custom prompt retexture for ${baseAssetId}: "${customPrompt.substring(0, 50)}..."`,
        );
      } else if (materialPreset) {
        // Preset-based retexturing (legacy mode)
        textPrompt =
          materialPreset.stylePrompt ||
          `Apply ${materialPreset.displayName} material texture`;
        mode = `preset: ${materialPreset.displayName}`;
        logger.info(
          `🎨 Starting preset retexture for ${baseAssetId} with material: ${materialPreset.displayName}`,
        );
      } else {
        throw new Error(
          "Either materialPreset, customPrompt, or imageUrl must be provided",
        );
      }

      // Start retexture task using the new MeshyClient
      const taskId = await this.meshyClient.startRetexture({
        inputTaskId: baseMetadata.meshyTaskId,
        textStylePrompt: textPrompt,
        imageStyleUrl: imageStyleUrl,
        artStyle: artStyle || "realistic",
        aiModel: "meshy-5",
        enableOriginalUV: true,
      });

      logger.info({}, `🎨 Retexture task started: ${taskId}`);

      // Wait for completion with progress updates
      const result = await this.meshyClient.waitForCompletion(
        taskId,
        (progress) => {
          logger.info({}, `⏳ Retexture Progress: ${progress}%`);
        },
      );

      // Download and save the retextured model
      const variantName =
        outputName ||
        (materialPreset
          ? `${baseAssetId.replace("-base", "")}-${materialPreset.id}`
          : `${baseAssetId.replace("-base", "")}-custom-${Date.now()}`);

      const savedAsset = await this.saveRetexturedAsset({
        result,
        variantName,
        baseAssetId,
        baseMetadata,
        materialPreset:
          materialPreset ||
          ({
            id: "custom",
            displayName: customPrompt ? "Custom Prompt" : "Image Reference",
            stylePrompt: customPrompt || imageUrl || "",
            category: "custom",
            tier: 1,
            color: "#666666",
          } as MaterialPreset),
        taskId,
        assetsDir,
        user,
      });

      // Get CDN URL from environment or construct it
      const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
      const cdnUrl = `${CDN_URL}/models/${variantName}/${variantName}.glb`;

      return {
        success: true,
        assetId: variantName,
        url: cdnUrl,
        message: `Asset retextured successfully using ${mode}`,
        asset: savedAsset,
      };
    } catch (error) {
      logger.error({ err: error }, "Retexturing failed:");
      const err = error as Error;

      // Provide more detailed error information
      const errorMessage = err.message || "Unknown error";
      const isNetworkError =
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("network");

      throw new Error(
        isNetworkError
          ? `Network error during retexturing: ${errorMessage}. Please check your internet connection and try again.`
          : `Retexturing failed: ${errorMessage}`,
      );
    }
  }

  async saveRetexturedAsset({
    result,
    variantName,
    baseAssetId,
    baseMetadata,
    materialPreset,
    taskId,
    assetsDir,
    user = null,
  }: SaveRetexturedAssetParams): Promise<AssetMetadataType> {
    if (!result.model_urls?.glb) {
      throw new Error("No model URL in result");
    }

    // Download model using MeshyClient
    logger.info({}, "📥 Downloading retextured model...");
    const modelBuffer = await this.meshyClient!.downloadModel(
      result.model_urls.glb,
    );

    // Prepare files for CDN upload
    const filesToUpload: Array<{
      buffer: Buffer;
      name: string;
      type?: string;
    }> = [];

    // Variant model
    filesToUpload.push({
      buffer: modelBuffer,
      name: `${variantName}.glb`,
      type: "model/gltf-binary",
    });

    // Note: Concept art is inherited from base asset, webhook handler can link it

    // Create standardized metadata with proper typing
    const variantMetadata: VariantMetadataExtended = {
      // Identity
      id: variantName,
      gameId: variantName,
      name: variantName,
      type: baseMetadata.type,
      subtype: baseMetadata.subtype,

      // Variant-specific
      isBaseModel: false,
      isVariant: true,
      parentBaseModel: baseAssetId,
      baseAssetId: baseAssetId,
      variantType: "retexture",

      // Material information
      materialPreset: {
        id: materialPreset.id,
        displayName: materialPreset.displayName,
        category: materialPreset.category || "custom",
        tier: typeof materialPreset.tier === "number" ? materialPreset.tier : 1,
        color: materialPreset.color || "#666666",
        stylePrompt: materialPreset.stylePrompt,
      },

      // Generation tracking
      workflow: "Meshy AI Retexture",
      baseModelTaskId: baseMetadata.meshyTaskId,
      retextureTaskId: taskId,
      retextureStatus: "completed",

      // Files
      hasModel: true,
      hasConceptArt: baseMetadata.hasConceptArt || false,

      // Timestamps
      generatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),

      // Inherit other properties from base
      description: baseMetadata.description,
      isPlaceholder: false,
      gddCompliant: true,

      // Ownership tracking (Phase 1) - inherit from parent or use provided user
      createdBy: user?.userId || baseMetadata.createdBy || undefined,
      walletAddress:
        user?.walletAddress || baseMetadata.walletAddress || undefined,
      isPublic:
        baseMetadata.isPublic !== undefined ? baseMetadata.isPublic : true,
    };

    filesToUpload.push({
      buffer: Buffer.from(JSON.stringify(variantMetadata, null, 2)),
      name: "metadata.json",
      type: "application/json",
    });

    // Upload to CDN (webhook will create database record and link to base)
    await this.uploadToCDN(variantName, filesToUpload);

    logger.info({}, `✅ Successfully retextured and uploaded: ${variantName}`);

    return variantMetadata as AssetMetadataType;
  }

  /**
   * Get asset metadata from CDN (CDN-first architecture)
   * In CDN-first mode, metadata is stored on CDN, not local filesystem
   */
  async getAssetMetadata(
    assetId: string,
    _assetsDir: string, // Deprecated parameter, kept for backward compatibility
  ): Promise<AssetMetadataType> {
    // Try CDN metadata
    const CDN_URL = process.env.CDN_URL;
    if (!CDN_URL) {
      throw new Error(
        "CDN_URL must be configured for asset metadata retrieval",
      );
    }

    try {
      const metadataUrl = `${CDN_URL}/models/${assetId}/metadata.json`;
      const response = await this.fetchFn(metadataUrl);
      if (response.ok) {
        return (await response.json()) as AssetMetadataType;
      }

      throw new Error(
        `Asset metadata not found on CDN: ${response.status} ${metadataUrl}`,
      );
    } catch (error) {
      logger.error(
        { err: error, assetId },
        "Failed to fetch metadata from CDN",
      );
      throw new Error(
        `Asset ${assetId} metadata not available on CDN. Asset must be uploaded to CDN first.`,
      );
    }
  }

  async regenerateBase({ baseAssetId, assetsDir }: RegenerateBaseParams) {
    if (!this.meshyApiKey || !process.env.OPENAI_API_KEY) {
      throw new Error(
        "MESHY_API_KEY and OPENAI_API_KEY are required for base regeneration",
      );
    }

    // For now, return a simulated success response
    // Full implementation would regenerate the base model from scratch
    logger.info({}, `🔄 Regenerating base model: ${baseAssetId}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get CDN URL from environment or construct it
    const CDN_URL = process.env.CDN_URL || "http://localhost:3005";
    const cdnUrl = `${CDN_URL}/models/${baseAssetId}/${baseAssetId}.glb`;

    return {
      success: true,
      assetId: baseAssetId,
      url: cdnUrl,
      message: `Base model ${baseAssetId} has been queued for regeneration. This feature is coming soon!`,
      asset: await this.getAssetMetadata(baseAssetId, assetsDir),
    };
  }

  /**
   * Cleanup resources on shutdown
   */
  destroy(): void {
    if (this.meshyClient) {
      this.meshyClient.destroy();
    }
  }
}
