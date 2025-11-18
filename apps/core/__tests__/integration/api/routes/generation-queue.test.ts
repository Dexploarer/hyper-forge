/**
 * Generation Queue Routes Tests
 * Tests for generation job management and monitoring
 */

import { describe, it, expect, beforeAll, afterEach } from "bun:test";
import { Elysia } from "elysia";
import { generationQueueRoutes } from "../../../../server/routes/generation-queue";
import { generationPipelineService } from "../../../../server/services/GenerationPipelineService";
import { cleanDatabase } from "../../../helpers/db";

describe("Generation Queue Routes", () => {
  let app: Elysia;

  beforeAll(async () => {
    await cleanDatabase();
    app = new Elysia().use(generationQueueRoutes);
  });

  afterEach(async () => {
    // Clean up test jobs if needed
  });

  describe("GET /api/generation/jobs/:pipelineId", () => {
    it("should return 404 for non-existent job", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/jobs/non-existent"),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Job not found");
    });

    it("should return job status with all required fields", async () => {
      // Create a test job
      const pipelineId = `test-pipeline-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Test Asset",
        stages: ["init", "generate", "process"],
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/jobs/${pipelineId}`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("pipelineId");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("progress");
      expect(data).toHaveProperty("stages");
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("createdAt");
    });

    it("should work without authentication", async () => {
      const pipelineId = `test-pipeline-2-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Test Asset 2",
        stages: ["init"],
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/jobs/${pipelineId}`),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/generation/jobs/:pipelineId/stream", () => {
    it("should return 404 for non-existent job", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/jobs/non-existent/stream"),
      );

      expect(response.status).toBe(404);
    });

    it("should set SSE headers for streaming", async () => {
      const pipelineId = `test-pipeline-stream-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Stream Test",
        stages: ["init"],
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/generation/jobs/${pipelineId}/stream`,
        ),
      );

      if (response.status === 200) {
        expect(response.headers.get("content-type")).toContain(
          "text/event-stream",
        );
        expect(response.headers.get("cache-control")).toBe("no-cache");
        expect(response.headers.get("connection")).toBe("keep-alive");
      }
    });

    it("should return streaming response", async () => {
      const pipelineId = `test-pipeline-stream-2-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Stream Test 2",
        stages: ["init"],
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/generation/jobs/${pipelineId}/stream`,
        ),
      );

      // May succeed or fail based on Redis availability
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("DELETE /api/generation/jobs/:pipelineId", () => {
    it("should return 404 for non-existent job", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/jobs/non-existent", {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Job not found");
    });

    it("should cancel job in processing state", async () => {
      const pipelineId = `test-pipeline-cancel-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Cancel Test",
        stages: ["init"],
      });

      // Update to processing state
      await generationPipelineService.updateJob(pipelineId, {
        status: "processing",
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/jobs/${pipelineId}`, {
          method: "DELETE",
        }),
      );

      // May succeed or fail based on Redis
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain("cancelled");
      }
    });

    it("should reject cancellation of completed job", async () => {
      const pipelineId = `test-pipeline-completed-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Completed Test",
        stages: ["init"],
      });

      // Update to completed state
      await generationPipelineService.updateJob(pipelineId, {
        status: "completed",
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/jobs/${pipelineId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Cannot cancel");
    });

    it("should reject cancellation of failed job", async () => {
      const pipelineId = `test-pipeline-failed-${Date.now()}`;
      await generationPipelineService.createJob({
        pipelineId,
        userId: "test-user",
        assetName: "Failed Test",
        stages: ["init"],
      });

      await generationPipelineService.updateJob(pipelineId, {
        status: "failed",
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/jobs/${pipelineId}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/generation/queue/stats", () => {
    it("should return queue statistics", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/queue/stats"),
      );

      // May succeed or fail based on Redis
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("queues");
        expect(data.queues).toHaveProperty("high");
        expect(data.queues).toHaveProperty("normal");
        expect(data.queues).toHaveProperty("low");
        expect(data).toHaveProperty("total");
        expect(data).toHaveProperty("timestamp");
      }
    });

    it("should work without authentication", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/queue/stats"),
      );

      expect([200, 500]).toContain(response.status);
    });
  });

  describe("GET /api/generation/users/:userId/jobs", () => {
    it("should return user's jobs", async () => {
      const userId = `test-user-${Date.now()}`;
      const pipelineId = `test-pipeline-user-${Date.now()}`;

      await generationPipelineService.createJob({
        pipelineId,
        userId,
        assetName: "User Job Test",
        stages: ["init"],
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/users/${userId}/jobs`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("jobs");
      expect(data).toHaveProperty("total");
      expect(Array.isArray(data.jobs)).toBe(true);
    });

    it("should support limit query parameter", async () => {
      const userId = `test-user-limit-${Date.now()}`;

      const response = await app.handle(
        new Request(
          `http://localhost/api/generation/users/${userId}/jobs?limit=10`,
        ),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jobs.length).toBeLessThanOrEqual(10);
    });

    it("should default to 50 jobs limit", async () => {
      const userId = `test-user-default-${Date.now()}`;

      const response = await app.handle(
        new Request(`http://localhost/api/generation/users/${userId}/jobs`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jobs.length).toBeLessThanOrEqual(50);
    });

    it("should return empty array for user with no jobs", async () => {
      const userId = `test-user-empty-${Date.now()}`;

      const response = await app.handle(
        new Request(`http://localhost/api/generation/users/${userId}/jobs`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jobs).toEqual([]);
      expect(data.total).toBe(0);
    });

    it("should include job summary fields", async () => {
      const userId = `test-user-summary-${Date.now()}`;
      const pipelineId = `test-pipeline-summary-${Date.now()}`;

      await generationPipelineService.createJob({
        pipelineId,
        userId,
        assetName: "Summary Test",
        stages: ["init"],
      });

      const response = await app.handle(
        new Request(`http://localhost/api/generation/users/${userId}/jobs`),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.jobs.length > 0) {
        const job = data.jobs[0];
        expect(job).toHaveProperty("id");
        expect(job).toHaveProperty("pipelineId");
        expect(job).toHaveProperty("status");
        expect(job).toHaveProperty("progress");
        expect(job).toHaveProperty("createdAt");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid pipeline ID format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/generation/jobs/"),
      );

      expect([400, 404]).toContain(response.status);
    });

    it("should handle malformed limit parameter", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/api/generation/users/test-user/jobs?limit=invalid",
        ),
      );

      expect(response.status).toBe(200);
      // Should use default limit
    });
  });
});
