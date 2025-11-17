import { api, apiFetch } from "@/lib/api-client";
import { ExtendedImportMeta } from "../../types";

export interface GameStylePrompt {
  id?: string;
  name: string;
  base: string;
  enhanced?: string;
  generation?: string;
  fallback?: string;
}

export interface AssetTypePrompt {
  name: string;
  prompt: string;
  placeholder?: string;
}

export interface AssetTypePromptsByCategory {
  avatar: {
    default: Record<string, AssetTypePrompt>;
    custom: Record<string, AssetTypePrompt>;
  };
  item: {
    default: Record<string, AssetTypePrompt>;
    custom: Record<string, AssetTypePrompt>;
  };
}

export interface PromptsResponse<T> {
  version: string;
  default: T;
  custom: T;
}

export type MaterialPromptTemplate = {
  templates: { runescape: string; generic: string } & Record<string, string>;
  customOverrides: Record<string, string>;
};

class PromptServiceClass {
  private baseUrl: string;

  constructor() {
    // Use environment variable if available, otherwise use relative URL
    const envApiUrl = (import.meta as ExtendedImportMeta).env
      ?.VITE_GENERATION_API_URL;
    const apiBaseUrl = envApiUrl || "/api";
    this.baseUrl = `${apiBaseUrl}/prompts`;
  }

  async getGameStylePrompts(): Promise<
    PromptsResponse<Record<string, GameStylePrompt>>
  > {
    const { data, error } = await api.api.prompts["game-styles"].get();
    if (error) {
      console.error("Failed to load game style prompts:", error);
      throw new Error("Failed to load game style prompts");
    }
    return data as PromptsResponse<Record<string, GameStylePrompt>>;
  }

  async saveGameStylePrompts(
    prompts: PromptsResponse<Record<string, GameStylePrompt>>,
  ): Promise<void> {
    const { error } = await apiFetch(`${this.baseUrl}/game-styles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompts),
    });
    if (error) throw new Error("Failed to save game style prompts");
  }

  async deleteGameStyle(styleId: string): Promise<boolean> {
    try {
      const { error } = await apiFetch(
        `${this.baseUrl}/game-styles/${styleId}`,
        { method: "DELETE" },
      );
      return !error;
    } catch (error) {
      console.error("Error deleting game style:", error);
      return false;
    }
  }

  async getAssetTypePrompts(): Promise<AssetTypePromptsByCategory> {
    const { data, error } = await api.api.prompts["asset-types"].get();
    if (error) {
      console.error("Failed to load asset type prompts:", error);
      throw new Error("Failed to load asset type prompts");
    }
    return data as AssetTypePromptsByCategory;
  }

  async saveAssetTypePrompts(
    prompts: AssetTypePromptsByCategory,
  ): Promise<void> {
    const { error } = await apiFetch(`${this.baseUrl}/asset-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompts),
    });
    if (error) throw new Error("Failed to save asset type prompts");
  }

  async deleteAssetType(
    typeId: string,
    category: "avatar" | "item",
  ): Promise<boolean> {
    try {
      const { error } = await apiFetch(
        `${this.baseUrl}/asset-types/${typeId}?category=${category}`,
        { method: "DELETE" },
      );
      return !error;
    } catch (error) {
      console.error("Error deleting asset type:", error);
      return false;
    }
  }

  async getMaterialPrompts(): Promise<MaterialPromptTemplate> {
    const { data, error } = await api.api.prompts.materials.get();
    if (error) {
      console.error("Failed to load material prompts:", error);
      throw new Error("Failed to load material prompts");
    }
    const result = data as any;
    // Ensure required keys exist for consumers expecting defaults
    const templates = {
      runescape:
        result.templates?.runescape ??
        "${materialId} texture, low-poly RuneScape style",
      generic: result.templates?.generic ?? "${materialId} texture",
      ...result.templates,
    };
    return { templates, customOverrides: result.customOverrides ?? {} };
  }

  async saveMaterialPrompts(prompts: MaterialPromptTemplate): Promise<void> {
    const { error } = await apiFetch(`${this.baseUrl}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompts),
    });
    if (error) throw new Error("Failed to save material prompts");
  }

  mergePrompts<T extends Record<string, unknown>>(defaults: T, custom: T): T {
    return { ...defaults, ...custom };
  }
}

export const PromptService = new PromptServiceClass();
