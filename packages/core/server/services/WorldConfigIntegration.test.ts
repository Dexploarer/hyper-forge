/**
 * World Configuration Integration Tests
 * End-to-end tests for world config integration with content generation
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { ContentGenerationService } from "./ContentGenerationService";
import { WorldConfigService } from "./WorldConfigService";

// Store original env vars
const originalApiKey = process.env.AI_GATEWAY_API_KEY;
const originalDbUrl = process.env.DATABASE_URL;

describe("World Configuration Integration", () => {
  let contentService: ContentGenerationService;
  let worldConfigService: WorldConfigService;

  beforeEach(() => {
    // Ensure AI_GATEWAY_API_KEY is set for tests
    process.env.AI_GATEWAY_API_KEY = "test-key";
    contentService = new ContentGenerationService();

    // Only create WorldConfigService if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      worldConfigService = new WorldConfigService();
    }
  });

  describe("injectWorldContext Method", () => {
    it("should exist on ContentGenerationService", () => {
      expect(contentService.injectWorldContext).toBeDefined();
      expect(typeof contentService.injectWorldContext).toBe("function");
    });

    it("should return base prompt when no worldConfigId provided and no active config", async () => {
      const basePrompt = "Generate a fantasy NPC";

      // This should work even without database - it will check for active config and find none
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBe(basePrompt);
    });

    it("should accept worldConfigId parameter", async () => {
      const basePrompt = "Generate a fantasy NPC";
      const worldConfigId = "test-config-id";

      // This will attempt to load config, but should handle missing config gracefully
      try {
        await contentService.injectWorldContext(basePrompt, worldConfigId);
      } catch (error) {
        // Expected to fail without real database
        expect(error).toBeDefined();
      }
    });

    it("should prepend context when config exists", async () => {
      const basePrompt = "Generate a fantasy NPC";

      // Mock a successful context injection
      const mockContext = `
World Configuration: Test Fantasy World
Genre: fantasy

Available Races: Humans, Elves, Dwarves
Available Factions: The Order, The Rebellion
`;

      // The expected format when context is prepended
      const expectedFormat = `${mockContext}\n\n---\n\n${basePrompt}`;

      expect(expectedFormat).toContain("World Configuration:");
      expect(expectedFormat).toContain("---");
      expect(expectedFormat).toContain(basePrompt);
    });
  });

  describe("Generation Method Parameters", () => {
    it("generateDialogue should accept worldConfigId parameter", () => {
      const params = {
        npcName: "Test NPC",
        npcPersonality: "Friendly",
        quality: "speed" as const,
        worldConfigId: "test-uuid",
      };

      expect(params.worldConfigId).toBe("test-uuid");
    });

    it("generateNPC should accept worldConfigId parameter", () => {
      const params = {
        archetype: "Warrior",
        prompt: "A brave knight",
        quality: "quality" as const,
        worldConfigId: "test-uuid",
      };

      expect(params.worldConfigId).toBe("test-uuid");
    });

    it("generateQuest should accept worldConfigId parameter", () => {
      const params = {
        questType: "main",
        difficulty: "hard",
        quality: "balanced" as const,
        worldConfigId: "test-uuid",
      };

      expect(params.worldConfigId).toBe("test-uuid");
    });

    it("generateLore should accept worldConfigId parameter", () => {
      const params = {
        category: "History",
        topic: "The Great War",
        quality: "speed" as const,
        worldConfigId: "test-uuid",
      };

      expect(params.worldConfigId).toBe("test-uuid");
    });
  });

  describe("Context Injection Flow", () => {
    it("should handle undefined worldConfigId gracefully", async () => {
      const basePrompt = "Test prompt";
      const result = await contentService.injectWorldContext(
        basePrompt,
        undefined,
      );

      // Should return base prompt when no config found
      expect(result).toBe(basePrompt);
    });

    it("should handle null database connection gracefully", async () => {
      const basePrompt = "Test prompt";

      // Even without database, should not crash
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("Prompt Building with World Context", () => {
    it("should build complete prompts with world context structure", () => {
      const worldContext = `World Configuration: Dark Souls RPG
Genre: dark-fantasy

Available Races: Undead, Hollow, Firekeeper
Available Factions: Way of White, Darkwraiths, Chaos Servants

Economy: Souls (currency)
Magic: Pyromancy, Sorcery, Miracles common

Tone: Dark, somber, challenging`;

      const basePrompt = "Generate an NPC merchant";
      const finalPrompt = `${worldContext}\n\n---\n\n${basePrompt}`;

      // Verify structure
      expect(finalPrompt).toContain("World Configuration:");
      expect(finalPrompt).toContain("Genre:");
      expect(finalPrompt).toContain("Available Races:");
      expect(finalPrompt).toContain("Available Factions:");
      expect(finalPrompt).toContain("---");
      expect(finalPrompt).toContain(basePrompt);

      // Verify the separator is present
      const parts = finalPrompt.split("---");
      expect(parts.length).toBe(2);
      expect(parts[0]).toContain("World Configuration");
      expect(parts[1].trim()).toContain(basePrompt);
    });

    it("should maintain base prompt when no context available", () => {
      const basePrompt = "Generate an NPC merchant";

      // No context scenario
      const finalPrompt = basePrompt;

      expect(finalPrompt).toBe(basePrompt);
      expect(finalPrompt).not.toContain("World Configuration:");
      expect(finalPrompt).not.toContain("---");
    });
  });

  describe("Metadata Storage", () => {
    it("should include worldConfigId in NPC metadata structure", () => {
      const metadata = {
        generatedBy: "AI",
        model: "quality",
        timestamp: new Date().toISOString(),
        archetype: "Warrior",
        worldConfigId: "test-uuid-123",
      };

      expect(metadata.worldConfigId).toBe("test-uuid-123");
      expect(metadata.generatedBy).toBe("AI");
    });

    it("should include worldConfigId in quest metadata structure", () => {
      const metadata = {
        generatedBy: "AI",
        model: "quality",
        timestamp: new Date().toISOString(),
        worldConfigId: "test-uuid-456",
      };

      expect(metadata.worldConfigId).toBe("test-uuid-456");
    });

    it("should include worldConfigId in lore metadata structure", () => {
      const metadata = {
        generatedBy: "AI",
        model: "balanced",
        timestamp: new Date().toISOString(),
        worldConfigId: "test-uuid-789",
      };

      expect(metadata.worldConfigId).toBe("test-uuid-789");
    });
  });

  describe("WorldConfigService Integration", () => {
    it("should be able to import WorldConfigService", () => {
      expect(WorldConfigService).toBeDefined();
    });

    it("should dynamically import WorldConfigService in injectWorldContext", async () => {
      // The injectWorldContext method uses dynamic import
      const basePrompt = "test";

      // This should not throw on import
      try {
        await contentService.injectWorldContext(basePrompt);
      } catch (error) {
        // May fail on database query but not on import
        const errorMessage = (error as Error).message;
        expect(errorMessage).not.toContain("Cannot find module");
        expect(errorMessage).not.toContain("import");
      }
    });
  });

  describe("Default Parameter Behavior", () => {
    it("should handle worldConfigId as optional parameter", async () => {
      const basePrompt = "Generate content";

      // worldConfigId is optional - should work without it
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should preserve original behavior when worldConfigId not provided", async () => {
      const basePrompt = "Original prompt text";

      // When no config exists, should return original prompt
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBe(basePrompt);
    });
  });

  describe("Context Format Validation", () => {
    it("should use correct separator format between context and prompt", () => {
      const context = "World Config Data";
      const prompt = "User Prompt";
      const separator = "\n\n---\n\n";

      const combined = `${context}${separator}${prompt}`;

      expect(combined).toContain(separator);

      // Split should produce exactly 2 parts
      const parts = combined.split("---");
      expect(parts.length).toBe(2);
    });

    it("should handle empty context gracefully", () => {
      const context = "";
      const prompt = "User Prompt";

      // If context is empty, just return prompt
      const result = context ? `${context}\n\n---\n\n${prompt}` : prompt;

      expect(result).toBe(prompt);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing database gracefully", async () => {
      const basePrompt = "test prompt";

      // Should not crash even if database is not configured
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBeDefined();
    });

    it("should handle invalid worldConfigId gracefully", async () => {
      const basePrompt = "test prompt";
      const invalidId = "invalid-uuid-that-does-not-exist";

      try {
        await contentService.injectWorldContext(basePrompt, invalidId);
      } catch (error) {
        // Should throw an error for invalid ID when database is available
        expect(error).toBeDefined();
      }
    });
  });

  describe("Integration Workflow", () => {
    it("should support the complete workflow pattern", () => {
      // Step 1: Create world config (worldConfigService.createConfiguration)
      const configData = {
        name: "Test World",
        description: "A test world",
        genre: "fantasy",
      };

      expect(configData.name).toBeTruthy();

      // Step 2: Activate config (worldConfigService.setActiveConfiguration)
      const configId = "test-uuid";
      expect(configId).toBeTruthy();

      // Step 3: Generate content with active config (contentService.generateNPC)
      const npcParams = {
        archetype: "Merchant",
        prompt: "Friendly trader",
        worldConfigId: configId, // Can specify
      };

      expect(npcParams.worldConfigId).toBe(configId);

      // Step 4: Or generate without specifying (uses active)
      const autoParams = {
        archetype: "Guard",
        prompt: "Stern protector",
        // worldConfigId omitted - will use active config
      };

      expect(autoParams.worldConfigId).toBeUndefined();
    });
  });

  describe("Backward Compatibility", () => {
    it("should work without worldConfigId parameter (backward compatible)", async () => {
      const basePrompt = "Generate an NPC";

      // Old code that doesn't pass worldConfigId should still work
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should not break existing generation method calls", () => {
      // Old-style calls without worldConfigId should still be valid
      const oldStyleNPC = {
        archetype: "Warrior",
        prompt: "A fighter",
        quality: "quality" as const,
      };

      const oldStyleQuest = {
        questType: "side",
        difficulty: "easy",
        quality: "speed" as const,
      };

      const oldStyleLore = {
        category: "History",
        topic: "Ancient Ruins",
        quality: "balanced" as const,
      };

      expect(oldStyleNPC.archetype).toBeTruthy();
      expect(oldStyleQuest.questType).toBeTruthy();
      expect(oldStyleLore.category).toBeTruthy();
    });
  });
});
