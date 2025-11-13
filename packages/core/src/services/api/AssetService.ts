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

  // CDN URLs (populated when asset is published to CDN)
  publishedToCdn?: boolean;
  cdnUrl?: string; // Full CDN URL for main model file
  cdnThumbnailUrl?: string; // CDN URL for thumbnail
  cdnConceptArtUrl?: string; // CDN URL for concept art
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
   * Get model URL - uses CDN URL if available, falls back to local
   * @param asset - Asset object with CDN URL fields (preferred)
   * @param assetId - Asset ID for backward compatibility fallback
   */
  getModelUrl(asset: Asset | string): string {
    // Handle string input for backward compatibility
    if (typeof asset === "string") {
      return `/gdd-assets/${asset}/${asset}.glb`;
    }

    // Priority 1: Use CDN URL if asset is published to CDN
    if (asset.publishedToCdn && asset.cdnUrl) {
      return asset.cdnUrl;
    }

    // Priority 2: Fallback to local path
    return `/gdd-assets/${asset.id}/${asset.id}.glb`;
  }

  /**
   * Get T-pose model URL for retargeting workflow
   * Tries to load t-pose.glb, falls back to regular model if not found
   */
  async getTPoseUrl(assetId: string): Promise<string> {
    // Try gdd-assets first (for any asset that might be in that folder)
    const gddTposeUrl = `/gdd-assets/${assetId}/t-pose.glb`;
    try {
      const response = await fetch(gddTposeUrl, { method: "HEAD" });
      if (response.ok) {
        console.log(`[AssetService] T-pose found in gdd-assets: ${assetId}`);
        return gddTposeUrl;
      }
    } catch (error) {
      // Silently continue to next check
    }

    // Try to load t-pose.glb from user assets via API
    const apiTposeUrl = `/api/assets/${assetId}/t-pose.glb`;
    try {
      const response = await fetch(apiTposeUrl, { method: "HEAD" });
      if (response.ok) {
        console.log(`[AssetService] T-pose found via API for ${assetId}`);
        return apiTposeUrl;
      }
    } catch (error) {
      // Silently continue to fallback
    }

    console.log(
      `[AssetService] No T-pose found for ${assetId}, using regular model`,
    );
    // Fall back to regular model
    return this.getModelUrl(assetId);
  }

  /**
   * Get concept art URL - uses CDN URL if available, falls back to local
   * @param asset - Asset object with CDN URL fields (preferred)
   * @param assetId - Asset ID for backward compatibility fallback
   */
  getConceptArtUrl(asset: Asset | string): string {
    // Handle string input for backward compatibility
    if (typeof asset === "string") {
      return `/gdd-assets/${asset}/concept-art.png`;
    }

    // Priority 1: Use CDN concept art URL if available
    if (asset.publishedToCdn && asset.cdnConceptArtUrl) {
      return asset.cdnConceptArtUrl;
    }

    // Priority 2: Fallback to local path
    return `/gdd-assets/${asset.id}/concept-art.png`;
  }

  /**
   * Get preview image URL for an asset
   * Returns thumbnail, concept art, or null if no preview available
   * Prioritizes CDN URLs when available
   */
  getPreviewImageUrl(asset: Asset): string | null {
    // Priority 1: CDN thumbnail URL if published
    if (asset.publishedToCdn && asset.cdnThumbnailUrl) {
      return asset.cdnThumbnailUrl;
    }

    // Priority 2: CDN concept art URL if published
    if (asset.publishedToCdn && asset.cdnConceptArtUrl) {
      return asset.cdnConceptArtUrl;
    }

    // Priority 3: Local thumbnail (sprite or PFP)
    if (asset.thumbnailPath) {
      return `/gdd-assets/${asset.id}/${asset.thumbnailPath}`;
    }

    // Priority 4: Local concept art from metadata
    if (asset.metadata?.hasConceptArt && asset.metadata?.conceptArtPath) {
      return `/gdd-assets/${asset.id}/${asset.metadata.conceptArtPath}`;
    }

    // Priority 5: Local concept art from conceptArtPath field
    if (asset.conceptArtPath) {
      return `/gdd-assets/${asset.id}/${asset.conceptArtPath}`;
    }

    // No preview available
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
   * Get VRM model URL if it exists
   * Note: This returns a URL path, but doesn't guarantee the file exists
   * Calling code should handle 404 errors gracefully
   */
  getVRMUrl(assetId: string): string {
    // Try gdd-assets path first (for any assets stored there)
    // If not found, the calling code should fall back to API path
    return `/gdd-assets/${assetId}/${assetId}.vrm`;
  }

  /**
   * Get VRM model URL from API endpoint
   */
  getAPIVRMUrl(assetId: string): string {
    return `/assets/${assetId}/${assetId}.vrm`;
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
