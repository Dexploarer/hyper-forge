/**
 * Prompts Hooks - Powered by TanStack Query
 *
 * Modernized prompt data fetching with automatic caching,
 * background refetching, and optimistic updates.
 */

import { useQuery } from "@tanstack/react-query";
import { promptsQueries } from "@/queries/prompts.queries";

/**
 * Game Style Prompts Hook
 *
 * Fetches and manages game style prompts (default + custom).
 *
 * Usage:
 * ```typescript
 * const { data: prompts, isLoading, error } = useGameStylePrompts()
 * const saveMutation = useSaveGameStylePromptsMutation()
 * const deleteMutation = useDeleteGameStyleMutation()
 * ```
 */
export function useGameStylePrompts() {
  return useQuery(promptsQueries.gameStyles());
}

/**
 * Asset Type Prompts Hook
 *
 * Fetches and manages asset type prompts by category (avatar, item).
 *
 * Usage:
 * ```typescript
 * const { data: prompts, isLoading, error } = useAssetTypePrompts()
 * const saveMutation = useSaveAssetTypePromptsMutation()
 * const deleteMutation = useDeleteAssetTypeMutation()
 * ```
 */
export function useAssetTypePrompts() {
  return useQuery(promptsQueries.assetTypes());
}

/**
 * Material Prompt Templates Hook
 *
 * Fetches and manages material prompt templates.
 *
 * Usage:
 * ```typescript
 * const { data: templates, isLoading } = useMaterialPromptTemplates()
 * const saveMutation = useSaveMaterialPromptsMutation()
 * ```
 */
export function useMaterialPromptTemplates() {
  return useQuery(promptsQueries.materials());
}
