/**
 * Optimistic Updates Tests
 *
 * Tests for optimistic UI updates and rollback on error.
 * Verifies that mutations update the UI immediately before server response,
 * and roll back changes if the mutation fails.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useBulkUpdateAssetsMutation } from "@/queries/assets.queries";
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

// Mock AssetService with delay to test optimistic updates
mock.module("@/services/api/AssetService", () => ({
  AssetService: {
    listAssets: mock(() => Promise.resolve([...mockAssets])),
    bulkUpdateAssets: mock((assetIds, updates) =>
      // Add delay to simulate network request
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            updated: assetIds.length,
            failed: 0,
          });
        }, 100);
      })
    ),
  },
}));

describe("Optimistic Updates", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should update UI immediately before server response", async () => {
    // Seed cache with test data
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Trigger optimistic update
    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { isFavorite: true },
    });

    // Should update immediately (before mutation completes)
    // Note: We need to wait a tick for the optimistic update to be applied
    await waitFor(() => {
      const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
      expect(cachedAssets).toBeDefined();
      if (cachedAssets) {
        const updatedAsset = cachedAssets.find((a) => a.id === "asset-1");
        expect(updatedAsset?.metadata?.isFavorite).toBe(true);
      }
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should apply optimistic updates to multiple assets", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Trigger bulk optimistic update
    result.current.mutate({
      assetIds: ["asset-1", "asset-2"],
      updates: { isFavorite: true },
    });

    // Both assets should be updated immediately
    await waitFor(() => {
      const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
      expect(cachedAssets).toBeDefined();
      if (cachedAssets) {
        const asset1 = cachedAssets.find((a) => a.id === "asset-1");
        const asset2 = cachedAssets.find((a) => a.id === "asset-2");
        expect(asset1?.metadata?.isFavorite).toBe(true);
        expect(asset2?.metadata?.isFavorite).toBe(true);
      }
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should preserve other asset fields during optimistic update", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { isFavorite: true },
    });

    await waitFor(() => {
      const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
      expect(cachedAssets).toBeDefined();
      if (cachedAssets) {
        const updatedAsset = cachedAssets.find((a) => a.id === "asset-1");
        // Should preserve all original fields
        expect(updatedAsset?.name).toBe("Sword");
        expect(updatedAsset?.type).toBe("weapon");
        expect(updatedAsset?.metadata?.category).toBe("melee");
        // Only isFavorite should be updated
        expect(updatedAsset?.metadata?.isFavorite).toBe(true);
      }
    });
  });
});

describe("Optimistic Update Rollback", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should rollback on error", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    // Mock API to fail
    AssetService.bulkUpdateAssets = mock(() =>
      Promise.reject(new Error("Network error"))
    );

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { isFavorite: true },
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should rollback to original state
    const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
    expect(cachedAssets).toBeDefined();
    if (cachedAssets) {
      const asset = cachedAssets.find((a) => a.id === "asset-1");
      expect(asset?.metadata?.isFavorite).toBe(false);
    }
  });

  it("should rollback multiple asset updates on error", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    // Mock API to fail
    AssetService.bulkUpdateAssets = mock(() =>
      Promise.reject(new Error("Network error"))
    );

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1", "asset-2"],
      updates: { isFavorite: true },
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Both assets should be rolled back
    const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
    expect(cachedAssets).toBeDefined();
    if (cachedAssets) {
      const asset1 = cachedAssets.find((a) => a.id === "asset-1");
      const asset2 = cachedAssets.find((a) => a.id === "asset-2");
      expect(asset1?.metadata?.isFavorite).toBe(false);
      expect(asset2?.metadata?.isFavorite).toBe(false);
    }
  });

  it("should not affect other assets during rollback", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    // Mock API to fail
    AssetService.bulkUpdateAssets = mock(() =>
      Promise.reject(new Error("Network error"))
    );

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    // Only update asset-1
    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { isFavorite: true },
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // asset-2 should remain unchanged
    const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
    expect(cachedAssets).toBeDefined();
    if (cachedAssets) {
      const asset2 = cachedAssets.find((a) => a.id === "asset-2");
      expect(asset2?.name).toBe("Shield");
      expect(asset2?.metadata?.isFavorite).toBe(false);
    }
  });
});

describe("Optimistic Update with Status Changes", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should optimistically update asset status", async () => {
    // Seed cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    // Mock successful update
    AssetService.bulkUpdateAssets = mock((assetIds, updates) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            updated: assetIds.length,
            failed: 0,
          });
        }, 100);
      })
    );

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { status: "published" },
    });

    // Should update immediately
    await waitFor(() => {
      const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
      expect(cachedAssets).toBeDefined();
      if (cachedAssets) {
        const updatedAsset = cachedAssets.find((a) => a.id === "asset-1");
        expect(updatedAsset?.metadata?.status).toBe("published");
      }
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should rollback status change on error", async () => {
    // Seed cache with status
    const assetsWithStatus = mockAssets.map((a) => ({
      ...a,
      metadata: {
        ...a.metadata,
        status: "draft",
      },
    }));
    queryClient.setQueryData(queryKeys.assets.list(), assetsWithStatus);

    // Mock API to fail
    AssetService.bulkUpdateAssets = mock(() =>
      Promise.reject(new Error("Network error"))
    );

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      assetIds: ["asset-1"],
      updates: { status: "published" },
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should rollback to draft
    const cachedAssets = queryClient.getQueryData<Asset[]>(queryKeys.assets.list());
    expect(cachedAssets).toBeDefined();
    if (cachedAssets) {
      const asset = cachedAssets.find((a) => a.id === "asset-1");
      expect(asset?.metadata?.status).toBe("draft");
    }
  });
});
