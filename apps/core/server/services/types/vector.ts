/**
 * Vector Search Type Definitions
 * Shared types for Qdrant vector database integration
 */

/**
 * Qdrant filter for vector search
 * Supports must/should/must_not conditions with field matching
 */
export interface QdrantFilter {
  must?: QdrantCondition[];
  should?: QdrantCondition[];
  must_not?: QdrantCondition[];
}

export interface QdrantCondition {
  key: string;
  match?: {
    value: string | number | boolean;
  };
  range?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}

/**
 * Base payload structure for all Qdrant collections
 */
export interface BaseQdrantPayload {
  /** Entity type identifier */
  type: string;
  /** Metadata for filtering and display */
  metadata: Record<string, unknown>;
}

/**
 * Asset payload stored in Qdrant
 */
export interface AssetPayload extends BaseQdrantPayload {
  type: 'asset';
  name: string;
  assetType: string;
  category: string | null;
  tags: string[];
  metadata: {
    description: string | null;
    subtype: string | null;
    status: string;
    createdAt: string | null;
  };
}

/**
 * NPC payload stored in Qdrant
 */
export interface NPCPayload extends BaseQdrantPayload {
  type: 'npc';
  name: string;
  archetype: string;
  tags: string[];
  metadata: {
    createdBy: string | null;
    createdAt: string | null;
  };
}

/**
 * Quest payload stored in Qdrant
 */
export interface QuestPayload extends BaseQdrantPayload {
  type: 'quest';
  title: string;
  questType: string;
  difficulty: string;
  tags: string[];
  metadata: {
    createdBy: string | null;
    createdAt: string | null;
  };
}

/**
 * Lore payload stored in Qdrant
 */
export interface LorePayload extends BaseQdrantPayload {
  type: 'lore';
  title: string;
  category: string;
  summary: string;
  tags: string[];
  metadata: {
    createdBy: string | null;
    createdAt: string | null;
  };
}

/**
 * Dialogue payload stored in Qdrant
 */
export interface DialoguePayload extends BaseQdrantPayload {
  type: 'dialogue';
  npcName: string;
  context: string | null;
  metadata: {
    createdBy: string | null;
    createdAt: string | null;
  };
}

/**
 * Union type of all possible payloads
 */
export type QdrantPayload =
  | AssetPayload
  | NPCPayload
  | QuestPayload
  | LorePayload
  | DialoguePayload;

/**
 * Embedding model configuration constants
 */
export const EMBEDDING_CONFIG = {
  MODEL: 'text-embedding-3-small' as const,
  DIMENSIONS: 768,
  PROVIDER: 'openai' as const,
  DISTANCE_METRIC: 'Cosine' as const,
} as const;
