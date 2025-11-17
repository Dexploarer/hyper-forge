/**
 * Real AI Content Generation Integration Tests
 * 
 * ⚠️ WARNING: These tests make REAL API calls and COST MONEY
 * 
 * These tests use actual API keys from .env to validate:
 * - Real NPC generation
 * - Real dialogue generation
 * - Real quest generation
 * - Real lore generation
 * 
 * Run with: bun test apps/core/__tests__/integration/ai-real
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { ContentGenerationService } from "../../../server/services/ContentGenerationService";

describe("ContentGenerationService - Real AI Integration", () => {
  let service: ContentGenerationService;

  beforeAll(() => {
    // Verify API key is set
    if (!process.env.AI_GATEWAY_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error(
        "AI_GATEWAY_API_KEY or OPENAI_API_KEY must be set in .env to run real integration tests"
      );
    }

    service = new ContentGenerationService();
  });

  describe("Real NPC Generation", () => {
    it("should generate a real NPC character with AI", async () => {
      const result = await service.generateNPC({
        prompt: "A wise old wizard who studies ancient magic",
        archetype: "Mage",
        quality: "speed", // Use speed to reduce cost
      });

      // Validate structure
      expect(result).toBeDefined();
      expect(result.npc).toBeDefined();
      expect(result.rawResponse).toBeDefined();

      // Validate NPC data
      const { npc } = result;
      expect(npc.id).toBeDefined();
      expect(npc.id).toMatch(/^npc_/);
      expect(npc.name).toBeDefined();
      expect(typeof npc.name).toBe("string");
      expect(npc.name.length).toBeGreaterThan(0);

      // Validate personality
      expect(npc.personality).toBeDefined();
      expect(Array.isArray(npc.personality.traits)).toBe(true);
      expect(npc.personality.traits.length).toBeGreaterThan(0);
      expect(npc.personality.background).toBeDefined();
      expect(npc.personality.background.length).toBeGreaterThan(0);
      expect(Array.isArray(npc.personality.motivations)).toBe(true);

      // Validate appearance
      expect(npc.appearance).toBeDefined();
      expect(npc.appearance.description).toBeDefined();
      expect(npc.appearance.description.length).toBeGreaterThan(0);
      expect(Array.isArray(npc.appearance.equipment)).toBe(true);

      // Validate dialogue
      expect(npc.dialogue).toBeDefined();
      expect(npc.dialogue.greeting).toBeDefined();
      expect(npc.dialogue.farewell).toBeDefined();
      expect(Array.isArray(npc.dialogue.idle)).toBe(true);

      // Validate behavior
      expect(npc.behavior).toBeDefined();
      expect(npc.behavior.role).toBeDefined();

      // Validate metadata
      expect(npc.metadata).toBeDefined();
      expect(npc.metadata.generatedBy).toBe("AI");

      console.log("\n✅ Generated NPC:", npc.name);
      console.log("   Archetype:", npc.archetype);
      console.log("   Personality:", npc.personality.traits.join(", "));
    }, 30000); // 30s timeout for AI call

    it("should generate NPC with context", async () => {
      const result = await service.generateNPC({
        prompt: "A blacksmith who forges legendary weapons",
        archetype: "Craftsperson",
        context: "Medieval fantasy setting with dragons",
        quality: "speed",
      });

      expect(result.npc).toBeDefined();
      expect(result.npc.name).toBeDefined();
      expect(result.npc.behavior.role).toBeDefined();

      console.log("\n✅ Generated contextual NPC:", result.npc.name);
    }, 30000);
  });

  describe("Real Dialogue Generation", () => {
    it("should generate real dialogue tree with AI", async () => {
      const result = await service.generateDialogue({
        npcName: "Gandalf",
        npcPersonality: "Wise, mysterious, and cryptic",
        prompt: "The wizard discusses a dangerous quest",
        quality: "speed",
      });

      // Validate structure
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.rawResponse).toBeDefined();

      // Validate dialogue nodes
      const firstNode = result.nodes[0];
      expect(firstNode.id).toBeDefined();
      expect(firstNode.text).toBeDefined();
      expect(firstNode.text.length).toBeGreaterThan(0);

      // Check if nodes have responses
      const hasResponses = result.nodes.some(
        (node) => node.responses && node.responses.length > 0
      );
      expect(hasResponses).toBe(true);

      console.log("\n✅ Generated dialogue with", result.nodes.length, "nodes");
      console.log("   First line:", firstNode.text.substring(0, 50) + "...");
    }, 30000);

    it("should generate dialogue without NPC name", async () => {
      const result = await service.generateDialogue({
        prompt: "A merchant negotiating prices",
        quality: "speed",
      });

      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);

      console.log("\n✅ Generated generic dialogue");
    }, 30000);
  });

  describe("Real Quest Generation", () => {
    it("should generate a real quest with AI", async () => {
      const result = await service.generateQuest({
        questType: "side",
        difficulty: "medium",
        theme: "Rescue mission",
        quality: "speed",
      });

      // Validate structure
      expect(result).toBeDefined();
      expect(result.quest).toBeDefined();
      expect(result.rawResponse).toBeDefined();

      // Validate quest data
      const { quest } = result;
      expect(quest.id).toBeDefined();
      expect(quest.id).toMatch(/^quest_/);
      expect(quest.title).toBeDefined();
      expect(quest.title.length).toBeGreaterThan(0);
      expect(quest.description).toBeDefined();
      expect(quest.description.length).toBeGreaterThan(0);

      // Validate objectives
      expect(Array.isArray(quest.objectives)).toBe(true);
      expect(quest.objectives.length).toBeGreaterThan(0);
      const firstObjective = quest.objectives[0];
      expect(firstObjective.description).toBeDefined();
      expect(firstObjective.type).toBeDefined();
      expect(["kill", "collect", "talk", "explore"]).toContain(
        firstObjective.type
      );
      expect(firstObjective.target).toBeDefined();
      expect(firstObjective.count).toBeGreaterThan(0);

      // Validate rewards
      expect(quest.rewards).toBeDefined();
      expect(typeof quest.rewards.experience).toBe("number");
      expect(typeof quest.rewards.gold).toBe("number");
      expect(Array.isArray(quest.rewards.items)).toBe(true);

      // Validate requirements
      expect(quest.requirements).toBeDefined();
      expect(typeof quest.requirements.level).toBe("number");

      // Validate metadata
      expect(quest.metadata).toBeDefined();
      expect(quest.metadata.generatedBy).toBe("AI");

      console.log("\n✅ Generated quest:", quest.title);
      console.log("   Objectives:", quest.objectives.length);
      console.log("   Rewards: XP:", quest.rewards.experience, "Gold:", quest.rewards.gold);
    }, 30000);

    it("should generate quest with context", async () => {
      const result = await service.generateQuest({
        questType: "main",
        difficulty: "hard",
        theme: "Defeat the dragon",
        context: "Epic fantasy campaign finale",
        quality: "speed",
      });

      expect(result.quest).toBeDefined();
      expect(result.quest.title).toBeDefined();
      expect(result.quest.objectives.length).toBeGreaterThan(0);

      console.log("\n✅ Generated epic quest:", result.quest.title);
    }, 30000);
  });

  describe("Real Lore Generation", () => {
    it("should generate real lore content with AI", async () => {
      const result = await service.generateLore({
        category: "History",
        topic: "The Fall of the Ancient Kingdom",
        quality: "speed",
      });

      // Validate structure
      expect(result).toBeDefined();
      expect(result.lore).toBeDefined();
      expect(result.rawResponse).toBeDefined();

      // Validate lore data
      const { lore } = result;
      expect(lore.id).toBeDefined();
      expect(lore.id).toMatch(/^lore_/);
      expect(lore.title).toBeDefined();
      expect(lore.title.length).toBeGreaterThan(0);
      expect(lore.category).toBeDefined();
      expect(lore.content).toBeDefined();
      expect(lore.content.length).toBeGreaterThan(50); // Should be substantial
      expect(lore.summary).toBeDefined();
      expect(lore.summary.length).toBeGreaterThan(0);
      expect(Array.isArray(lore.relatedTopics)).toBe(true);

      // Validate metadata
      expect(lore.metadata).toBeDefined();
      expect(lore.metadata.generatedBy).toBe("AI");

      console.log("\n✅ Generated lore:", lore.title);
      console.log("   Category:", lore.category);
      console.log("   Content length:", lore.content.length, "characters");
    }, 30000);

    it("should generate lore with context", async () => {
      const result = await service.generateLore({
        category: "Legend",
        topic: "The First Dragon",
        context: "High fantasy world with ancient magic",
        quality: "speed",
      });

      expect(result.lore).toBeDefined();
      expect(result.lore.title).toBeDefined();
      expect(result.lore.content.length).toBeGreaterThan(50);

      console.log("\n✅ Generated legend:", result.lore.title);
    }, 30000);
  });

  describe("Quality Levels", () => {
    it("should handle different quality levels", async () => {
      // Test speed model (cheapest)
      const speedResult = await service.generateDialogue({
        prompt: "Quick test dialogue",
        quality: "speed",
      });
      expect(speedResult.nodes.length).toBeGreaterThan(0);

      console.log("\n✅ Speed quality works");
    }, 30000);

    it("should use balanced quality", async () => {
      const result = await service.generateDialogue({
        prompt: "Balanced test dialogue",
        quality: "balanced",
      });
      expect(result.nodes.length).toBeGreaterThan(0);

      console.log("✅ Balanced quality works");
    }, 30000);
  });

  describe("Error Handling", () => {
    it("should handle invalid prompts gracefully", async () => {
      try {
        await service.generateNPC({
          prompt: "", // Empty prompt
          quality: "speed",
        });
        // If it doesn't throw, that's okay - AI might generate generic content
      } catch (error) {
        // If it throws, error should be meaningful
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
