/**
 * Optimistic Updates Tests
 *
 * Tests that verify optimistic update behavior and rollback on errors.
 * These tests ensure instant UI feedback and proper error recovery.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useBulkUpdateAssetsMutation,
  useFavoriteAssetMutation,
} from "@/queries/assets.queries";
import {
  useDeleteNPCMutation,
  useDeleteQuestMutation,
  useUpdateNPCMutation,
  useUpdateQuestMutation,
} from "@/queries/content.queries";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { AssetService } from "@/services/api/AssetService";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";
import type { Asset } from "@/services/api/AssetService";
import type { NPCData, QuestData } from "@/types/content";
import { queryKeys } from "@/queries/query-keys";

// Mock data
const mockAssets: Asset[] = [
  {
    id: "asset-1",
    name: "Sword",
    type: "weapon",
    metadata: { isFavorite: false, status: "completed" },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    createdBy: "user-123",
    isPublic: true,
    modelUrl: "/models/sword.glb",
    hasSpriteSheet: false,
  },
  {
    id: "asset-2",
    name: "Shield",
    type: "armor",
    metadata: { isFavorite: true, status: "completed" },
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
    createdBy: "user-456",
    isPublic: true,
    modelUrl: "/models/shield.glb",
    hasSpriteSheet: false,
  },
];

const mockNPCs: NPCData[] = [
  {
    id: "npc-1",
    name: "Village Elder",
    description: "Wise old man",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "npc-2",
    name: "Merchant",
    description: "Sells goods",
    createdAt: "2025-01-02T00:00:00Z",
  },
];

const mockQuests: QuestData[] = [
  {
    id: "quest-1",
    title: "Save the Village",
    description: "Protect the village from bandits",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

describe("Asset Optimistic Updates", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Pre-populate cache
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);
  });

  describe("Bulk Update Optimistic Updates", () => {
    it("should instantly update UI before server responds", async () => {
      // Mock slow server response
      let resolveServerCall: any;
      const serverPromise = new Promise((resolve) => {
        resolveServerCall = resolve;
      });

      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          bulkUpdateAssets: mock(() => serverPromise),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

      const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
        wrapper,
      });

      // Start mutation
      act(() => {
        result.current.mutate({
          assetIds: ["asset-1"],
          updates: { isFavorite: true },
        });
      });

      // Check that cache was updated immediately (before server responds)
      await waitFor(() => {
        const assets = queryClient.getQueryData<Asset[]>(
          queryKeys.assets.list()
        );
        return assets?.[0].metadata?.isFavorite === true;
      });

      // Now resolve server call
      resolveServerCall({ success: true, updated: 1, failed: 0 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should rollback on server error", async () => {
      // Mock error
      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          bulkUpdateAssets: mock(() =>
            Promise.reject(new Error("Server error"))
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

      const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
        wrapper,
      });

      // Verify initial state
      let initialAssets = queryClient.getQueryData<Asset[]>(
        queryKeys.assets.list()
      );
      expect(initialAssets?.[0].metadata?.isFavorite).toBe(false);

      // Start mutation (will fail)
      try {
        await act(async () => {
          await result.current.mutateAsync({
            assetIds: ["asset-1"],
            updates: { isFavorite: true },
          });
        });
      } catch (err) {
        // Expected to throw
      }

      // Cache should be rolled back to original state
      const rolledBackAssets = queryClient.getQueryData<Asset[]>(
        queryKeys.assets.list()
      );
      expect(rolledBackAssets?.[0].metadata?.isFavorite).toBe(false);
    });

    it("should maintain optimistic update across multiple assets", async () => {
      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          bulkUpdateAssets: mock(() =>
            Promise.resolve({ success: true, updated: 2, failed: 0 })
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

      const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          assetIds: ["asset-1", "asset-2"],
          updates: { status: "published" },
        });
      });

      // Wait for mutation state to update
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("Favorite Asset Optimistic Updates", () => {
    it("should instantly toggle favorite status", async () => {
      mock.module("@/services/api/AssetService", () => ({
        AssetService: {
          bulkUpdateAssets: mock(() =>
            new Promise((resolve) => {
              setTimeout(
                () => resolve({ success: true, updated: 1, failed: 0 }),
                100
              );
            })
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

      const { result } = renderHook(() => useFavoriteAssetMutation(), {
        wrapper,
      });

      // Asset starts as not favorite
      const initialAssets = queryClient.getQueryData<Asset[]>(
        queryKeys.assets.list()
      );
      expect(initialAssets?.[0].metadata?.isFavorite).toBe(false);

      // Trigger mutation
      act(() => {
        result.current.mutate({
          assetId: "asset-1",
          isFavorite: true,
        });
      });

      // Should update instantly (optimistic)
      await waitFor(() => {
        const assets = queryClient.getQueryData<Asset[]>(
          queryKeys.assets.list()
        );
        return assets?.[0].metadata?.isFavorite === true;
      });
    });
  });
});

describe("Content Optimistic Updates", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Pre-populate cache
    queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);
    queryClient.setQueryData(queryKeys.content.list("quest"), [...mockQuests]);
  });

  describe("Delete NPC Optimistic Updates", () => {
    it("should instantly remove NPC from UI", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          deleteNPC: mock(() =>
            Promise.resolve({ success: true, message: "NPC deleted" })
          ),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);

      const { result } = renderHook(() => useDeleteNPCMutation(), { wrapper });

      // Initially 2 NPCs
      const initialNPCs = queryClient.getQueryData<NPCData[]>(
        queryKeys.content.list("npc")
      );
      expect(initialNPCs).toHaveLength(2);

      // Delete NPC
      act(() => {
        result.current.mutate("npc-1");
      });

      // Should remove instantly (optimistic)
      await waitFor(() => {
        const npcs = queryClient.getQueryData<NPCData[]>(
          queryKeys.content.list("npc")
        );
        return npcs?.length === 1;
      });

      const updatedNPCs = queryClient.getQueryData<NPCData[]>(
        queryKeys.content.list("npc")
      );
      expect(updatedNPCs?.find((n) => n.id === "npc-1")).toBeUndefined();
    });

    it("should rollback on delete error", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          deleteNPC: mock(() => Promise.reject(new Error("Delete failed"))),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);

      const { result } = renderHook(() => useDeleteNPCMutation(), { wrapper });

      try {
        await act(async () => {
          await result.current.mutateAsync("npc-1");
        });
      } catch (err) {
        // Expected to throw
      }

      // Should rollback - NPC should still be there
      const npcs = queryClient.getQueryData<NPCData[]>(
        queryKeys.content.list("npc")
      );
      expect(npcs).toHaveLength(2);
      expect(npcs?.find((n) => n.id === "npc-1")).toBeDefined();
    });
  });

  describe("Update NPC Optimistic Updates", () => {
    it("should instantly update NPC in UI", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          updateNPC: mock((id: string, updates: any) =>
            Promise.resolve({ success: true, npc: { id, ...updates } })
          ),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);

      const { result } = renderHook(() => useUpdateNPCMutation(), { wrapper });

      // Update NPC
      act(() => {
        result.current.mutate({
          id: "npc-1",
          updates: { name: "Updated Elder" },
        });
      });

      // Should update instantly (optimistic)
      await waitFor(() => {
        const npcs = queryClient.getQueryData<NPCData[]>(
          queryKeys.content.list("npc")
        );
        return npcs?.find((n) => n.id === "npc-1")?.name === "Updated Elder";
      });
    });

    it("should rollback on update error", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          updateNPC: mock(() => Promise.reject(new Error("Update failed"))),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);

      const { result } = renderHook(() => useUpdateNPCMutation(), { wrapper });

      try {
        await act(async () => {
          await result.current.mutateAsync({
            id: "npc-1",
            updates: { name: "Failed Update" },
          });
        });
      } catch (err) {
        // Expected to throw
      }

      // Should rollback - original name should be restored
      const npcs = queryClient.getQueryData<NPCData[]>(
        queryKeys.content.list("npc")
      );
      expect(npcs?.find((n) => n.id === "npc-1")?.name).toBe("Village Elder");
    });
  });

  describe("Delete Quest Optimistic Updates", () => {
    it("should instantly remove quest from UI", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          deleteQuest: mock(() =>
            Promise.resolve({ success: true, message: "Quest deleted" })
          ),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(
        queryKeys.content.list("quest"),
        [...mockQuests]
      );

      const { result } = renderHook(() => useDeleteQuestMutation(), {
        wrapper,
      });

      // Delete quest
      act(() => {
        result.current.mutate("quest-1");
      });

      // Should remove instantly (optimistic)
      await waitFor(() => {
        const quests = queryClient.getQueryData<QuestData[]>(
          queryKeys.content.list("quest")
        );
        return quests?.length === 0;
      });
    });
  });

  describe("Update Quest Optimistic Updates", () => {
    it("should instantly update quest in UI", async () => {
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          updateQuest: mock((id: string, updates: any) =>
            Promise.resolve({ success: true, quest: { id, ...updates } })
          ),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);
      queryClient.setQueryData(
        queryKeys.content.list("quest"),
        [...mockQuests]
      );

      const { result } = renderHook(() => useUpdateQuestMutation(), {
        wrapper,
      });

      // Update quest
      act(() => {
        result.current.mutate({
          id: "quest-1",
          updates: { title: "Updated Quest" },
        });
      });

      // Should update instantly (optimistic)
      await waitFor(() => {
        const quests = queryClient.getQueryData<QuestData[]>(
          queryKeys.content.list("quest")
        );
        return (
          quests?.find((q) => q.id === "quest-1")?.title === "Updated Quest"
        );
      });
    });
  });
});

describe("Cache Invalidation After Mutations", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);
  });

  it("should invalidate assets cache after bulk update", async () => {
    mock.module("@/services/api/AssetService", () => ({
      AssetService: {
        bulkUpdateAssets: mock(() =>
          Promise.resolve({ success: true, updated: 1, failed: 0 })
        ),
      },
    }));

    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
    queryClient.setQueryData(queryKeys.assets.list(), [...mockAssets]);

    const invalidateSpy = mock(() => Promise.resolve());
    queryClient.invalidateQueries = invalidateSpy as any;

    const { result } = renderHook(() => useBulkUpdateAssetsMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        assetIds: ["asset-1"],
        updates: { isFavorite: true },
      });
    });

    // Should have called invalidateQueries
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("should invalidate content cache after delete", async () => {
    mock.module("@/services/api/ContentAPIClient", () => ({
      ContentAPIClient: mock(() => ({
        deleteNPC: mock(() =>
          Promise.resolve({ success: true, message: "NPC deleted" })
        ),
      })),
    }));

    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
    queryClient.setQueryData(queryKeys.content.list("npc"), [...mockNPCs]);

    const invalidateSpy = mock(() => Promise.resolve());
    queryClient.invalidateQueries = invalidateSpy as any;

    const { result } = renderHook(() => useDeleteNPCMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("npc-1");
    });

    // Should have called invalidateQueries
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
