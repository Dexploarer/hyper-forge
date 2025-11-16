/**
 * Generation Routes Tests
 * Tests for generation pipeline endpoints
 *
 * NOTE: These tests use mocked GenerationService as the actual service
 * requires external API calls (Meshy, OpenAI) which should not be called in tests.
 *
 * CRITICAL: Tests cdnUrl migration - ALL API responses must use cdnUrl, NOT modelUrl
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { createGenerationRoutes } from "../../../../server/routes/generation";

// Mock GenerationService with CDN URLs
const mockGenerationService = {
  startPipeline: async (config: any) => {
    return {
      pipelineId: "test-pipeline-123",
      status: "initiated",
      message: "Pipeline started successfully",
    };
  },
  getPipelineStatus: async (pipelineId: string) => {
    if (pipelineId === "non-existent") {
      throw new Error("Pipeline not found");
    }

    // Simulate completed pipeline with CDN URLs
    if (pipelineId === "test-pipeline-completed") {
      return {
        id: pipelineId,
        status: "completed",
        progress: 100,
        stages: {
          conceptArt: "completed",
          model3D: "completed",
          processing: "completed",
        },
        results: {
          assetId: "test-asset-123",
          cdnUrl: "https://cdn.asset-forge.com/models/test-asset-123/model.glb",
          cdnThumbnailUrl:
            "https://cdn.asset-forge.com/models/test-asset-123/thumbnail.png",
          cdnConceptArtUrl:
            "https://cdn.asset-forge.com/models/test-asset-123/concept-art.png",
        },
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: pipelineId,
      status: "processing",
      progress: 50,
      stages: {},
      results: {},
      createdAt: new Date().toISOString(),
    };
  },
};

describe("Generation Routes", () => {
  let app: Elysia;

  beforeAll(() => {
    app = new Elysia().use(
      createGenerationRoutes(mockGenerationService as any),
    );
  });

  describe("POST /api/generation/pipeline", () => {
    it("should start generation pipeline with valid config", async () => {
      const config = {
        description: "Test asset generation",
        assetId: "test-asset-123",
        name: "Test Asset",
        type: "weapon",
        subtype: "sword",
      };

      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pipelineId).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.message).toBeDefined();
    });

    it("should reject empty description", async () => {
      const config = {
        description: "",
        assetId: "test-asset",
        name: "Test",
        type: "weapon",
        subtype: "sword",
      };

      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject missing required fields", async () => {
      const config = {
        description: "Test",
        // Missing other required fields
      };

      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }),
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should work without authentication (optional auth)", async () => {
      const config = {
        description: "Public test",
        assetId: "test-asset",
        name: "Test",
        type: "weapon",
        subtype: "sword",
      };

      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/generation/pipeline/:pipelineId", () => {
    it("should return pipeline status", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/pipeline/test-pipeline-123",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("test-pipeline-123");
      expect(data.status).toBeDefined();
      expect(data.progress).toBeDefined();
    });

    it("should handle non-existent pipeline", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline/non-existent"),
      );

      // Should return error status
      expect([404, 500]).toContain(response.status);
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/pipeline/test-pipeline"),
      );

      // No 401 error expected
      expect(response.status).not.toBe(401);
    });
  });

  describe("CDN URL Migration Tests", () => {
    it("should return cdnUrl in completed pipeline results", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/pipeline/test-pipeline-completed",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify CDN URLs are present
      expect(data.results).toHaveProperty("cdnUrl");
      expect(data.results.cdnUrl).toContain("cdn.asset-forge.com");
      expect(data.results.cdnUrl).toContain("/models/");
      expect(data.results.cdnUrl).toMatch(/\.glb$/);

      // Verify NO legacy modelUrl
      expect(data.results).not.toHaveProperty("modelUrl");
      expect(data.results).not.toHaveProperty("filePath");
      expect(data.results).not.toHaveProperty("modelPath");
    });

    it("should return cdnThumbnailUrl in completed pipeline", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/pipeline/test-pipeline-completed",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.results).toHaveProperty("cdnThumbnailUrl");
      expect(data.results.cdnThumbnailUrl).toContain("cdn.asset-forge.com");
      expect(data.results.cdnThumbnailUrl).toContain("thumbnail.png");
    });

    it("should return cdnConceptArtUrl in completed pipeline", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/pipeline/test-pipeline-completed",
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.results).toHaveProperty("cdnConceptArtUrl");
      expect(data.results.cdnConceptArtUrl).toContain("cdn.asset-forge.com");
      expect(data.results.cdnConceptArtUrl).toContain("concept-art.png");
    });

    it("should NOT include modelUrl in any pipeline response", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/pipeline/test-pipeline-completed",
        ),
      );

      const data = await response.json();
      const jsonString = JSON.stringify(data);

      // Ensure no legacy field names appear anywhere
      expect(jsonString).not.toContain("modelUrl");
      expect(jsonString).not.toContain("filePath");
      expect(jsonString).not.toContain("modelPath");
    });
  });
});
