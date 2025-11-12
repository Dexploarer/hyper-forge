/**
 * Asset Service
 * Clean API interface for asset operations
 */

import { MaterialPreset, AssetMetadata } from "../../types";

import { apiFetch } from "@/utils/api";

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
  private baseUrl = "/api";

  async listAssets(): Promise<Asset[]> {
    const response = await apiFetch(`${this.baseUrl}/assets?t=${Date.now()}`, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      timeoutMs: 15000,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch assets");
    }
    return response.json();
  }

  async getMaterialPresets(): Promise<MaterialPreset[]> {
    const response = await apiFetch(`${this.baseUrl}/material-presets`, {
      timeoutMs: 10000,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch material presets");
    }
    return response.json();
  }

  async retexture(request: RetextureRequest): Promise<RetextureResponse> {
    const response = await apiFetch(`${this.baseUrl}/retexture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      timeoutMs: 30000,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Retexturing failed");
    }

    return response.json();
  }

  getModelUrl(assetId: string): string {
    return `/gdd-assets/${assetId}/${assetId}.glb`;
  }

  /**
   * Get T-pose model URL for retargeting workflow
   * Returns direct path to t-pose.glb, GLB loader will handle 404 gracefully
   */
  async getTPoseUrl(assetId: string): Promise<string> {
    // Return t-pose URL directly without checking existence
    // The GLTFLoader will handle 404 and the calling code can fall back to regular model
    // This avoids unnecessary HEAD requests that cause Elysia routing errors
    const tposeUrl = `/gdd-assets/${assetId}/t-pose.glb`;
    console.log(`[AssetService] Attempting T-pose URL: ${tposeUrl}`);
    return tposeUrl;
  }

  getConceptArtUrl(assetId: string): string {
    return `/gdd-assets/${assetId}/concept-art.png`;
  }

  /**
   * Get preview image URL for an asset
   * Returns thumbnail, concept art, or null if no preview available
   */
  getPreviewImageUrl(asset: Asset): string | null {
    // Priority 1: Thumbnail (sprite or PFP)
    if (asset.thumbnailPath) {
      return `/gdd-assets/${asset.id}/${asset.thumbnailPath}`;
    }

    // Priority 2: Concept art from metadata
    if (asset.metadata?.hasConceptArt && asset.metadata?.conceptArtPath) {
      return `/gdd-assets/${asset.id}/${asset.metadata.conceptArtPath}`;
    }

    // Priority 3: Concept art from conceptArtPath field
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

    const response = await apiFetch(`${this.baseUrl}/assets/upload-vrm`, {
      method: "POST",
      body: formData,
      timeoutMs: 30000,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "VRM upload failed");
    }

    return response.json();
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
    const response = await apiFetch(`${this.baseUrl}/assets/bulk-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assetIds,
        updates,
      }),
      timeoutMs: 30000,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Bulk update failed");
    }

    return response.json();
  }
}

export const AssetService = new AssetServiceClass();
