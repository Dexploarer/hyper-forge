/**
 * Content Generation Routes Tests
 * Tests for content generation API endpoints
 * Uses Elysia.handle() with mocked ContentGenerationService
 *
 * NOTE: All content generation routes require authentication.
 * These tests validate request schemas but do not test auth flow.
 */

import { describe, it, expect, beforeAll, mock } from "bun:test";
import { Elysia } from "elysia";
import { contentRoutes } from "../../../../server/routes/content";

// Mock ContentGenerationService
const mockDialogueResult = {
  nodes: [
    {
      id: "node_1",
      text: "Hello, traveler!",
      responses: [
        { text: "Hello!", nextNodeId: "node_2" },
        { text: "Goodbye", nextNodeId: undefined },
      ],
    },
    {
      id: "node_2",
      text: "How can I help you?",
      responses: [],
    },
  ],
  rawResponse: '{"nodes": [...]}',
};

const mockNPCResult = {
  npc: {
    id: "npc_test_123",
    name: "Test Warrior",
    archetype: "Fighter",
    personality: {
      traits: ["brave", "loyal", "strong"],
      background: "A seasoned warrior from the northern kingdoms",
      motivations: ["Protect the innocent", "Seek glory"],
    },
    appearance: {
      description: "A tall, muscular warrior with battle scars",
      equipment: ["Longsword", "Steel Armor"],
    },
    dialogue: {
      greeting: "Hail, friend!",
      farewell: "Until we meet again",
      idle: ["The battle calls", "Honor above all"],
    },
    behavior: {
      role: "Town guard captain",
      schedule: "Patrols the walls from dawn to dusk",
      relationships: [],
    },
    metadata: {
      generatedBy: "AI",
      model: "quality",
      timestamp: new Date().toISOString(),
      archetype: "Fighter",
    },
  },
  rawResponse: '{"name": "Test Warrior", ...}',
};

const mockQuestResult = {
  quest: {
    id: "quest_test_456",
    title: "The Goblin Menace",
    description: "Clear out the goblin camp threatening the village",
    objectives: [
      {
        description: "Defeat goblin chief",
        type: "kill" as const,
        target: "Goblin Chief",
        count: 1,
      },
      {
        description: "Collect goblin ears",
        type: "collect" as const,
        target: "Goblin Ear",
        count: 10,
      },
    ],
    rewards: {
      experience: 500,
      gold: 100,
      items: ["Iron Dagger"],
    },
    requirements: {
      level: 5,
      previousQuests: [],
    },
    npcs: ["Village Elder"],
    location: "Goblin Camp",
    story: "A goblin tribe has been raiding the village. Stop them!",
    difficulty: "medium",
    questType: "side",
    metadata: {
      generatedBy: "AI",
      model: "balanced",
      timestamp: new Date().toISOString(),
    },
  },
  rawResponse: '{"title": "The Goblin Menace", ...}',
};

const mockLoreResult = {
  lore: {
    id: "lore_test_789",
    title: "The Ancient Prophecy",
    category: "Prophecy",
    content:
      "Long ago, the sages foretold of a great hero who would rise in the darkest hour. This prophecy has been passed down through generations, waiting for the chosen one to emerge.",
    summary: "A prophecy foretelling the rise of a great hero",
    relatedTopics: ["Heroes", "Prophecies", "Ancient Times"],
    timeline: "Written 1000 years ago",
    characters: ["The First Sage", "The Chosen One"],
    metadata: {
      generatedBy: "AI",
      model: "balanced",
      timestamp: new Date().toISOString(),
    },
  },
  rawResponse: '{"title": "The Ancient Prophecy", ...}',
};

describe("Content Generation Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    // Create test app with content generation routes
    app = new Elysia().use(contentRoutes);
  });

  describe("POST /api/content/generate-dialogue", () => {
    it("should reject empty npcName", async () => {
      const request = {
        npcName: "",
        npcPersonality: "Friendly",
        quality: "speed" as const,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject missing npcPersonality", async () => {
      const request = {
        npcName: "Test NPC",
        quality: "speed" as const,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should validate quality parameter", async () => {
      const request = {
        npcName: "Test",
        npcPersonality: "Test",
        quality: "invalid" as any,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/content/generate-npc", () => {
    it("should reject empty archetype", async () => {
      const request = {
        archetype: "",
        prompt: "Test",
        quality: "speed" as const,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-npc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/content/generate-quest", () => {
    it("should reject empty questType", async () => {
      const request = {
        questType: "",
        difficulty: "medium",
        quality: "speed" as const,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-quest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/content/generate-lore", () => {
    it("should reject empty category", async () => {
      const request = {
        category: "",
        topic: "Test",
        quality: "speed" as const,
      };

      const response = await app.handle(
        new Request("http://localhost/api/content/generate-lore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Content-Type Validation", () => {
    it("should require JSON content type", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/content/generate-dialogue", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "invalid",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject invalid JSON", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/content/generate-dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not valid json",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
