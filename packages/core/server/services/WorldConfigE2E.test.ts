/**
 * World Configuration End-to-End Test
 * Full workflow: Create config → Activate → Generate content with context
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ContentGenerationService } from "./ContentGenerationService";
import { WorldConfigService } from "./WorldConfigService";
import type { NewWorldConfiguration } from "../db/schema/world-config.schema";

// Store original API key
const originalApiKey = process.env.AI_GATEWAY_API_KEY;

describe("World Configuration E2E", () => {
  let contentService: ContentGenerationService;
  let worldConfigService: WorldConfigService;
  let testConfigId: string | null = null;

  beforeAll(async () => {
    // Set up services
    process.env.AI_GATEWAY_API_KEY = "test-key";
    contentService = new ContentGenerationService();
    worldConfigService = new WorldConfigService();

    // Clean up any existing test configs
    try {
      const configs = await worldConfigService.listConfigurations();
      for (const config of configs) {
        if (config.name.includes("E2E Test World")) {
          await worldConfigService.deleteConfiguration(config.id);
        }
      }
    } catch (error) {
      console.log("[E2E Setup] No existing test configs to clean");
    }
  });

  afterAll(async () => {
    // Clean up test config
    if (testConfigId) {
      try {
        await worldConfigService.deleteConfiguration(testConfigId);
        console.log("[E2E Cleanup] Deleted test configuration");
      } catch (error) {
        console.log("[E2E Cleanup] Test config already deleted");
      }
    }
  });

  describe("Complete Workflow", () => {
    it("should create a world configuration", async () => {
      const configData: NewWorldConfiguration = {
        name: "E2E Test World - Dark Fantasy",
        description: "A dark fantasy test world for end-to-end testing",
        genre: "dark-fantasy",
        races: [
          {
            id: "undead",
            name: "Undead",
            description: "Cursed souls that cannot die",
            traits: ["immortal", "cursed", "hollow"],
            culturalBackground: "Once human, now cursed to wander eternally",
            enabled: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "human",
            name: "Human",
            description: "Mortal beings fighting for survival",
            traits: ["adaptable", "brave", "mortal"],
            culturalBackground: "Struggling kingdoms in a dying world",
            enabled: true,
            createdAt: new Date().toISOString(),
          },
        ],
        factions: [
          {
            id: "way_of_white",
            name: "Way of White",
            description: "Religious order seeking to preserve the light",
            alignment: "good",
            goals: ["Preserve the flame", "Aid the undead"],
            rivals: ["darkwraiths"],
            allies: [],
            enabled: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "darkwraiths",
            name: "Darkwraiths",
            description: "Dark covenant serving the Abyss",
            alignment: "evil",
            goals: ["Spread the Abyss", "Extinguish the flame"],
            rivals: ["way_of_white"],
            allies: [],
            enabled: true,
            createdAt: new Date().toISOString(),
          },
        ],
        skills: [
          {
            id: "pyromancy",
            name: "Pyromancy",
            category: "magic",
            description: "Fire magic from ancient traditions",
            prerequisites: [],
            tier: 1,
            enabled: true,
            createdAt: new Date().toISOString(),
          },
        ],
        npcCategories: [
          {
            id: "merchant",
            name: "Merchant",
            archetypes: ["trader", "vendor", "smuggler"],
            commonTraits: ["greedy", "cunning", "knowledgeable"],
            typicalRoles: ["selling items", "providing information", "trading"],
            enabled: true,
          },
        ],
        questConfig: {
          types: [
            {
              id: "main",
              name: "Main Quest",
              description: "Critical story quests",
              enabled: true,
            },
          ],
          difficulties: [
            {
              id: "hard",
              name: "Hard",
              levelRange: { min: 10, max: 20 },
              rewardMultiplier: 2.0,
              enabled: true,
            },
          ],
          objectiveTypes: ["kill", "collect", "explore"],
          defaultRewards: {
            experienceBase: 1000,
            goldBase: 500,
          },
        },
        itemsConfig: {
          categories: [
            {
              id: "weapons",
              name: "Weapons",
              subcategories: ["swords", "axes", "bows"],
              enabled: true,
            },
          ],
          rarities: [
            {
              id: "legendary",
              name: "Legendary",
              dropChance: 0.01,
              statMultiplier: 3.0,
              enabled: true,
            },
          ],
          enchantments: [
            {
              id: "fire",
              name: "Fire",
              effect: "+50% fire damage",
              tier: 1,
              enabled: true,
            },
          ],
        },
        locationsConfig: {
          biomes: [
            {
              id: "ashen",
              name: "Ashen Wastelands",
              climate: "volcanic",
              terrain: ["ash", "lava", "ruins"],
              dangerLevel: 8,
              enabled: true,
            },
          ],
          settlementTypes: [
            {
              id: "bonfire",
              name: "Bonfire",
              populationRange: { min: 5, max: 20 },
              commonBuildings: ["shrine", "blacksmith"],
              enabled: true,
            },
          ],
          dungeonTypes: [
            {
              id: "catacombs",
              name: "Catacombs",
              themes: ["undead", "dark", "ancient"],
              difficultyRange: { min: 5, max: 10 },
              enabled: true,
            },
          ],
        },
        economySettings: {
          currencyName: "Souls",
          priceRanges: {
            consumables: { min: 50, max: 500 },
            equipment: { min: 1000, max: 50000 },
            services: { min: 100, max: 5000 },
            housing: { min: 10000, max: 100000 },
          },
          tradingEnabled: true,
          barterEnabled: false,
          inflationRate: 0,
        },
        aiPreferences: {
          defaultQuality: "quality",
          toneAndStyle: {
            narrative: "dark",
            dialogueFormality: "formal",
            detailLevel: "verbose",
          },
          contentGuidelines: {
            violenceLevel: "high",
            magicPrevalence: "common",
            technologyLevel: "medieval",
          },
          generationConstraints: {
            maxNPCsPerLocation: 10,
            maxQuestChainLength: 5,
            minQuestObjectives: 2,
            maxQuestObjectives: 5,
          },
        },
      };

      const config = await worldConfigService.createConfiguration(configData);

      expect(config).toBeDefined();
      expect(config.id).toBeTruthy();
      expect(config.name).toBe("E2E Test World - Dark Fantasy");
      expect(config.genre).toBe("dark-fantasy");
      expect(config.races.length).toBe(2);
      expect(config.factions.length).toBe(2);

      testConfigId = config.id;
      console.log(`[E2E] Created test config: ${testConfigId}`);
    });

    it("should activate the configuration", async () => {
      expect(testConfigId).toBeTruthy();

      await worldConfigService.setActiveConfiguration(testConfigId!);

      const activeConfig = await worldConfigService.getActiveConfiguration();

      expect(activeConfig).toBeDefined();
      expect(activeConfig?.id).toBe(testConfigId);
      expect(activeConfig?.isActive).toBe(true);

      console.log(`[E2E] Activated config: ${activeConfig?.name}`);
    });

    it("should build AI context from configuration", async () => {
      expect(testConfigId).toBeTruthy();

      const { context, sections } = await worldConfigService.buildAIContext(
        testConfigId!,
      );

      expect(context).toBeTruthy();
      expect(context).toContain("E2E Test World - Dark Fantasy");
      expect(context).toContain("dark-fantasy");
      expect(context).toContain("Undead");
      expect(context).toContain("Way of White");
      expect(context).toContain("Darkwraiths");
      expect(context).toContain("Souls");

      expect(sections.races).toContain("Undead");
      expect(sections.factions).toContain("Way of White");
      expect(sections.economy || context).toContain("Souls");

      console.log("[E2E] Built AI context:");
      console.log(context.substring(0, 500) + "...");
    });

    it("should inject world context into content generation prompts", async () => {
      const basePrompt = "Generate a mysterious merchant NPC";

      const enrichedPrompt = await contentService.injectWorldContext(
        basePrompt,
        testConfigId!,
      );

      expect(enrichedPrompt).toBeTruthy();
      expect(enrichedPrompt).not.toBe(basePrompt);
      expect(enrichedPrompt).toContain("E2E Test World");
      expect(enrichedPrompt).toContain("---");
      expect(enrichedPrompt).toContain(basePrompt);

      const parts = enrichedPrompt.split("---");
      expect(parts.length).toBe(2);
      expect(parts[0]).toContain("dark-fantasy");
      expect(parts[1].trim()).toBe(basePrompt);

      console.log("[E2E] Injected context successfully");
    });

    it("should use active config when no worldConfigId specified", async () => {
      const basePrompt = "Generate a quest about the Abyss";

      // Don't specify worldConfigId - should use active config
      const enrichedPrompt =
        await contentService.injectWorldContext(basePrompt);

      expect(enrichedPrompt).toBeTruthy();
      expect(enrichedPrompt).not.toBe(basePrompt);
      expect(enrichedPrompt).toContain("E2E Test World");
      expect(enrichedPrompt).toContain("dark-fantasy");

      console.log("[E2E] Used active config automatically");
    });

    it("should generate NPC with world context", async () => {
      // Mock generation result for testing
      const params = {
        archetype: "merchant",
        prompt: "A soul merchant in the Ashen Wastelands",
        worldConfigId: testConfigId!,
        quality: "speed" as const,
      };

      // We can't actually call the AI without a real API key,
      // but we can verify the parameters are structured correctly
      expect(params.worldConfigId).toBe(testConfigId);
      expect(params.archetype).toBe("merchant");

      // Verify injectWorldContext would be called
      const basePrompt = `You are an NPC character designer for an RPG game. Generate a complete NPC character.

Archetype: merchant
Requirements: A soul merchant in the Ashen Wastelands

Generate a complete NPC in JSON format:`;

      const enrichedPrompt = await contentService.injectWorldContext(
        basePrompt,
        testConfigId!,
      );

      expect(enrichedPrompt).toContain("Ashen Wastelands");
      expect(enrichedPrompt).toContain("dark-fantasy");
      expect(enrichedPrompt).toContain("Souls");

      console.log("[E2E] NPC generation would use world context");
    });

    it("should generate quest with world context", async () => {
      const params = {
        questType: "main",
        difficulty: "hard",
        theme: "Darkwraiths",
        worldConfigId: testConfigId!,
        quality: "speed" as const,
      };

      expect(params.worldConfigId).toBe(testConfigId);
      expect(params.difficulty).toBe("hard");

      // Verify context injection
      const basePrompt = "Generate a quest about defeating Darkwraiths";
      const enrichedPrompt = await contentService.injectWorldContext(
        basePrompt,
        testConfigId!,
      );

      expect(enrichedPrompt).toContain("Darkwraiths");
      expect(enrichedPrompt).toContain("Way of White");
      expect(enrichedPrompt).toContain("Abyss");

      console.log("[E2E] Quest generation would use world context");
    });

    it("should deactivate configuration before deletion", async () => {
      expect(testConfigId).toBeTruthy();

      // First, deactivate by setting isActive to false
      const config = await worldConfigService.getConfiguration(testConfigId!);
      expect(config?.isActive).toBe(true);

      // Deactivate by updating
      await worldConfigService.updateConfiguration(testConfigId!, {
        isActive: false,
      });

      // Verify it's deactivated
      const updatedConfig = await worldConfigService.getConfiguration(
        testConfigId!,
      );
      expect(updatedConfig?.isActive).toBe(false);

      // Now delete
      await worldConfigService.deleteConfiguration(testConfigId!);

      // Verify no active config
      const activeConfig = await worldConfigService.getActiveConfiguration();
      expect(activeConfig).toBeNull();

      console.log("[E2E] Deactivated and deleted config successfully");

      // Clear testConfigId so afterAll doesn't try to delete again
      testConfigId = null;
    });
  });

  describe("Edge Cases", () => {
    it("should handle no active configuration gracefully", async () => {
      // Get active config if any and deactivate it
      const activeConfig = await worldConfigService.getActiveConfiguration();
      if (activeConfig) {
        await worldConfigService.updateConfiguration(activeConfig.id, {
          isActive: false,
        });
      }

      // Verify no active config
      const noActiveConfig = await worldConfigService.getActiveConfiguration();
      expect(noActiveConfig).toBeNull();

      // Should return base prompt when no config
      const basePrompt = "Generate an NPC";
      const result = await contentService.injectWorldContext(basePrompt);

      expect(result).toBe(basePrompt);

      console.log("[E2E] Handled no active config correctly");
    });

    it("should create and use multiple configurations", async () => {
      // Create first config
      const config1 = await worldConfigService.createConfiguration({
        name: "E2E Test World - Sci-Fi",
        description: "A sci-fi world",
        genre: "sci-fi",
        questConfig: worldConfigService.getDefaultQuestConfig(),
        itemsConfig: worldConfigService.getDefaultItemsConfig(),
        locationsConfig: worldConfigService.getDefaultLocationsConfig(),
        economySettings: worldConfigService.getDefaultEconomySettings(),
        aiPreferences: worldConfigService.getDefaultAIPreferences(),
      });

      // Create second config
      const config2 = await worldConfigService.createConfiguration({
        name: "E2E Test World - Modern",
        description: "A modern world",
        genre: "modern",
        questConfig: worldConfigService.getDefaultQuestConfig(),
        itemsConfig: worldConfigService.getDefaultItemsConfig(),
        locationsConfig: worldConfigService.getDefaultLocationsConfig(),
        economySettings: worldConfigService.getDefaultEconomySettings(),
        aiPreferences: worldConfigService.getDefaultAIPreferences(),
      });

      expect(config1.id).not.toBe(config2.id);

      // Activate first
      await worldConfigService.setActiveConfiguration(config1.id);
      let active = await worldConfigService.getActiveConfiguration();
      expect(active?.id).toBe(config1.id);

      // Activate second (should deactivate first)
      await worldConfigService.setActiveConfiguration(config2.id);
      active = await worldConfigService.getActiveConfiguration();
      expect(active?.id).toBe(config2.id);

      // Verify first is deactivated
      const config1Updated = await worldConfigService.getConfiguration(
        config1.id,
      );
      expect(config1Updated?.isActive).toBe(false);

      // Clean up - deactivate second config before deletion
      await worldConfigService.updateConfiguration(config2.id, {
        isActive: false,
      });

      // Delete both
      await worldConfigService.deleteConfiguration(config1.id);
      await worldConfigService.deleteConfiguration(config2.id);

      console.log("[E2E] Multiple configs handled correctly");
    });
  });
});
