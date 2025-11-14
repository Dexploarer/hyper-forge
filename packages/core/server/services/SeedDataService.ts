/**
 * Seed Data Service
 * Generates interconnected seed data for worlds, NPCs, quests, lore, and music
 */

import { generateText } from "ai";
import { logger } from "../utils/logger";

export interface SeedWorldData {
  world: {
    name: string;
    description: string;
    genre: string;
    data: {
      geography: string[];
      culture: string;
      history: string;
      magicSystem?: string;
      technology?: string;
      threats: string[];
    };
    tags: string[];
  };
  locations: Array<{
    name: string;
    type: string;
    data: {
      description: string;
      climate: string;
      inhabitants: string[];
      resources: string[];
      dangers?: string[];
    };
    tags: string[];
  }>;
  npcs: Array<{
    name: string;
    archetype: string;
    locationName: string;
    personality: {
      traits: string[];
      background: string;
      motivations: string[];
    };
    appearance: {
      description: string;
      equipment: string[];
    };
    dialogue: {
      greeting: string;
      farewell: string;
      idle: string[];
    };
    behavior: {
      role: string;
      schedule: string;
      relationships: string[];
    };
  }>;
  quests: Array<{
    title: string;
    questType: string;
    difficulty: string;
    description: string;
    objectives: Array<{
      description: string;
      type: "kill" | "collect" | "talk" | "explore";
      target: string;
      count: number;
    }>;
    rewards: {
      experience: number;
      gold: number;
      items: string[];
    };
    requirements: {
      level: number;
      previousQuests: string[];
    };
    npcs: string[];
    location: string;
    story: string;
  }>;
  lore: Array<{
    title: string;
    category: string;
    content: string;
    summary: string;
    relatedTopics: string[];
    timeline?: string;
    characters?: string[];
  }>;
  music: Array<{
    title: string;
    mood: string;
    contextType: string; // location, quest, npc, combat, etc.
    contextName: string;
    data: {
      tempo: string;
      instruments: string[];
      description: string;
    };
    tags: string[];
  }>;
  relationships: Array<{
    sourceType: string;
    sourceName: string;
    targetType: string;
    targetName: string;
    relationshipType: string;
    strength: "weak" | "medium" | "strong";
    metadata: Record<string, unknown>;
  }>;
}

export class SeedDataService {
  constructor() {
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error("AI_GATEWAY_API_KEY required for Seed Data Service");
    }
    logger.info({}, "[SeedDataService] Initialized with AI Gateway");
  }

  /**
   * Generate a complete interconnected game world with all content
   */
  async generateSeedWorld(params: {
    theme: string;
    genre: string;
    scale: "small" | "medium" | "large";
    quality?: "quality" | "speed" | "balanced";
  }): Promise<{
    seedData: SeedWorldData;
    rawResponse: string;
  }> {
    const { theme, genre, scale, quality = "quality" } = params;

    const model =
      quality === "quality"
        ? "openai/gpt-4o"
        : quality === "speed"
          ? "openai/gpt-4o-mini"
          : "openai/gpt-4o";

    const scaleConfig = {
      small: { locations: 3, npcs: 5, quests: 3, lore: 4, music: 5 },
      medium: { locations: 5, npcs: 10, quests: 6, lore: 8, music: 10 },
      large: { locations: 8, npcs: 15, quests: 10, lore: 12, music: 15 },
    };

    const config = scaleConfig[scale];

    const prompt = `You are a game world designer. Generate a complete, interconnected game world with all content.

Theme: ${theme}
Genre: ${genre}
Scale: ${scale} (${config.locations} locations, ${config.npcs} NPCs, ${config.quests} quests, ${config.lore} lore entries, ${config.music} music tracks)

Generate a JSON object with the following structure. IMPORTANT: Make sure all entities reference each other appropriately:
- NPCs should reference locations they're in
- Quests should reference NPCs who give them and locations where they occur
- Lore should mention NPCs, locations, and quest-related events
- Music should be tagged for specific locations, NPCs, or quest moments
- Relationships array should explicitly define all connections

{
  "world": {
    "name": "World Name",
    "description": "Detailed world description",
    "genre": "${genre}",
    "data": {
      "geography": ["region1", "region2"],
      "culture": "Cultural overview",
      "history": "Historical overview",
      "magicSystem": "Magic system explanation (if fantasy)",
      "technology": "Technology level (if sci-fi)",
      "threats": ["threat1", "threat2"]
    },
    "tags": ["tag1", "tag2"]
  },
  "locations": [
    {
      "name": "Location Name",
      "type": "city|dungeon|wilderness|village|fortress",
      "data": {
        "description": "Detailed description",
        "climate": "Climate description",
        "inhabitants": ["race1", "race2"],
        "resources": ["resource1", "resource2"],
        "dangers": ["danger1"]
      },
      "tags": ["tag1"]
    }
  ],
  "npcs": [
    {
      "name": "NPC Name",
      "archetype": "merchant|warrior|mage|noble|peasant|villain",
      "locationName": "Location they're found in",
      "personality": {
        "traits": ["trait1", "trait2", "trait3"],
        "background": "Their backstory",
        "motivations": ["motivation1", "motivation2"]
      },
      "appearance": {
        "description": "Physical description",
        "equipment": ["item1", "item2"]
      },
      "dialogue": {
        "greeting": "Hello traveler!",
        "farewell": "Safe travels!",
        "idle": ["idle1", "idle2"]
      },
      "behavior": {
        "role": "Their role in the world",
        "schedule": "Daily routine",
        "relationships": ["relationship with other NPCs"]
      }
    }
  ],
  "quests": [
    {
      "title": "Quest Title",
      "questType": "main|side|bounty|fetch|rescue",
      "difficulty": "easy|medium|hard|epic",
      "description": "Quest description",
      "objectives": [
        {"description": "objective", "type": "kill|collect|talk|explore", "target": "target", "count": 1}
      ],
      "rewards": {"experience": 100, "gold": 50, "items": ["item1"]},
      "requirements": {"level": 1, "previousQuests": []},
      "npcs": ["NPC Name who gives quest"],
      "location": "Location Name where quest occurs",
      "story": "Quest narrative"
    }
  ],
  "lore": [
    {
      "title": "Lore Title",
      "category": "history|legend|religion|culture|magic",
      "content": "Detailed lore content (2-3 paragraphs)",
      "summary": "Brief summary",
      "relatedTopics": ["topic1", "topic2"],
      "timeline": "When this occurred",
      "characters": ["Character names mentioned"]
    }
  ],
  "music": [
    {
      "title": "Track Title",
      "mood": "epic|mysterious|peaceful|tense|melancholic|triumphant",
      "contextType": "location|quest|npc|combat|exploration",
      "contextName": "Name of the location/quest/npc this is for",
      "data": {
        "tempo": "slow|medium|fast",
        "instruments": ["instrument1", "instrument2"],
        "description": "Musical description"
      },
      "tags": ["tag1", "tag2"]
    }
  ],
  "relationships": [
    {
      "sourceType": "npc|quest|lore|location|music",
      "sourceName": "Source entity name",
      "targetType": "npc|quest|lore|location|music",
      "targetName": "Target entity name",
      "relationshipType": "mentions|requires|located_in|gives_quest|enemy_of|ally_of|plays_in|related_to",
      "strength": "weak|medium|strong",
      "metadata": {"details": "any additional context"}
    }
  ]
}

Generate exactly ${config.locations} locations, ${config.npcs} NPCs, ${config.quests} quests, ${config.lore} lore entries, ${config.music} music tracks, and comprehensive relationships linking them all together.

Return ONLY the JSON object, no explanation.`;

    logger.info(
      `[SeedDataService] Generating ${scale} ${genre} world: ${theme}`,
    );

    const result = await generateText({
      model,
      prompt,
      temperature: 0.8,
      maxOutputTokens: 8000,
    });

    const seedData = this.parseSeedWorldResponse(result.text);

    logger.info(
      `[SeedDataService] Generated world: ${seedData.world.name} with ${seedData.locations.length} locations, ${seedData.npcs.length} NPCs, ${seedData.quests.length} quests, ${seedData.lore.length} lore, ${seedData.music.length} music tracks, ${seedData.relationships.length} relationships`,
    );

    return {
      seedData,
      rawResponse: result.text,
    };
  }

  /**
   * Generate additional content that links to existing entities
   */
  async generateLinkedContent(params: {
    contentType: "npc" | "quest" | "lore" | "music";
    linkTo: {
      type: string;
      id: string;
      name: string;
      context: string;
    };
    quality?: "quality" | "speed" | "balanced";
  }): Promise<{
    content: unknown;
    relationships: Array<{
      sourceType: string;
      targetType: string;
      targetId: string;
      relationshipType: string;
      strength: string;
      metadata: Record<string, unknown>;
    }>;
    rawResponse: string;
  }> {
    const { contentType, linkTo, quality = "balanced" } = params;

    const model =
      quality === "quality"
        ? "openai/gpt-4o"
        : quality === "speed"
          ? "openai/gpt-4o-mini"
          : "openai/gpt-4o";

    const prompt = this.buildLinkedContentPrompt(contentType, linkTo);

    logger.info(
      `[SeedDataService] Generating ${contentType} linked to ${linkTo.type}: ${linkTo.name}`,
    );

    const result = await generateText({
      model,
      prompt,
      temperature: 0.8,
      maxOutputTokens: 3000,
    });

    const parsed = this.parseLinkedContentResponse(
      result.text,
      contentType,
      linkTo,
    );

    logger.info(
      `[SeedDataService] Generated linked ${contentType} with ${parsed.relationships.length} relationships`,
    );

    return {
      ...parsed,
      rawResponse: result.text,
    };
  }

  private buildLinkedContentPrompt(
    contentType: string,
    linkTo: { type: string; name: string; context: string },
  ): string {
    const prompts = {
      npc: `Generate an NPC that is connected to the ${linkTo.type} "${linkTo.name}".
Context: ${linkTo.context}

Create an NPC with strong narrative connections to this ${linkTo.type}. The NPC should naturally fit into the context.

Return JSON: {"npc": {...NPC data...}, "relationshipType": "enemy_of|ally_of|related_to|mentions", "strength": "weak|medium|strong"}`,

      quest: `Generate a quest that involves the ${linkTo.type} "${linkTo.name}".
Context: ${linkTo.context}

Create a quest that naturally involves this ${linkTo.type} in objectives, story, or location.

Return JSON: {"quest": {...Quest data...}, "relationshipType": "requires|mentions|located_in", "strength": "weak|medium|strong"}`,

      lore: `Generate lore content that references the ${linkTo.type} "${linkTo.name}".
Context: ${linkTo.context}

Create lore that mentions and provides background for this ${linkTo.type}.

Return JSON: {"lore": {...Lore data...}, "relationshipType": "mentions|related_to", "strength": "weak|medium|strong"}`,

      music: `Generate a music track for the ${linkTo.type} "${linkTo.name}".
Context: ${linkTo.context}

Create a music track that fits the mood and theme of this ${linkTo.type}.

Return JSON: {"music": {...Music data...}, "relationshipType": "plays_in|theme_for", "strength": "strong"}`,
    };

    return prompts[contentType as keyof typeof prompts];
  }

  private parseSeedWorldResponse(text: string): SeedWorldData {
    try {
      const cleaned = this.cleanJSONResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error(
        { err: error },
        "[Parse Error] Failed to parse seed world response:",
      );
      throw new Error("Invalid JSON response from AI");
    }
  }

  private parseLinkedContentResponse(
    text: string,
    contentType: string,
    linkTo: { type: string; id: string; name: string },
  ): {
    content: unknown;
    relationships: Array<{
      sourceType: string;
      targetType: string;
      targetId: string;
      relationshipType: string;
      strength: string;
      metadata: Record<string, unknown>;
    }>;
  } {
    try {
      const cleaned = this.cleanJSONResponse(text);
      const parsed = JSON.parse(cleaned);

      const content = parsed[contentType];
      const relationship = {
        sourceType: contentType,
        targetType: linkTo.type,
        targetId: linkTo.id,
        relationshipType: parsed.relationshipType || "related_to",
        strength: parsed.strength || "medium",
        metadata: { generatedLink: true },
      };

      return {
        content,
        relationships: [relationship],
      };
    } catch (error) {
      logger.error(
        "[Parse Error] Failed to parse linked content response:",
        error,
      );
      throw new Error("Invalid JSON response from AI");
    }
  }

  private cleanJSONResponse(text: string): string {
    let cleaned = text.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
  }
}
