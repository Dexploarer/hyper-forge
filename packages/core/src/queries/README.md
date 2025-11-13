# TanStack Query Patterns

This directory contains centralized query definitions and best practices for data fetching using TanStack Query v5.

## Table of Contents

- [Query Structure](#query-structure)
- [Optimistic Updates](#optimistic-updates)
- [Prefetching on Hover](#prefetching-on-hover)
- [Cache Invalidation](#cache-invalidation)
- [Best Practices](#best-practices)

## Query Structure

All queries use the unified `queryOptions` API for type-safe, reusable query definitions:

```typescript
// Define queries with queryOptions
export const assetsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.assets.list(),
      queryFn: () => AssetService.listAssets(),
      staleTime: 30 * 1000,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.assets.detail(id),
      queryFn: () => AssetService.getAsset(id),
      enabled: !!id,
      staleTime: 60 * 1000,
    }),
};

// Use in components
const { data: assets } = useQuery(assetsQueries.list());
const { data: asset } = useQuery(assetsQueries.detail(assetId));
```

### Benefits

- Full TypeScript type inference
- Reusable across `useQuery`, `prefetchQuery`, and `getQueryData`
- Automatic request deduplication
- Smart caching based on query keys

## Optimistic Updates

Optimistic updates provide instant UI feedback by updating the cache immediately before the server responds. If the request fails, changes are automatically rolled back.

### Implementation Pattern

```typescript
export function useDeleteItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItemAPI,

    // Step 1: Before mutation, snapshot and update cache
    onMutate: async (itemId) => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['items'] });

      // Snapshot current state for rollback
      const previousItems = queryClient.getQueryData(['items']);

      // Optimistically update the cache
      queryClient.setQueryData(['items'], (old: Item[]) =>
        old.filter(item => item.id !== itemId)
      );

      // Return context with snapshot for rollback
      return { previousItems };
    },

    // Step 2: On error, restore snapshot
    onError: (_err, _itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems);
      }
    },

    // Step 3: Always refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

### Key Principles

1. **Cancel Queries**: Always cancel outgoing queries to prevent race conditions
2. **Snapshot State**: Save previous state in `onMutate` for rollback
3. **Update Cache**: Immediately update cache with expected result
4. **Rollback on Error**: Restore snapshot if mutation fails
5. **Sync with Server**: Always refetch after mutation completes

### Real-World Examples

#### Example 1: Toggle Favorite

```typescript
export function useFavoriteAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, isFavorite }) =>
      AssetService.updateAsset(assetId, { isFavorite }),

    onMutate: async ({ assetId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all });
      const previousAssets = queryClient.getQueryData(queryKeys.assets.list());

      queryClient.setQueryData(
        queryKeys.assets.list(),
        (old: Asset[]) =>
          old?.map(asset =>
            asset.id === assetId
              ? { ...asset, metadata: { ...asset.metadata, isFavorite } }
              : asset
          ) || []
      );

      return { previousAssets };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(queryKeys.assets.list(), context.previousAssets);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}
```

#### Example 2: Update Asset Status

```typescript
export function useUpdateAssetStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, status }) => {
      return AssetService.bulkUpdateAssets([assetId], { status });
    },

    onMutate: async ({ assetId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.all });
      const previousAssets = queryClient.getQueryData(queryKeys.assets.list());

      queryClient.setQueryData(
        queryKeys.assets.list(),
        (old: Asset[] | undefined) => {
          if (!old) return old;
          return old.map(asset =>
            asset.id === assetId
              ? { ...asset, metadata: { ...asset.metadata, status } }
              : asset
          );
        }
      );

      return { previousAssets };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(queryKeys.assets.list(), context.previousAssets);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}
```

## Prefetching on Hover

Prefetching improves perceived performance by loading data before users need it. When users hover over a card or list item, we prefetch the detail data.

### Basic Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { createPrefetchOnHover } from '@/lib/query-prefetch';

const queryClient = useQueryClient();

const prefetchAsset = createPrefetchOnHover(
  queryClient,
  assetsQueries.detail(assetId).queryKey,
  assetsQueries.detail(assetId).queryFn
);

<Card onMouseEnter={prefetchAsset} />
```

### Batch Prefetching

Prefetch multiple related queries at once:

```typescript
import { createBatchPrefetchOnHover } from '@/lib/query-prefetch';

const prefetchProjectData = createBatchPrefetchOnHover(queryClient, [
  {
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => ProjectService.getProject(projectId)
  },
  {
    queryKey: queryKeys.assets.list({ projectId }),
    queryFn: () => AssetService.listAssets({ projectId })
  }
]);

<ProjectCard onMouseEnter={prefetchProjectData} />
```

### Debounced Prefetching

For components with rapid hover events (e.g., list items):

```typescript
import { createDebouncedPrefetchOnHover } from '@/lib/query-prefetch';

const debouncedPrefetch = createDebouncedPrefetchOnHover(
  queryClient,
  assetsQueries.detail(assetId).queryKey,
  assetsQueries.detail(assetId).queryFn,
  200 // Wait 200ms before prefetching
);

<AssetListItem onMouseEnter={debouncedPrefetch} />
```

### Best Practices for Prefetching

1. **Use Short Stale Time**: Prefetched data is fresh for 5 seconds by default
2. **Prefetch on Hover, Not Render**: Avoid prefetching on component mount
3. **Debounce for Lists**: Use debouncing for rapidly hovered elements
4. **Batch Related Data**: Prefetch related queries together for better UX
5. **Don't Over-Prefetch**: Only prefetch data users are likely to need

## Cache Invalidation

Invalidate queries after mutations to keep data in sync with the server.

### Invalidate All Queries for a Resource

```typescript
// Invalidates all 'items' queries (lists, details, etc.)
queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
```

### Invalidate Specific Queries

```typescript
// Invalidate all item lists
queryClient.invalidateQueries({ queryKey: queryKeys.items.lists() });

// Invalidate specific item
queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
```

### Invalidation Strategies

#### Strategy 1: Broad Invalidation (Recommended)

Invalidate all queries for a resource after mutations:

```typescript
onSuccess: () => {
  // Invalidates all asset queries (lists, details, stats, etc.)
  queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
}
```

**Pros**: Simple, ensures complete sync
**Cons**: May refetch more than necessary

#### Strategy 2: Targeted Invalidation

Invalidate only affected queries:

```typescript
onSuccess: (newAsset) => {
  // Invalidate lists (new item appears in lists)
  queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() });

  // Update cache for the specific item
  queryClient.setQueryData(
    queryKeys.assets.detail(newAsset.id),
    newAsset
  );
}
```

**Pros**: Minimizes refetches
**Cons**: More complex, risk of stale data

## Best Practices

### 1. Use Hierarchical Query Keys

```typescript
export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    list: (filters) => [...queryKeys.assets.lists(), filters] as const,
    details: () => [...queryKeys.assets.all, 'detail'] as const,
    detail: (id) => [...queryKeys.assets.details(), id] as const,
  },
};
```

### 2. Set Appropriate Stale Times

```typescript
// Frequently changing data (30 seconds)
staleTime: 30 * 1000

// Stable data (5 minutes)
staleTime: 5 * 60 * 1000

// Very stable data (15 minutes)
staleTime: 15 * 60 * 1000
```

### 3. Handle Loading and Error States

```typescript
const { data, isLoading, isError, error } = useQuery(assetsQueries.list());

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage error={error} />;

return <AssetList assets={data} />;
```

### 4. Use Suspense for Better UX (Optional)

```typescript
// In query definition
export const assetsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.assets.list(),
      queryFn: () => AssetService.listAssets(),
      staleTime: 30 * 1000,
      throwOnError: true, // Enable suspense
    }),
};

// In component (wrapped with Suspense boundary)
const { data } = useQuery(assetsQueries.list());
// No need for isLoading check - Suspense handles it
return <AssetList assets={data} />;
```

### 5. Avoid Over-Fetching

```typescript
// Bad: Fetches all assets when only count is needed
const { data: assets } = useQuery(assetsQueries.list());
const count = assets?.length;

// Good: Dedicated query for counts
const { data: count } = useQuery(assetsQueries.count());
```

### 6. Use Optimistic Updates for Instant Feedback

Prioritize optimistic updates for:
- Toggle actions (favorite, archive, etc.)
- Status updates
- Quick edits (name changes, descriptions)

### 7. Prefetch Predictable User Actions

Prefetch data when users are likely to:
- Hover over items they'll click
- Navigate to detail pages
- Open modals or panels

### 8. Keep Mutations Simple

```typescript
// Bad: Complex mutation with too much logic
const mutation = useMutation({
  mutationFn: async (data) => {
    const result1 = await api1(data);
    const result2 = await api2(result1);
    const result3 = await api3(result2);
    return result3;
  },
});

// Good: Single atomic mutation
const mutation = useMutation({
  mutationFn: (data) => AssetService.createAsset(data),
});
```

## Common Patterns

### Pattern 1: List + Detail Queries

```typescript
export const assetsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.assets.list(),
      queryFn: () => AssetService.listAssets(),
      staleTime: 30 * 1000,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.assets.detail(id),
      queryFn: async () => {
        // Try to get from list query first
        const assets = queryClient.getQueryData(queryKeys.assets.list());
        const asset = assets?.find(a => a.id === id);
        if (asset) return asset;

        // Fall back to API call
        return AssetService.getAsset(id);
      },
      enabled: !!id,
      staleTime: 60 * 1000,
    }),
};
```

### Pattern 2: Dependent Queries

```typescript
// First query
const { data: project } = useQuery(projectsQueries.detail(projectId));

// Second query depends on first
const { data: assets } = useQuery({
  ...assetsQueries.list({ projectId: project?.id }),
  enabled: !!project?.id, // Only run when project exists
});
```

### Pattern 3: Parallel Queries

```typescript
const queries = useQueries({
  queries: [
    assetsQueries.list(),
    projectsQueries.list(false),
    materialsQueries.presets(),
  ],
});

const [assetsQuery, projectsQuery, materialsQuery] = queries;
```

## Troubleshooting

### Issue: Stale data after mutation

**Solution**: Make sure you're invalidating queries in `onSettled` or `onSuccess`

```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
}
```

### Issue: Race conditions with optimistic updates

**Solution**: Cancel queries in `onMutate` before updating cache

```typescript
onMutate: async () => {
  await queryClient.cancelQueries({ queryKey: queryKeys.assets.all });
  // ... rest of optimistic update
}
```

### Issue: Over-fetching after mutations

**Solution**: Use targeted invalidation instead of broad invalidation

```typescript
// Instead of this
queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });

// Do this
queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(assetId) });
```

### Issue: Prefetching not working

**Solution**: Ensure you're using the query options correctly

```typescript
// Bad: Missing queryKey and queryFn
queryClient.prefetchQuery({ queryKey: ['assets', id] });

// Good: Complete query options
queryClient.prefetchQuery(assetsQueries.detail(id));
```

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/guides/query-keys)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/guides/optimistic-updates)
- [Prefetching Guide](https://tanstack.com/query/latest/docs/guides/prefetching)
