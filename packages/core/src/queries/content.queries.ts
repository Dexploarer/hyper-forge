/**
 * Content Query Options
 *
 * Centralized query definitions for content library data fetching.
 * Uses TanStack Query v5's unified queryOptions API for type-safe,
 * reusable query definitions.
 *
 * Features:
 * - Full TypeScript type inference
 * - Reusable across useQuery, prefetchQuery, and getQueryData
 * - Automatic request deduplication
 * - Smart caching based on query keys
 * - Optimistic updates for mutations
 */

import {
  queryOptions,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";
import type {
  NPCData,
  QuestData,
  DialogueNode,
  LoreData,
} from "@/types/content";
import { queryKeys } from "./query-keys";

/**
 * Content Queries - NPCs, Quests, Dialogues, Lores
 *
 * Stale time: 60 seconds (content changes less frequently than assets)
 */
export const contentQueries = {
  /**
   * NPCs List Query
   *
   * Fetches all NPCs for the current user.
   */
  npcs: () =>
    queryOptions({
      queryKey: queryKeys.content.list("npc"),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.listNPCs();
        return result.npcs || [];
      },
      staleTime: 60 * 1000,
    }),

  /**
   * Quests List Query
   *
   * Fetches all quests for the current user.
   */
  quests: () =>
    queryOptions({
      queryKey: queryKeys.content.list("quest"),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.listQuests();
        return result.quests || [];
      },
      staleTime: 60 * 1000,
    }),

  /**
   * Dialogues List Query
   *
   * Fetches all dialogues for the current user.
   */
  dialogues: () =>
    queryOptions({
      queryKey: queryKeys.content.list("dialogue"),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.listDialogues();
        return result.dialogues || [];
      },
      staleTime: 60 * 1000,
    }),

  /**
   * Lores List Query
   *
   * Fetches all lore entries for the current user.
   */
  lores: () =>
    queryOptions({
      queryKey: queryKeys.content.list("lore"),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.listLores();
        return result.lores || [];
      },
      staleTime: 60 * 1000,
    }),

  /**
   * Single NPC Query
   *
   * Fetches a specific NPC by ID.
   */
  npc: (id: string) =>
    queryOptions({
      queryKey: queryKeys.content.detail(id),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.getNPC(id);
        return result.npc || null;
      },
      enabled: !!id,
      staleTime: 60 * 1000,
    }),

  /**
   * Single Quest Query
   *
   * Fetches a specific quest by ID.
   */
  quest: (id: string) =>
    queryOptions({
      queryKey: queryKeys.content.detail(id),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.getQuest(id);
        return result.quest || null;
      },
      enabled: !!id,
      staleTime: 60 * 1000,
    }),

  /**
   * Single Dialogue Query
   *
   * Fetches a specific dialogue by ID.
   */
  dialogue: (id: string) =>
    queryOptions({
      queryKey: queryKeys.content.detail(id),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.getDialogue(id);
        return result.dialogue || null;
      },
      enabled: !!id,
      staleTime: 60 * 1000,
    }),

  /**
   * Single Lore Query
   *
   * Fetches a specific lore entry by ID.
   */
  lore: (id: string) =>
    queryOptions({
      queryKey: queryKeys.content.detail(id),
      queryFn: async () => {
        const client = new ContentAPIClient();
        const result = await client.getLore(id);
        return result.lore || null;
      },
      enabled: !!id,
      staleTime: 60 * 1000,
    }),
};

/**
 * Delete NPC Mutation
 *
 * Deletes an NPC with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteNPCMutation()
 * mutation.mutate('npc-id')
 * ```
 */
export function useDeleteNPCMutation(): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = new ContentAPIClient();
      return await client.deleteNPC(id);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });

      // Snapshot current NPCs for rollback
      const previousNPCs = queryClient.getQueryData(
        queryKeys.content.list("npc"),
      );

      // Optimistically remove NPC from cache
      queryClient.setQueryData(
        queryKeys.content.list("npc"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((npc) => npc.id !== id);
        },
      );

      return { previousNPCs };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousNPCs) {
        queryClient.setQueryData(
          queryKeys.content.list("npc"),
          context.previousNPCs,
        );
      }
    },
    onSettled: () => {
      // Always refetch to sync with server state
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Delete Quest Mutation
 *
 * Deletes a quest with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteQuestMutation()
 * mutation.mutate('quest-id')
 * ```
 */
export function useDeleteQuestMutation(): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = new ContentAPIClient();
      return await client.deleteQuest(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousQuests = queryClient.getQueryData(
        queryKeys.content.list("quest"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("quest"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((quest) => quest.id !== id);
        },
      );

      return { previousQuests };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(
          queryKeys.content.list("quest"),
          context.previousQuests,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Delete Dialogue Mutation
 *
 * Deletes a dialogue with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteDialogueMutation()
 * mutation.mutate('dialogue-id')
 * ```
 */
export function useDeleteDialogueMutation(): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = new ContentAPIClient();
      return await client.deleteDialogue(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousDialogues = queryClient.getQueryData(
        queryKeys.content.list("dialogue"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("dialogue"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((dialogue) => dialogue.id !== id);
        },
      );

      return { previousDialogues };
    },
    onError: (_err, _id, context) => {
      if (context?.previousDialogues) {
        queryClient.setQueryData(
          queryKeys.content.list("dialogue"),
          context.previousDialogues,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Delete Lore Mutation
 *
 * Deletes a lore entry with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useDeleteLoreMutation()
 * mutation.mutate('lore-id')
 * ```
 */
export function useDeleteLoreMutation(): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = new ContentAPIClient();
      return await client.deleteLore(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousLores = queryClient.getQueryData(
        queryKeys.content.list("lore"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("lore"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((lore) => lore.id !== id);
        },
      );

      return { previousLores };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLores) {
        queryClient.setQueryData(
          queryKeys.content.list("lore"),
          context.previousLores,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Update NPC Mutation
 *
 * Updates an NPC with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useUpdateNPCMutation()
 * mutation.mutate({ id: 'npc-id', updates: { name: 'New Name' } })
 * ```
 */
export function useUpdateNPCMutation(): UseMutationResult<
  { success: boolean; npc: any },
  Error,
  { id: string; updates: Partial<NPCData> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const client = new ContentAPIClient();
      return await client.updateNPC(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousNPCs = queryClient.getQueryData(
        queryKeys.content.list("npc"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("npc"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((npc) =>
            npc.id === id ? { ...npc, ...updates } : npc,
          );
        },
      );

      return { previousNPCs };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNPCs) {
        queryClient.setQueryData(
          queryKeys.content.list("npc"),
          context.previousNPCs,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Update Quest Mutation
 *
 * Updates a quest with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useUpdateQuestMutation()
 * mutation.mutate({ id: 'quest-id', updates: { title: 'New Title' } })
 * ```
 */
export function useUpdateQuestMutation(): UseMutationResult<
  { success: boolean; quest: any },
  Error,
  { id: string; updates: Partial<QuestData> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const client = new ContentAPIClient();
      return await client.updateQuest(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousQuests = queryClient.getQueryData(
        queryKeys.content.list("quest"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("quest"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((quest) =>
            quest.id === id ? { ...quest, ...updates } : quest,
          );
        },
      );

      return { previousQuests };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(
          queryKeys.content.list("quest"),
          context.previousQuests,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Update Dialogue Mutation
 *
 * Updates a dialogue with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useUpdateDialogueMutation()
 * mutation.mutate({ id: 'dialogue-id', updates: [...nodes] })
 * ```
 */
export function useUpdateDialogueMutation(): UseMutationResult<
  { success: boolean; dialogue: any },
  Error,
  { id: string; updates: Partial<DialogueNode[]> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const client = new ContentAPIClient();
      return await client.updateDialogue(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousDialogues = queryClient.getQueryData(
        queryKeys.content.list("dialogue"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("dialogue"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((dialogue) =>
            dialogue.id === id ? { ...dialogue, ...updates } : dialogue,
          );
        },
      );

      return { previousDialogues };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDialogues) {
        queryClient.setQueryData(
          queryKeys.content.list("dialogue"),
          context.previousDialogues,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}

/**
 * Update Lore Mutation
 *
 * Updates a lore entry with optimistic updates for instant UI feedback.
 *
 * Usage:
 * ```typescript
 * const mutation = useUpdateLoreMutation()
 * mutation.mutate({ id: 'lore-id', updates: { title: 'New Title' } })
 * ```
 */
export function useUpdateLoreMutation(): UseMutationResult<
  { success: boolean; lore: any },
  Error,
  { id: string; updates: Partial<LoreData> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const client = new ContentAPIClient();
      return await client.updateLore(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
      const previousLores = queryClient.getQueryData(
        queryKeys.content.list("lore"),
      );

      queryClient.setQueryData(
        queryKeys.content.list("lore"),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((lore) =>
            lore.id === id ? { ...lore, ...updates } : lore,
          );
        },
      );

      return { previousLores };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLores) {
        queryClient.setQueryData(
          queryKeys.content.list("lore"),
          context.previousLores,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    },
  });
}
