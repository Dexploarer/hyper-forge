/**
 * Embedding Service
 * Generates vector embeddings for semantic search using Vercel AI SDK
 */

import { embed, embedMany } from "ai";
import { logger } from '../utils/logger';
import { createOpenAI } from "@ai-sdk/openai";
import type { Asset } from "../db/schema/assets.schema";
import type { NPC, Quest, Lore, Dialogue } from "../db/schema/content.schema";
import type { NPCData, QuestData, LoreData, DialogueNode } from "./ContentGenerationService";

/**
 * Embedding configuration
 * Using text-embedding-3-small with reduced dimensions for cost efficiency
 */
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 768; // Reduced from 1536 for cost/performance balance

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export interface BatchEmbeddingResult {
  embeddings: Array<{
    embedding: number[];
    text: string;
  }>;
}

/**
 * Embedding Service
 * Generates embeddings for various entity types using OpenAI embeddings
 */
export class EmbeddingService {
  private openai: ReturnType<typeof createOpenAI>;

  constructor() {
    // Initialize OpenAI client with AI Gateway if available
    const useAIGateway = !!process.env.AI_GATEWAY_API_KEY;
    const apiKey = useAIGateway
      ? process.env.AI_GATEWAY_API_KEY!
      : process.env.OPENAI_API_KEY!;

    if (!apiKey) {
      throw new Error(
        "AI_GATEWAY_API_KEY or OPENAI_API_KEY required for Embedding Service",
      );
    }

    this.openai = createOpenAI({
      apiKey,
      baseURL: useAIGateway
        ? "https://ai-gateway.vercel.sh/v1"
        : "https://api.openai.com/v1",
    });

    logger.info(
      `[EmbeddingService] Initialized with ${useAIGateway ? "AI Gateway" : "direct OpenAI"}`,
    );
  }

  /**
   * Generate embedding for a single text value
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const input = this.prepareText(text);

    const { embedding } = await embed({
      model: this.openai.textEmbeddingModel(EMBEDDING_MODEL),
      value: input,
      providerOptions: {
        openai: {
          dimensions: EMBEDDING_DIMENSIONS,
        },
      },
    });

    return {
      embedding,
      text: input,
    };
  }

  /**
   * Generate embeddings for multiple text values (batch)
   * More efficient than calling generateEmbedding multiple times
   */
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const inputs = texts.map((text) => this.prepareText(text));

    const { embeddings } = await embedMany({
      model: this.openai.textEmbeddingModel(EMBEDDING_MODEL),
      values: inputs,
      providerOptions: {
        openai: {
          dimensions: EMBEDDING_DIMENSIONS,
        },
      },
    });

    return {
      embeddings: embeddings.map((embedding, i) => ({
        embedding,
        text: inputs[i],
      })),
    };
  }

  /**
   * Prepare text for asset embedding
   * Combines relevant searchable fields into a single text
   */
  prepareAssetText(asset: Partial<Asset>): string {
    const parts: string[] = [];

    if (asset.name) parts.push(asset.name);
    if (asset.description) parts.push(asset.description);
    if (asset.type) parts.push(`type: ${asset.type}`);
    if (asset.subtype) parts.push(`subtype: ${asset.subtype}`);
    if (asset.category) parts.push(`category: ${asset.category}`);
    if (asset.tags && Array.isArray(asset.tags)) {
      parts.push(`tags: ${asset.tags.join(", ")}`);
    }
    if (asset.prompt) parts.push(asset.prompt);
    if (asset.detailedPrompt) parts.push(asset.detailedPrompt);

    return parts.join(" | ");
  }

  /**
   * Prepare text for NPC embedding
   */
  prepareNPCText(npc: Partial<NPC>): string {
    const parts: string[] = [];

    if (npc.name) parts.push(npc.name);
    if (npc.archetype) parts.push(`archetype: ${npc.archetype}`);

    // Extract data from JSONB field
    if (npc.data) {
      const data = npc.data as NPCData;
      if (data.personality?.traits) {
        parts.push(`personality: ${data.personality.traits.join(", ")}`);
      }
      if (data.personality?.background) {
        parts.push(data.personality.background);
      }
      if (data.personality?.motivations) {
        parts.push(`motivations: ${data.personality.motivations.join(", ")}`);
      }
      if (data.appearance?.description) {
        parts.push(data.appearance.description);
      }
      if (data.behavior?.role) {
        parts.push(`role: ${data.behavior.role}`);
      }
    }

    if (npc.tags && Array.isArray(npc.tags)) {
      parts.push(`tags: ${npc.tags.join(", ")}`);
    }

    return parts.join(" | ");
  }

  /**
   * Prepare text for Quest embedding
   */
  prepareQuestText(quest: Partial<Quest>): string {
    const parts: string[] = [];

    if (quest.title) parts.push(quest.title);
    if (quest.questType) parts.push(`type: ${quest.questType}`);
    if (quest.difficulty) parts.push(`difficulty: ${quest.difficulty}`);

    // Extract data from JSONB field
    if (quest.data) {
      const data = quest.data as QuestData;
      if (data.description) parts.push(data.description);
      if (data.story) parts.push(data.story);
      if (data.objectives) {
        const objectives = data.objectives
          .map((obj) => obj.description)
          .join(", ");
        parts.push(`objectives: ${objectives}`);
      }
      if (data.location) parts.push(`location: ${data.location}`);
    }

    if (quest.tags && Array.isArray(quest.tags)) {
      parts.push(`tags: ${quest.tags.join(", ")}`);
    }

    return parts.join(" | ");
  }

  /**
   * Prepare text for Lore embedding
   */
  prepareLoreText(lore: Partial<Lore>): string {
    const parts: string[] = [];

    if (lore.title) parts.push(lore.title);
    if (lore.category) parts.push(`category: ${lore.category}`);
    if (lore.summary) parts.push(lore.summary);

    // Extract data from JSONB field
    if (lore.data) {
      const data = lore.data as LoreData;
      if (data.content) parts.push(data.content);
      if (data.timeline) parts.push(`timeline: ${data.timeline}`);
      if (data.characters) {
        parts.push(`characters: ${data.characters.join(", ")}`);
      }
    }

    if (lore.tags && Array.isArray(lore.tags)) {
      parts.push(`tags: ${lore.tags.join(", ")}`);
    }

    return parts.join(" | ");
  }

  /**
   * Prepare text for Dialogue embedding
   */
  prepareDialogueText(dialogue: Partial<Dialogue>): string {
    const parts: string[] = [];

    if (dialogue.npcName) parts.push(`NPC: ${dialogue.npcName}`);
    if (dialogue.context) parts.push(dialogue.context);

    // Extract dialogue nodes from JSONB
    if (dialogue.nodes) {
      const nodes = dialogue.nodes as DialogueNode[];
      const dialogueTexts = nodes.map((node) => node.text).join(" ");
      parts.push(dialogueTexts);
    }

    return parts.join(" | ");
  }

  /**
   * Clean and prepare text for embedding
   * Removes excessive whitespace and normalizes
   */
  private prepareText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .slice(0, 8000); // Limit to 8000 characters (well below token limit)
  }

  /**
   * Get embedding model info
   */
  getModelInfo() {
    return {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      provider: "openai",
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
