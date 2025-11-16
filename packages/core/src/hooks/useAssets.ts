/**
 * Asset Hooks - Powered by TanStack Query
 *
 * Modernized asset data fetching with automatic caching,
 * background refetching, and optimistic updates.
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
 * Usage:
 * ```typescript
 * const { data: assets, isLoading, error, refetch } = useAssets()
 * ```
 */
export const useAssets = () => {
  return useQuery(assetsQueries.list());
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
 * Usage:
 * ```typescript
 * const { data: presets, isLoading } = useMaterialPresets()
 * ```
 */
export const useMaterialPresets = () => {
  return useQuery(materialsQueries.presets());
};

/**
 * Retexture an existing asset
 *
 * Usage:
 * ```typescript
 * const mutation = useRetexturing()
 * mutation.mutate({ baseAssetId, materialPreset, ... })
 * ```
 */
export const useRetexturing = () => {
  return useRetextureMutation();
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