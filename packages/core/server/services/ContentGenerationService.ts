/**
 * Content Generation Service
 * AI-powered content generation for NPCs, quests, dialogue, and lore
 */

import { generateText } from "ai";

export interface DialogueNode {
  id: string;
  text: string;
  responses?: Array<{
    text: string;
    nextNodeId?: string;
  }>;
}

export interface NPCData {
  name: string;
  archetype: string;
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
}

export interface QuestObjective {
  description: string;
  type: "kill" | "collect" | "talk" | "explore";
  target: string;
  count: number;
}

export interface QuestData {
  title: string;
  description: string;
  objectives: QuestObjective[];
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
}

export interface LoreData {
  title: string;
  category: string;
  content: string;
  summary: string;
  relatedTopics: string[];
  timeline?: string;
  characters?: string[];
}

export class ContentGenerationService {
  constructor() {
    // Verify AI Gateway API key is configured
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error(
        "AI_GATEWAY_API_KEY required for Content Generation Service",
      );
    }

    console.log("[ContentGenerationService] Initialized with AI Gateway");
  }

  /**
   * Get model string for quality level
   * Returns model in 'creator/model-name' format which automatically uses AI Gateway
   */
  private getModel(quality: "quality" | "speed" | "balanced"): string {
    const modelMap = {
      quality: "openai/gpt-4o",
      speed: "openai/gpt-4o-mini",
      balanced: "openai/gpt-4o",
    };

    return modelMap[quality];
  }

  /**
   * Inject world configuration context into generation prompts
   */
  async injectWorldContext(
    basePrompt: string,
    worldConfigId?: string,
  ): Promise<string> {
    if (!worldConfigId) {
      // Try to get active configuration
      const { WorldConfigService } = await import("./WorldConfigService");
      const configService = new WorldConfigService();
      const activeConfig = await configService.getActiveConfiguration();

      if (!activeConfig) {
        // No world config, use base prompt
        return basePrompt;
      }

      worldConfigId = activeConfig.id;
    }

    const { WorldConfigService } = await import("./WorldConfigService");
    const configService = new WorldConfigService();
    const { context } = await configService.buildAIContext(worldConfigId);

    return `${context}\n\n---\n\n${basePrompt}`;
  }

  /**
   * Generate NPC dialogue tree nodes
   */
  async generateDialogue(params: {
    npcName?: string;
    npcPersonality?: string;
    prompt?: string;
    context?: string;
    existingNodes?: DialogueNode[];
    quality?: "quality" | "speed" | "balanced";
    worldConfigId?: string;
  }): Promise<{
    nodes: DialogueNode[];
    rawResponse: string;
  }> {
    const {
      npcName,
      npcPersonality,
      prompt: userPrompt,
      context,
      existingNodes = [],
      quality = "speed",
      worldConfigId,
    } = params;

    const model = this.getModel(quality);

    const basePrompt = this.buildDialoguePrompt(
      npcName,
      npcPersonality,
      userPrompt,
      context,
      existingNodes,
    );

    const aiPrompt = await this.injectWorldContext(basePrompt, worldConfigId);

    console.log(
      `[ContentGeneration] Generating dialogue${npcName ? ` for NPC: ${npcName}` : ""}`,
    );

    const result = await generateText({
      model,
      prompt: aiPrompt,
      temperature: 0.8,
      maxOutputTokens: 2000,
    });

    const nodes = this.parseDialogueResponse(result.text);

    console.log(`[ContentGeneration] Generated ${nodes.length} dialogue nodes`);

    return {
      nodes,
      rawResponse: result.text,
    };
  }

  /**
   * Generate complete NPC character
   */
  async generateNPC(params: {
    prompt: string;
    archetype?: string;
    context?: string;
    quality?: "quality" | "speed" | "balanced";
    worldConfigId?: string;
  }): Promise<{
    npc: NPCData & { id: string; metadata: any };
    rawResponse: string;
  }> {
    const {
      prompt: userPrompt,
      archetype,
      context,
      quality = "quality",
      worldConfigId,
    } = params;

    const model = this.getModel(quality);

    const basePrompt = this.buildNPCPrompt(userPrompt, archetype, context);
    const aiPrompt = await this.injectWorldContext(basePrompt, worldConfigId);

    console.log(
      `[ContentGeneration] Generating NPC${archetype ? ` with archetype: ${archetype}` : ""}`,
    );

    const result = await generateText({
      model,
      prompt: aiPrompt,
      temperature: 0.8,
      maxOutputTokens: 3000,
    });

    const npcData = this.parseNPCResponse(result.text);

    const completeNPC = {
      id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...npcData,
      metadata: {
        generatedBy: "AI",
        model: quality,
        timestamp: new Date().toISOString(),
        archetype: archetype || npcData.archetype,
        worldConfigId,
      },
    };

    console.log(`[ContentGeneration] Generated NPC: ${completeNPC.name}`);

    return {
      npc: completeNPC,
      rawResponse: result.text,
    };
  }

  /**
   * Generate game quest
   */
  async generateQuest(params: {
    prompt?: string;
    questType?: string;
    difficulty?: string;
    theme?: string;
    context?: string;
    quality?: "quality" | "speed" | "balanced";
    worldConfigId?: string;
  }): Promise<{
    quest: QuestData & {
      id: string;
      difficulty: string;
      questType: string;
      metadata: any;
    };
    rawResponse: string;
  }> {
    const {
      prompt: userPrompt,
      questType,
      difficulty,
      theme,
      context,
      quality = "quality",
      worldConfigId,
    } = params;

    const model = this.getModel(quality);

    const basePrompt = this.buildQuestPrompt(
      userPrompt,
      questType,
      difficulty,
      theme,
      context,
    );

    const aiPrompt = await this.injectWorldContext(basePrompt, worldConfigId);

    console.log(
      `[ContentGeneration] Generating${difficulty ? ` ${difficulty}` : ""}${questType ? ` ${questType}` : ""} quest`,
    );

    const result = await generateText({
      model,
      prompt: aiPrompt,
      temperature: 0.7,
      maxOutputTokens: 3000,
    });

    const questData = this.parseQuestResponse(result.text);

    const completeQuest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...questData,
      difficulty: difficulty || "medium",
      questType: questType || "general",
      metadata: {
        generatedBy: "AI",
        model: quality,
        timestamp: new Date().toISOString(),
        worldConfigId,
      },
    };

    console.log(`[ContentGeneration] Generated quest: ${completeQuest.title}`);

    return {
      quest: completeQuest,
      rawResponse: result.text,
    };
  }

  /**
   * Generate lore content
   */
  async generateLore(params: {
    prompt?: string;
    category?: string;
    topic?: string;
    context?: string;
    quality?: "quality" | "speed" | "balanced";
    worldConfigId?: string;
  }): Promise<{
    lore: LoreData & { id: string; metadata: any };
    rawResponse: string;
  }> {
    const {
      prompt: userPrompt,
      category,
      topic,
      context,
      quality = "balanced",
      worldConfigId,
    } = params;

    const model = this.getModel(quality);

    const basePrompt = this.buildLorePrompt(
      userPrompt,
      category,
      topic,
      context,
    );
    const aiPrompt = await this.injectWorldContext(basePrompt, worldConfigId);

    console.log(
      `[ContentGeneration] Generating lore${category ? ` for: ${category}` : ""}${topic ? ` - ${topic}` : ""}`,
    );

    const result = await generateText({
      model,
      prompt: aiPrompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    const loreData = this.parseLoreResponse(result.text);

    const completeLore = {
      id: `lore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...loreData,
      metadata: {
        generatedBy: "AI",
        model: quality,
        timestamp: new Date().toISOString(),
        worldConfigId,
      },
    };

    console.log(`[ContentGeneration] Generated lore: ${completeLore.title}`);

    return {
      lore: completeLore,
      rawResponse: result.text,
    };
  }

  /**
   * Generate entire world seed
   */
  async generateWorld(params: {
    theme?: string;
    complexity?: "simple" | "medium" | "complex";
    customPrompt?: string;
    quality?: "quality" | "speed" | "balanced";
  }): Promise<{
    world: any;
    rawResponse: string;
  }> {
    const {
      theme = "fantasy",
      complexity = "medium",
      customPrompt,
      quality = "quality",
    } = params;

    const model = this.getModel(quality);

    const aiPrompt = this.buildWorldPrompt(theme, complexity, customPrompt);

    console.log(`[ContentGeneration] Generating ${complexity} ${theme} world`);

    const result = await generateText({
      model,
      prompt: aiPrompt,
      temperature: 0.8,
      maxOutputTokens: 4000,
    });

    const worldData = this.parseWorldResponse(result.text);

    const completeWorld = {
      id: `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...worldData,
      theme,
      complexity,
      metadata: {
        generatedBy: "AI",
        model: quality,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `[ContentGeneration] Generated world: ${completeWorld.worldName}`,
    );

    return {
      world: completeWorld,
      rawResponse: result.text,
    };
  }

  // ============================================================================
  // Prompt Building
  // ============================================================================

  private buildDialoguePrompt(
    npcName?: string,
    personality?: string,
    userPrompt?: string,
    context?: string,
    existingNodes?: DialogueNode[],
  ): string {
    return `You are a dialogue writer for an RPG game. Generate dialogue tree nodes for an NPC.

${npcName ? `NPC Name: ${npcName}` : ""}
${personality ? `Personality: ${personality}` : ""}
${userPrompt ? `User Request: ${userPrompt}` : ""}
${context ? `Context: ${context}` : ""}
${existingNodes && existingNodes.length > 0 ? `Existing Nodes: ${JSON.stringify(existingNodes, null, 2)}` : ""}

Generate 3-5 dialogue nodes in JSON format:
[
  {
    "id": "unique_id",
    "text": "dialogue text",
    "responses": [
      {"text": "player response", "nextNodeId": "next_node_id"}
    ]
  }
]

Return ONLY the JSON array, no explanation.`;
  }

  private buildNPCPrompt(
    userPrompt: string,
    archetype?: string,
    context?: string,
  ): string {
    return `You are an NPC character designer for an RPG game. Generate a complete NPC character.

Requirements: ${userPrompt}
${archetype ? `Suggested Archetype: ${archetype}` : ""}
${context ? `Context: ${context}` : ""}

Generate a complete NPC in JSON format:
{
  "name": "NPC Name",
  "archetype": "${archetype || "appropriate archetype"}",
  "personality": {
    "traits": ["trait1", "trait2", "trait3"],
    "background": "background story",
    "motivations": ["motivation1", "motivation2"]
  },
  "appearance": {
    "description": "physical description",
    "equipment": ["item1", "item2"]
  },
  "dialogue": {
    "greeting": "greeting text",
    "farewell": "farewell text",
    "idle": ["idle line 1", "idle line 2"]
  },
  "behavior": {
    "role": "their role in the world",
    "schedule": "daily routine",
    "relationships": []
  }
}

Return ONLY the JSON object, no explanation.`;
  }

  private buildQuestPrompt(
    userPrompt?: string,
    questType?: string,
    difficulty?: string,
    theme?: string,
    context?: string,
  ): string {
    return `You are a quest designer for an RPG game. Generate a complete quest.

${userPrompt ? `User Request: ${userPrompt}` : ""}
${questType ? `Quest Type: ${questType}` : ""}
${difficulty ? `Difficulty: ${difficulty}` : ""}
${theme ? `Theme: ${theme}` : ""}
${context ? `Context: ${context}` : ""}

Generate a quest in JSON format:
{
  "title": "Quest Title",
  "description": "Quest description",
  "objectives": [
    {"description": "objective 1", "type": "kill|collect|talk|explore", "target": "target", "count": 1}
  ],
  "rewards": {
    "experience": 100,
    "gold": 50,
    "items": ["item1"]
  },
  "requirements": {
    "level": 1,
    "previousQuests": []
  },
  "npcs": ["NPC Name"],
  "location": "Location Name",
  "story": "Quest narrative"
}

Return ONLY the JSON object, no explanation.`;
  }

  private buildLorePrompt(
    userPrompt?: string,
    category?: string,
    topic?: string,
    context?: string,
  ): string {
    return `You are a lore writer for an RPG game. Generate rich lore content.

${userPrompt ? `User Request: ${userPrompt}` : ""}
${category ? `Category: ${category}` : ""}
${topic ? `Topic: ${topic}` : ""}
${context ? `Context: ${context}` : ""}

Generate lore content in JSON format:
{
  "title": "Lore Title",
  "category": "${category || "appropriate category"}",
  "content": "Detailed lore content (2-3 paragraphs)",
  "summary": "Brief summary (1-2 sentences)",
  "relatedTopics": ["topic1", "topic2"],
  "timeline": "When this occurs in the game world (optional)",
  "characters": ["character1", "character2"] (if applicable)
}

Return ONLY the JSON object, no explanation.`;
  }

  private buildWorldPrompt(
    theme: string,
    complexity: string,
    customPrompt?: string,
  ): string {
    const complexityGuide = {
      simple: "3-5 key NPCs, 5-8 asset types, 2-3 main locations",
      medium: "5-8 key NPCs, 10-15 asset types, 4-6 main locations",
      complex: "10-15 key NPCs, 20-30 asset types, 8-12 main locations",
    };

    return `You are a world designer for a game development platform. Generate a complete, cohesive game world seed.

Theme: ${theme}
Complexity: ${complexity} (${complexityGuide[complexity as keyof typeof complexityGuide]})
${customPrompt ? `Additional Requirements: ${customPrompt}` : ""}

Create a world that is internally consistent, with interconnected elements that tell a story. Each asset, NPC, and location should feel like part of the same world.

Generate a world seed in JSON format:
{
  "worldName": "World Name",
  "narrative": "2-3 paragraph narrative describing the world's current state, history, and key conflicts",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "suggestedAssets": {
    "items": [
      {"name": "Item Name", "description": "Item description", "category": "weapon|armor|tool|consumable"}
    ],
    "environments": [
      {"name": "Environment Name", "description": "Environment description", "category": "nature|urban|dungeon"}
    ],
    "buildings": [
      {"name": "Building Name", "description": "Building description", "category": "residential|commercial|temple|fortress"}
    ]
  },
  "suggestedNPCs": [
    {"name": "NPC Name", "role": "Their role in the world", "archetype": "merchant|warrior|mage|villain|quest_giver"}
  ],
  "suggestedLocations": [
    {"name": "Location Name", "type": "town|dungeon|wilderness|castle", "description": "Location description"}
  ],
  "loreHooks": ["Intriguing lore element 1", "Intriguing lore element 2"]
}

IMPORTANT:
- All elements should be thematically consistent with the ${theme} theme
- NPCs should have roles that connect to the locations and narrative
- Assets should make sense within the world context
- Include variety but maintain coherence

Return ONLY the JSON object, no explanation.`;
  }

  // ============================================================================
  // Response Parsing
  // ============================================================================

  private parseDialogueResponse(text: string): DialogueNode[] {
    try {
      let cleaned = this.cleanJSONResponse(text);
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error("[Parse Error] Failed to parse dialogue response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }

  private parseNPCResponse(text: string): NPCData {
    try {
      let cleaned = this.cleanJSONResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Parse Error] Failed to parse NPC response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }

  private parseQuestResponse(text: string): QuestData {
    try {
      let cleaned = this.cleanJSONResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Parse Error] Failed to parse quest response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }

  private parseLoreResponse(text: string): LoreData {
    try {
      let cleaned = this.cleanJSONResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Parse Error] Failed to parse lore response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }

  private parseWorldResponse(text: string): any {
    try {
      let cleaned = this.cleanJSONResponse(text);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Parse Error] Failed to parse world response:", error);
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
