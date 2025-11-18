/**
 * World Knowledge Service
 * Provides comprehensive world context and knowledge management for AI agents and users
 *
 * This service aggregates data from multiple sources to give a holistic view of the game world,
 * enabling AI agents to build contextually-aware content and users to understand their world.
 */

import { ContentDatabaseService } from "./ContentDatabaseService";
import { RelationshipService } from "./RelationshipService";
import { WorldConfigService } from "./WorldConfigService";
import { logger } from "../utils/logger";
import type {
  NPC,
  Quest,
  Lore,
  Dialogue,
  Location,
} from "../db/schema/content.schema";
import type { WorldConfiguration } from "../db/schema/world-config.schema";
import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  npcs,
  quests,
  lores,
  dialogues,
  locations,
} from "../db/schema/content.schema";

// JSONB data interfaces for type safety
interface NPCData {
  personality?: {
    traits?: string[];
  };
  [key: string]: unknown;
}

interface QuestData {
  description?: string;
  [key: string]: unknown;
}

interface LoreData {
  content?: string;
  [key: string]: unknown;
}

interface LocationData {
  description?: string;
  [key: string]: unknown;
}

export interface EntityRelationshipData {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: string | null;
}

export interface RelationshipConnection {
  relationship: string;
  strength: string;
  depth: number;
  target: {
    id: string;
    type: string;
    name: string;
    summary?: string;
    connections: RelationshipConnection[];
  };
}

export interface ConsistencyIssue {
  id: string;
  severity: "error" | "warning" | "info";
  type: string;
  message: string;
  entityId?: string;
  entityType?: string;
  suggestions: Array<{
    action: string;
    description: string;
    targetId?: string;
  }>;
}

// Simple in-memory cache with TTL
class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances
const worldContextCache = new SimpleCache<WorldContext>();
const relationshipGraphCache = new SimpleCache<RelationshipGraph>();

export interface WorldStats {
  totalNPCs: number;
  totalQuests: number;
  totalLore: number;
  totalDialogues: number;
  totalLocations: number;
}

export interface EntitySummary {
  id: string;
  name: string;
  type: string;
  summary?: string;
  tags?: string[];
  relationshipCount?: number;
  archetype?: string;
}

export interface RelationshipNode {
  id: string;
  type: string;
  name: string;
}

export interface RelationshipEdge {
  source: string;
  target: string;
  type: string;
  strength: string;
}

export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

export interface StyleGuide {
  commonThemes: string[];
  namingConventions: string[];
  tone: string;
  avoidTopics: string[];
}

export interface WorldSuggestions {
  missingContent: string[];
  weakConnections: string[];
  opportunities: string[];
}

export interface WorldContext {
  stats: WorldStats;
  worldConfig: WorldConfiguration | null;
  entities: {
    npcs: EntitySummary[];
    quests: EntitySummary[];
    lore: EntitySummary[];
    locations: EntitySummary[];
  };
  relationshipGraph?: RelationshipGraph;
  styleGuide: StyleGuide;
  suggestions?: WorldSuggestions;
}

export interface SearchFacets {
  byType: Record<string, number>;
  byTag: Record<string, number>;
  byArchetype?: Record<string, number>;
}

export interface SearchResults {
  results: Array<{
    id: string;
    type: string;
    name: string;
    archetype?: string;
    summary?: string;
    relevanceScore: number;
    matchedFields: string[];
    relationshipCount?: number;
    tags?: string[];
  }>;
  totalResults: number;
  facets: SearchFacets;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class WorldKnowledgeService {
  private contentDb: ContentDatabaseService;
  private relationshipService: RelationshipService;
  private worldConfig: WorldConfigService;

  constructor() {
    this.contentDb = new ContentDatabaseService();
    this.relationshipService = new RelationshipService();
    this.worldConfig = new WorldConfigService();
  }

  /**
   * Get complete world context
   * Aggregates stats, entities, relationships, and style guide
   */
  async getWorldContext(options: {
    userId: string;
    includeRelationships?: boolean;
    includeFullData?: boolean;
    maxEntities?: number;
    format?: "summary" | "detailed" | "llm-optimized";
  }): Promise<WorldContext> {
    const cacheKey = `world:context:${options.userId}:${options.format || "summary"}`;

    // Check cache
    const cached = worldContextCache.get(cacheKey);
    if (cached) {
      logger.info({ userId: options.userId }, "Returning cached world context");
      return cached;
    }

    logger.info({ userId: options.userId }, "Building world context");

    // Get all data in parallel
    const [stats, worldConfigData, entities] = await Promise.all([
      this.getWorldStats(options.userId),
      this.worldConfig.getActiveConfiguration(),
      this.getAllEntities({
        userId: options.userId,
        limit: options.maxEntities || 1000,
        includeFullData: options.includeFullData || false,
      }),
    ]);

    // Get relationship graph if requested
    let relationshipGraph: RelationshipGraph | undefined;
    if (options.includeRelationships !== false) {
      relationshipGraph = await this.buildRelationshipGraph(
        entities,
        options.userId,
      );
    }

    // Extract style guide from existing content
    const styleGuide = this.extractStyleGuide(entities, worldConfigData);

    // Generate suggestions
    const suggestions = this.generateSuggestions(entities, relationshipGraph);

    const context: WorldContext = {
      stats,
      worldConfig: worldConfigData,
      entities,
      relationshipGraph,
      styleGuide,
      suggestions,
    };

    // Cache for 5 minutes
    worldContextCache.set(cacheKey, context, 300);

    return context;
  }

  /**
   * Get world statistics
   */
  private async getWorldStats(userId: string): Promise<WorldStats> {
    try {
      // Use SQL COUNT for performance instead of loading all records
      const [npcCount, questCount, loreCount, dialogueCount, locationCount] =
        await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(npcs)
            .then((result) => result[0]?.count ?? 0),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(quests)
            .then((result) => result[0]?.count ?? 0),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lores)
            .then((result) => result[0]?.count ?? 0),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(dialogues)
            .then((result) => result[0]?.count ?? 0),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(locations)
            .then((result) => result[0]?.count ?? 0),
        ]);

      return {
        totalNPCs: npcCount,
        totalQuests: questCount,
        totalLore: loreCount,
        totalDialogues: dialogueCount,
        totalLocations: locationCount,
      };
    } catch (error) {
      logger.error(
        { error, userId },
        "Failed to get world stats, returning zeros",
      );
      return {
        totalNPCs: 0,
        totalQuests: 0,
        totalLore: 0,
        totalDialogues: 0,
        totalLocations: 0,
      };
    }
  }

  /**
   * Get all entities (condensed)
   */
  private async getAllEntities(options: {
    userId: string;
    limit: number;
    includeFullData: boolean;
  }): Promise<{
    npcs: EntitySummary[];
    quests: EntitySummary[];
    lore: EntitySummary[];
    locations: EntitySummary[];
  }> {
    const [npcs, quests, lore, locations] = await Promise.all([
      this.contentDb.listNPCs(options.limit, 0),
      this.contentDb.listQuests(options.limit, 0),
      this.contentDb.listLores(options.limit, 0),
      this.contentDb.listLocations(options.limit, 0),
    ]);

    return {
      npcs: npcs.map((npc: NPC) =>
        this.summarizeNPC(npc, options.includeFullData),
      ),
      quests: quests.map((quest: Quest) =>
        this.summarizeQuest(quest, options.includeFullData),
      ),
      lore: lore.map((l: Lore) =>
        this.summarizeLore(l, options.includeFullData),
      ),
      locations: locations.map((loc: Location) =>
        this.summarizeLocation(loc, options.includeFullData),
      ),
    };
  }

  /**
   * Summarize NPC for context
   */
  private summarizeNPC(npc: NPC, includeFull: boolean): EntitySummary {
    const data = npc.data as NPCData;
    return {
      id: npc.id,
      name: npc.name,
      type: "npc",
      archetype: npc.archetype,
      summary: includeFull
        ? JSON.stringify(data)
        : data?.personality?.traits?.slice(0, 3).join(", ") || "No description",
      tags: npc.tags || [],
      relationshipCount: 0, // Will be populated if relationships are included
    };
  }

  /**
   * Summarize Quest for context
   */
  private summarizeQuest(quest: Quest, includeFull: boolean): EntitySummary {
    const data = quest.data as QuestData;
    return {
      id: quest.id,
      name: quest.title,
      type: "quest",
      summary: includeFull
        ? JSON.stringify(data)
        : data?.description?.slice(0, 100) || "No description",
      tags: quest.tags || [],
    };
  }

  /**
   * Summarize Lore for context
   */
  private summarizeLore(lore: Lore, includeFull: boolean): EntitySummary {
    const data = lore.data as LoreData;
    return {
      id: lore.id,
      name: lore.title,
      type: "lore",
      summary: includeFull
        ? JSON.stringify(data)
        : data?.content?.slice(0, 100) || "No description",
      tags: lore.tags || [],
    };
  }

  /**
   * Summarize Location for context
   */
  private summarizeLocation(
    location: Location,
    includeFull: boolean,
  ): EntitySummary {
    const data = location.data as LocationData;
    return {
      id: location.id,
      name: location.name,
      type: "location",
      summary: includeFull
        ? JSON.stringify(data)
        : data?.description?.slice(0, 100) || "No description",
      tags: location.tags || [],
    };
  }

  /**
   * Build relationship graph from entities
   */
  private async buildRelationshipGraph(
    entities: {
      npcs: EntitySummary[];
      quests: EntitySummary[];
      lore: EntitySummary[];
      locations: EntitySummary[];
    },
    userId: string,
  ): Promise<RelationshipGraph> {
    // Get all entities with their types
    const allEntities = [
      ...entities.npcs,
      ...entities.quests,
      ...entities.lore,
      ...entities.locations,
    ];

    // Get relationships for all entities
    const allRelationships = await Promise.all(
      allEntities.map((entity: EntitySummary) =>
        this.relationshipService
          .getRelationships(entity.type as any, entity.id)
          .catch(() => []),
      ),
    );

    // Build nodes map
    const nodesMap = new Map<string, RelationshipNode>();
    [
      ...entities.npcs,
      ...entities.quests,
      ...entities.lore,
      ...entities.locations,
    ].forEach((entity: EntitySummary) => {
      nodesMap.set(entity.id, {
        id: entity.id,
        type: entity.type,
        name: entity.name,
      });
    });

    // Build edges
    const edges: RelationshipEdge[] = [];
    allRelationships.flat().forEach((rel: EntityRelationshipData) => {
      if (rel) {
        edges.push({
          source: rel.sourceId,
          target: rel.targetId,
          type: rel.relationshipType,
          strength: rel.strength || "medium",
        });
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
    };
  }

  /**
   * Extract style guide from existing content
   */
  private extractStyleGuide(
    entities: {
      npcs: EntitySummary[];
      quests: EntitySummary[];
      lore: EntitySummary[];
      locations: EntitySummary[];
    },
    worldConfig: WorldConfiguration | null,
  ): StyleGuide {
    // Extract common themes from tags
    const allTags = [
      ...entities.npcs.flatMap((e: EntitySummary) => e.tags || []),
      ...entities.quests.flatMap((e: EntitySummary) => e.tags || []),
      ...entities.lore.flatMap((e: EntitySummary) => e.tags || []),
    ];

    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const commonThemes = Object.entries(tagCounts)
      .sort(([, a], [, b]): number => (b as number) - (a as number))
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      commonThemes,
      namingConventions: worldConfig?.genre ? [worldConfig.genre] : ["Fantasy"],
      tone:
        (
          worldConfig?.aiPreferences as {
            toneAndStyle?: { narrative?: string };
          }
        )?.toneAndStyle?.narrative || "Epic Adventure",
      avoidTopics: [],
    };
  }

  /**
   * Generate suggestions for world improvement
   */
  private generateSuggestions(
    entities: {
      npcs: EntitySummary[];
      quests: EntitySummary[];
      lore: EntitySummary[];
      locations: EntitySummary[];
    },
    relationshipGraph?: RelationshipGraph,
  ): WorldSuggestions {
    const suggestions: WorldSuggestions = {
      missingContent: [],
      weakConnections: [],
      opportunities: [],
    };

    // Check for archetype diversity
    const archetypes = entities.npcs.map((npc: EntitySummary) => npc.archetype);
    const uniqueArchetypes = new Set(archetypes);

    if (uniqueArchetypes.size < 5 && entities.npcs.length > 5) {
      suggestions.missingContent.push(
        "Consider adding more diverse NPC archetypes",
      );
    }

    // Check for quests without NPCs
    if (entities.quests.length > 0 && entities.npcs.length === 0) {
      suggestions.missingContent.push(
        "Add NPCs to give quests and interact with players",
      );
    }

    // Check for weak connections
    if (relationshipGraph) {
      const entitiesWithNoConnections = relationshipGraph.nodes.filter(
        (node) =>
          !relationshipGraph.edges.some(
            (edge) => edge.source === node.id || edge.target === node.id,
          ),
      );

      if (entitiesWithNoConnections.length > 0) {
        suggestions.weakConnections.push(
          `${entitiesWithNoConnections.length} entities have no relationships`,
        );
      }
    }

    // Opportunities
    if (entities.lore.length < entities.npcs.length / 2) {
      suggestions.opportunities.push(
        "Create lore entries to add depth to your world",
      );
    }

    return suggestions;
  }

  /**
   * Search entities with filters
   */
  async searchEntities(options: {
    userId: string;
    q?: string;
    type?: string;
    tags?: string[];
    archetype?: string;
    difficulty?: string;
    semantic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<SearchResults> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get all entities
    const entities = await this.getAllEntities({
      userId: options.userId,
      limit: 10000,
      includeFullData: false,
    });

    // Flatten all entities
    let allEntities: EntitySummary[] = [];
    if (!options.type || options.type === "all" || options.type === "npc") {
      allEntities.push(...entities.npcs);
    }
    if (!options.type || options.type === "all" || options.type === "quest") {
      allEntities.push(...entities.quests);
    }
    if (!options.type || options.type === "all" || options.type === "lore") {
      allEntities.push(...entities.lore);
    }
    if (
      !options.type ||
      options.type === "all" ||
      options.type === "location"
    ) {
      allEntities.push(...entities.locations);
    }

    // Filter by text query
    if (options.q) {
      const query = options.q.toLowerCase();
      allEntities = allEntities.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.summary?.toLowerCase().includes(query) ||
          e.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      allEntities = allEntities.filter((e) =>
        options.tags!.some((tag) => e.tags?.includes(tag)),
      );
    }

    // Filter by archetype
    if (options.archetype) {
      allEntities = allEntities.filter(
        (e) => e.archetype === options.archetype,
      );
    }

    // Build facets
    const facets = this.buildFacets(allEntities);

    // Paginate
    const paginatedResults = allEntities.slice(offset, offset + limit);

    return {
      results: paginatedResults.map((e) => ({
        id: e.id,
        type: e.type,
        name: e.name,
        archetype: e.archetype,
        summary: e.summary,
        relevanceScore: 1.0, // Simple search, all matches are equally relevant
        matchedFields: this.getMatchedFields(e, options.q),
        relationshipCount: e.relationshipCount,
        tags: e.tags,
      })),
      totalResults: allEntities.length,
      facets,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < allEntities.length,
      },
    };
  }

  /**
   * Build search facets
   */
  private buildFacets(entities: EntitySummary[]): SearchFacets {
    const byType: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    const byArchetype: Record<string, number> = {};

    entities.forEach((entity) => {
      // Type facet
      byType[entity.type] = (byType[entity.type] || 0) + 1;

      // Tag facets
      entity.tags?.forEach((tag) => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });

      // Archetype facet
      if (entity.archetype) {
        byArchetype[entity.archetype] =
          (byArchetype[entity.archetype] || 0) + 1;
      }
    });

    return { byType, byTag, byArchetype };
  }

  /**
   * Get matched fields for search result
   */
  private getMatchedFields(entity: EntitySummary, query?: string): string[] {
    if (!query) return ["name"];

    const matched: string[] = [];
    const q = query.toLowerCase();

    if (entity.name.toLowerCase().includes(q)) matched.push("name");
    if (entity.summary?.toLowerCase().includes(q)) matched.push("summary");
    if (entity.tags?.some((tag) => tag.toLowerCase().includes(q)))
      matched.push("tags");
    if (entity.archetype?.toLowerCase().includes(q)) matched.push("archetype");

    return matched.length > 0 ? matched : ["name"];
  }

  /**
   * Build LLM-optimized context for content generation
   */
  async buildGenerationContext(params: {
    userId: string;
    intent:
      | "generate_npc"
      | "generate_quest"
      | "generate_lore"
      | "expand_world";
    theme?: string;
    relatedEntityIds?: string[];
  }): Promise<{
    worldSummary: string;
    relevantNPCs: EntitySummary[];
    relevantQuests: EntitySummary[];
    relevantLore: EntitySummary[];
    styleGuide: StyleGuide;
    constraints: {
      avoidDuplicates: string[];
      fillGaps: string[];
      maintainConsistency: string[];
    };
    systemPrompt: string;
    contextWindow: string;
    tokenEstimate: number;
    compressionLevel: "low" | "medium" | "high";
  }> {
    const context = await this.getWorldContext({
      userId: params.userId,
      includeRelationships: true,
      includeFullData: false,
      maxEntities: 1000,
      format: "summary",
    });

    let relevantNPCs = context.entities.npcs;
    let relevantQuests = context.entities.quests;
    let relevantLore = context.entities.lore;

    if (params.theme) {
      const themeQuery = params.theme.toLowerCase();
      relevantNPCs = relevantNPCs.filter(
        (npc) =>
          npc.tags?.some((tag) => tag.toLowerCase().includes(themeQuery)) ||
          npc.summary?.toLowerCase().includes(themeQuery),
      );
      relevantQuests = relevantQuests.filter(
        (quest) =>
          quest.tags?.some((tag) => tag.toLowerCase().includes(themeQuery)) ||
          quest.summary?.toLowerCase().includes(themeQuery),
      );
      relevantLore = relevantLore.filter(
        (lore) =>
          lore.tags?.some((tag) => tag.toLowerCase().includes(themeQuery)) ||
          lore.summary?.toLowerCase().includes(themeQuery),
      );
    }

    if (params.relatedEntityIds && params.relatedEntityIds.length > 0) {
      const relatedIds = new Set(params.relatedEntityIds);
      relevantNPCs = relevantNPCs.filter((npc) => relatedIds.has(npc.id));
      relevantQuests = relevantQuests.filter((quest) =>
        relatedIds.has(quest.id),
      );
      relevantLore = relevantLore.filter((lore) => relatedIds.has(lore.id));
    }

    const worldSummary = this.buildWorldSummary(context);
    const constraints = this.identifyConstraints(context, params.intent);
    const systemPrompt = this.buildSystemPrompt(
      worldSummary,
      context.styleGuide,
      params.intent,
    );
    const contextWindow = this.buildContextWindow({
      npcs: relevantNPCs,
      quests: relevantQuests,
      lore: relevantLore,
    });

    const fullText = systemPrompt + contextWindow;
    const tokenEstimate = Math.ceil(fullText.length / 4);

    return {
      worldSummary,
      relevantNPCs,
      relevantQuests,
      relevantLore,
      styleGuide: context.styleGuide,
      constraints,
      systemPrompt,
      contextWindow,
      tokenEstimate,
      compressionLevel:
        tokenEstimate > 2000 ? "high" : tokenEstimate > 1000 ? "medium" : "low",
    };
  }

  private buildWorldSummary(context: WorldContext): string {
    const { stats, worldConfig, styleGuide } = context;

    return `WORLD: ${worldConfig?.name || "Unnamed World"}
THEME: ${worldConfig?.genre || "Generic Fantasy"}
TONE: ${styleGuide.tone}
STATS: ${stats.totalNPCs} NPCs, ${stats.totalQuests} Quests, ${stats.totalLore} Lore entries
COMMON THEMES: ${styleGuide.commonThemes.slice(0, 5).join(", ")}
NAMING STYLE: ${styleGuide.namingConventions.join(", ")}`.trim();
  }

  private identifyConstraints(
    context: WorldContext,
    intent: string,
  ): {
    avoidDuplicates: string[];
    fillGaps: string[];
    maintainConsistency: string[];
  } {
    const constraints = {
      avoidDuplicates: [] as string[],
      fillGaps: [] as string[],
      maintainConsistency: [] as string[],
    };

    if (intent === "generate_npc") {
      const archetypeCounts = context.entities.npcs.reduce(
        (acc, npc) => {
          if (npc.archetype) {
            acc[npc.archetype] = (acc[npc.archetype] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      Object.entries(archetypeCounts).forEach(([archetype, count]) => {
        if (count >= 5) {
          constraints.avoidDuplicates.push(
            `Already have ${count} ${archetype} NPCs`,
          );
        }
      });
    }

    if (context.stats.totalNPCs > 10 && context.stats.totalLore < 5) {
      constraints.fillGaps.push("World needs more lore entries for depth");
    }

    if (context.worldConfig?.genre) {
      constraints.maintainConsistency.push(
        `Maintain ${context.worldConfig.genre} theme`,
      );
    }

    return constraints;
  }

  private buildSystemPrompt(
    summary: string,
    styleGuide: StyleGuide,
    intent: string,
  ): string {
    return `You are creating content for a game world.

${summary}

STYLE GUIDE:
- Tone: ${styleGuide.tone}
- Common Themes: ${styleGuide.commonThemes.join(", ")}
- Naming: ${styleGuide.namingConventions.join(", ")}

INTENT: ${intent}

Generate content that fits seamlessly into this world.`;
  }

  private buildContextWindow(entities: {
    npcs: EntitySummary[];
    quests: EntitySummary[];
    lore: EntitySummary[];
  }): string {
    let context = "";

    if (entities.npcs.length > 0) {
      context += "\n\nEXISTING NPCs:\n";
      context += entities.npcs
        .slice(0, 10)
        .map(
          (npc) =>
            `- ${npc.name} (${npc.archetype}): ${npc.summary?.slice(0, 100)}`,
        )
        .join("\n");
    }

    if (entities.quests.length > 0) {
      context += "\n\nEXISTING QUESTS:\n";
      context += entities.quests
        .slice(0, 5)
        .map((quest) => `- ${quest.name}: ${quest.summary?.slice(0, 100)}`)
        .join("\n");
    }

    if (entities.lore.length > 0) {
      context += "\n\nEXISTING LORE:\n";
      context += entities.lore
        .slice(0, 5)
        .map((lore) => `- ${lore.name}: ${lore.summary?.slice(0, 100)}`)
        .join("\n");
    }

    return context;
  }

  /**
   * Find similar entities using text matching
   */
  async findSimilarEntities(options: {
    entityType: string;
    entityId: string;
    userId: string;
    limit?: number;
    threshold?: number;
  }): Promise<
    Array<{
      id: string;
      type: string;
      name: string;
      archetype?: string;
      similarity: number;
      sharedThemes: string[];
      suggestedRelationships: string[];
      reason: string;
    }>
  > {
    const context = await this.getWorldContext({
      userId: options.userId,
      includeRelationships: false,
      includeFullData: false,
      maxEntities: 1000,
      format: "summary",
    });

    const allEntities = [
      ...context.entities.npcs,
      ...context.entities.quests,
      ...context.entities.lore,
      ...context.entities.locations,
    ];

    const sourceEntity = allEntities.find((e) => e.id === options.entityId);

    if (!sourceEntity) {
      throw new Error("Source entity not found");
    }

    const sameTypeEntities = allEntities.filter(
      (e) => e.type === options.entityType && e.id !== options.entityId,
    );

    const similarEntities = sameTypeEntities.map((entity) => {
      const sharedTags = (sourceEntity.tags || []).filter((tag) =>
        entity.tags?.includes(tag),
      );

      const nameSimilarity = this.calculateStringSimilarity(
        sourceEntity.name.toLowerCase(),
        entity.name.toLowerCase(),
      );

      const tagSimilarity =
        sharedTags.length /
        Math.max(sourceEntity.tags?.length || 1, entity.tags?.length || 1);

      const similarity = nameSimilarity * 0.3 + tagSimilarity * 0.7;

      return {
        id: entity.id,
        type: entity.type,
        name: entity.name,
        archetype: entity.archetype,
        similarity,
        sharedThemes: sharedTags,
        suggestedRelationships: this.suggestRelationships(sourceEntity, entity),
        reason: this.getSimilarityReason(
          nameSimilarity,
          tagSimilarity,
          sharedTags,
        ),
      };
    });

    return similarEntities
      .filter((e) => e.similarity >= (options.threshold || 0.7))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit || 10);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private suggestRelationships(
    entity1: EntitySummary,
    entity2: EntitySummary,
  ): string[] {
    const suggestions: string[] = [];

    if (entity1.type === "npc" && entity2.type === "npc") {
      suggestions.push("could_be_allies", "could_be_rivals");
    }

    if (entity1.type === "npc" && entity2.type === "quest") {
      suggestions.push("gives_quest", "involved_in_quest");
    }

    return suggestions;
  }

  private getSimilarityReason(
    nameSim: number,
    tagSim: number,
    sharedTags: string[],
  ): string {
    if (nameSim > 0.8) {
      return `Very similar names (${Math.round(nameSim * 100)}% match)`;
    }

    if (tagSim > 0.7) {
      return `Shared themes: ${sharedTags.join(", ")}`;
    }

    return "Similar characteristics";
  }

  /**
   * Get relationship graph starting from an entity
   */
  async getRelationshipGraph(options: {
    entityId: string;
    userId: string;
    depth: number;
    relationshipTypes?: string[];
  }): Promise<{
    centerNode: {
      id: string;
      type: string;
      name: string;
      summary?: string;
    };
    connections: RelationshipConnection[];
    stats: {
      totalNodes: number;
      maxDepth: number;
      relationshipTypes: string[];
    };
  }> {
    const context = await this.getWorldContext({
      userId: options.userId,
      includeRelationships: true,
      includeFullData: false,
      maxEntities: 1000,
      format: "summary",
    });

    const allEntities = [
      ...context.entities.npcs,
      ...context.entities.quests,
      ...context.entities.lore,
      ...context.entities.locations,
    ];

    const centerEntity = allEntities.find((e) => e.id === options.entityId);

    if (!centerEntity) {
      throw new Error("Entity not found");
    }

    const visited = new Set<string>();
    const connections = await this.traverseRelationships(
      options.entityId,
      options.userId,
      options.depth,
      1,
      visited,
      options.relationshipTypes,
      allEntities,
    );

    const relationshipTypes = new Set<string>();
    const countNodes = (conns: RelationshipConnection[]): number => {
      let count = conns.length;
      conns.forEach((conn) => {
        if (conn.relationship) relationshipTypes.add(conn.relationship);
        if (conn.target.connections) {
          count += countNodes(conn.target.connections);
        }
      });
      return count;
    };

    const totalNodes = 1 + countNodes(connections);

    return {
      centerNode: {
        id: centerEntity.id,
        type: centerEntity.type,
        name: centerEntity.name,
        summary: centerEntity.summary,
      },
      connections,
      stats: {
        totalNodes,
        maxDepth: options.depth,
        relationshipTypes: Array.from(relationshipTypes),
      },
    };
  }

  private async traverseRelationships(
    entityId: string,
    userId: string,
    maxDepth: number,
    currentDepth: number,
    visited: Set<string>,
    filterTypes?: string[],
    allEntities: EntitySummary[] = [],
  ): Promise<RelationshipConnection[]> {
    if (currentDepth > maxDepth || visited.has(entityId)) {
      return [];
    }

    visited.add(entityId);

    // Find entity type from allEntities
    const entity = allEntities.find((e) => e.id === entityId);
    if (!entity) return [];

    const relationships = await this.relationshipService
      .getRelationships(entity.type as any, entityId)
      .catch(() => []);

    const filteredRelationships = filterTypes
      ? relationships.filter((rel) =>
          filterTypes.includes(rel.relationshipType),
        )
      : relationships;

    const connections = await Promise.all(
      filteredRelationships.map(async (rel) => {
        const targetId = rel.targetId;
        const targetEntity = allEntities.find((e) => e.id === targetId);

        if (!targetEntity) return null;

        const nestedConnections =
          currentDepth < maxDepth
            ? await this.traverseRelationships(
                targetId,
                userId,
                maxDepth,
                currentDepth + 1,
                visited,
                filterTypes,
                allEntities,
              )
            : [];

        return {
          relationship: rel.relationshipType,
          strength: rel.strength || "medium",
          depth: currentDepth,
          target: {
            id: targetEntity.id,
            type: targetEntity.type,
            name: targetEntity.name,
            summary: targetEntity.summary,
            connections: nestedConnections,
          },
        };
      }),
    );

    return connections.filter((c) => c !== null);
  }

  /**
   * Export complete world snapshot
   */
  async exportWorldSnapshot(options: {
    userId: string;
    includeAssets?: boolean;
  }): Promise<{
    version: string;
    worldId: string;
    worldName: string;
    exportedAt: string;
    worldConfig: WorldConfiguration | null;
    entities: {
      npcs: EntitySummary[];
      quests: EntitySummary[];
      lore: EntitySummary[];
      locations: EntitySummary[];
    };
    relationships: EntityRelationshipData[];
    stats: WorldStats;
  }> {
    logger.info({ userId: options.userId }, "Exporting world snapshot");

    const context = await this.getWorldContext({
      userId: options.userId,
      includeRelationships: true,
      includeFullData: true,
      maxEntities: 100000,
      format: "detailed",
    });

    const allEntityIds = [
      ...context.entities.npcs.map((e) => e.id),
      ...context.entities.quests.map((e) => e.id),
      ...context.entities.lore.map((e) => e.id),
      ...context.entities.locations.map((e) => e.id),
    ];

    // Get relationships for all entities
    const allEntitiesFlat = [
      ...context.entities.npcs,
      ...context.entities.quests,
      ...context.entities.lore,
      ...context.entities.locations,
    ];

    const relationships = await Promise.all(
      allEntitiesFlat.map((entity) =>
        this.relationshipService
          .getRelationships(entity.type as any, entity.id)
          .catch(() => []),
      ),
    );

    const snapshot = {
      version: "1.0",
      worldId: context.worldConfig?.id || crypto.randomUUID(),
      worldName: context.worldConfig?.name || "Unnamed World",
      exportedAt: new Date().toISOString(),
      worldConfig: context.worldConfig,
      entities: {
        npcs: context.entities.npcs,
        quests: context.entities.quests,
        lore: context.entities.lore,
        locations: context.entities.locations,
      },
      relationships: relationships.flat(),
      stats: context.stats,
    };

    return snapshot;
  }

  /**
   * Check world consistency and identify issues
   */
  async checkConsistency(userId: string): Promise<{
    issues: ConsistencyIssue[];
    stats: {
      totalIssues: number;
      errors: number;
      warnings: number;
      info: number;
    };
    overallScore: number;
    recommendations: string[];
  }> {
    const context = await this.getWorldContext({
      userId,
      includeRelationships: true,
      includeFullData: false,
      maxEntities: 10000,
      format: "summary",
    });

    const issues: ConsistencyIssue[] = [];

    if (context.relationshipGraph) {
      const entitiesWithNoConnections = context.relationshipGraph.nodes.filter(
        (node) =>
          !context.relationshipGraph!.edges.some(
            (edge) => edge.source === node.id || edge.target === node.id,
          ),
      );

      entitiesWithNoConnections.forEach((node) => {
        issues.push({
          id: crypto.randomUUID(),
          severity: "warning" as const,
          type: "orphaned_entity",
          message: `${node.type} "${node.name}" has no relationships`,
          entityId: node.id,
          entityType: node.type,
          suggestions: [
            {
              action: "create_relationship",
              description: "Connect to related entities",
            },
          ],
        });
      });
    }

    const nameMap = new Map<string, EntitySummary[]>();
    [
      ...context.entities.npcs,
      ...context.entities.quests,
      ...context.entities.lore,
    ].forEach((entity) => {
      const existing = nameMap.get(entity.name) || [];
      existing.push(entity);
      nameMap.set(entity.name, existing);
    });

    nameMap.forEach((entities, name) => {
      if (entities.length > 1) {
        issues.push({
          id: crypto.randomUUID(),
          severity: "error" as const,
          type: "duplicate_name",
          message: `Multiple entities named "${name}" (${entities.map((e) => e.type).join(", ")})`,
          suggestions: [
            {
              action: "rename",
              description: "Give unique names to distinguish them",
            },
          ],
        });
      }
    });

    const archetypes = context.entities.npcs
      .map((npc) => npc.archetype)
      .filter(Boolean);
    const uniqueArchetypes = new Set(archetypes);

    if (context.stats.totalNPCs > 10 && uniqueArchetypes.size < 5) {
      issues.push({
        id: crypto.randomUUID(),
        severity: "info" as const,
        type: "missing_diversity",
        message: `Limited NPC diversity: only ${uniqueArchetypes.size} different archetypes`,
        suggestions: [
          {
            action: "generate_diverse_npcs",
            description:
              "Create NPCs with different archetypes (merchants, guards, scholars, etc.)",
          },
        ],
      });
    }

    const stats = {
      totalIssues: issues.length,
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    };

    const errorPenalty = stats.errors * 2;
    const warningPenalty = stats.warnings * 0.5;
    const infoPenalty = stats.info * 0.1;
    const overallScore = Math.max(
      0,
      Math.min(10, 10 - errorPenalty - warningPenalty - infoPenalty),
    );

    const recommendations: string[] = [];
    if (stats.errors > 0) {
      recommendations.push("Fix duplicate names and broken relationships");
    }
    if (stats.warnings > 5) {
      recommendations.push(
        "Connect orphaned entities to improve world cohesion",
      );
    }
    if (context.stats.totalLore < context.stats.totalNPCs / 3) {
      recommendations.push("Add more lore entries to enrich world backstory");
    }

    return {
      issues,
      stats,
      overallScore,
      recommendations,
    };
  }
}

/**
 * Invalidate world context cache
 * Call this when entities are created/updated/deleted
 */
export function invalidateWorldCache(
  userId: string,
  entityType?: string,
): void {
  worldContextCache.deletePattern(`world:context:${userId}`);
  if (entityType) {
    relationshipGraphCache.deletePattern(`graph:${userId}`);
  }
  logger.info({ userId, entityType }, "Invalidated world knowledge cache");
}
