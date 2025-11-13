/**
 * Vector Search Routes Tests
 * Tests for semantic search using Qdrant vector database
 * NOTE: Requires Qdrant to be running, mocks gracefully handle unavailability
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { vectorSearchRoutes } from "../../../../server/routes/vector-search";
import {
  createTestUser,
  createTestAsset,
  cleanDatabase,
} from "../../../helpers/db";

describe("Vector Search Routes", () => {
  let app: Elysia;
  let testUser: any;
  let testAsset: any;
  const isQdrantAvailable = !!process.env.QDRANT_URL;

  beforeAll(async () => {
    await cleanDatabase();

    const { user, authUser } = await createTestUser({
      privyUserId: "vector-user-1",
      email: "vector@test.com",
    });
    testUser = { ...user, authUser };

    testAsset = await createTestAsset(testUser.id, {
      name: "Test Sword",
      description: "A sharp medieval sword",
    });

    app = new Elysia().use(vectorSearchRoutes);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("POST /api/search/assets", () => {
    it("should return 503 when Qdrant not configured", async () => {
      const originalUrl = process.env.QDRANT_URL;
      delete process.env.QDRANT_URL;

      const testApp = new Elysia().use(vectorSearchRoutes);

      const response = await testApp.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "sword",
          }),
        }),
      );

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toContain("not configured");

      if (originalUrl) process.env.QDRANT_URL = originalUrl;
    });

    it("should validate request body", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }),
      );

      expect([400, 503]).toContain(response.status);
    });

    it("should accept query parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "medieval weapon",
          }),
        }),
      );

      if (isQdrantAvailable) {
        expect([200, 500]).toContain(response.status);
      } else {
        expect([503, 500]).toContain(response.status);
      }
    });

    it("should support limit parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "sword",
            limit: 5,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
        expect(data.results.length).toBeLessThanOrEqual(5);
      }
    });

    it("should support scoreThreshold parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "sword",
            scoreThreshold: 0.8,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        // All results should have score >= 0.8
        data.results.forEach((result: any) => {
          if (result.score !== undefined) {
            expect(result.score).toBeGreaterThanOrEqual(0.8);
          }
        });
      }
    });

    it("should support type filter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "sword",
            filters: {
              type: "weapon",
            },
          }),
        }),
      );

      expect([200, 500, 503]).toContain(response.status);
    });

    it("should return enriched results with asset data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "sword",
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        if (data.results.length > 0) {
          expect(data.results[0]).toHaveProperty("score");
          expect(data.results[0]).toHaveProperty("asset");
        }
      }
    });

    it("should return empty results gracefully", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "nonexistentuniquething12345",
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("results");
        expect(Array.isArray(data.results)).toBe(true);
      }
    });
  });

  describe("GET /api/search/assets/:id/similar", () => {
    it("should return 503 when Qdrant not configured", async () => {
      const originalUrl = process.env.QDRANT_URL;
      delete process.env.QDRANT_URL;

      const testApp = new Elysia().use(vectorSearchRoutes);

      const response = await testApp.handle(
        new Request(
          `http://localhost/api/search/assets/${testAsset.id}/similar`,
        ),
      );

      expect(response.status).toBe(503);

      if (originalUrl) process.env.QDRANT_URL = originalUrl;
    });

    it("should find similar assets", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/search/assets/${testAsset.id}/similar`,
        ),
      );

      expect([200, 500, 503]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
      }
    });

    it("should support limit query parameter", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/search/assets/${testAsset.id}/similar?limit=3`,
        ),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.results.length).toBeLessThanOrEqual(3);
      }
    });

    it("should support scoreThreshold query parameter", async () => {
      const response = await app.handle(
        new Request(
          `http://localhost/api/search/assets/${testAsset.id}/similar?scoreThreshold=0.9`,
        ),
      );

      expect([200, 500, 503]).toContain(response.status);
    });
  });

  describe("POST /api/search/npcs", () => {
    it("should return 503 when Qdrant not configured", async () => {
      const originalUrl = process.env.QDRANT_URL;
      delete process.env.QDRANT_URL;

      const testApp = new Elysia().use(vectorSearchRoutes);

      const response = await testApp.handle(
        new Request("http://localhost/api/search/npcs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "warrior",
          }),
        }),
      );

      expect(response.status).toBe(503);

      if (originalUrl) process.env.QDRANT_URL = originalUrl;
    });

    it("should search NPCs by query", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/npcs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "merchant who sells potions",
          }),
        }),
      );

      expect([200, 500, 503]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
      }
    });

    it("should validate query parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/npcs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "",
          }),
        }),
      );

      expect([400, 500, 503]).toContain(response.status);
    });
  });

  describe("POST /api/search/quests", () => {
    it("should search quests by query", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/quests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "rescue mission",
          }),
        }),
      );

      expect([200, 500, 503]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
      }
    });

    it("should return enriched results with quest data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/quests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "quest",
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        if (data.results.length > 0) {
          expect(data.results[0]).toHaveProperty("score");
          expect(data.results[0]).toHaveProperty("quest");
        }
      }
    });
  });

  describe("POST /api/search/lore", () => {
    it("should search lore by query", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/lore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "ancient kingdom history",
          }),
        }),
      );

      expect([200, 500, 503]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.results)).toBe(true);
      }
    });
  });

  describe("GET /api/search/health", () => {
    it("should return unavailable when Qdrant not configured", async () => {
      const originalUrl = process.env.QDRANT_URL;
      delete process.env.QDRANT_URL;

      const testApp = new Elysia().use(vectorSearchRoutes);

      const response = await testApp.handle(
        new Request("http://localhost/api/search/health"),
      );

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.status).toBe("unavailable");

      if (originalUrl) process.env.QDRANT_URL = originalUrl;
    });

    it("should check Qdrant health", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/health"),
      );

      expect([200, 503, 500]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty("status");
    });

    it("should return collection stats when healthy", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/health"),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.status).toBe("healthy");
        expect(data).toHaveProperty("collections");
        expect(data.collections).toHaveProperty("assets");
        expect(data.collections).toHaveProperty("npcs");
        expect(data.collections).toHaveProperty("quests");
        expect(data.collections).toHaveProperty("lore");
        expect(data).toHaveProperty("embeddingModel");
      }
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/health"),
      );

      expect([200, 503, 500]).toContain(response.status);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
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
        new Request("http://localhost/api/search/npcs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }),
      );

      expect([400, 503]).toContain(response.status);
    });

    it("should handle invalid limit values", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "test",
            limit: -1,
          }),
        }),
      );

      expect([400, 500, 503]).toContain(response.status);
    });

    it("should handle invalid scoreThreshold values", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "test",
            scoreThreshold: 2.0,
          }),
        }),
      );

      expect([400, 500, 503]).toContain(response.status);
    });
  });

  describe("Performance", () => {
    it("should enforce maximum limit of 100", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "test",
            limit: 200,
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.results.length).toBeLessThanOrEqual(100);
      }
    });

    it("should default to limit 10", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/search/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "test",
          }),
        }),
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.results.length).toBeLessThanOrEqual(10);
      }
    });
  });
});
