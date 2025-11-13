/**
 * useContent Hook Tests
 *
 * Tests for the useContent hook which fetches and manages game content
 * (NPCs, quests, dialogues, lores) with optimistic updates.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useContent } from "@/hooks/useContent";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";
import type {
  NPCData,
  QuestData,
  DialogueNode,
  LoreData,
} from "@/types/content";

// Mock Content Data
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

const mockDialogues: DialogueNode[] = [
  {
    id: "dialogue-1",
    npcName: "Elder",
    content: "Welcome, traveler",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

const mockLores: LoreData[] = [
  {
    id: "lore-1",
    title: "Ancient History",
    content: "Long ago...",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

// Mock the AppContext for notifications
const mockShowNotification = mock(() => {});

// Mock ContentAPIClient
const createMockContentClient = () => ({
  listNPCs: mock(() => Promise.resolve({ npcs: mockNPCs })),
  listQuests: mock(() => Promise.resolve({ quests: mockQuests })),
  listDialogues: mock(() => Promise.resolve({ dialogues: mockDialogues })),
  listLores: mock(() => Promise.resolve({ lores: mockLores })),
  getNPC: mock((id: string) =>
    Promise.resolve({ npc: mockNPCs.find((n) => n.id === id) || null })
  ),
  getQuest: mock((id: string) =>
    Promise.resolve({ quest: mockQuests.find((q) => q.id === id) || null })
  ),
  getDialogue: mock((id: string) =>
    Promise.resolve({
      dialogue: mockDialogues.find((d) => d.id === id) || null,
    })
  ),
  getLore: mock((id: string) =>
    Promise.resolve({ lore: mockLores.find((l) => l.id === id) || null })
  ),
  deleteNPC: mock(() =>
    Promise.resolve({ success: true, message: "NPC deleted" })
  ),
  deleteQuest: mock(() =>
    Promise.resolve({ success: true, message: "Quest deleted" })
  ),
  deleteDialogue: mock(() =>
    Promise.resolve({ success: true, message: "Dialogue deleted" })
  ),
  deleteLore: mock(() =>
    Promise.resolve({ success: true, message: "Lore deleted" })
  ),
  updateNPC: mock((id: string, updates: any) =>
    Promise.resolve({ success: true, npc: { ...updates, id } })
  ),
  updateQuest: mock((id: string, updates: any) =>
    Promise.resolve({ success: true, quest: { ...updates, id } })
  ),
  updateDialogue: mock((id: string, updates: any) =>
    Promise.resolve({ success: true, dialogue: { ...updates, id } })
  ),
  updateLore: mock((id: string, updates: any) =>
    Promise.resolve({ success: true, lore: { ...updates, id } })
  ),
});

describe("useContent Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Mock ContentAPIClient
    mock.module("@/services/api/ContentAPIClient", () => ({
      ContentAPIClient: mock(() => createMockContentClient()),
    }));

    // Mock AppContext
    mock.module("@/contexts/AppContext", () => ({
      useApp: () => ({ showNotification: mockShowNotification }),
    }));
  });

  describe("Fetching Content", () => {
    it("should fetch all content types on mount", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have all content types
      expect(result.current.npcs).toHaveLength(2);
      expect(result.current.quests).toHaveLength(1);
      expect(result.current.dialogues).toHaveLength(1);
      expect(result.current.lores).toHaveLength(1);
    });

    it("should provide allContent computed property", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should combine all content types
      expect(result.current.allContent).toHaveLength(5);

      // Should have correct types
      const types = result.current.allContent.map((c) => c.type);
      expect(types).toContain("npc");
      expect(types).toContain("quest");
      expect(types).toContain("dialogue");
      expect(types).toContain("lore");
    });

    it("should format content items correctly", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const npcContent = result.current.allContent.find(
        (c) => c.id === "npc-1"
      );

      expect(npcContent).toBeDefined();
      expect(npcContent?.type).toBe("npc");
      expect(npcContent?.name).toBe("Village Elder");
      expect(npcContent?.createdAt).toBeInstanceOf(Date);
      expect(npcContent?.data).toBeDefined();
    });
  });

  describe("Delete Operations", () => {
    it("should delete NPC and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.npcs).toHaveLength(2);

      // Delete NPC
      await act(async () => {
        await result.current.deleteNPC("npc-1");
      });

      // Should show success notification
      expect(mockShowNotification).toHaveBeenCalledWith(
        "NPC deleted successfully",
        "success"
      );
    });

    it("should delete Quest and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteQuest("quest-1");
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Quest deleted successfully",
        "success"
      );
    });

    it("should delete Dialogue and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteDialogue("dialogue-1");
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Dialogue deleted successfully",
        "success"
      );
    });

    it("should delete Lore and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteLore("lore-1");
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Lore deleted successfully",
        "success"
      );
    });

    it("should handle delete errors and show error notification", async () => {
      // Mock error
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          ...createMockContentClient(),
          deleteNPC: mock(() => Promise.reject(new Error("Delete failed"))),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      try {
        await act(async () => {
          await result.current.deleteNPC("npc-1");
        });
      } catch (err) {
        // Expected to throw
      }

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Delete failed",
        "error"
      );
    });
  });

  describe("Update Operations", () => {
    it("should update NPC and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateNPC("npc-1", { name: "Updated Elder" });
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "NPC updated successfully",
        "success"
      );
    });

    it("should update Quest and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateQuest("quest-1", {
          title: "Updated Quest",
        });
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Quest updated successfully",
        "success"
      );
    });

    it("should update Dialogue and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateDialogue("dialogue-1", {
          content: "Updated dialogue",
        });
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Dialogue updated successfully",
        "success"
      );
    });

    it("should update Lore and show notification", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateLore("lore-1", { title: "Updated Lore" });
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Lore updated successfully",
        "success"
      );
    });

    it("should handle update errors and show error notification", async () => {
      // Mock error
      mock.module("@/services/api/ContentAPIClient", () => ({
        ContentAPIClient: mock(() => ({
          ...createMockContentClient(),
          updateNPC: mock(() => Promise.reject(new Error("Update failed"))),
        })),
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      try {
        await act(async () => {
          await result.current.updateNPC("npc-1", { name: "New Name" });
        });
      } catch (err) {
        // Expected to throw
      }

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Update failed",
        "error"
      );
    });
  });

  describe("Reload Operations", () => {
    it("should reload all content when reloadContent is called", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.reloadContent();
      });

      // Should have refetched all content
      expect(result.current.npcs).toHaveLength(2);
      expect(result.current.quests).toHaveLength(1);
    });

    it("should force reload when forceReload is called", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.forceReload();
      });

      // Should have refetched all content
      expect(result.current.npcs).toHaveLength(2);
    });
  });

  describe("React Query Integration", () => {
    it("should provide access to individual query objects", async () => {
      const { result } = renderHook(() => useContent(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have query objects
      expect(result.current.npcsQuery).toBeDefined();
      expect(result.current.questsQuery).toBeDefined();
      expect(result.current.dialoguesQuery).toBeDefined();
      expect(result.current.loresQuery).toBeDefined();

      // Query objects should have isSuccess
      expect(result.current.npcsQuery.isSuccess).toBe(true);
      expect(result.current.questsQuery.isSuccess).toBe(true);
    });
  });
});
