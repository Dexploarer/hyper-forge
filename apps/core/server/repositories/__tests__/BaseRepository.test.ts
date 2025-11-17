/**
 * BaseRepository Test
 * Verifies that the base repository pattern works correctly
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../db/db";
import { apiErrors, type NewApiError } from "../../db/schema/api-errors.schema";
import { generationPipelines } from "../../db/schema/generation-pipelines.schema";
import { ApiErrorRepository } from "../ApiErrorRepository";
import { GenerationPipelineRepository } from "../GenerationPipelineRepository";
import { eq } from "drizzle-orm";

describe("BaseRepository", () => {
  const apiErrorRepo = new ApiErrorRepository();
  const pipelineRepo = new GenerationPipelineRepository();

  // Cleanup function
  const cleanupTestData = async () => {
    try {
      await db
        .delete(apiErrors)
        .where(eq(apiErrors.endpoint, "/test-base-repo"));
      await db
        .delete(generationPipelines)
        .where(eq(generationPipelines.currentStage, "test-base-repo"));
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("ApiErrorRepository (extends BaseRepository)", () => {
    test("should create a record", async () => {
      const errorData: NewApiError = {
        endpoint: "/test-base-repo",
        method: "GET",
        errorMessage: "Test error message",
        severity: "error",
        category: "application",
        context: { test: true },
      };

      const created = await apiErrorRepo.create(errorData);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.endpoint).toBe("/test-base-repo");
      expect(created.errorMessage).toBe("Test error message");
    });

    test("should find record by ID", async () => {
      const errorData: NewApiError = {
        endpoint: "/test-base-repo",
        method: "POST",
        errorMessage: "Test find by ID",
        severity: "warning",
        category: "validation",
        context: { test: true },
      };

      const created = await apiErrorRepo.create(errorData);
      const found = await apiErrorRepo.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.errorMessage).toBe("Test find by ID");
    });

    test("should find many with filters", async () => {
      // Create test errors
      await apiErrorRepo.create({
        endpoint: "/test-base-repo",
        method: "GET",
        errorMessage: "Error 1",
        severity: "error",
        category: "application",
        context: {},
      });

      await apiErrorRepo.create({
        endpoint: "/test-base-repo",
        method: "GET",
        errorMessage: "Error 2",
        severity: "critical",
        category: "application",
        context: {},
      });

      const errors = await apiErrorRepo.findMany(
        {
          endpoint: eq(apiErrors.endpoint, "/test-base-repo"),
        },
        { limit: 10 },
      );

      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.every((e) => e.endpoint === "/test-base-repo")).toBe(true);
    });

    test("should update a record", async () => {
      const errorData: NewApiError = {
        endpoint: "/test-base-repo",
        method: "PUT",
        errorMessage: "Test update",
        severity: "info",
        category: "application",
        context: {},
      };

      const created = await apiErrorRepo.create(errorData);
      const updated = await apiErrorRepo.update(created.id, {
        errorMessage: "Updated message",
        resolved: true,
      });

      expect(updated).toBeDefined();
      expect(updated?.errorMessage).toBe("Updated message");
      expect(updated?.resolved).toBe(true);
    });

    test("should count records", async () => {
      const count = await apiErrorRepo.count({
        endpoint: eq(apiErrors.endpoint, "/test-base-repo"),
      });

      expect(count).toBeGreaterThan(0);
    });

    test("should check if record exists", async () => {
      const errorData: NewApiError = {
        endpoint: "/test-base-repo",
        method: "GET",
        errorMessage: "Test exists",
        severity: "error",
        category: "application",
        context: {},
      };

      const created = await apiErrorRepo.create(errorData);
      const exists = await apiErrorRepo.exists(created.id);

      expect(exists).toBe(true);

      const notExists = await apiErrorRepo.exists(
        "00000000-0000-0000-0000-000000000000",
      );
      expect(notExists).toBe(false);
    });

    test("should delete a record", async () => {
      const errorData: NewApiError = {
        endpoint: "/test-base-repo",
        method: "DELETE",
        errorMessage: "Test delete",
        severity: "error",
        category: "application",
        context: {},
      };

      const created = await apiErrorRepo.create(errorData);
      const deleted = await apiErrorRepo.delete(created.id);

      expect(deleted).toBeDefined();
      expect(deleted?.id).toBe(created.id);

      const found = await apiErrorRepo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  // Note: GenerationPipeline tests require a valid userId that exists in the users table
  // Skipping these tests as they require database setup with user records
});
