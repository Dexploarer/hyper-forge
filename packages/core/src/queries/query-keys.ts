/**
 * Centralized Query Keys for TanStack Query
 *
 * Following TanStack Query best practices for hierarchical key structure:
 * - Keys are arrays for proper cache invalidation
 * - Nested structure allows targeted invalidation
 * - Type-safe with TypeScript 'as const' assertions
 *
 * Key Structure:
 * - ['resource'] - Invalidates all queries for that resource
 * - ['resource', 'list'] - Invalidates all list queries
 * - ['resource', 'list', { filters }] - Invalidates specific filtered list
 * - ['resource', 'detail', id] - Invalidates specific item
 *
 * Usage Examples:
 * ```typescript
 * // Invalidate all assets queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
 *
 * // Invalidate only asset lists
 * queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() })
 *
 * // Invalidate specific asset
 * queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(id) })
 * ```
 */

export const queryKeys = {
  /**
   * Assets - 3D models, characters, props, environments
   */
  assets: {
    all: ["assets"] as const,
    lists: () => [...queryKeys.assets.all, "list"] as const,
    list: () => [...queryKeys.assets.lists()] as const,
    details: () => [...queryKeys.assets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.assets.details(), id] as const,
  },

  /**
   * Material Presets - Predefined material configurations
   */
  materials: {
    all: ["materials"] as const,
    presets: () => [...queryKeys.materials.all, "presets"] as const,
  },

  /**
   * Projects - User project collections
   */
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (includeArchived: boolean) =>
      [...queryKeys.projects.lists(), { includeArchived }] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  /**
   * Content Library - NPCs, quests, dialogue, lore
   */
  content: {
    all: ["content"] as const,
    lists: () => [...queryKeys.content.all, "list"] as const,
    list: (type?: string) =>
      [...queryKeys.content.lists(), { type }] as const,
    details: () => [...queryKeys.content.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
  },

  /**
   * Prompts - Game styles, asset types, materials
   */
  prompts: {
    all: ["prompts"] as const,
    gameStyles: () => [...queryKeys.prompts.all, "gameStyles"] as const,
    assetTypes: () => [...queryKeys.prompts.all, "assetTypes"] as const,
    materials: () => [...queryKeys.prompts.all, "materials"] as const,
  },

  /**
   * User Profile - Current user and public profiles
   */
  user: {
    all: ["user"] as const,
    me: () => [...queryKeys.user.all, "me"] as const,
    profile: (userId: string) => [...queryKeys.user.all, userId] as const,
  },

  /**
   * Generation Pipelines - Real-time pipeline status
   */
  pipelines: {
    all: ["pipelines"] as const,
    status: (pipelineId: string) =>
      [...queryKeys.pipelines.all, "status", pipelineId] as const,
  },
} as const;
