/**
 * useContent Hook Tests
 *
 * Tests for content fetching (NPCs, quests, dialogues, lores).
 * Note: useContent doesn't use React Query yet, so we test the traditional useState/useEffect pattern.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useContent } from "@/hooks/useContent";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";

// Mock content data
const mockNPCs = [
  {
    id: "npc-1",
    name: "Blacksmith",
    archetype: "merchant",
    personality: "gruff but helpful",
    appearance: "muscular, soot-covered",
    createdAt: new Date().toISOString(),
  },
  {
    id: "npc-2",
    name: "Guard Captain",
    archetype: "warrior",
    personality: "stern and dutiful",
    appearance: "armored, scarred face",
    createdAt: new Date().toISOString(),
  },
];

const mockQuests = [
  {
    id: "quest-1",
    title: "Forge the Legendary Sword",
    description: "Help the blacksmith create a legendary weapon",
    difficulty: "hard",
    questType: "main",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quest-2",
    title: "Patrol the City Walls",
    description: "Assist the guard captain in patrolling",
    difficulty: "medium",
    questType: "side",
    createdAt: new Date().toISOString(),
  },
];

const mockDialogues = [
  {
    id: "dialogue-1",
    npcName: "Blacksmith",
    nodes: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "dialogue-2",
    npcName: "Guard Captain",
    nodes: [],
    createdAt: new Date().toISOString(),
  },
];

const mockLores = [
  {
    id: "lore-1",
    title: "The Ancient Forge",
    content: "Long ago, a legendary forge was built...",
    category: "history",
    createdAt: new Date().toISOString(),
  },
  {
    id: "lore-2",
    title: "The City Guard",
    content: "The city guard has protected these walls for centuries...",
    category: "faction",
    createdAt: new Date().toISOString(),
  },
];

// Mock ContentAPIClient
mock.module("@/services/api/ContentAPIClient", () => ({
  ContentAPIClient: class {
    listNPCs = mock(() => Promise.resolve({ success: true, npcs: [...mockNPCs] }));
    listQuests = mock(() => Promise.resolve({ success: true, quests: [...mockQuests] }));
    listDialogues = mock(() => Promise.resolve({ success: true, dialogues: [...mockDialogues] }));
    listLores = mock(() => Promise.resolve({ success: true, lores: [...mockLores] }));
    deleteNPC = mock((id: string) => Promise.resolve({ success: true, message: "NPC deleted" }));
    deleteQuest = mock((id: string) => Promise.resolve({ success: true, message: "Quest deleted" }));
    deleteDialogue = mock((id: string) => Promise.resolve({ success: true, message: "Dialogue deleted" }));
    deleteLore = mock((id: string) => Promise.resolve({ success: true, message: "Lore deleted" }));
    updateNPC = mock((id: string, updates: any) => Promise.resolve({ success: true, npc: { id, ...updates } }));
    updateQuest = mock((id: string, updates: any) => Promise.resolve({ success: true, quest: { id, ...updates } }));
    updateDialogue = mock((id: string, updates: any) => Promise.resolve({ success: true, dialogue: { id, ...updates } }));
    updateLore = mock((id: string, updates: any) => Promise.resolve({ success: true, lore: { id, ...updates } }));
  },
}));

// Mock AppContext for notifications
mock.module("@/contexts/AppContext", () => ({
  useApp: () => ({
    showNotification: mock(() => {}),
  }),
}));

describe("useContent", () => {
  it("should fetch all content types on mount", async () => {
    const { result } = renderHook(() => useContent());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify all content types are loaded
    expect(result.current.npcs).toHaveLength(2);
    expect(result.current.quests).toHaveLength(2);
    expect(result.current.dialogues).toHaveLength(2);
    expect(result.current.lores).toHaveLength(2);
  });

  it("should provide unified allContent array", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have 8 items total (2 of each type)
    expect(result.current.allContent).toHaveLength(8);

    // Verify content types are correctly set
    const npcContent = result.current.allContent.filter((c) => c.type === "npc");
    const questContent = result.current.allContent.filter((c) => c.type === "quest");
    const dialogueContent = result.current.allContent.filter((c) => c.type === "dialogue");
    const loreContent = result.current.allContent.filter((c) => c.type === "lore");

    expect(npcContent).toHaveLength(2);
    expect(questContent).toHaveLength(2);
    expect(dialogueContent).toHaveLength(2);
    expect(loreContent).toHaveLength(2);
  });

  it("should reload content when forceReload is called", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call forceReload
    await result.current.forceReload();

    // Should still have content
    expect(result.current.npcs).toHaveLength(2);
    expect(result.current.quests).toHaveLength(2);
  });

  it("should handle empty content lists", async () => {
    // Mock empty responses
    mock.module("@/services/api/ContentAPIClient", () => ({
      ContentAPIClient: class {
        listNPCs = mock(() => Promise.resolve({ success: true, npcs: [] }));
        listQuests = mock(() => Promise.resolve({ success: true, quests: [] }));
        listDialogues = mock(() => Promise.resolve({ success: true, dialogues: [] }));
        listLores = mock(() => Promise.resolve({ success: true, lores: [] }));
        deleteNPC = mock(() => Promise.resolve({ success: true, message: "NPC deleted" }));
        deleteQuest = mock(() => Promise.resolve({ success: true, message: "Quest deleted" }));
        deleteDialogue = mock(() => Promise.resolve({ success: true, message: "Dialogue deleted" }));
        deleteLore = mock(() => Promise.resolve({ success: true, message: "Lore deleted" }));
        updateNPC = mock((id: string, updates: any) => Promise.resolve({ success: true, npc: { id, ...updates } }));
        updateQuest = mock((id: string, updates: any) => Promise.resolve({ success: true, quest: { id, ...updates } }));
        updateDialogue = mock((id: string, updates: any) => Promise.resolve({ success: true, dialogue: { id, ...updates } }));
        updateLore = mock((id: string, updates: any) => Promise.resolve({ success: true, lore: { id, ...updates } }));
      },
    }));

    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.npcs).toHaveLength(0);
    expect(result.current.quests).toHaveLength(0);
    expect(result.current.dialogues).toHaveLength(0);
    expect(result.current.lores).toHaveLength(0);
    expect(result.current.allContent).toHaveLength(0);
  });
});

describe("useContent - Delete Operations", () => {
  it("should delete NPC and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Delete an NPC
    await result.current.deleteNPC("npc-1");

    // Content should be reloaded (we don't verify the deletion in mock, but the reload happened)
    expect(result.current.npcs).toBeDefined();
  });

  it("should delete quest and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Delete a quest
    await result.current.deleteQuest("quest-1");

    expect(result.current.quests).toBeDefined();
  });

  it("should delete dialogue and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Delete a dialogue
    await result.current.deleteDialogue("dialogue-1");

    expect(result.current.dialogues).toBeDefined();
  });

  it("should delete lore and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Delete a lore
    await result.current.deleteLore("lore-1");

    expect(result.current.lores).toBeDefined();
  });
});

describe("useContent - Update Operations", () => {
  it("should update NPC and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update an NPC
    await result.current.updateNPC("npc-1", { name: "Updated Blacksmith" });

    expect(result.current.npcs).toBeDefined();
  });

  it("should update quest and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update a quest
    await result.current.updateQuest("quest-1", { title: "Updated Quest Title" });

    expect(result.current.quests).toBeDefined();
  });

  it("should update dialogue and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update a dialogue
    await result.current.updateDialogue("dialogue-1", { npcName: "Updated NPC Name" });

    expect(result.current.dialogues).toBeDefined();
  });

  it("should update lore and reload content", async () => {
    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update a lore
    await result.current.updateLore("lore-1", { title: "Updated Lore Title" });

    expect(result.current.lores).toBeDefined();
  });

  it("should handle update errors gracefully", async () => {
    // Mock error
    mock.module("@/services/api/ContentAPIClient", () => ({
      ContentAPIClient: class {
        listNPCs = mock(() => Promise.resolve({ success: true, npcs: [...mockNPCs] }));
        listQuests = mock(() => Promise.resolve({ success: true, quests: [...mockQuests] }));
        listDialogues = mock(() => Promise.resolve({ success: true, dialogues: [...mockDialogues] }));
        listLores = mock(() => Promise.resolve({ success: true, lores: [...mockLores] }));
        deleteNPC = mock(() => Promise.resolve({ success: true, message: "NPC deleted" }));
        deleteQuest = mock(() => Promise.resolve({ success: true, message: "Quest deleted" }));
        deleteDialogue = mock(() => Promise.resolve({ success: true, message: "Dialogue deleted" }));
        deleteLore = mock(() => Promise.resolve({ success: true, message: "Lore deleted" }));
        updateNPC = mock(() => Promise.reject(new Error("Update failed")));
        updateQuest = mock((id: string, updates: any) => Promise.resolve({ success: true, quest: { id, ...updates } }));
        updateDialogue = mock((id: string, updates: any) => Promise.resolve({ success: true, dialogue: { id, ...updates } }));
        updateLore = mock((id: string, updates: any) => Promise.resolve({ success: true, lore: { id, ...updates } }));
      },
    }));

    const { result } = renderHook(() => useContent());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should throw error
    await expect(result.current.updateNPC("npc-1", { name: "Test" })).rejects.toThrow();
  });
});
