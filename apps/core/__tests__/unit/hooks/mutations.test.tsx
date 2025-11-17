/**
 * Mutation Tests
 *
 * Tests for React Query mutation hooks with cache invalidation.
 * Verifies that mutations properly invalidate related queries.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useBulkUpdateAssetsMutation,
  useFavoriteAssetMutation,
  useRetextureMutation,
} from "@/queries/assets.queries";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { AssetService } from "@/services/api/AssetService";
import { queryKeys } from "@/queries/query-keys";
import type { Asset } from "@/services/api/AssetService";

// Mock data
const mockAssets: Asset[] = [
  {
    id: "asset-1",
    name: "Sword",
    description: "A basic sword",
    type: "weapon",
    metadata: {
      category: "melee",
      tier: 1,
      isFavorite: false,
    },
    hasModel: true,
    modelFile: "sword.glb",
    generatedAt: new Date().toISOString(),
  },
  {
    id: "asset-2",
    name: "Shield",
    description: "A basic shield",
    type: "armor",
    metadata: {
      category: "defense",
      tier: 1,
      isFavorite: false,
    },
    hasModel: true,
    modelFile: "shield.glb",
    generatedAt: new Date().toISOString(),
  },
];

// Mock AssetService
mock.module("@/services/api/AssetService", () => ({
  AssetService: {
    listAssets: mock(() => Promise.resolve([...mockAssets])),
    bulkUpdateAssets: mock((assetIds, updates) =>
      Promise.resolve({
        success: true,
        updated: assetIds.length,
        failed: 0,
      })
    ),
    retexture: mock((req) =>
      Promise.resolve({
        success: true,
        assetId: "new-asset-id",
        message: "Asset retextured successfully",
      })
    ),
  },
}));

describe("Bulk Update Mutations", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should invalidate cache after bulk update", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Trigger mutation
    result.current.mutate({
      assetIds: ["asset-1", "asset-2"],
      updates: { isFavorite: true },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Cache should be invalidated
    const cachedState = queryClient.getQueryState(queryKeys.assets.list());
    expect(cachedState?.isInvalidated).toBe(true);
  });

  it("should update multiple assets at once", async () => {
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1", "asset-2"],
      updates: { isFavorite: true },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.updated).toBe(2);
  });
});

describe("Favorite Mutation", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should invalidate cache after favorite toggle", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useFavoriteAssetMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Trigger mutation
    result.current.mutate({
      assetId: "asset-1",
      isFavorite: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Cache should be invalidated
    const cachedState = queryClient.getQueryState(queryKeys.assets.list());
    expect(cachedState?.isInvalidated).toBe(true);
  });

  it("should toggle favorite on a single asset", async () => {
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useFavoriteAssetMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetId: "asset-1",
      isFavorite: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
  });
});

describe("Retexture Mutation", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should invalidate cache after retexturing", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useRetextureMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Trigger mutation
    result.current.mutate({
      baseAssetId: "asset-1",
      materialPreset: {
        name: "steel",
        displayName: "Steel",
        description: "Metallic steel material",
        baseColor: "#C0C0C0",
        metalness: 0.9,
        roughness: 0.3,
      },
      outputName: "Steel Sword",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Cache should be invalidated
    const cachedState = queryClient.getQueryState(queryKeys.assets.list());
    expect(cachedState?.isInvalidated).toBe(true);
  });

  it("should create a new asset from retexturing", async () => {
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useRetextureMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      baseAssetId: "asset-1",
      materialPreset: {
        name: "steel",
        displayName: "Steel",
        description: "Metallic steel material",
        baseColor: "#C0C0C0",
        metalness: 0.9,
        roughness: 0.3,
      },
      outputName: "Steel Sword",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.assetId).toBe("new-asset-id");
  });
});

describe("Mutation Error Handling", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should handle bulk update errors", async () => {
    // Mock error
    AssetService.bulkUpdateAssets = mock(() =>
      Promise.reject(new Error("Network error"))
    );

    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { isFavorite: true },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("should handle retexture errors", async () => {
    // Mock error
    AssetService.retexture = mock(() =>
      Promise.reject(new Error("Retexturing failed"))
    );

    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useRetextureMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      baseAssetId: "asset-1",
      materialPreset: {
        name: "steel",
        displayName: "Steel",
        description: "Metallic steel material",
        baseColor: "#C0C0C0",
        metalness: 0.9,
        roughness: 0.3,
      },
      outputName: "Steel Sword",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
