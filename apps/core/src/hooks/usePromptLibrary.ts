import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api-client";
import { notify } from "@/utils/notify";
import { getAuthToken } from "@/utils/auth-token-store";

export type PromptType =
  | "npc"
  | "quest"
  | "dialogue"
  | "lore"
  | "voice"
  | "sfx"
  | "music"
  | "character"
  | "prop"
  | "environment";

export interface PromptContent {
  prompt: string;
  archetype?: string;
  context?: string;
  settings?: Record<string, any>;
  // Allow any additional fields for different prompt types
  [key: string]: any;
}

export interface SavedPrompt {
  id: string;
  type: PromptType;
  name: string;
  content: PromptContent;
  description?: string;
  isSystem: boolean;
  isPublic: boolean;
  createdBy?: string;
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SavePromptData {
  type: PromptType;
  name: string;
  content: PromptContent;
  description?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export function usePromptLibrary() {
  const { user } = usePrivy();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all prompts for the current user
  const loadPrompts = useCallback(
    async (type?: PromptType) => {
      if (!user?.id) {
        console.warn("[PromptLibrary] No user ID available");
        return [];
      }

      try {
        setIsLoading(true);

        // Use Eden Treaty for type-safe API calls
        const result = await api.api.prompts.custom
          .user({
            userId: user.id,
          })
          .get();

        if (result.error) {
          console.error(
            "[PromptLibrary] Failed to load prompts:",
            result.error,
          );
          throw new Error(
            `Failed to load prompts: ${result.error.value?.message || result.error.value?.summary || "Unknown error"}`,
          );
        }

        const loadedPrompts = result.data as any as SavedPrompt[];

        // Filter by type if specified
        const filtered = type
          ? loadedPrompts.filter((p) => p.type === type)
          : loadedPrompts;

        setPrompts(filtered);
        return filtered;
      } catch (error) {
        console.error("[PromptLibrary] Error loading prompts:", error);
        notify.error("Failed to load saved prompts");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  // Save a new prompt
  const savePrompt = useCallback(
    async (data: SavePromptData): Promise<SavedPrompt | null> => {
      if (!user?.id) {
        notify.error("Please sign in to save prompts");
        return null;
      }

      try {
        setIsLoading(true);
        const response = await api.api.prompts.custom.post({
          type: data.type,
          name: data.name,
          content: data.content as any,
          description: data.description || "",
          isPublic: data.isPublic || false,
          createdBy: user.id,
          metadata: data.metadata || {},
        });

        if (response.error) {
          console.error(
            "[PromptLibrary] Failed to save prompt:",
            response.error,
          );
          throw new Error("Failed to save prompt");
        }

        const savedPrompt = response.data as unknown as SavedPrompt;
        setPrompts((prev) => [savedPrompt, ...prev]);
        notify.success(`Prompt "${data.name}" saved successfully!`);
        return savedPrompt;
      } catch (error) {
        console.error("[PromptLibrary] Error saving prompt:", error);
        notify.error("Failed to save prompt");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  // Update an existing prompt
  const updatePrompt = useCallback(
    async (
      id: string,
      updates: Partial<SavePromptData>,
    ): Promise<SavedPrompt | null> => {
      try {
        setIsLoading(true);
        const response = await (api.api.prompts.custom as any)[id].put({
          name: updates.name!,
          content: updates.content as any,
          description: updates.description,
          isPublic: updates.isPublic,
          metadata: updates.metadata,
        });

        if (response.error) {
          console.error(
            "[PromptLibrary] Failed to update prompt:",
            response.error,
          );
          throw new Error("Failed to update prompt");
        }

        const updatedPrompt = response.data as SavedPrompt;
        setPrompts((prev) =>
          prev.map((p) => (p.id === id ? updatedPrompt : p)),
        );
        notify.success("Prompt updated successfully!");
        return updatedPrompt;
      } catch (error) {
        console.error("[PromptLibrary] Error updating prompt:", error);
        notify.error("Failed to update prompt");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Delete a prompt
  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await (api.api.prompts.custom as any)[id].delete();

      if (response.error) {
        console.error(
          "[PromptLibrary] Failed to delete prompt:",
          response.error,
        );
        throw new Error("Failed to delete prompt");
      }

      setPrompts((prev) => prev.filter((p) => p.id !== id));
      notify.success("Prompt deleted successfully!");
      return true;
    } catch (error) {
      console.error("[PromptLibrary] Error deleting prompt:", error);
      notify.error("Failed to delete prompt");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Duplicate a prompt (create a copy)
  const duplicatePrompt = useCallback(
    async (prompt: SavedPrompt): Promise<SavedPrompt | null> => {
      return savePrompt({
        type: prompt.type,
        name: `${prompt.name} (Copy)`,
        content: prompt.content,
        description: prompt.description,
        isPublic: false, // Duplicates are private by default
        metadata: prompt.metadata,
      });
    },
    [savePrompt],
  );

  return {
    prompts,
    isLoading,
    loadPrompts,
    savePrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
  };
}
