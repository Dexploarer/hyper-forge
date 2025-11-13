/**
 * Prompts Hooks - Powered by TanStack Query
 *
 * Modernized prompt data fetching with automatic caching,
 * background refetching, and optimistic updates.
 *
 * Migration Notes:
 * - Removed manual useState/useEffect patterns
 * - Removed PromptService instantiation (now in queries)
 * - Maintained backward-compatible API for existing components
 * - Maintained Zustand integration for store updates
 * - Added optimistic updates for all mutations
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGenerationStore } from "../store";
import {
  promptsQueries,
  useSaveGameStylePromptsMutation,
  useDeleteGameStyleMutation,
  useSaveAssetTypePromptsMutation,
  useDeleteAssetTypeMutation,
  useSaveMaterialPromptsMutation,
} from "@/queries/prompts.queries";
import {
  PromptService,
  type GameStylePrompt,
  type AssetTypePrompt,
  type AssetTypePromptsByCategory,
  type PromptsResponse,
} from "@/services/api/PromptService";

/**
 * Game Style Prompts Hook
 *
 * Fetches and manages game style prompts (default + custom).
 * Integrates with Zustand store for custom game prompt state.
 *
 * Modern API:
 * ```typescript
 * const { data: prompts, isLoading, error } = useGameStylePrompts()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { prompts, loading, error, saveCustomGameStyle, deleteCustomGameStyle } = useGameStylePrompts()
 * ```
 */
export function useGameStylePrompts() {
  const query = useQuery(promptsQueries.gameStyles());
  const savePromptsMutation = useSaveGameStylePromptsMutation();
  const deleteStyleMutation = useDeleteGameStyleMutation();

  const {
    customGamePrompt: _customGamePrompt,
    setCustomGamePrompt: _setCustomGamePrompt,
  } = useGenerationStore();

  const saveCustomGameStyle = useCallback(
    async (
      styleId: string,
      style: { name: string; base: string; enhanced?: string },
    ) => {
      try {
        const currentPrompts = query.data || {
          version: "1.0.0",
          default: {},
          custom: {},
        };

        const updatedPrompts = {
          ...currentPrompts,
          custom: {
            ...currentPrompts.custom,
            [styleId]: style,
          },
        };

        await savePromptsMutation.mutateAsync(updatedPrompts);
        return true;
      } catch (err) {
        console.error("Failed to save custom game style:", err);
        return false;
      }
    },
    [query.data, savePromptsMutation],
  );

  const deleteCustomGameStyle = useCallback(
    async (styleId: string) => {
      try {
        const success = await deleteStyleMutation.mutateAsync(styleId);
        return success;
      } catch (err) {
        console.error("Failed to delete custom game style:", err);
        return false;
      }
    },
    [deleteStyleMutation],
  );

  // Get all available styles (default + custom)
  const getAllStyles = useCallback(() => {
    if (!query.data) return {};
    return PromptService.mergePrompts(query.data.default, query.data.custom);
  }, [query.data]);

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    prompts:
      query.data || {
        version: "1.0.0",
        default: {},
        custom: {},
      },
    loading: query.isLoading,
    error: query.error ? "Failed to load game style prompts" : null,

    // Backward-compatible methods
    saveCustomGameStyle,
    deleteCustomGameStyle,
    getAllStyles,
  };
}

/**
 * Asset Type Prompts Hook
 *
 * Fetches and manages asset type prompts by category (avatar, item).
 * Integrates with Zustand store for asset type prompts state.
 *
 * Modern API:
 * ```typescript
 * const { data: prompts, isLoading, error } = useAssetTypePrompts()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { prompts, loading, error, saveCustomAssetType, deleteCustomAssetType } = useAssetTypePrompts()
 * ```
 */
export function useAssetTypePrompts() {
  const query = useQuery(promptsQueries.assetTypes());
  const savePromptsMutation = useSaveAssetTypePromptsMutation();
  const deleteTypeMutation = useDeleteAssetTypeMutation();

  const { assetTypePrompts, setAssetTypePrompts } = useGenerationStore();

  const saveCustomAssetType = useCallback(
    async (
      typeId: string,
      prompt: AssetTypePrompt,
      generationType: "avatar" | "item" | "building" | "environment" | "prop" = "item",
    ) => {
      try {
        // Only avatar and item are supported currently, ignore others
        if (generationType !== "avatar" && generationType !== "item") {
          console.warn(
            `[usePrompts] Generation type "${generationType}" is not supported for custom asset types yet`,
          );
          return false;
        }

        const currentPrompts = query.data || {
          avatar: { default: {}, custom: {} },
          item: { default: {}, custom: {} },
        };

        const updatedPrompts = {
          ...currentPrompts,
          [generationType]: {
            ...currentPrompts[generationType],
            custom: {
              ...currentPrompts[generationType].custom,
              [typeId]: prompt,
            },
          },
        };

        await savePromptsMutation.mutateAsync(updatedPrompts);

        // Update Zustand store
        setAssetTypePrompts({
          ...assetTypePrompts,
          [typeId]: prompt.prompt,
        });

        return true;
      } catch (err) {
        console.error("Failed to save custom asset type:", err);
        return false;
      }
    },
    [query.data, savePromptsMutation, assetTypePrompts, setAssetTypePrompts],
  );

  const deleteCustomAssetType = useCallback(
    async (typeId: string, generationType: "avatar" | "item" = "item") => {
      try {
        const success = await deleteTypeMutation.mutateAsync({
          typeId,
          category: generationType,
        });

        if (success) {
          // Update Zustand store
          const { [typeId]: _, ...remainingPrompts } = assetTypePrompts;
          setAssetTypePrompts(remainingPrompts);
        }

        return success;
      } catch (err) {
        console.error("Failed to delete custom asset type:", err);
        return false;
      }
    },
    [deleteTypeMutation, assetTypePrompts, setAssetTypePrompts],
  );

  // Get all available types (default + custom) for both categories
  const getAllTypes = useCallback(() => {
    if (!query.data) return {};
    const avatarMerged = PromptService.mergePrompts(
      query.data.avatar.default,
      query.data.avatar.custom,
    );
    const itemMerged = PromptService.mergePrompts(
      query.data.item.default,
      query.data.item.custom,
    );
    return { ...avatarMerged, ...itemMerged };
  }, [query.data]);

  // Get types by generation type
  const getTypesByGeneration = useCallback(
    (
      generationType:
        | "avatar"
        | "item"
        | "building"
        | "environment"
        | "prop",
    ) => {
      if (!query.data) return {};
      // Only avatar and item have prompt configurations currently
      if (generationType === "avatar" || generationType === "item") {
        return PromptService.mergePrompts(
          query.data[generationType].default,
          query.data[generationType].custom,
        );
      }
      // Return empty object for unsupported types
      return {};
    },
    [query.data],
  );

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    prompts:
      query.data || {
        avatar: { default: {}, custom: {} },
        item: { default: {}, custom: {} },
      },
    loading: query.isLoading,
    error: query.error ? "Failed to load asset type prompts" : null,

    // Backward-compatible methods
    saveCustomAssetType,
    deleteCustomAssetType,
    getAllTypes,
    getTypesByGeneration,
  };
}

/**
 * Material Prompt Templates Hook
 *
 * Fetches and manages material prompt templates.
 *
 * Modern API:
 * ```typescript
 * const { data: templates, isLoading } = useMaterialPromptTemplates()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { templates, loading, saveCustomOverride } = useMaterialPromptTemplates()
 * ```
 */
export function useMaterialPromptTemplates() {
  const query = useQuery(promptsQueries.materials());
  const savePromptsMutation = useSaveMaterialPromptsMutation();

  const saveCustomOverride = useCallback(
    async (materialId: string, override: string) => {
      try {
        const currentTemplates = query.data || {
          templates: {
            runescape: "${materialId} texture, low-poly RuneScape style",
            generic: "${materialId} texture",
          },
          customOverrides: {},
        };

        const updated = {
          ...currentTemplates,
          customOverrides: {
            ...currentTemplates.customOverrides,
            [materialId]: override,
          },
        };

        await savePromptsMutation.mutateAsync(updated);
        return true;
      } catch (err) {
        console.error("Failed to save material prompt override:", err);
        return false;
      }
    },
    [query.data, savePromptsMutation],
  );

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    templates:
      query.data || {
        templates: {
          runescape: "${materialId} texture, low-poly RuneScape style",
          generic: "${materialId} texture",
        },
        customOverrides: {},
      },
    loading: query.isLoading,

    // Backward-compatible methods
    saveCustomOverride,
  };
}
