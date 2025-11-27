/**
 * Type-Safe API Client using Elysia's Eden Treaty
 *
 * This client provides end-to-end type safety for all API calls.
 * It automatically infers request/response types from the Elysia server,
 * eliminating the need for manual type definitions or runtime validation.
 *
 * Benefits:
 * - Full TypeScript autocomplete for all routes and methods
 * - Compile-time type checking for request bodies and query parameters
 * - Automatic response type inference
 * - No manual type definitions needed
 * - Runtime errors caught at compile time
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "../../server/api-elysia";
import { getAuthToken } from "@/utils/auth-token-store";

// Get API base URL
// In development: Use http://localhost:3004 (direct connection to local backend)
// In production: Use VITE_API_URL if set, otherwise relative path /api
// Remove trailing slash to prevent double-slash URLs (e.g., //api/users/me)
const rawBaseUrl = import.meta.env.DEV
  ? "http://localhost:3004" // Dev mode: Direct connection to local backend
  : import.meta.env.VITE_API_URL || "/api"; // Production: Use VITE_API_URL or relative path
const API_BASE_URL = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

// Debug logging
if (import.meta.env.DEV) {
  console.log(
    "[API Client] Dev mode - connecting to local backend, API_BASE_URL:",
    API_BASE_URL,
  );
}

/**
 * Get authentication headers with Privy token
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  return {};
}

/**
 * Type-safe API client for asset-forge backend
 *
 * Eden Treaty automatically infers ALL route types from the Elysia server through
 * recursive plugin composition. The server has been refactored to eliminate factory
 * functions, allowing TypeScript to properly infer the complete route tree.
 *
 * This single client provides type-safe access to all routes including assets, content,
 * generation, voice, and more!
 *
 * Usage examples:
 *
 * ```typescript
 * // Health check
 * const { data, error } = await api.api.health.get()
 * if (data) {
 *   console.log('Status:', data.status)
 *   console.log('Services:', data.services)
 * }
 *
 * // Asset routes
 * const { data: assets } = await api.api.assets.get()
 * const { data: model } = await api.api.assets({ id: 'sword-001' }).model.get()
 * const { data } = await api.api.assets({ id: 'sword-001' }).delete({
 *   query: { includeVariants: 'true' }
 * })
 * const { data: updated } = await api.api.assets({ id: 'sword-001' }).patch({
 *   name: 'Updated Sword',
 *   tier: 3
 * })
 *
 * // Generation routes
 * const { data: result } = await api.api.retexture.post({
 *   baseAssetId: 'sword-001',
 *   materialPreset: 'steel',
 *   outputName: 'steel-sword'
 * })
 * const { data: pipeline } = await api.api.generation.pipeline.post({
 *   name: 'Iron Sword',
 *   type: 'weapon',
 *   subtype: 'sword',
 *   tier: 1
 * })
 * const { data: status } = await api.api.generation.pipeline({ pipelineId: '123' }).get()
 *
 * // Material presets
 * const { data: presets } = await api.api['material-presets'].get()
 *
 * // Sprites
 * const { data: result } = await api.api.assets({ id: 'sword-001' }).sprites.post({
 *   sprites: [
 *     { angle: 0, imageData: 'data:image/png;base64,...' },
 *     { angle: 45, imageData: 'data:image/png;base64,...' }
 *   ],
 *   config: { resolution: 512, angles: 8 }
 * })
 *
 * // VRM upload
 * const formData = new FormData()
 * formData.append('file', file)
 * formData.append('assetId', 'character-001')
 * const { data } = await api.api.assets['upload-vrm'].post(formData)
 *
 * // AI Vision
 * const { data: gripData } = await api.api['weapon-handle-detect'].post({
 *   image: 'data:image/png;base64,...',
 *   angle: 'side',
 *   promptHint: 'medieval sword'
 * })
 * const { data: orientation } = await api.api['weapon-orientation-detect'].post({
 *   image: 'data:image/png;base64,...'
 * })
 *
 * // Voice generation
 * const { data: saved } = await api.api.voice.saved.get({ query: { type: 'voice' } })
 * const { data: result } = await api.api.voice.save.post({ name: 'My Voice', type: 'voice', audioData: '...' })
 *
 * // Content generation routes (all via same client!)
 * const { data: world } = await api.api.content['generate-world'].post({ theme: 'fantasy', complexity: 'medium' })
 * const { data: npc } = await api.api.content['generate-npc'].post({ prompt: 'A friendly merchant', archetype: 'merchant' })
 * const { data: quest } = await api.api.content['generate-quest'].post({ prompt: 'Find the lost artifact', difficulty: 'medium' })
 * const { data: dialogue } = await api.api.content['generate-dialogue'].post({ npcName: 'Merchant', prompt: 'Greeting dialogue' })
 * const { data: lore } = await api.api.content['generate-lore'].post({ category: 'history', prompt: 'Ancient war' })
 *
 * // Content CRUD routes
 * const { data: npcs } = await api.api.content.npcs.get()
 * const { data: npc } = await api.api.content.npcs({ id: 'npc-123' }).get()
 * const { data: deleted } = await api.api.content.npcs({ id: 'npc-123' }).delete()
 * const { data: updated } = await api.api.content.quests({ id: 'quest-123' }).put({ title: 'New Title' })
 *
 * // Content media routes
 * const { data: portrait } = await api.api.content['generate-npc-portrait'].post({
 *   npcName: 'Merchant',
 *   archetype: 'merchant',
 *   appearance: 'Friendly face',
 *   personality: 'Cheerful'
 * })
 * const { data: banner } = await api.api.content['generate-quest-banner'].post({
 *   questTitle: 'Find the Artifact',
 *   description: 'A dangerous quest'
 * })
 * const { data: saved } = await api.api.content.media['save-portrait'].post({
 *   entityType: 'npc',
 *   entityId: 'npc-123',
 *   imageData: 'base64...'
 * })
 * ```
 */

const _api = treaty<App>(API_BASE_URL, {
  // Dynamic headers - auth token updated on every request
  fetch: {
    credentials: "include",
  },
  headers: () => getAuthHeaders(),
});

/**
 * Export the unified API client
 *
 * Eden Treaty automatically infers types from the Elysia server through plugin composition.
 * The server uses direct .use() chaining (no factory functions), enabling TypeScript to
 * capture the complete route tree for all plugins.
 *
 * Type inference automatically includes:
 * - api.api.assets (asset CRUD operations)
 * - api.api.generation (3D model generation)
 * - api.api.content (NPCs, quests, dialogues, lores)
 * - api.api.content['generate-*'] (content generation endpoints)
 * - api.api.content.media (portrait/banner generation and saving)
 * - api.api.prompts (prompt management)
 * - api.api['material-presets'] (material presets)
 * - api.api.voice (voice/audio operations)
 * - api.api.health (health check)
 * - And all other routes defined in the server plugins
 */
export const api = _api;

/**
 * Type-safe fetch wrapper for non-Eden endpoints
 * Use this if you need to make requests outside the Eden Treaty client
 */
export const apiFetch = async <T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null }> => {
  try {
    // Ensure endpoint starts with / if API_BASE_URL is relative
    const endpointPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = API_BASE_URL.startsWith("http")
      ? `${API_BASE_URL}${endpointPath}` // Absolute URL
      : `${API_BASE_URL}${endpointPath}`; // Relative URL (Vite proxy handles it)
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error: `HTTP ${response.status}: ${error}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Export App type for convenience
export type { App } from "../../server/api-elysia";
