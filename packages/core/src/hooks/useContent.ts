/**
 * Content Hooks - Powered by TanStack Query
 *
 * Modernized content data fetching with automatic caching,
 * background refetching, and optimistic updates.
 *
 * Migration Notes:
 * - Removed manual useState/useEffect patterns
 * - Removed ContentAPIClient instantiation (now in queries)
 * - Maintained backward-compatible API for existing components
 * - Added optimistic updates for all mutations
 */

import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import {
  contentQueries,
  useDeleteNPCMutation,
  useDeleteQuestMutation,
  useDeleteDialogueMutation,
  useDeleteLoreMutation,
  useUpdateNPCMutation,
  useUpdateQuestMutation,
  useUpdateDialogueMutation,
  useUpdateLoreMutation,
} from "@/queries/content.queries";

export type ContentType = "npc" | "quest" | "dialogue" | "lore";

export interface ContentItem {
  id: string;
  type: ContentType;
  name: string;
  createdAt: Date;
  data: any;
}

/**
 * Fetch and manage all content (NPCs, quests, dialogues, lore)
 *
 * Modern API:
 * ```typescript
 * const { data: npcs, isLoading, error, refetch } = useContent()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { npcs, quests, dialogues, lores, loading, reloadContent } = useContent()
 * ```
 */
export const useContent = () => {
  const { showNotification } = useApp();

  // Fetch all content types
  const npcsQuery = useQuery(contentQueries.npcs());
  const questsQuery = useQuery(contentQueries.quests());
  const dialoguesQuery = useQuery(contentQueries.dialogues());
  const loresQuery = useQuery(contentQueries.lores());

  // Mutations with notifications
  const deleteNPCMutation = useDeleteNPCMutation();
  const deleteQuestMutation = useDeleteQuestMutation();
  const deleteDialogueMutation = useDeleteDialogueMutation();
  const deleteLoreMutation = useDeleteLoreMutation();
  const updateNPCMutation = useUpdateNPCMutation();
  const updateQuestMutation = useUpdateQuestMutation();
  const updateDialogueMutation = useUpdateDialogueMutation();
  const updateLoreMutation = useUpdateLoreMutation();

  // Delete operations with notifications
  const deleteNPC = async (id: string) => {
    try {
      await deleteNPCMutation.mutateAsync(id);
      showNotification("NPC deleted successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to delete NPC",
        "error",
      );
      throw err;
    }
  };

  const deleteQuest = async (id: string) => {
    try {
      await deleteQuestMutation.mutateAsync(id);
      showNotification("Quest deleted successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to delete quest",
        "error",
      );
      throw err;
    }
  };

  const deleteDialogue = async (id: string) => {
    try {
      await deleteDialogueMutation.mutateAsync(id);
      showNotification("Dialogue deleted successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to delete dialogue",
        "error",
      );
      throw err;
    }
  };

  const deleteLore = async (id: string) => {
    try {
      await deleteLoreMutation.mutateAsync(id);
      showNotification("Lore deleted successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to delete lore",
        "error",
      );
      throw err;
    }
  };

  // Update operations with notifications
  const updateNPC = async (id: string, updates: any) => {
    try {
      await updateNPCMutation.mutateAsync({ id, updates });
      showNotification("NPC updated successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to update NPC",
        "error",
      );
      throw err;
    }
  };

  const updateQuest = async (id: string, updates: any) => {
    try {
      await updateQuestMutation.mutateAsync({ id, updates });
      showNotification("Quest updated successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to update quest",
        "error",
      );
      throw err;
    }
  };

  const updateDialogue = async (id: string, updates: any) => {
    try {
      await updateDialogueMutation.mutateAsync({ id, updates });
      showNotification("Dialogue updated successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to update dialogue",
        "error",
      );
      throw err;
    }
  };

  const updateLore = async (id: string, updates: any) => {
    try {
      await updateLoreMutation.mutateAsync({ id, updates });
      showNotification("Lore updated successfully", "success");
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : "Failed to update lore",
        "error",
      );
      throw err;
    }
  };

  // Computed values
  const npcs = npcsQuery.data ?? [];
  const quests = questsQuery.data ?? [];
  const dialogues = dialoguesQuery.data ?? [];
  const lores = loresQuery.data ?? [];

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

  // Reload all content
  const reloadContent = async () => {
    await Promise.all([
      npcsQuery.refetch(),
      questsQuery.refetch(),
      dialoguesQuery.refetch(),
      loresQuery.refetch(),
    ]);
  };

  // Force reload (clears and refetches)
  const forceReload = async () => {
    await reloadContent();
  };

  const loading =
    npcsQuery.isLoading ||
    questsQuery.isLoading ||
    dialoguesQuery.isLoading ||
    loresQuery.isLoading;

  return {
    // Data
    npcs,
    quests,
    dialogues,
    lores,
    allContent,

    // Loading state
    loading,

    // Reload operations
    reloadContent,
    forceReload,

    // Delete operations
    deleteNPC,
    deleteQuest,
    deleteDialogue,
    deleteLore,

    // Update operations
    updateNPC,
    updateQuest,
    updateDialogue,
    updateLore,

    // Modern React Query API (for advanced usage)
    npcsQuery,
    questsQuery,
    dialoguesQuery,
    loresQuery,
  };
};
