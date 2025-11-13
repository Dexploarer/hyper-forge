/**
 * useAssets Hook Tests
 *
 * Tests for asset fetching, retexturing, and bulk update hooks.
 * Uses Bun test (NOT Vitest) and mocks only external API services.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useAssets, useRetexturing, useMaterialPresets } from "@/hooks/useAssets";
import { useBulkUpdateAssetsMutation, useFavoriteAssetMutation } from "@/queries/assets.queries";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { AssetService } from "@/services/api/AssetService";
import type { Asset, MaterialPreset } from "@/services/api/AssetService";

// Mock AssetService methods
const mockAssets: Asset[] = [
  {
    id: "asset-1",
    name: "Sword",
    description: "A basic sword",
    type: "weapon",
    metadata: {
      category: "melee",
      tier: 1,
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

const mockMaterialPresets: MaterialPreset[] = [
  {
    name: "steel",
    displayName: "Steel",
    description: "Metallic steel material",
    baseColor: "#C0C0C0",
    metalness: 0.9,
    roughness: 0.3,
  },
  {
    name: "gold",
    displayName: "Gold",
    description: "Shiny gold material",
    baseColor: "#FFD700",
    metalness: 1.0,
    roughness: 0.2,
  },
];

// Mock the AssetService
mock.module("@/services/api/AssetService", () => ({
  AssetService: {
    listAssets: mock(() => Promise.resolve([...mockAssets])),
    getMaterialPresets: mock(() => Promise.resolve([...mockMaterialPresets])),
    retexture: mock((req) =>
      Promise.resolve({
        success: true,
        assetId: "new-asset-id",
        message: "Asset retextured successfully",
        asset: {
          id: "new-asset-id",
          name: req.outputName || "Retextured Asset",
          description: "Retextured asset",
          type: "weapon",
          metadata: {},
          hasModel: true,
          modelFile: "retextured.glb",
          generatedAt: new Date().toISOString(),
        },
      })
    ),
    bulkUpdateAssets: mock((assetIds, updates) =>
      Promise.resolve({
        success: true,
        updated: assetIds.length,
        failed: 0,
      })
    ),
  },
}));

// Mock AppContext for notifications
mock.module("@/contexts/AppContext", () => ({
  useApp: () => ({
    showNotification: mock(() => {}),
  }),
}));

describe("useAssets", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should fetch assets on mount", async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(queryClient),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify assets are loaded
    expect(result.current.assets).toHaveLength(2);
    expect(result.current.assets[0].name).toBe("Sword");
    expect(result.current.assets[1].name).toBe("Shield");
  });

  it("should support backward-compatible API", async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Backward-compatible properties
    expect(result.current).toHaveProperty("assets");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("reloadAssets");
    expect(result.current).toHaveProperty("forceReload");

    // Verify they're functions
    expect(typeof result.current.reloadAssets).toBe("function");
    expect(typeof result.current.forceReload).toBe("function");
  });

  it("should support modern React Query API", async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Modern properties
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current).toHaveProperty("isFetching");
  });

  it("should reload assets when reloadAssets is called", async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call reload
    await result.current.reloadAssets();

    // Should still have assets
    expect(result.current.assets).toHaveLength(2);
  });

  it("should handle empty asset list", async () => {
    // Mock empty response
    AssetService.listAssets = mock(() => Promise.resolve([]));

    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets).toHaveLength(0);
    expect(result.current.assets).toEqual([]);
  });
});

describe("useMaterialPresets", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should fetch material presets", async () => {
    const { result } = renderHook(() => useMaterialPresets(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.presets[0].name).toBe("steel");
    expect(result.current.presets[1].name).toBe("gold");
  });

  it("should support both modern and backward-compatible API", async () => {
    const { result } = renderHook(() => useMaterialPresets(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Backward-compatible
    expect(result.current).toHaveProperty("presets");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("refetch");

    // Modern React Query
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
  });
});

describe("useRetexturing", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should call retexture mutation", async () => {
    const { result } = renderHook(() => useRetexturing(), {
      wrapper: createWrapper(queryClient),
    });

    const request = {
      baseAssetId: "asset-1",
      materialPreset: mockMaterialPresets[0],
      outputName: "Steel Sword",
    };

    const response = await result.current.retextureAsset(request);

    expect(response).toBeDefined();
    expect(response?.success).toBe(true);
    expect(response?.assetId).toBe("new-asset-id");
  });

  it("should support both modern and backward-compatible API", async () => {
    const { result } = renderHook(() => useRetexturing(), {
      wrapper: createWrapper(queryClient),
    });

    // Backward-compatible
    expect(result.current).toHaveProperty("retextureAsset");
    expect(result.current).toHaveProperty("isRetexturing");

    // Modern React Query
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });

  it("should handle retexture errors gracefully", async () => {
    // Mock error
    AssetService.retexture = mock(() =>
      Promise.reject(new Error("Retexturing failed"))
    );

    const { result } = renderHook(() => useRetexturing(), {
      wrapper: createWrapper(queryClient),
    });

    const request = {
      baseAssetId: "asset-1",
      materialPreset: mockMaterialPresets[0],
      outputName: "Steel Sword",
    };

    const response = await result.current.retextureAsset(request);

    // Should return null on error
    expect(response).toBeNull();
  });
});

describe("useBulkUpdateAssets", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should bulk update assets", async () => {
    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper: createWrapper(queryClient),
    });

    const mutation = result.current.mutate;

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

describe("useFavoriteAsset", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should toggle favorite status", async () => {
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
