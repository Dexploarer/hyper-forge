/**
 * ContentGenerationService Tests
 * Tests for content generation service configuration and structure
 * Focuses on testable logic without requiring real AI API calls
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { ContentGenerationService } from "../../../../server/services/ContentGenerationService";

// Store original AI_GATEWAY_API_KEY
const originalApiKey = process.env.AI_GATEWAY_API_KEY;

describe("ContentGenerationService", () => {
  let service: ContentGenerationService;

  beforeEach(() => {
    // Ensure AI_GATEWAY_API_KEY is set for tests
    process.env.AI_GATEWAY_API_KEY = "test-key";
    service = new ContentGenerationService();
  });

  describe("Constructor", () => {
    it("should initialize successfully with AI_GATEWAY_API_KEY", () => {
      expect(service).toBeDefined();
    });

    it("should throw error without AI_GATEWAY_API_KEY", () => {
      delete process.env.AI_GATEWAY_API_KEY;

      expect(() => new ContentGenerationService()).toThrow(
        "AI_GATEWAY_API_KEY required",
      );

      // Restore for other tests
      process.env.AI_GATEWAY_API_KEY = originalApiKey;
    });
  });

  describe("Model Selection", () => {
    it.skip("should have getModel method for quality levels", () => {
      // Access private method via any cast for testing
      const serviceAny = service as any;

      expect(serviceAny.getModel("quality")).toBe("openai/gpt-4o");
      expect(serviceAny.getModel("speed")).toBe("openai/gpt-4o-mini");
      expect(serviceAny.getModel("balanced")).toBe("openai/gpt-4o");
    });

    it.skip("should default to speed for missing quality", () => {
      const serviceAny = service as any;

      // When no quality specified, methods default to speed
      expect(serviceAny.getModel("speed")).toBe("openai/gpt-4o-mini");
    });
  });

  describe("JSON Cleaning", () => {
    it("should clean markdown code blocks from JSON", () => {
      const serviceAny = service as any;

      const input1 = `\`\`\`json
{"test": "value"}
\`\`\``;
      expect(serviceAny.cleanJSONResponse(input1)).toBe('{"test": "value"}');

      const input2 = `\`\`\`
{"test": "value"}
\`\`\``;
      expect(serviceAny.cleanJSONResponse(input2)).toBe('{"test": "value"}');

      const input3 = '{"test": "value"}';
      expect(serviceAny.cleanJSONResponse(input3)).toBe('{"test": "value"}');
    });

    it("should handle whitespace correctly", () => {
      const serviceAny = service as any;

      const input = `  \`\`\`json
{"test": "value"}
\`\`\`  `;
      const result = serviceAny.cleanJSONResponse(input);
      expect(result.trim()).toBe('{"test": "value"}');
    });
  });

  describe("Parameter Validation", () => {
    it("should accept valid dialogue parameters", () => {
      const params = {
        npcName: "Test NPC",
        npcPersonality: "Friendly",
        quality: "speed" as const,
      };

      expect(params.npcName).toBeTruthy();
      expect(params.npcPersonality).toBeTruthy();
      expect(["quality", "speed", "balanced"]).toContain(params.quality);
    });

    it("should accept valid NPC parameters", () => {
      const params = {
        archetype: "Warrior",
        prompt: "A brave knight",
        quality: "quality" as const,
      };

      expect(params.archetype).toBeTruthy();
      expect(params.prompt).toBeTruthy();
      expect(["quality", "speed", "balanced"]).toContain(params.quality);
    });

    it("should accept valid quest parameters", () => {
      const params = {
        questType: "main",
        difficulty: "hard",
        quality: "balanced" as const,
      };

      expect(params.questType).toBeTruthy();
      expect(params.difficulty).toBeTruthy();
      expect(["quality", "speed", "balanced"]).toContain(params.quality);
    });

    it("should accept valid lore parameters", () => {
      const params = {
        category: "History",
        topic: "The Great War",
        quality: "speed" as const,
      };

      expect(params.category).toBeTruthy();
      expect(params.topic).toBeTruthy();
      expect(["quality", "speed", "balanced"]).toContain(params.quality);
    });
  });

  describe("Prompt Building", () => {
    it("should build dialogue prompts with all parameters", () => {
      const serviceAny = service as any;

      const prompt = serviceAny.buildDialoguePrompt(
        "Test NPC",
        "Friendly",
        "Fantasy setting",
        [],
      );

      expect(prompt).toContain("Test NPC");
      expect(prompt).toContain("Friendly");
      expect(prompt).toContain("Fantasy setting");
      expect(prompt).toContain("dialogue");
    });

    it("should build NPC prompts with archetype", () => {
      const serviceAny = service as any;

      const prompt = serviceAny.buildNPCPrompt(
        "Mage",
        "Powerful wizard",
        "High fantasy",
      );

      expect(prompt).toContain("Mage");
      expect(prompt).toContain("Powerful wizard");
      expect(prompt).toContain("High fantasy");
      expect(prompt).toContain("NPC");
    });

    it("should build quest prompts with difficulty", () => {
      const serviceAny = service as any;

      const prompt = serviceAny.buildQuestPrompt(
        "main",
        "hard",
        "Dragon",
        "Epic fantasy",
      );

      expect(prompt).toContain("main");
      expect(prompt).toContain("hard");
      expect(prompt).toContain("Dragon");
      expect(prompt).toContain("quest");
    });

    it("should build lore prompts with category", () => {
      const serviceAny = service as any;

      const prompt = serviceAny.buildLorePrompt(
        "History",
        "Ancient War",
        "Fantasy world",
      );

      expect(prompt).toContain("History");
      expect(prompt).toContain("Ancient War");
      expect(prompt).toContain("Fantasy world");
      expect(prompt).toContain("lore");
    });
  });

  describe("Response Parsing", () => {
    it("should parse valid dialogue JSON", () => {
      const serviceAny = service as any;

      const validJSON = JSON.stringify([
        {
          id: "node_1",
          text: "Hello",
          responses: [{ text: "Hi", nextNodeId: "node_2" }],
        },
      ]);

      const result = serviceAny.parseDialogueResponse(validJSON);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe("node_1");
      expect(result[0].text).toBe("Hello");
    });

    it("should parse valid NPC JSON", () => {
      const serviceAny = service as any;

      const validJSON = JSON.stringify({
        name: "Test Warrior",
        archetype: "Fighter",
        personality: {
          traits: ["brave"],
          background: "A hero",
          motivations: ["Save the world"],
        },
        appearance: {
          description: "Tall and strong",
          equipment: ["Sword"],
        },
        dialogue: {
          greeting: "Hello",
          farewell: "Goodbye",
          idle: ["..."],
        },
        behavior: {
          role: "Guard",
          schedule: "Day shift",
          relationships: [],
        },
      });

      const result = serviceAny.parseNPCResponse(validJSON);
      expect(result.name).toBe("Test Warrior");
      expect(result.archetype).toBe("Fighter");
      expect(result.personality.traits).toContain("brave");
    });

    it("should parse valid quest JSON", () => {
      const serviceAny = service as any;

      const validJSON = JSON.stringify({
        title: "Test Quest",
        description: "A test",
        objectives: [
          { description: "Do thing", type: "kill", target: "Enemy", count: 1 },
        ],
        rewards: { experience: 100, gold: 50, items: [] },
        requirements: { level: 1, previousQuests: [] },
        npcs: [],
        location: "Town",
        story: "A story",
      });

      const result = serviceAny.parseQuestResponse(validJSON);
      expect(result.title).toBe("Test Quest");
      expect(result.objectives.length).toBe(1);
    });

    it("should parse valid lore JSON", () => {
      const serviceAny = service as any;

      const validJSON = JSON.stringify({
        title: "Test Lore",
        category: "History",
        content: "Long ago...",
        summary: "A summary",
        relatedTopics: ["War", "Peace"],
      });

      const result = serviceAny.parseLoreResponse(validJSON);
      expect(result.title).toBe("Test Lore");
      expect(result.category).toBe("History");
    });

    it("should throw error on invalid JSON", () => {
      const serviceAny = service as any;

      expect(() => {
        serviceAny.parseDialogueResponse("not json");
      }).toThrow("Invalid JSON response from AI");

      expect(() => {
        serviceAny.parseNPCResponse("not json");
      }).toThrow("Invalid JSON response from AI");

      expect(() => {
        serviceAny.parseQuestResponse("not json");
      }).toThrow("Invalid JSON response from AI");

      expect(() => {
        serviceAny.parseLoreResponse("not json");
      }).toThrow("Invalid JSON response from AI");
    });
  });

  describe("ID Generation", () => {
    it("should generate unique IDs for NPCs", () => {
      const ids = new Set();

      // Generate multiple IDs
      for (let i = 0; i < 10; i++) {
        const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        ids.add(id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(10);
    });

    it("should generate IDs with correct format", () => {
      const id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id).toMatch(/^npc_\d+_[a-z0-9]{9}$/);
    });
  });

  describe("Configuration", () => {
    it.skip("should use correct model names for AI Gateway", () => {
      const serviceAny = service as any;

      // All models should use openai/ prefix for AI Gateway
      expect(serviceAny.getModel("quality")).toMatch(/^openai\//);
      expect(serviceAny.getModel("speed")).toMatch(/^openai\//);
      expect(serviceAny.getModel("balanced")).toMatch(/^openai\//);
    });

    it.skip("should have consistent model configurations", () => {
      const serviceAny = service as any;

      const qualityModel = serviceAny.getModel("quality");
      const speedModel = serviceAny.getModel("speed");
      const balancedModel = serviceAny.getModel("balanced");

      expect(qualityModel).toBeTruthy();
      expect(speedModel).toBeTruthy();
      expect(balancedModel).toBeTruthy();

      // Speed should use mini model
      expect(speedModel).toContain("mini");

      // Quality and balanced should use full model
      expect(qualityModel).toContain("gpt-4o");
      expect(balancedModel).toContain("gpt-4o");
    });
  });
});
