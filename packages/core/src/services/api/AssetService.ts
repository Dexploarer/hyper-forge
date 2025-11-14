/**
 * Asset Service
 * Clean API interface for asset operations
 */

import { MaterialPreset, AssetMetadata } from "../../types";

import { api } from "@/lib/api-client";

export type { MaterialPreset };

export type AssetStatus =
  | "draft"
  | "processing"
  | "completed"
  | "failed"
  | "approved"
  | "published"
  | "archived";

export interface BulkUpdateRequest {
  status?: AssetStatus;
  isFavorite?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: string;
  metadata: AssetMetadata;
  hasModel: boolean;
  modelFile?: string;
  generatedAt: string;
  thumbnailPath?: string; // Path to thumbnail/sprite image (e.g., "sprites/0deg.png" or "pfp.png")
  conceptArtPath?: string; // Path to concept art image

  // CDN URLs (presence indicates asset is on CDN - single source of truth)
  cdnUrl?: string; // Full CDN URL for main model file
  cdnThumbnailUrl?: string; // CDN URL for thumbnail
  cdnConceptArtUrl?: string; // CDN URL for concept art
  cdnRiggedModelUrl?: string; // CDN URL for rigged/animated model
  cdnFiles?: string[]; // Array of all CDN file URLs
}

export interface RetextureRequest {
  baseAssetId: string;
  // Support three modes: preset, custom prompt, or image reference
  materialPreset?: MaterialPreset;
  customPrompt?: string;
  imageUrl?: string;
  artStyle?: "realistic" | "cartoon";
  outputName?: string;
}

export interface RetextureResponse {
  success: boolean;
  assetId: string;
  message: string;
  asset?: Asset;
}

class AssetServiceClass {
  async listAssets(): Promise<Asset[]> {
    const { data, error } = await api.api.assets.get({
      query: { t: Date.now().toString() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (error) {
      console.error("Failed to fetch assets:", error);
      throw new Error("Failed to fetch assets");
    }

    return data as Asset[];
  }

  async getMaterialPresets(): Promise<MaterialPreset[]> {
    const { data, error } = await api.api["material-presets"].get();

    if (error) {
      console.error("Failed to fetch material presets:", error);
      throw new Error("Failed to fetch material presets");
    }

    return data as MaterialPreset[];
  }

  async retexture(request: RetextureRequest): Promise<RetextureResponse> {
    const { data, error } = await api.api.retexture.post(request as any);

    if (error) {
      console.error("Retexturing failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "message" in error
          ? (error.message as string)
          : "Retexturing failed",
      );
    }

    return data as RetextureResponse;
  }

  /**
   * Get model URL - uses CDN URL if available, falls back to API endpoint
   * @param asset - Asset object with CDN URL fields (preferred) or asset ID string
   */
  getModelUrl(asset: Asset | string): string {
    // Handle string input for backward compatibility
    if (typeof asset === "string") {
      // Fallback to API endpoint for legacy assets
      console.warn(`[AssetService] Using API fallback for asset ID: ${asset}`);
      return `/api/assets/${asset}/model`;
    }

    // Priority 1: Use CDN URL (preferred for new assets)
    if (asset.cdnUrl) {
      return asset.cdnUrl;
    }

    // Priority 2: Fallback to API endpoint (for legacy assets without CDN URL)
    console.warn(
      `[AssetService] Asset ${asset.id} has no CDN URL, using API fallback`,
    );
    return `/api/assets/${asset.id}/model`;
  }

  /**
   * Get T-pose model URL for retargeting workflow
   * Tries to load t-pose.glb from CDN, falls back to regular model if not found
   */
  async getTPoseUrl(assetId: string): Promise<string> {
    // Try to load t-pose.glb from CDN via API
    const apiTposeUrl = `/api/assets/${assetId}/t-pose.glb`;
    try {
      const response = await fetch(apiTposeUrl, { method: "HEAD" });
      if (response.ok) {
        console.log(`[AssetService] T-pose found on CDN for ${assetId}`);
        return apiTposeUrl;
      }
    } catch (error) {
      // Silently continue to fallback
    }

    console.log(
      `[AssetService] No T-pose found for ${assetId}, using regular model`,
    );

    // Fall back to regular model - must fetch asset to get CDN URL
    const assets = await this.listAssets();
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }
    return this.getModelUrl(asset);
  }

  /**
   * Get concept art URL from CDN or fallback path
   * @param asset - Asset object with CDN URL fields or asset ID
   */
  getConceptArtUrl(asset: Asset | string): string | null {
    // Handle string input for backward compatibility
    if (typeof asset === "string") {
      // No reliable fallback for concept art with just ID
      console.warn(
        `[AssetService] Cannot get concept art URL from asset ID: ${asset}`,
      );
      return null;
    }

    // Priority 1: Use CDN concept art URL
    if (asset.cdnConceptArtUrl) {
      return asset.cdnConceptArtUrl;
    }

    // Priority 2: Check legacy concept art path
    if (asset.conceptArtPath) {
      console.warn(
        `[AssetService] Asset ${asset.id} using legacy concept art path`,
      );
      return `/gdd-assets/${asset.id}/${asset.conceptArtPath}`;
    }

    return null;
  }

  /**
   * Get preview image URL for an asset from CDN
   * Returns thumbnail, concept art, or null if no preview available
   */
  getPreviewImageUrl(asset: Asset): string | null {
    // Priority 1: CDN thumbnail URL
    if (asset.cdnThumbnailUrl) {
      return asset.cdnThumbnailUrl;
    }

    // Priority 2: CDN concept art URL
    if (asset.cdnConceptArtUrl) {
      return asset.cdnConceptArtUrl;
    }

    // No preview available on CDN
    return null;
  }

  /**
   * Upload VRM file to server
   * Saves the converted VRM alongside the original asset
   */
  async uploadVRM(
    assetId: string,
    vrmData: ArrayBuffer,
    filename: string,
  ): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    const blob = new Blob([vrmData], { type: "application/octet-stream" });
    formData.append("file", blob, filename);
    formData.append("assetId", assetId);

    const { data, error } = await api.api.assets["upload-vrm"].post(
      formData as any,
    );

    if (error) {
      console.error("VRM upload failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "message" in error
          ? (error.message as string)
          : "VRM upload failed",
      );
    }

    return data as { success: boolean; url: string };
  }

  /**
   * Get VRM model URL from CDN via API endpoint
   */
  getVRMUrl(assetId: string): string {
    return `/api/assets/${assetId}/${assetId}.vrm`;
  }

  /**
   * Get rigged model URL from CDN
   * Used for characters with rigged/animated models
   */
  getRiggedModelUrl(
    asset: Asset,
    riggedModelPath?: string,
  ): string | undefined {
    // Priority 1: Use CDN rigged model URL
    if (asset.cdnRiggedModelUrl) {
      return asset.cdnRiggedModelUrl;
    }

    // Priority 2: Search CDN files array for rigged model path
    if (riggedModelPath && asset.cdnFiles && asset.cdnFiles.length > 0) {
      const riggedFile = asset.cdnFiles.find((url) =>
        url.includes(riggedModelPath),
      );
      if (riggedFile) {
        return riggedFile;
      }
    }

    // No rigged model available on CDN
    return undefined;
  }

  /**
   * Bulk update multiple assets
   * Supports updating status and isFavorite fields for multiple assets at once
   */
  async bulkUpdateAssets(
    assetIds: string[],
    updates: BulkUpdateRequest,
  ): Promise<{
    success: boolean;
    updated: number;
    failed: number;
    errors?: Array<{ assetId: string; error: string }>;
  }> {
    const { data, error } = await api.api.assets["bulk-update"].post({
      assetIds,
      updates,
    } as any);

    if (error) {
      console.error("Bulk update failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "message" in error
          ? (error.message as string)
          : "Bulk update failed",
      );
    }

    return data as {
      success: boolean;
      updated: number;
      failed: number;
      errors?: Array<{ assetId: string; error: string }>;
    };
  }
}

export const AssetService = new AssetServiceClass();
