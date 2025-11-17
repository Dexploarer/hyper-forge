/**
 * World Knowledge API Routes
 * Provides comprehensive world context for AI agents and users
 * 
 * All endpoints are designed to work equally well for:
 * - AI agents building worlds autonomously
 * - Human users exploring/managing content
 * - Frontend applications displaying world state
 * - Analytics tools analyzing game design
 */

import { Elysia, t } from "elysia";
import { WorldKnowledgeService } from "../services/WorldKnowledgeService";
import { requireAuthGuard } from "../plugins/auth.plugin";
import { logger } from "../utils/logger";
import type { AuthUser } from "../types/auth";

const worldKnowledgeService = new WorldKnowledgeService();

export const worldKnowledgeRoutes = new Elysia({
  prefix: "/api/world",
  name: "world-knowledge",
})
  // All endpoints require authentication
  .use(requireAuthGuard)

  /**
   * GET /api/world/context
   * Get complete world context overview
   */
  .get(
    "/context",
    async ({ query, user }) => {
      const authUser = user as AuthUser;

      logger.info(
        {
          userId: authUser.id,
          format: query.format || "summary",
        },
        "Getting world context",
      );

      try {
        const context = await worldKnowledgeService.getWorldContext({
          userId: authUser.id,
          includeRelationships: query.includeRelationships !== undefined ? query.includeRelationships : true,
          includeFullData: query.includeFullData !== undefined ? query.includeFullData : false,
          maxEntities: query.maxEntities !== undefined ? Number(query.maxEntities) : 1000,
          format: (query.format as "summary" | "detailed" | "llm-optimized") || "summary",
        });

        return {
          success: true,
          worldContext: context,
          generatedAt: new Date().toISOString(),
          cacheExpiresIn: 300, // 5 minutes
        };
      } catch (error) {
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to get world context",
        );
        throw error;
      }
    },
    {
      query: t.Object({
        includeRelationships: t.Optional(t.Boolean()),
        includeFullData: t.Optional(t.Boolean()),
        maxEntities: t.Optional(t.Numeric()),
        format: t.Optional(
          t.Union([
            t.Literal("summary"),
            t.Literal("detailed"),
            t.Literal("llm-optimized"),
          ]),
        ),
      }),
      detail: {
        tags: ["World Knowledge"],
        summary: "Get complete world context",
        description:
          "Get a comprehensive overview of the entire game world including entities, relationships, and style guide. Useful for AI agents and dashboards. Returns stats, world config, entities, relationship graph, style guide, and suggestions. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/search
   * Advanced entity search with filters
   */
  .get(
    "/search",
    async ({ query, user }) => {
      const authUser = user as AuthUser;

      logger.info(
        {
          userId: authUser.id,
          query: query.q,
          type: query.type,
        },
        "Searching world entities",
      );

      try {
        // Parse comma-separated tags
        const tags = query.tags
          ? query.tags.split(",").map((t) => t.trim())
          : undefined;

        const results = await worldKnowledgeService.searchEntities({
          userId: authUser.id,
          q: query.q,
          type: query.type,
          tags,
          archetype: query.archetype,
          difficulty: query.difficulty,
          semantic: query.semantic !== undefined ? query.semantic : false,
          limit: query.limit !== undefined ? Number(query.limit) : 50,
          offset: query.offset !== undefined ? Number(query.offset) : 0,
        });

        return {
          success: true,
          query: {
            text: query.q,
            type: query.type,
            semantic: query.semantic ?? false,
          },
          ...results,
        };
      } catch (error) {
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to search entities",
        );
        throw error;
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        type: t.Optional(
          t.Union([
            t.Literal("npc"),
            t.Literal("quest"),
            t.Literal("lore"),
            t.Literal("dialogue"),
            t.Literal("location"),
            t.Literal("all"),
          ]),
        ),
        tags: t.Optional(t.String()), // Comma-separated
        archetype: t.Optional(t.String()),
        difficulty: t.Optional(t.String()),
        semantic: t.Optional(t.Boolean()),
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["World Knowledge", "Search"],
        summary: "Advanced entity search",
        description:
          "Search across all entities with text or semantic search, filtering by type, tags, archetype, etc. Returns faceted results with pagination. Supports filtering by multiple criteria. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/stats
   * Get quick world statistics
   */
  .get(
    "/stats",
    async ({ user }) => {
      const authUser = user as AuthUser;

      logger.info({ userId: authUser.id }, "Getting world stats");

      try {
        const context = await worldKnowledgeService.getWorldContext({
          userId: authUser.id,
          includeRelationships: false,
          includeFullData: false,
          maxEntities: 0,
          format: "summary",
        });

        return {
          success: true,
          stats: context.stats,
          worldConfig: context.worldConfig
            ? {
                name: context.worldConfig.name,
                theme: context.worldConfig.theme,
                complexity: context.worldConfig.complexity,
              }
            : null,
        };
      } catch (error) {
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to get world stats",
        );
        throw error;
      }
    },
    {
      detail: {
        tags: ["World Knowledge"],
        summary: "Get world statistics",
        description:
          "Get quick statistics about the world including entity counts and basic world config. Lightweight endpoint for dashboards. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/health
   * Health check endpoint (useful for monitoring)
   */
  .get(
    "/health",
    () => {
      return {
        success: true,
        status: "healthy",
        service: "world-knowledge",
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        tags: ["World Knowledge"],
        summary: "Health check",
        description:
          "Health check endpoint for monitoring. Returns service status.",
      },
    },
  )

  /**
   * POST /api/world/build-context
   * Build LLM-optimized context for content generation
   */
  .post(
    "/build-context",
    async ({ body, user }) => {
      const authUser = user as AuthUser;

      logger.info(
        { userId: authUser.id, intent: body.intent },
        "Building generation context",
      );

      try {
        const context = await worldKnowledgeService.buildGenerationContext({
          userId: authUser.id,
          intent: body.intent,
          theme: body.theme,
          relatedEntityIds: body.relatedEntityIds,
        });

        return {
          success: true,
          context,
        };
      } catch (error) {
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to build generation context",
        );
        throw error;
      }
    },
    {
      body: t.Object({
        intent: t.Union([
          t.Literal("generate_npc"),
          t.Literal("generate_quest"),
          t.Literal("generate_lore"),
          t.Literal("expand_world"),
        ]),
        theme: t.Optional(t.String()),
        relatedEntityIds: t.Optional(t.Array(t.String())),
      }),
      detail: {
        tags: ["World Knowledge", "AI Generation"],
        summary: "Build LLM-optimized context for generation",
        description:
          "Create context window optimized for LLM consumption. Includes relevant entities, style guide, constraints, and ready-to-use prompts. Returns system prompts, context windows, token estimates, and suggested compression levels.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/similar/:entityType/:entityId
   * Find similar entities for duplicate detection
   */
  .get(
    "/similar/:entityType/:entityId",
    async ({ params, query, user, set }) => {
      const authUser = user as AuthUser;

      logger.info(
        {
          userId: authUser.id,
          entityType: params.entityType,
          entityId: params.entityId,
        },
        "Finding similar entities",
      );

      try {
        const similarEntities = await worldKnowledgeService.findSimilarEntities(
          {
            entityType: params.entityType,
            entityId: params.entityId,
            userId: authUser.id,
            limit: query.limit !== undefined ? Number(query.limit) : 10,
            threshold: query.scoreThreshold !== undefined ? Number(query.scoreThreshold) : 0.7,
          },
        );

        return {
          success: true,
          sourceEntity: {
            id: params.entityId,
            type: params.entityType,
          },
          similarEntities,
          totalFound: similarEntities.length,
        };
      } catch (error) {
        set.status = 404;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Entity not found",
        };
      }
    },
    {
      params: t.Object({
        entityType: t.Union([
          t.Literal("npc"),
          t.Literal("quest"),
          t.Literal("lore"),
          t.Literal("dialogue"),
          t.Literal("location"),
        ]),
        entityId: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.Numeric()),
        scoreThreshold: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["World Knowledge", "Search"],
        summary: "Find similar entities",
        description:
          "Find entities similar to the given one using text similarity and tag matching. Useful for duplicate detection and relationship suggestions. Returns similarity scores, shared themes, and suggested relationships.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/graph/:entityId
   * Get relationship graph starting from an entity
   */
  .get(
    "/graph/:entityId",
    async ({ params, query, user, set }) => {
      const authUser = user as AuthUser;

      logger.info(
        {
          userId: authUser.id,
          entityId: params.entityId,
          depth: query.depth,
        },
        "Getting relationship graph",
      );

      const relationshipTypes = query.relationshipTypes
        ? query.relationshipTypes.split(",").map((t) => t.trim())
        : undefined;

      try {
        const graph = await worldKnowledgeService.getRelationshipGraph({
          entityId: params.entityId,
          userId: authUser.id,
          depth: Math.min(query.depth !== undefined ? Number(query.depth) : 2, 5),
          relationshipTypes,
        });

        return {
          success: true,
          graph,
        };
      } catch (error) {
        set.status = 404;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Entity not found",
        };
      }
    },
    {
      params: t.Object({
        entityId: t.String(),
      }),
      query: t.Object({
        depth: t.Optional(t.Numeric()),
        relationshipTypes: t.Optional(t.String()),
      }),
      detail: {
        tags: ["World Knowledge", "Relationships"],
        summary: "Get relationship graph",
        description:
          "Traverse relationships starting from an entity. Returns a tree structure showing all connected entities up to specified depth (max 5). Supports filtering by relationship types.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * GET /api/world/snapshot
   * Export complete world snapshot
   */
  .get(
    "/snapshot",
    async ({ query, user, set }) => {
      const authUser = user as AuthUser;

      logger.info({ userId: authUser.id }, "Exporting world snapshot");

      try {
        const snapshot = await worldKnowledgeService.exportWorldSnapshot({
          userId: authUser.id,
          includeAssets: query.includeAssets !== undefined ? query.includeAssets : true,
        });

        return {
          success: true,
          snapshot,
          fileSizeEstimate: `${(JSON.stringify(snapshot).length / 1024 / 1024).toFixed(2)} MB`,
          entityCount:
            snapshot.entities.npcs.length +
            snapshot.entities.quests.length +
            snapshot.entities.lore.length +
            snapshot.entities.locations.length,
        };
      } catch (error) {
        set.status = 500;
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to export world snapshot",
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : "Export failed",
        };
      }
    },
    {
      query: t.Object({
        includeAssets: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["World Knowledge", "Export"],
        summary: "Export world snapshot",
        description:
          "Export complete world state including all entities, relationships, and configuration. Useful for backups and transfers. Returns file size estimate and entity count.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * POST /api/world/check-consistency
   * Check world consistency and identify issues
   */
  .post(
    "/check-consistency",
    async ({ user }) => {
      const authUser = user as AuthUser;

      logger.info({ userId: authUser.id }, "Checking world consistency");

      try {
        const report = await worldKnowledgeService.checkConsistency(
          authUser.id,
        );

        return {
          success: true,
          ...report,
        };
      } catch (error) {
        logger.error(
          { err: error, userId: authUser.id },
          "Failed to check world consistency",
        );
        throw error;
      }
    },
    {
      detail: {
        tags: ["World Knowledge", "Quality"],
        summary: "Check world consistency",
        description:
          "Validate world coherence and identify issues like orphaned entities, duplicate names, and missing diversity. Returns actionable suggestions, quality score (0-10), and categorized issues by severity.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
