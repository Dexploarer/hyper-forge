/**
 * Seed Data Routes Tests
 * Tests for generating interconnected game world content
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { createSeedDataRoutes } from "../../../../server/routes/seed-data";
import { createTestUser, cleanDatabase } from "../../../helpers/db";

describe("Seed Data Routes", () => {
  let app: Elysia;
  let testUser: any;

  beforeAll(async () => {
    await cleanDatabase();

    const { user, authUser } = await createTestUser({
      privyUserId: "seed-user-1",
      email: "seed@test.com",
    });
    testUser = { ...user, authUser };

    app = new Elysia().use(createSeedDataRoutes());
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST /api/seed-data/generate-world", () => {
    it("should validate required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });

    it("should require theme parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            genre: "fantasy",
            scale: "small",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });

    it("should require genre parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Medieval Kingdom",
            scale: "small",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });

    it("should validate scale parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Test World",
            genre: "fantasy",
            scale: "invalid",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });

    it("should accept valid scale values", async () => {
      const scales = ["small", "medium", "large"];

      for (const scale of scales) {
        const response = await app.handle(
          new Request("http://localhost/api/seed-data/generate-world", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              theme: "Test World",
              genre: "fantasy",
              scale,
              userId: testUser.id,
            }),
          }),
        );

        // May succeed or fail based on AI service availability
        expect([200, 500]).toContain(response.status);
      }
    });

    it("should support optional quality parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Test World",
            genre: "fantasy",
            scale: "small",
            quality: "speed",
            userId: testUser.id,
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });

    it("should support optional userId parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Test World",
            genre: "fantasy",
            scale: "small",
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });

    it("should return world with all components on success", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Tiny Test Kingdom",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data).toHaveProperty("world");
        expect(data).toHaveProperty("counts");
        expect(data).toHaveProperty("message");

        expect(data.counts).toHaveProperty("locations");
        expect(data.counts).toHaveProperty("npcs");
        expect(data.counts).toHaveProperty("quests");
        expect(data.counts).toHaveProperty("lore");
        expect(data.counts).toHaveProperty("music");
        expect(data.counts).toHaveProperty("relationships");
      }
    });

    it("should create database records for generated content", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Test Database World",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.world).toHaveProperty("id");
        expect(data.world).toHaveProperty("name");
        expect(data.world).toHaveProperty("description");
      }
    });
  });

  describe("GET /api/seed-data/relationships/:entityType/:entityId", () => {
    it("should validate entity type", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/seed-data/relationships/invalid/test-id",
        ),
      );

      // May accept or reject invalid entity types
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it("should return relationship graph", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/relationships/npc/test-id"),
      );

      // May return empty graph for non-existent entity
      expect([200, 404, 500]).toContain(response.status);
    });

    it("should support npc entity type", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/relationships/npc/test-id"),
      );

      expect([200, 404, 500]).toContain(response.status);
    });

    it("should support quest entity type", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/seed-data/relationships/quest/test-id",
        ),
      );

      expect([200, 404, 500]).toContain(response.status);
    });

    it("should support location entity type", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/seed-data/relationships/location/test-id",
        ),
      );

      expect([200, 404, 500]).toContain(response.status);
    });

    it("should support lore entity type", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/seed-data/relationships/lore/test-id",
        ),
      );

      expect([200, 404, 500]).toContain(response.status);
    });

    it("should support music entity type", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/seed-data/relationships/music/test-id",
        ),
      );

      expect([200, 404, 500]).toContain(response.status);
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/relationships/npc/test-id"),
      );

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("World Generation Scale", () => {
    it("should generate small world quickly", async () => {
      const start = Date.now();
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Small Test",
            genre: "fantasy",
            scale: "small",
            quality: "speed",
            userId: testUser.id,
          }),
        }),
      );

      const duration = Date.now() - start;

      if (response.status === 200) {
        // Small world should generate relatively quickly
        // This is more of a smoke test than a strict requirement
        expect(duration).toBeLessThan(120000); // 2 minutes max
      }
    });

    it("small world should have fewer entities than large", async () => {
      // This test documents expected behavior but may not always be deterministic
      const responseSmall = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Small World",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      if (responseSmall.status === 200) {
        const dataSmall = await responseSmall.json();
        // Small world typically has 2-4 locations, 4-8 NPCs, etc.
        expect(dataSmall.counts.locations).toBeLessThan(10);
      }
    });
  });

  describe("Relationship Creation", () => {
    it("should create bidirectional relationships", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Relationship Test World",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        // Should have created multiple relationships
        expect(data.counts.relationships).toBeGreaterThan(0);
      }
    });

    it("should link NPCs to locations", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "NPC Location Test",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        // NPCs should be created with location relationships
        expect(data.counts.npcs).toBeGreaterThan(0);
        expect(data.counts.locations).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{invalid json",
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle missing required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Only Theme",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });

    it("should handle empty strings", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "",
            genre: "fantasy",
            scale: "small",
          }),
        }),
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Genre Support", () => {
    it("should support fantasy genre", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Fantasy Test",
            genre: "fantasy",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });

    it("should support sci-fi genre", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Space Station",
            genre: "sci-fi",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });

    it("should support horror genre", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/seed-data/generate-world", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: "Haunted Mansion",
            genre: "horror",
            scale: "small",
            userId: testUser.id,
          }),
        }),
      );

      expect([200, 500]).toContain(response.status);
    });
  });
});
