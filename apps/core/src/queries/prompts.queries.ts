/**
 * Prompts Query Options
 *
 * Centralized query definitions for prompt-related data fetching.
 * Uses TanStack Query v5's unified queryOptions API for type-safe,
 * reusable query definitions.
 *
 * Features:
 * - Full TypeScript type inference
 * - Reusable across useQuery, prefetchQuery, and getQueryData
 * - Automatic request deduplication
 * - Smart caching based on query keys
 * - Optimistic updates for mutations
 */

import {
  queryOptions,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  PromptService,
  type GameStylePrompt,
  type AssetTypePrompt,
  type AssetTypePromptsByCategory,
  type PromptsResponse,
  type MaterialPromptTemplate,
} from "@/services/api/PromptService";
import { queryKeys } from "./query-keys";

/**
 * Prompts Queries - Game Styles, Asset Types, Materials
 *
 * Stale time: 5 minutes (prompts rarely change)
 */
export const promptsQueries = {
  /**
   * Game Style Prompts Query
   *
   * Fetches all game style prompts (default + custom).
   */
  gameStyles: () =>
    queryOptions({
      queryKey: queryKeys.prompts.gameStyles(),
      queryFn: async () => {
        return await PromptService.getGameStylePrompts();
      },
      staleTime: 5 * 60 * 1000, // Prompts rarely change, cache for 5 minutes
    }),

  /**
   * Asset Type Prompts Query
   *
   * Fetches all asset type prompts by category (avatar, item).
   */
  assetTypes: () =>
    queryOptions({
      queryKey: queryKeys.prompts.assetTypes(),
      queryFn: async () => {
        return await PromptService.getAssetTypePrompts();
      },
      staleTime: 5 * 60 * 1000,
    }),

  /**
   * Material Prompt Templates Query
   *
   * Fetches material prompt templates and custom overrides.
   */
  materials: () =>
    queryOptions({
      queryKey: queryKeys.prompts.materials(),
      queryFn: async () => {
        return await PromptService.getMaterialPrompts();
      },
      staleTime: 5 * 60 * 1000,
    }),
};

/**
 * Save Game Style Prompts Mutation
 *
 * Saves game style prompts with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useSaveGameStylePromptsMutation()
 * mutation.mutate(updatedPrompts)
 * ```
 */
export function useSaveGameStylePromptsMutation(): UseMutationResult<
  void,
  Error,
  PromptsResponse<Record<string, GameStylePrompt>>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompts) => {
      await PromptService.saveGameStylePrompts(prompts);
    },
    onMutate: async (prompts) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.gameStyles(),
      });
      const previousPrompts = queryClient.getQueryData(
        queryKeys.prompts.gameStyles(),
      );

      // Optimistically update cache
      queryClient.setQueryData(queryKeys.prompts.gameStyles(), prompts);

      return { previousPrompts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.gameStyles(),
          context.previousPrompts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.gameStyles(),
      });
    },
  });
}

/**
 * Delete Game Style Mutation
 *
 * Deletes a custom game style with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteGameStyleMutation()
 * mutation.mutate('style-id')
 * ```
 */
export function useDeleteGameStyleMutation(): UseMutationResult<
  boolean,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (styleId) => {
      return await PromptService.deleteGameStyle(styleId);
    },
    onMutate: async (styleId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.gameStyles(),
      });
      const previousPrompts = queryClient.getQueryData<
        PromptsResponse<Record<string, GameStylePrompt>>
      >(queryKeys.prompts.gameStyles());

      // Optimistically remove style from cache
      if (previousPrompts) {
        const { [styleId]: _, ...remainingCustom } = previousPrompts.custom;
        queryClient.setQueryData(queryKeys.prompts.gameStyles(), {
          ...previousPrompts,
          custom: remainingCustom,
        });
      }

      return { previousPrompts };
    },
    onError: (_err, _styleId, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.gameStyles(),
          context.previousPrompts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.gameStyles(),
      });
    },
  });
}

/**
 * Save Asset Type Prompts Mutation
 *
 * Saves asset type prompts with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useSaveAssetTypePromptsMutation()
 * mutation.mutate(updatedPrompts)
 * ```
 */
export function useSaveAssetTypePromptsMutation(): UseMutationResult<
  void,
  Error,
  AssetTypePromptsByCategory
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompts) => {
      await PromptService.saveAssetTypePrompts(prompts);
    },
    onMutate: async (prompts) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.assetTypes(),
      });
      const previousPrompts = queryClient.getQueryData(
        queryKeys.prompts.assetTypes(),
      );

      // Optimistically update cache
      queryClient.setQueryData(queryKeys.prompts.assetTypes(), prompts);

      return { previousPrompts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.assetTypes(),
          context.previousPrompts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.assetTypes(),
      });
    },
  });
}

/**
 * Delete Asset Type Mutation
 *
 * Deletes a custom asset type with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteAssetTypeMutation()
 * mutation.mutate({ typeId: 'type-id', category: 'avatar' })
 * ```
 */
export function useDeleteAssetTypeMutation(): UseMutationResult<
  boolean,
  Error,
  { typeId: string; category: "avatar" | "item" }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ typeId, category }) => {
      return await PromptService.deleteAssetType(typeId, category);
    },
    onMutate: async ({ typeId, category }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.assetTypes(),
      });
      const previousPrompts =
        queryClient.getQueryData<AssetTypePromptsByCategory>(
          queryKeys.prompts.assetTypes(),
        );

      // Optimistically remove asset type from cache
      if (previousPrompts) {
        const { [typeId]: _, ...remainingCustom } =
          previousPrompts[category].custom;
        queryClient.setQueryData(queryKeys.prompts.assetTypes(), {
          ...previousPrompts,
          [category]: {
            ...previousPrompts[category],
            custom: remainingCustom,
          },
        });
      }

      return { previousPrompts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.assetTypes(),
          context.previousPrompts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.assetTypes(),
      });
    },
  });
}

/**
 * Save Material Prompts Mutation
 *
 * Saves material prompt templates with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useSaveMaterialPromptsMutation()
 * mutation.mutate(updatedTemplates)
 * ```
 */
export function useSaveMaterialPromptsMutation(): UseMutationResult<
  void,
  Error,
  MaterialPromptTemplate
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompts) => {
      await PromptService.saveMaterialPrompts(prompts);
    },
    onMutate: async (prompts) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.prompts.materials(),
      });
      const previousPrompts = queryClient.getQueryData(
        queryKeys.prompts.materials(),
      );

      // Optimistically update cache
      queryClient.setQueryData(queryKeys.prompts.materials(), prompts);

      return { previousPrompts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(
          queryKeys.prompts.materials(),
          context.previousPrompts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.materials(),
      });
    },
  });
}
