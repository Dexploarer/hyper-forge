/**
 * Content Hooks
 * Hooks for fetching and managing content (NPCs, quests, dialogues, lore)
 */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";

export type ContentType = "npc" | "quest" | "dialogue" | "lore";

export interface ContentItem {
  id: string;
  type: ContentType;
  name: string;
  createdAt: Date;
  data: any;
}

export const useContent = () => {
  const [npcs, setNpcs] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [dialogues, setDialogues] = useState<any[]>([]);
  const [lores, setLores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useApp();
  const apiClient = new ContentAPIClient();

  const fetchAllContent = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all content types in parallel
      const [npcsData, questsData, dialoguesData, loresData] =
        await Promise.all([
          apiClient.listNPCs().catch(() => ({ npcs: [] })),
          apiClient.listQuests().catch(() => ({ quests: [] })),
          apiClient.listDialogues().catch(() => ({ dialogues: [] })),
          apiClient.listLores().catch(() => ({ lores: [] })),
        ]);

      setNpcs(npcsData.npcs || []);
      setQuests(questsData.quests || []);
      setDialogues(dialoguesData.dialogues || []);
      setLores(loresData.lores || []);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to load content",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const forceReload = useCallback(async () => {
    // Clear content first to ensure UI updates
    setNpcs([]);
    setQuests([]);
    setDialogues([]);
    setLores([]);
    await fetchAllContent();
  }, [fetchAllContent]);

  useEffect(() => {
    fetchAllContent();
  }, [fetchAllContent]);

  // Delete operations
  const deleteNPC = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteNPC(id);
        showNotification("NPC deleted successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to delete NPC",
          "error",
        );
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const deleteQuest = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteQuest(id);
        showNotification("Quest deleted successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to delete quest",
          "error",
        );
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const deleteDialogue = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteDialogue(id);
        showNotification("Dialogue deleted successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to delete dialogue",
          "error",
        );
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const deleteLore = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteLore(id);
        showNotification("Lore deleted successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to delete lore",
          "error",
        );
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  // Update operations
  const updateNPC = useCallback(
    async (id: string, updates: any) => {
      try {
        await apiClient.updateNPC(id, updates);
        showNotification("NPC updated successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to update NPC",
          "error",
        );
        throw err;
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const updateQuest = useCallback(
    async (id: string, updates: any) => {
      try {
        await apiClient.updateQuest(id, updates);
        showNotification("Quest updated successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to update quest",
          "error",
        );
        throw err;
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const updateDialogue = useCallback(
    async (id: string, updates: any) => {
      try {
        await apiClient.updateDialogue(id, updates);
        showNotification("Dialogue updated successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to update dialogue",
          "error",
        );
        throw err;
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  const updateLore = useCallback(
    async (id: string, updates: any) => {
      try {
        await apiClient.updateLore(id, updates);
        showNotification("Lore updated successfully", "success");
        await fetchAllContent();
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to update lore",
          "error",
        );
        throw err;
      }
    },
    [apiClient, fetchAllContent, showNotification],
  );

  // Get all content items in a unified format
  const allContent: ContentItem[] = [
    ...npcs.map((npc) => ({
      id: npc.id,
      type: "npc" as ContentType,
      name: npc.name,
      createdAt: new Date(npc.createdAt),
      data: npc,
    })),
    ...quests.map((quest) => ({
      id: quest.id,
      type: "quest" as ContentType,
      name: quest.title,
      createdAt: new Date(quest.createdAt),
      data: quest,
    })),
    ...dialogues.map((dialogue) => ({
      id: dialogue.id,
      type: "dialogue" as ContentType,
      name: dialogue.npcName,
      createdAt: new Date(dialogue.createdAt),
      data: dialogue,
    })),
    ...lores.map((lore) => ({
      id: lore.id,
      type: "lore" as ContentType,
      name: lore.title,
      createdAt: new Date(lore.createdAt),
      data: lore,
    })),
  ];

  return {
    npcs,
    quests,
    dialogues,
    lores,
    allContent,
    loading,
    reloadContent: fetchAllContent,
    forceReload,
    deleteNPC,
    deleteQuest,
    deleteDialogue,
    deleteLore,
    updateNPC,
    updateQuest,
    updateDialogue,
    updateLore,
  };
};
