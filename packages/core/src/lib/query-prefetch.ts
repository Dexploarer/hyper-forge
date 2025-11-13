/**
 * Query Prefetching Utilities
 *
 * Reusable utilities for prefetching data on hover to improve perceived performance.
 * These utilities work with TanStack Query v5 to prefetch data before users need it.
 *
 * Usage:
 * ```typescript
 * const queryClient = useQueryClient()
 * const handleHover = createPrefetchOnHover(
 *   queryClient,
 *   ['assets', 'detail', assetId],
 *   () => AssetService.getAsset(assetId)
 * )
 *
 * <Card onMouseEnter={handleHover} />
 * ```
 */

import { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Create a prefetch handler for hover events
 * @param queryClient - TanStack Query client instance
 * @param queryKey - Query key to prefetch
 * @param queryFn - Query function to execute
 * @param staleTime - How long to consider prefetched data fresh (default: 5000ms)
 * @returns Event handler for onMouseEnter
 *
 * @example
 * ```typescript
 * const prefetchAsset = createPrefetchOnHover(
 *   queryClient,
 *   queryKeys.assets.detail(assetId),
 *   () => AssetService.getAsset(assetId)
 * )
 *
 * <AssetCard onMouseEnter={prefetchAsset} />
 * ```
 */
export function createPrefetchOnHover<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  staleTime: number = 5000,
) {
  return () => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime, // Consider prefetched data fresh for specified time
    });
  };
}

/**
 * Prefetch multiple queries on hover
 * Useful when hovering over a component should prefetch multiple related queries
 *
 * @param queryClient - TanStack Query client instance
 * @param queries - Array of query configurations to prefetch
 * @param staleTime - How long to consider prefetched data fresh (default: 5000ms)
 * @returns Event handler for onMouseEnter
 *
 * @example
 * ```typescript
 * const prefetchProjectData = createBatchPrefetchOnHover(queryClient, [
 *   {
 *     queryKey: queryKeys.projects.detail(projectId),
 *     queryFn: () => ProjectService.getProject(projectId)
 *   },
 *   {
 *     queryKey: queryKeys.assets.list({ projectId }),
 *     queryFn: () => AssetService.listAssets({ projectId })
 *   }
 * ])
 *
 * <ProjectCard onMouseEnter={prefetchProjectData} />
 * ```
 */
export function createBatchPrefetchOnHover(
  queryClient: QueryClient,
  queries: Array<{ queryKey: QueryKey; queryFn: () => Promise<any> }>,
  staleTime: number = 5000,
) {
  return () => {
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    });
  };
}

/**
 * Prefetch with debouncing to avoid excessive prefetch calls
 * Useful for components with rapid hover events
 *
 * @param queryClient - TanStack Query client instance
 * @param queryKey - Query key to prefetch
 * @param queryFn - Query function to execute
 * @param debounceMs - Debounce delay in milliseconds (default: 100ms)
 * @param staleTime - How long to consider prefetched data fresh (default: 5000ms)
 * @returns Event handler for onMouseEnter
 *
 * @example
 * ```typescript
 * const debouncedPrefetch = createDebouncedPrefetchOnHover(
 *   queryClient,
 *   queryKeys.assets.detail(assetId),
 *   () => AssetService.getAsset(assetId),
 *   200 // Wait 200ms before prefetching
 * )
 *
 * <AssetListItem onMouseEnter={debouncedPrefetch} />
 * ```
 */
export function createDebouncedPrefetchOnHover<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  debounceMs: number = 100,
  staleTime: number = 5000,
) {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    }, debounceMs);
  };
}
