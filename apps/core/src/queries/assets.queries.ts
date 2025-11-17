/**
 * Assets Query Options
 *
 * Centralized query definitions for asset-related data fetching.
 * Uses TanStack Query v5's unified queryOptions API for type-safe,
 * reusable query definitions.
 *
 * Features:
 * - Full TypeScript type inference
 * - Reusable across useQuery, prefetchQuery, and getQueryData
 * - Automatic request deduplication
 * - Smart caching based on query keys
 */

import {
  queryOptions,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  AssetService,
  type Asset,
  type MaterialPreset,
  type RetextureRequest,
  type RetextureResponse,
  type BulkUpdateRequest,
} from "@/services/api/AssetService";
import { queryKeys } from "./query-keys";

/**
 * Assets List Query
 *
 * Fetches all assets for the current user.
 * Stale time: 30 seconds (assets change frequently during generation)
 */
export const assetsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.assets.list(),
      queryFn: () => AssetService.listAssets(),
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    }),

  /**
   * Single Asset Query
   *
   * Fetches a specific asset by ID. Uses the list query as a data source
   * to avoid unnecessary API calls if the data is already cached.
   */
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.assets.detail(id),
      queryFn: async () => {
        const assets = await AssetService.listAssets();
        return assets.find((a) => a.id === id) || null;
      },
      enabled: !!id,
      staleTime: 60 * 1000, // Single assets change less frequently
    }),
};

/**
 * Material Presets Query
 *
 * Fetches available material presets for retexturing.
 * Stale time: 5 minutes (presets rarely change)
 */
export const materialsQueries = {
  presets: () =>
    queryOptions({
      queryKey: queryKeys.materials.presets(),
      queryFn: () => AssetService.getMaterialPresets(),
      staleTime: 5 * 60 * 1000, // Presets rarely change, cache for 5 minutes
    }),
};

/**
 * Retexture Asset Mutation
 *
 * Starts a retexturing job for an existing asset.
 * Automatically invalidates asset queries on success.
 *
 * Usage:
 * ```typescript
 * const mutation = useRetextureMutation()
 * mutation.mutate({
 *   baseAssetId: 'asset-123',
 *   materialPreset: { name: 'steel', ... },
 *   outputName: 'Steel Sword'
 * })
 * ```
 */
export function useRetextureMutation(): UseMutationResult<
  RetextureResponse,
  Error,
  RetextureRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RetextureRequest) => AssetService.retexture(request),
    onSuccess: () => {
      // Invalidate all asset queries to refetch the updated list
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}

/**
 * Bulk Update Assets Mutation
 *
 * Updates multiple assets at once (e.g., favorite, status changes).
 * Includes optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useBulkUpdateAssetsMutation()
 * mutation.mutate({
 *   assetIds: ['id1', 'id2'],
 *   updates: { isFavorite: true }
 * })
 * ```
 */
export function useBulkUpdateAssetsMutation(): UseMutationResult<
  {
    success: boolean;
    updated: number;
    failed: number;
    errors?: Array<{ assetId: string; error: string }>;
  },
  Error,
  { assetIds: string[]; updates: BulkUpdateRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetIds, updates }) =>
      AssetService.bulkUpdateAssets(assetIds, updates),

    // Optimistic update - update UI immediately before server responds
    onMutate: async ({ assetIds, updates }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all });

      // Snapshot current assets for rollback
      const previousAssets = queryClient.getQueryData(queryKeys.assets.list());

      // Optimistically update assets in cache
      queryClient.setQueryData(
        queryKeys.assets.list(),
        (old: Asset[] | undefined) => {
          if (!old) return old;
          return old.map((asset) =>
            assetIds.includes(asset.id)
              ? {
                  ...asset,
                  // Apply updates
                  ...(updates.status && { status: updates.status }),
                  ...(updates.isFavorite !== undefined && {
                    metadata: {
                      ...asset.metadata,
                      isFavorite: updates.isFavorite,
                    },
                  }),
                }
              : asset,
          );
        },
      );

      return { previousAssets };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(
          queryKeys.assets.list(),
          context.previousAssets,
        );
      }
    },

    // Always refetch to sync with server state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}

/**
 * Favorite Asset Mutation
 *
 * Convenience wrapper for toggling favorite status on a single asset.
 * Uses bulk update internally with optimistic updates.
 *
 * Usage:
 * ```typescript
 * const mutation = useFavoriteAssetMutation()
 * mutation.mutate({ assetId: 'asset-123', isFavorite: true })
 * ```
 */
export function useFavoriteAssetMutation(): UseMutationResult<
  {
    success: boolean;
    updated: number;
    failed: number;
    errors?: Array<{ assetId: string; error: string }>;
  },
  Error,
  { assetId: string; isFavorite: boolean }
> {
  const bulkMutation = useBulkUpdateAssetsMutation();

  return useMutation({
    mutationFn: ({ assetId, isFavorite }) =>
      bulkMutation.mutateAsync({
        assetIds: [assetId],
        updates: { isFavorite },
      }),
  });
}

/**
 * Update Asset Status Mutation
 *
 * Updates an asset's status (draft → processing → completed → published, etc.)
 * with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useUpdateAssetStatusMutation()
 * mutation.mutate({ assetId: 'asset-123', status: 'published' })
 * ```
 */
export function useUpdateAssetStatusMutation(): UseMutationResult<
  {
    success: boolean;
    updated: number;
    failed: number;
    errors?: Array<{ assetId: string; error: string }>;
  },
  Error,
  { assetId: string; status: "draft" | "processing" | "completed" | "failed" | "approved" | "published" | "archived" }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, status }) => {
      return AssetService.bulkUpdateAssets([assetId], { status });
    },

    // Optimistic update - update UI immediately before server responds
    onMutate: async ({ assetId, status }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all });

      // Snapshot current assets for rollback
      const previousAssets = queryClient.getQueryData(queryKeys.assets.list());

      // Optimistically update asset status in cache
      queryClient.setQueryData(
        queryKeys.assets.list(),
        (old: Asset[] | undefined) => {
          if (!old) return old;
          return old.map((asset) =>
            asset.id === assetId
              ? {
                  ...asset,
                  metadata: {
                    ...asset.metadata,
                    status,
                  },
                }
              : asset,
          );
        },
      );

      return { previousAssets };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(
          queryKeys.assets.list(),
          context.previousAssets,
        );
      }
    },

    // Always refetch to sync with server state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}
