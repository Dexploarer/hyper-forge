/**
 * Asset Hooks - Powered by TanStack Query
 *
 * Modernized asset data fetching with automatic caching,
 * background refetching, and optimistic updates.
 *
 * Migration Notes:
 * - Removed manual useState/useEffect patterns
 * - Removed CachedAssetService dependency (replaced by React Query cache)
 * - Maintained backward-compatible API for existing components
 * - Added new hooks for direct React Query access
 */

import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import {
  assetsQueries,
  materialsQueries,
  useRetextureMutation,
  useBulkUpdateAssetsMutation,
  useFavoriteAssetMutation,
} from "@/queries/assets.queries";
import type { RetextureRequest, RetextureResponse } from "@/services/api/AssetService";

/**
 * Fetch all assets for the current user
 *
 * Modern API:
 * ```typescript
 * const { data: assets, isLoading, error, refetch } = useAssets()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { assets, loading, reloadAssets } = useAssets()
 * ```
 */
export const useAssets = () => {
  const query = useQuery(assetsQueries.list());

  // Backward-compatible API for existing components
  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    assets: query.data ?? [],
    loading: query.isLoading,
    // Wrap refetch to match old Promise<void> signature
    reloadAssets: async () => {
      await query.refetch();
    },
    forceReload: async () => {
      await query.refetch();
    },
  };
};

/**
 * Fetch a single asset by ID
 *
 * Usage:
 * ```typescript
 * const { data: asset, isLoading } = useAsset('asset-123')
 * ```
 */
export const useAsset = (id: string) => {
  return useQuery(assetsQueries.detail(id));
};

/**
 * Fetch material presets for retexturing
 *
 * Modern API:
 * ```typescript
 * const { data: presets, isLoading } = useMaterialPresets()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { presets, loading, refetch } = useMaterialPresets()
 * ```
 */
export const useMaterialPresets = () => {
  const query = useQuery(materialsQueries.presets());

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    presets: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  };
};

/**
 * Retexture an existing asset
 *
 * Modern API (recommended):
 * ```typescript
 * const mutation = useRetexturing()
 * mutation.mutate({ baseAssetId, materialPreset, ... })
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { retextureAsset, isRetexturing } = useRetexturing()
 * await retextureAsset(request)
 * ```
 */
export const useRetexturing = () => {
  const mutation = useRetextureMutation();
  const { showNotification } = useApp();

  // Enhance mutation with notification callbacks
  const retextureAsset = async (
    request: RetextureRequest
  ): Promise<RetextureResponse | null> => {
    try {
      const result = await mutation.mutateAsync(request);
      showNotification(
        result.message || "Asset retextured successfully",
        "success"
      );
      return result;
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Retexturing failed",
        "error"
      );
      return null;
    }
  };

  return {
    // Modern React Query API
    ...mutation,

    // Backward-compatible API
    retextureAsset,
    isRetexturing: mutation.isPending,
  };
};

/**
 * Bulk update multiple assets (status, favorite, etc.)
 *
 * Usage:
 * ```typescript
 * const mutation = useBulkUpdateAssets()
 * mutation.mutate({
 *   assetIds: ['id1', 'id2'],
 *   updates: { isFavorite: true }
 * })
 * ```
 */
export const useBulkUpdateAssets = useBulkUpdateAssetsMutation;

/**
 * Toggle favorite status on an asset
 *
 * Usage:
 * ```typescript
 * const mutation = useFavoriteAsset()
 * mutation.mutate({ assetId: 'id', isFavorite: true })
 * ```
 */
export const useFavoriteAsset = useFavoriteAssetMutation;