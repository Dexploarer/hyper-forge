/**
 * Prompts API Client
 * Client for fetching various prompt configuration files
 */

import { apiFetch } from "@/utils/api";
import type {
  GameStylePrompts,
  AssetTypePrompts,
  MaterialPrompts,
  GenerationPrompts,
  GPT4EnhancementPrompts,
  WeaponDetectionPrompts,
  AllPromptsResponse,
} from "@/types/api/prompts";

const API_BASE = "/api/prompts";

export class PromptsAPIClient {
  /**
   * Get game style prompts
   */
  async getGameStylePrompts(): Promise<GameStylePrompts> {
    const response = await apiFetch(`${API_BASE}/game-styles`);

    if (!response.ok) {
      throw new Error(
        `Failed to get game style prompts: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get asset type prompts
   */
  async getAssetTypePrompts(): Promise<AssetTypePrompts> {
    const response = await apiFetch(`${API_BASE}/asset-types`);

    if (!response.ok) {
      throw new Error(
        `Failed to get asset type prompts: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get material prompts
   */
  async getMaterialPrompts(): Promise<MaterialPrompts> {
    const response = await apiFetch(`${API_BASE}/materials`);

    if (!response.ok) {
      throw new Error(`Failed to get material prompts: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get generation prompts
   */
  async getGenerationPrompts(): Promise<GenerationPrompts> {
    const response = await apiFetch(`${API_BASE}/generation`);

    if (!response.ok) {
      throw new Error(
        `Failed to get generation prompts: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get GPT-4 enhancement prompts
   */
  async getGPT4EnhancementPrompts(): Promise<GPT4EnhancementPrompts> {
    const response = await apiFetch(`${API_BASE}/gpt4-enhancement`);

    if (!response.ok) {
      throw new Error(
        `Failed to get GPT-4 enhancement prompts: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get weapon detection prompts
   */
  async getWeaponDetectionPrompts(): Promise<WeaponDetectionPrompts> {
    const response = await apiFetch(`${API_BASE}/weapon-detection`);

    if (!response.ok) {
      throw new Error(
        `Failed to get weapon detection prompts: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get all prompts at once
   */
  async getAllPrompts(): Promise<AllPromptsResponse> {
    const [
      gameStyles,
      assetTypes,
      materials,
      generation,
      gpt4Enhancement,
      weaponDetection,
    ] = await Promise.all([
      this.getGameStylePrompts(),
      this.getAssetTypePrompts(),
      this.getMaterialPrompts(),
      this.getGenerationPrompts(),
      this.getGPT4EnhancementPrompts(),
      this.getWeaponDetectionPrompts(),
    ]);

    return {
      gameStyles,
      assetTypes,
      materials,
      generation,
      gpt4Enhancement,
      weaponDetection,
    };
  }

  /**
   * Format JSON for display with syntax highlighting
   */
  formatJSON(data: unknown, indent: number = 2): string {
    return JSON.stringify(data, null, indent);
  }

  /**
   * Extract prompt text from nested objects
   */
  extractPromptText(data: unknown, maxDepth: number = 3): string[] {
    const prompts: string[] = [];

    const traverse = (obj: unknown, depth: number = 0) => {
      if (depth > maxDepth) return;

      if (typeof obj === "string" && obj.length > 10) {
        prompts.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => traverse(item, depth + 1));
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach((value) => traverse(value, depth + 1));
      }
    };

    traverse(data);
    return prompts;
  }

  /**
   * Count total number of prompts in a prompt data object
   */
  countPrompts(data: unknown): number {
    return this.extractPromptText(data).length;
  }
}

export const promptsClient = new PromptsAPIClient();
