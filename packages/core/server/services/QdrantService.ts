/**
 * Qdrant Service
 * Vector database operations for semantic search
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import type {
  QdrantFilter,
  QdrantPayload,
} from './types/vector';
import { EMBEDDING_CONFIG } from './types/vector';

export type CollectionName = "assets" | "npcs" | "quests" | "lore" | "dialogues";

export interface VectorSearchParams {
  collection: CollectionName;
  vector: number[];
  limit?: number;
  scoreThreshold?: number;
  filter?: QdrantFilter;
}

export interface VectorUpsertParams {
  collection: CollectionName;
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SimilaritySearchParams {
  collection: CollectionName;
  id: string;
  limit?: number;
  scoreThreshold?: number;
  filter?: QdrantFilter;
}

export interface SearchResultItem {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

/**
 * Qdrant Service
 * Manages vector database operations for semantic search
 */
export class QdrantService {
  private client: QdrantClient;
  private readonly VECTOR_SIZE = (EMBEDDING_CONFIG as typeof EMBEDDING_CONFIG).DIMENSIONS;
  private readonly DISTANCE = (EMBEDDING_CONFIG as typeof EMBEDDING_CONFIG).DISTANCE_METRIC;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;

    if (!qdrantUrl) {
      // Don't throw - just create a null client
      // This allows the server to start even if Qdrant is not configured
      console.warn("[QdrantService] QDRANT_URL not configured - vector search will not be available");
      this.client = null as any; // Will be checked before use
      return;
    }

    // Normalize URL - ensure it has a protocol
    let normalizedUrl = qdrantUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Default to http:// for Railway internal URLs or localhost
      normalizedUrl = `http://${normalizedUrl}`;
      console.log(`[QdrantService] Added http:// protocol to URL: ${normalizedUrl}`);
    }

    // Initialize Qdrant client
    this.client = new QdrantClient({
      url: normalizedUrl,
      apiKey: qdrantApiKey, // Optional - Railway Qdrant may not require API key
    });

    console.log(`[QdrantService] Initialized with URL: ${normalizedUrl}`);
  }

  /**
   * Check if Qdrant client is available
   */
  private isAvailable(): boolean {
    return this.client !== null && this.client !== undefined;
  }

  /**
   * Initialize all collections
   * Creates collections if they don't exist
   */
  async initializeCollections(): Promise<void> {
    if (!this.isAvailable()) {
      console.warn("[QdrantService] Client not available - skipping initialization");
      return;
    }

    const collections: CollectionName[] = [
      "assets",
      "npcs",
      "quests",
      "lore",
      "dialogues",
    ];

    console.log("[QdrantService] Initializing collections...");

    for (const collection of collections) {
      await this.ensureCollection(collection);
    }

    console.log("[QdrantService] All collections initialized");
  }

  /**
   * Ensure a collection exists, create if it doesn't
   */
  async ensureCollection(name: CollectionName): Promise<void> {
    try {
      // Check if collection exists
      const exists = await this.collectionExists(name);

      if (exists) {
        console.log(`[QdrantService] Collection '${name}' already exists`);
        return;
      }

      // Create collection
      await this.client.createCollection(name, {
        vectors: {
          size: this.VECTOR_SIZE,
          distance: this.DISTANCE,
        },
      });

      console.log(`[QdrantService] Created collection '${name}'`);

      // Create indexes for common payload fields
      await this.createPayloadIndexes(name);
    } catch (error) {
      console.error(`[QdrantService] Error ensuring collection '${name}':`, error);
      throw error;
    }
  }

  /**
   * Create payload indexes for filtering
   */
  private async createPayloadIndexes(collection: CollectionName): Promise<void> {
    try {
      // Common indexes for all collections
      await this.client.createPayloadIndex(collection, {
        field_name: "type",
        field_schema: "keyword",
      });

      // Collection-specific indexes
      if (collection === "assets") {
        await this.client.createPayloadIndex(collection, {
          field_name: "metadata.type",
          field_schema: "keyword",
        });
        await this.client.createPayloadIndex(collection, {
          field_name: "metadata.category",
          field_schema: "keyword",
        });
      } else if (collection === "npcs") {
        await this.client.createPayloadIndex(collection, {
          field_name: "archetype",
          field_schema: "keyword",
        });
      } else if (collection === "quests") {
        await this.client.createPayloadIndex(collection, {
          field_name: "questType",
          field_schema: "keyword",
        });
        await this.client.createPayloadIndex(collection, {
          field_name: "difficulty",
          field_schema: "keyword",
        });
      } else if (collection === "lore") {
        await this.client.createPayloadIndex(collection, {
          field_name: "category",
          field_schema: "keyword",
        });
      }

      console.log(`[QdrantService] Created payload indexes for '${collection}'`);
    } catch (error) {
      // Indexes might already exist, log but don't fail
      console.warn(`[QdrantService] Could not create some indexes for '${collection}'`);
    }
  }

  /**
   * Check if a collection exists
   */
  private async collectionExists(name: CollectionName): Promise<boolean> {
    try {
      await this.client.getCollection(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upsert a single vector point
   */
  async upsert(params: VectorUpsertParams): Promise<void> {
    const { collection, id, vector, payload } = params;

    try {
      await this.client.upsert(collection, {
        wait: true,
        points: [
          {
            id,
            vector,
            payload,
          },
        ],
      });

      console.log(`[QdrantService] Upserted point ${id} to '${collection}'`);
    } catch (error) {
      console.error(
        `[QdrantService] Error upserting to '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Upsert multiple vector points in batch
   */
  async upsertBatch(
    collection: CollectionName,
    points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>,
  ): Promise<void> {
    try {
      await this.client.upsert(collection, {
        wait: true,
        points: points.map((point) => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        })),
      });

      console.log(
        `[QdrantService] Batch upserted ${points.length} points to '${collection}'`,
      );
    } catch (error) {
      console.error(
        `[QdrantService] Error batch upserting to '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async search(params: VectorSearchParams): Promise<SearchResultItem[]> {
    const {
      collection,
      vector,
      limit = 10,
      scoreThreshold = 0.7,
      filter,
    } = params;

    try {
      const results = await this.client.search(collection, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        filter,
        with_payload: true,
      });

      return results.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as Record<string, unknown>,
      }));
    } catch (error) {
      console.error(`[QdrantService] Error searching '${collection}':`, error);
      throw error;
    }
  }

  /**
   * Find similar items to a given item by ID
   */
  async findSimilar(params: SimilaritySearchParams): Promise<SearchResultItem[]> {
    const { collection, id, limit = 10, scoreThreshold = 0.7, filter } = params;

    try {
      // First, get the vector for the given ID
      const point = await this.client.retrieve(collection, {
        ids: [id],
        with_payload: false,
        with_vector: true,
      });

      if (!point || point.length === 0) {
        throw new Error(`Point with ID ${id} not found in collection ${collection}`);
      }

      const vector = point[0].vector as number[];

      // Search for similar vectors, excluding the original
      const results = await this.client.search(collection, {
        vector,
        limit: limit + 1, // +1 to account for the item itself
        score_threshold: scoreThreshold,
        filter,
        with_payload: true,
      });

      // Filter out the original item and limit results
      return results
        .filter((result) => result.id !== id)
        .slice(0, limit)
        .map((result) => ({
          id: result.id as string,
          score: result.score,
          payload: result.payload as Record<string, unknown>,
        }));
    } catch (error) {
      console.error(
        `[QdrantService] Error finding similar in '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a point by ID
   */
  async delete(collection: CollectionName, id: string): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        points: [id],
      });

      console.log(`[QdrantService] Deleted point ${id} from '${collection}'`);
    } catch (error) {
      console.error(
        `[QdrantService] Error deleting from '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete multiple points by IDs
   */
  async deleteBatch(collection: CollectionName, ids: string[]): Promise<void> {
    try {
      await this.client.delete(collection, {
        wait: true,
        points: ids,
      });

      console.log(
        `[QdrantService] Deleted ${ids.length} points from '${collection}'`,
      );
    } catch (error) {
      console.error(
        `[QdrantService] Error batch deleting from '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(collection: CollectionName) {
    try {
      const info = await this.client.getCollection(collection);
      return info;
    } catch (error) {
      console.error(
        `[QdrantService] Error getting collection info for '${collection}':`,
        error,
      );
      throw error;
    }
  }

  /**
   * Count points in a collection
   */
  async count(collection: CollectionName): Promise<number> {
    try {
      const info = await this.client.getCollection(collection);
      return info.points_count || 0;
    } catch (error) {
      console.error(
        `[QdrantService] Error counting points in '${collection}':`,
        error,
      );
      return 0;
    }
  }

  /**
   * Health check - verify connection to Qdrant
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Try to list collections as a health check
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error("[QdrantService] Health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const qdrantService = new QdrantService();