/**
 * Vector Search Routes
 * Semantic search endpoints using Qdrant vector database
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { embeddingService } from "../services/EmbeddingService";
import { qdrantService } from "../services/QdrantService";
import { db } from "../db/db";
import { assets } from "../db/schema/assets.schema";
import { npcs, quests, lores } from "../db/schema/content.schema";
import { eq, inArray } from "drizzle-orm";
import * as Models from "../models";
import { requireAuthGuard, authPlugin } from "../plugins/auth.plugin";
import type { AuthUser } from "../types/auth";
import {
  ServiceUnavailableError,
  BadRequestError,
  InternalServerError,
} from "../errors";

export const vectorSearchRoutes = new Elysia({
  prefix: "/api/search",
  name: "vector-search",
})
  // Public health check endpoint
  .get(
    "/health",
    async () => {
      if (!process.env.QDRANT_URL) {
        throw new ServiceUnavailableError(
          "Vector Search",
          "Vector search is temporarily unavailable - QDRANT_URL not configured",
        );
      }

      try {
        const healthy = await qdrantService.healthCheck();

        if (!healthy) {
          throw new ServiceUnavailableError(
            "Vector Search",
            "Vector search service unavailable",
          );
        }

        // Get collection stats
        const stats = {
          assets: await qdrantService.count("assets"),
          npcs: await qdrantService.count("npcs"),
          quests: await qdrantService.count("quests"),
          lore: await qdrantService.count("lore"),
          dialogues: await qdrantService.count("dialogues"),
        };

        return {
          status: "healthy",
          collections: stats,
          embeddingModel: embeddingService.getModelInfo(),
        };
      } catch (error) {
        // Re-throw ApiErrors as-is
        if (
          error instanceof ServiceUnavailableError ||
          error instanceof InternalServerError
        ) {
          throw error;
        }

        // Convert unknown errors to InternalServerError
        logger.error({ err: error }, "Vector search health check failed");
        throw new InternalServerError(
          "Health check failed. Please try again later.",
          { originalError: error },
        );
      }
    },
    {
      detail: {
        tags: ["Vector Search"],
        summary: "Vector search health check",
        description: "Check Qdrant connection status and collection statistics",
      },
    },
  )

  // Authenticated search endpoints
  .group("", (app) =>
    app
      .use(requireAuthGuard)

      /**
       * Search assets by semantic similarity
       */
      .post(
        "/assets",
        async ({ body, user }) => {
          const { user: authenticatedUser } = { user } as { user: AuthUser };

          if (!process.env.QDRANT_URL) {
            throw new ServiceUnavailableError(
              "Vector Search",
              "Vector search is temporarily unavailable",
            );
          }

          try {
            const { query, limit = 10, scoreThreshold = 0.7, filters } = body;

            logger.info(
              { userId: authenticatedUser.id, query, collection: "assets" },
              "User performing asset search",
            );

            // Generate query embedding
            const { embedding } =
              await embeddingService.generateEmbedding(query);

            // Build Qdrant filter if provided
            let filter;
            if (filters) {
              const conditions = [];
              if (filters.type) {
                conditions.push({
                  key: "assetType",
                  match: { value: filters.type },
                });
              }
              if (filters.category) {
                conditions.push({
                  key: "category",
                  match: { value: filters.category },
                });
              }
              if (conditions.length > 0) {
                filter = { must: conditions };
              }
            }

            // Search Qdrant
            const results = await qdrantService.search({
              collection: "assets",
              vector: embedding,
              limit,
              scoreThreshold,
              filter,
            });

            // Fetch full asset data from PostgreSQL
            if (results.length === 0) {
              return { results: [] };
            }

            const assetIds = results.map((r) => r.id);
            const assetsData = await db
              .select()
              .from(assets)
              .where(inArray(assets.id, assetIds));

            // Create map for O(1) lookup while preserving Qdrant score-based ordering
            const assetsMap = new Map(assetsData.map((a) => [a.id, a]));
            const enrichedResults = results.map((result) => ({
              score: result.score,
              asset: assetsMap.get(result.id),
            }));

            logger.info(
              {
                userId: authenticatedUser.id,
                resultCount: enrichedResults.length,
              },
              "Asset search completed",
            );

            return { results: enrichedResults };
          } catch (error) {
            // Re-throw ApiErrors as-is
            if (
              error instanceof ServiceUnavailableError ||
              error instanceof BadRequestError ||
              error instanceof InternalServerError
            ) {
              throw error;
            }

            // Convert unknown errors to InternalServerError
            logger.error(
              { err: error, userId: authenticatedUser.id, query: body.query },
              "Asset search failed",
            );
            throw new InternalServerError(
              "Unable to complete search request. Please try again.",
              { originalError: error },
            );
          }
        },
        {
          body: Models.VectorSearchQuery,
          detail: {
            tags: ["Vector Search"],
            summary: "Semantic search for assets",
            description:
              "Search 3D assets using natural language queries with semantic similarity. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Find similar assets
       */
      .get(
        "/assets/:id/similar",
        async ({ params: { id }, query, user }) => {
          const { user: authenticatedUser } = { user } as { user: AuthUser };

          if (!process.env.QDRANT_URL) {
            throw new ServiceUnavailableError(
              "Vector Search",
              "Vector search is temporarily unavailable",
            );
          }

          try {
            const limit = query.limit ? parseInt(query.limit as string) : 10;
            const scoreThreshold = query.scoreThreshold
              ? parseFloat(query.scoreThreshold as string)
              : 0.7;

            logger.info(
              { userId: authenticatedUser.id, assetId: id },
              "Finding similar assets",
            );

            // Find similar items
            const results = await qdrantService.findSimilar({
              collection: "assets",
              id,
              limit,
              scoreThreshold,
            });

            // Fetch full data
            if (results.length === 0) {
              return { results: [] };
            }

            const assetIds = results.map((r) => r.id);
            const assetsData = await db
              .select()
              .from(assets)
              .where(inArray(assets.id, assetIds));

            // Create map for O(1) lookup while preserving Qdrant score-based ordering
            const assetsMap = new Map(assetsData.map((a) => [a.id, a]));
            const enrichedResults = results.map((result) => ({
              score: result.score,
              asset: assetsMap.get(result.id),
            }));

            return { results: enrichedResults };
          } catch (error) {
            // Re-throw ApiErrors as-is
            if (
              error instanceof ServiceUnavailableError ||
              error instanceof BadRequestError ||
              error instanceof InternalServerError
            ) {
              throw error;
            }

            // Convert unknown errors to InternalServerError
            logger.error(
              { err: error, userId: authenticatedUser.id, assetId: id },
              "Similar assets search failed",
            );
            throw new InternalServerError(
              "Unable to find similar assets. Please try again.",
              { originalError: error },
            );
          }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          query: t.Object({
            limit: t.Optional(t.String()),
            scoreThreshold: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Vector Search"],
            summary: "Find similar assets",
            description:
              "Find assets similar to a given asset by ID. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Search NPCs
       */
      .post(
        "/npcs",
        async ({ body, user }) => {
          const { user: authenticatedUser } = { user } as { user: AuthUser };

          if (!process.env.QDRANT_URL) {
            throw new ServiceUnavailableError(
              "Vector Search",
              "Vector search is temporarily unavailable",
            );
          }

          try {
            const { query, limit = 10, scoreThreshold = 0.7 } = body;

            logger.info(
              { userId: authenticatedUser.id, query, collection: "npcs" },
              "User performing NPC search",
            );

            const { embedding } =
              await embeddingService.generateEmbedding(query);

            const results = await qdrantService.search({
              collection: "npcs",
              vector: embedding,
              limit,
              scoreThreshold,
            });

            if (results.length === 0) return { results: [] };

            const npcIds = results.map((r) => r.id);
            const npcsData = await db
              .select()
              .from(npcs)
              .where(inArray(npcs.id, npcIds));

            // Create map for O(1) lookup while preserving Qdrant score-based ordering
            const npcsMap = new Map(npcsData.map((n) => [n.id, n]));
            return {
              results: results.map((result) => ({
                score: result.score,
                npc: npcsMap.get(result.id),
              })),
            };
          } catch (error) {
            // Re-throw ApiErrors as-is
            if (
              error instanceof ServiceUnavailableError ||
              error instanceof BadRequestError ||
              error instanceof InternalServerError
            ) {
              throw error;
            }

            // Convert unknown errors to InternalServerError
            logger.error(
              { err: error, userId: authenticatedUser.id, query: body.query },
              "NPC search failed",
            );
            throw new InternalServerError(
              "Unable to complete search request. Please try again.",
              { originalError: error },
            );
          }
        },
        {
          body: t.Object({
            query: t.String({ minLength: 1 }),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            scoreThreshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
          }),
          detail: {
            tags: ["Vector Search"],
            summary: "Semantic search for NPCs",
            description:
              "Search NPC characters using natural language. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Search Quests
       */
      .post(
        "/quests",
        async ({ body, user }) => {
          const { user: authenticatedUser } = { user } as { user: AuthUser };

          if (!process.env.QDRANT_URL) {
            throw new ServiceUnavailableError(
              "Vector Search",
              "Vector search is temporarily unavailable",
            );
          }

          try {
            const { query, limit = 10, scoreThreshold = 0.7 } = body;

            logger.info(
              { userId: authenticatedUser.id, query, collection: "quests" },
              "User performing quest search",
            );

            const { embedding } =
              await embeddingService.generateEmbedding(query);

            const results = await qdrantService.search({
              collection: "quests",
              vector: embedding,
              limit,
              scoreThreshold,
            });

            if (results.length === 0) return { results: [] };

            const questIds = results.map((r) => r.id);
            const questsData = await db
              .select()
              .from(quests)
              .where(inArray(quests.id, questIds));

            // Create map for O(1) lookup while preserving Qdrant score-based ordering
            const questsMap = new Map(questsData.map((q) => [q.id, q]));
            return {
              results: results.map((result) => ({
                score: result.score,
                quest: questsMap.get(result.id),
              })),
            };
          } catch (error) {
            // Re-throw ApiErrors as-is
            if (
              error instanceof ServiceUnavailableError ||
              error instanceof BadRequestError ||
              error instanceof InternalServerError
            ) {
              throw error;
            }

            // Convert unknown errors to InternalServerError
            logger.error(
              { err: error, userId: authenticatedUser.id, query: body.query },
              "Quest search failed",
            );
            throw new InternalServerError(
              "Unable to complete search request. Please try again.",
              { originalError: error },
            );
          }
        },
        {
          body: t.Object({
            query: t.String({ minLength: 1 }),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            scoreThreshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
          }),
          detail: {
            tags: ["Vector Search"],
            summary: "Semantic search for quests",
            description:
              "Search game quests using natural language. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      /**
       * Search Lore
       */
      .post(
        "/lore",
        async ({ body, user }) => {
          const { user: authenticatedUser } = { user } as { user: AuthUser };

          if (!process.env.QDRANT_URL) {
            throw new ServiceUnavailableError(
              "Vector Search",
              "Vector search is temporarily unavailable",
            );
          }

          try {
            const { query, limit = 10, scoreThreshold = 0.7 } = body;

            logger.info(
              { userId: authenticatedUser.id, query, collection: "lore" },
              "User performing lore search",
            );

            const { embedding } =
              await embeddingService.generateEmbedding(query);

            const results = await qdrantService.search({
              collection: "lore",
              vector: embedding,
              limit,
              scoreThreshold,
            });

            if (results.length === 0) return { results: [] };

            const loreIds = results.map((r) => r.id);
            const loresData = await db
              .select()
              .from(lores)
              .where(inArray(lores.id, loreIds));

            // Create map for O(1) lookup while preserving Qdrant score-based ordering
            const loresMap = new Map(loresData.map((l) => [l.id, l]));
            return {
              results: results.map((result) => ({
                score: result.score,
                lore: loresMap.get(result.id),
              })),
            };
          } catch (error) {
            // Re-throw ApiErrors as-is
            if (
              error instanceof ServiceUnavailableError ||
              error instanceof BadRequestError ||
              error instanceof InternalServerError
            ) {
              throw error;
            }

            // Convert unknown errors to InternalServerError
            logger.error(
              { err: error, userId: authenticatedUser.id, query: body.query },
              "Lore search failed",
            );
            throw new InternalServerError(
              "Unable to complete search request. Please try again.",
              { originalError: error },
            );
          }
        },
        {
          body: t.Object({
            query: t.String({ minLength: 1 }),
            limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
            scoreThreshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
          }),
          detail: {
            tags: ["Vector Search"],
            summary: "Semantic search for lore",
            description:
              "Search game lore and world-building content using natural language. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
