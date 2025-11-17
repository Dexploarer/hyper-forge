/**
 * useAssets Hook Tests
 *
 * Tests for the useAssets hook which fetches and manages 3D assets.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useAssets, useAsset, useMaterialPresets } from "@/hooks/useAssets";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { AssetService } from "@/services/api/AssetService";
import type { Asset, MaterialPreset } from "@/services/api/AssetService";

// Mock AssetService
const mockAssets: Asset[] = [
  {
    id: "asset-1",
    name: "Sword",
    type: "weapon",
    tier: 1,
    category: "melee",
    modelUrl: "/models/sword.glb",
    thumbnailUrl: "/thumbs/sword.png",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    createdBy: "user-123",
    isPublic: true,
    hasSpriteSheet: false,
  },
  {
    id: "asset-2",
    name: "Shield",
    type: "armor",
    tier: 2,
    category: "defense",
    modelUrl: "/models/shield.glb",
    thumbnailUrl: "/thumbs/shield.png",
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
    createdBy: "user-456",
    isPublic: true,
    hasSpriteSheet: false,
  },
];

const mockMaterialPresets: MaterialPreset[] = [
  {
    id: "steel",
    name: "Steel",
    description: "Metallic steel texture",
    baseColor: "#C0C0C0",
    metallic: 0.9,
    roughness: 0.3,
  },
  {
    id: "gold",
    name: "Gold",
    description: "Shiny gold texture",
    baseColor: "#FFD700",
    metallic: 1.0,
    roughness: 0.2,
  },
];

describe("useAssets Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Mock AssetService.listAssets
    mock.module("@/services/api/AssetService", () => ({
      AssetService: {
        listAssets: mock(() => Promise.resolve(mockAssets)),
        getMaterialPresets: mock(() => Promise.resolve(mockMaterialPresets)),
      },
    }));
  });

  describe("Fetching Assets", () => {
    it("should fetch assets on mount", async () => {
      const { result } = renderHook(() => useAssets(), { wrapper });

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.assets).toEqual([]);

      // Wait for data to load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have assets
      expect(result.current.assets).toHaveLength(2);
      expect(result.current.assets[0].name).toBe("Sword");
      expect(result.current.assets[1].name).toBe("Shield");
    });

    it("should provide React Query API with convenience aliases", async () => {
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // React Query API
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeNull();

      // Convenience aliases
      expect(result.current.assets).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.reloadAssets).toBeInstanceOf(Function);
      expect(result.current.forceReload).toBeInstanceOf(Function);
    });
  });

  describe("Refetching Assets", () => {
    it("should refetch assets when reloadAssets is called", async () => {
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialAssets = result.current.assets;
      expect(initialAssets).toHaveLength(2);

      // Update mock data
      const newMockAssets = [
        ...mockAssets,
        {
          id: "asset-3",
          name: "Helmet",
          type: "armor",
          tier: 3,
          category: "head",
          modelUrl: "/models/helmet.glb",
          createdAt: "2025-01-03T00:00:00Z",
          updatedAt: "2025-01-03T00:00:00Z",
          createdBy: "user-789",
          isPublic: true,
          hasSpriteSheet: false,
        },
      ];

      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          listAssets: mock(() => Promise.resolve(newMockAssets)),
        },
      }));

      // Trigger refetch
      await result.current.reloadAssets();

      await waitFor(() => expect(result.current.assets).toHaveLength(3));
    });

    it("should refetch when forceReload is called", async () => {
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Call forceReload
      await result.current.forceReload();

      // Should have refetched
      expect(result.current.assets).toHaveLength(2);
    });

    it("should refetch when refetch is called (modern API)", async () => {
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Modern refetch
      await result.current.refetch();

      // Should have refetched
      expect(result.current.data).toHaveLength(2);
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      // Mock error
      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          listAssets: mock(() => Promise.reject(new Error("Network error"))),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have error
      expect(result.current.error).toBeTruthy();
      expect(result.current.assets).toEqual([]);
    });
  });

  describe("Empty State", () => {
    it("should handle empty assets list", async () => {
      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          listAssets: mock(() => Promise.resolve([])),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.assets).toEqual([]);
      expect(result.current.assets).toHaveLength(0);
    });
  });
});

describe("useAsset Hook (Single Asset)", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    mock.module("@/services/api/AssetService", () => ({
      AssetService: {
        listAssets: mock(() => Promise.resolve(mockAssets)),
      },
    }));
  });

  it("should fetch a single asset by ID", async () => {
    const { result } = renderHook(() => useAsset("asset-1"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe("asset-1");
    expect(result.current.data?.name).toBe("Sword");
  });

  it("should return null for non-existent asset", async () => {
    const { result } = renderHook(() => useAsset("non-existent"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
  });

  it("should not fetch if ID is empty", async () => {
    const { result } = renderHook(() => useAsset(""), { wrapper });

    // Should not be loading since query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useMaterialPresets Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    mock.module("@/services/api/AssetService", () => ({
      AssetService: {
        getMaterialPresets: mock(() => Promise.resolve(mockMaterialPresets)),
      },
    }));
  });

  it("should fetch material presets on mount", async () => {
    const { result } = renderHook(() => useMaterialPresets(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.presets[0].name).toBe("Steel");
    expect(result.current.presets[1].name).toBe("Gold");
  });

  it("should provide React Query API with convenience aliases", async () => {
    const { result } = renderHook(() => useMaterialPresets(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // React Query API
    expect(result.current.data).toBeDefined();
    expect(result.current.isSuccess).toBe(true);

    // Convenience aliases
    expect(result.current.presets).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.refetch).toBeInstanceOf(Function);
  });

  it("should refetch when refetch is called", async () => {
    const { result } = renderHook(() => useMaterialPresets(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.refetch();

    expect(result.current.presets).toHaveLength(2);
  });
});
