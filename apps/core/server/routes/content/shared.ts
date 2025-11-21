/**
 * Shared imports and utilities for content routes
 * ALL content routes require authentication
 */

import { Elysia, t } from "elysia";
import { ContentGenerationService } from "../../services/ContentGenerationService";
import { AICreationService } from "../../services/AICreationService";
import { contentDatabaseService } from "../../services/ContentDatabaseService";
import { MediaStorageService } from "../../services/MediaStorageService";
import { RelationshipService } from "../../services/RelationshipService";
import { authPlugin } from "../../plugins/auth.plugin";
import {
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} from "../../errors";
import { createChildLogger } from "../../utils/logger";
import { getUserApiKeysWithFallback } from "../../utils/getUserApiKeys";
import { ActivityLogService } from "../../services/ActivityLogService";

// Shared logger
export const logger = createChildLogger("ContentRoutes");

/**
 * Shared service instances (Singleton Pattern)
 *
 * These services are instantiated once at module load time and shared across all route handlers.
 * This design provides several benefits:
 *
 * 1. **Memory Efficiency**: Single instance per service rather than creating new instances per request
 * 2. **Performance**: No instantiation overhead on each request
 * 3. **State Management**: Services can maintain internal caches or connection pools
 * 4. **Consistency**: Same service configuration across all endpoints
 *
 * These services are stateless or thread-safe, making them safe to share across concurrent requests.
 * Any per-request state (user context, auth tokens) is passed as parameters to service methods.
 */
export const contentGenService = new ContentGenerationService();
export const mediaStorageService = new MediaStorageService();
export const relationshipService = new RelationshipService();

// Header schema for auth-required routes (ALL content routes)
export const authHeaders = t.Object({
  authorization: t.String(),
});

// Export commonly used imports for route modules
export {
  Elysia,
  t,
  authPlugin,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
  getUserApiKeysWithFallback,
  ActivityLogService,
  contentDatabaseService,
  AICreationService,
};
