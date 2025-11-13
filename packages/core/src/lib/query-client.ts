/**
 * TanStack Query Client Configuration
 *
 * Centralized configuration for React Query with optimized defaults
 * for the Asset-Forge application.
 *
 * Key Features:
 * - Smart caching with 30-second stale time
 * - Automatic request deduplication
 * - Background refetching disabled (manual control via invalidation)
 * - Minimal retries (network errors handled gracefully)
 * - 5-minute garbage collection
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered "fresh" for 30 seconds
      // During this time, no refetch occurs on component mount
      staleTime: 30 * 1000,

      // Cached data kept in memory for 5 minutes after last use
      // Formerly known as "cacheTime" in v4
      gcTime: 5 * 60 * 1000,

      // Only retry once on failure to avoid excessive API calls
      retry: 1,

      // Disable automatic refetching on window focus
      // We'll use explicit cache invalidation instead
      refetchOnWindowFocus: false,

      // Disable automatic refetching on reconnect
      // Manual refetch can be triggered if needed
      refetchOnReconnect: false,

      // Show data from cache while refetching in background
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations - user can manually retry if needed
      retry: 0,
    },
  },
});
