/**
 * Content Routes Index
 * Combines all content-related route modules
 * ALL routes require authentication
 */

import { Elysia } from "elysia";
import { generationRoutes } from "./generation";
import { retrievalRoutes } from "./retrieval";
import { managementRoutes } from "./management";
import { mediaRoutes } from "./media";
import { relationshipRoutes } from "./relationships";
import { worldRoutes } from "./world";

/**
 * Complete content routes module
 * Combines all content generation, retrieval, and management endpoints
 */
export const contentRoutes = new Elysia({
  prefix: "/api/content",
  name: "content",
})
  .use(generationRoutes) // POST generation endpoints
  .use(retrievalRoutes) // GET list/detail endpoints
  .use(managementRoutes) // PUT/DELETE endpoints
  .use(mediaRoutes) // Media generation and storage
  .use(relationshipRoutes) // Linked content generation
  .use(worldRoutes); // World generation

/**
 * Eden Treaty type export for type-safe client usage
 * @example
 * import { treaty } from '@elysiajs/eden'
 * import type { ContentRoutes } from './routes/content'
 * const client = treaty<ContentRoutes>('http://localhost:3000')
 */
export type ContentRoutes = typeof contentRoutes;
