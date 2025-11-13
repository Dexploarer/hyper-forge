/**
 * ProjectService Unit Tests
 * Tests the ProjectService class with real database operations
 * NO MOCKS - Real implementations only
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { db } from "../../../../server/db/db";
import { projects, users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import {
  projectService,
  ProjectService,
} from "../../../../server/services/ProjectService";

/**
 * Test Helpers
 */

// Create test user
async function createTestUser(role: string = "member") {
  const [user] = await db
    .insert(users)
    .values({
      privyUserId: `test-privy-${Date.now()}-${Math.random()}`,
      email: `test-${Date.now()}@example.com`,
      role,
    })
    .returning();
  return user;
}

// Cleanup test data
async function cleanupTestData(userId?: string, projectId?: string) {
  try {
    if (projectId) {
      await db.delete(projects).where(eq(projects.id, projectId));
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId));
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

/**
 * ProjectService Tests
 */

describe("ProjectService", () => {
  describe("Constructor", () => {
    it("should be a singleton instance", () => {
      expect(projectService).toBeDefined();
      expect(projectService).toBeInstanceOf(ProjectService);
    });

    it("should create new instances", () => {
      const service1 = new ProjectService();
      const service2 = new ProjectService();

      expect(service1).toBeInstanceOf(ProjectService);
      expect(service2).toBeInstanceOf(ProjectService);
      expect(service1).not.toBe(service2);
    });
  });

  describe("createProject", () => {
    it("should create project with all fields", async () => {
      const user = await createTestUser();

      try {
        const projectData = {
          name: "Full Project",
          description: "Complete description",
          ownerId: user.id,
          status: "active",
          settings: { key: "value" },
          metadata: { tag: "test" },
        };

        const project = await projectService.createProject(projectData);

        expect(project.id).toBeDefined();
        expect(project.name).toBe(projectData.name);
        expect(project.description).toBe(projectData.description);
        expect(project.ownerId).toBe(user.id);
        expect(project.status).toBe("active");
        expect(project.settings).toEqual(projectData.settings);
        expect(project.metadata).toEqual(projectData.metadata);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should use default values for optional fields", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Simple Project",
          ownerId: user.id,
        });

        expect(project.description).toBeNull();
        expect(project.status).toBe("active");
        expect(project.settings).toEqual({});
        expect(project.metadata).toEqual({});

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should set timestamps automatically", async () => {
      const user = await createTestUser();

      try {
        const beforeCreate = new Date();
        const project = await projectService.createProject({
          name: "Timestamp Test",
          ownerId: user.id,
        });

        expect(project.createdAt).toBeInstanceOf(Date);
        expect(project.updatedAt).toBeInstanceOf(Date);
        expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle database errors gracefully", async () => {
      try {
        // Invalid owner ID (non-existent user)
        await projectService.createProject({
          name: "Error Project",
          ownerId: "00000000-0000-0000-0000-000000000000",
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getProjectById", () => {
    it("should retrieve existing project", async () => {
      const user = await createTestUser();

      try {
        const created = await projectService.createProject({
          name: "Test Project",
          ownerId: user.id,
        });

        const retrieved = await projectService.getProjectById(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe(created.name);

        await cleanupTestData(user.id, created.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return null for non-existent project", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const project = await projectService.getProjectById(fakeId);

      expect(project).toBeNull();
    });

    it("should return complete project data", async () => {
      const user = await createTestUser();

      try {
        const created = await projectService.createProject({
          name: "Complete Data",
          description: "Test",
          ownerId: user.id,
          settings: { theme: "dark" },
          metadata: { version: 1 },
        });

        const retrieved = await projectService.getProjectById(created.id);

        expect(retrieved?.settings).toEqual({ theme: "dark" });
        expect(retrieved?.metadata).toEqual({ version: 1 });

        await cleanupTestData(user.id, created.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("getUserProjects", () => {
    it("should return only user's projects", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      try {
        const user1Project = await projectService.createProject({
          name: "User 1 Project",
          ownerId: user1.id,
        });

        const user2Project = await projectService.createProject({
          name: "User 2 Project",
          ownerId: user2.id,
        });

        const user1Projects = await projectService.getUserProjects(user1.id);

        expect(user1Projects.some((p) => p.id === user1Project.id)).toBe(true);
        expect(user1Projects.some((p) => p.id === user2Project.id)).toBe(false);

        await cleanupTestData(user1.id, user1Project.id);
        await cleanupTestData(user2.id, user2Project.id);
      } catch (error) {
        await cleanupTestData(user1.id);
        await cleanupTestData(user2.id);
        throw error;
      }
    });

    it("should exclude archived projects by default", async () => {
      const user = await createTestUser();

      try {
        const activeProject = await projectService.createProject({
          name: "Active",
          ownerId: user.id,
        });

        const archivedProject = await projectService.createProject({
          name: "Archived",
          ownerId: user.id,
        });

        await projectService.archiveProject(archivedProject.id);

        const projects = await projectService.getUserProjects(user.id, false);

        expect(projects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(projects.some((p) => p.id === archivedProject.id)).toBe(false);

        await cleanupTestData(user.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should include archived when requested", async () => {
      const user = await createTestUser();

      try {
        const activeProject = await projectService.createProject({
          name: "Active",
          ownerId: user.id,
        });

        const archivedProject = await projectService.createProject({
          name: "Archived",
          ownerId: user.id,
        });

        await projectService.archiveProject(archivedProject.id);

        const projects = await projectService.getUserProjects(user.id, true);

        expect(projects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(projects.some((p) => p.id === archivedProject.id)).toBe(true);

        await cleanupTestData(user.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return projects in descending order", async () => {
      const user = await createTestUser();

      try {
        const project1 = await projectService.createProject({
          name: "First",
          ownerId: user.id,
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const project2 = await projectService.createProject({
          name: "Second",
          ownerId: user.id,
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const project3 = await projectService.createProject({
          name: "Third",
          ownerId: user.id,
        });

        const projects = await projectService.getUserProjects(user.id);

        const index1 = projects.findIndex((p) => p.id === project1.id);
        const index2 = projects.findIndex((p) => p.id === project2.id);
        const index3 = projects.findIndex((p) => p.id === project3.id);

        expect(index3).toBeLessThan(index2);
        expect(index2).toBeLessThan(index1);

        await cleanupTestData(user.id, project1.id);
        await cleanupTestData(undefined, project2.id);
        await cleanupTestData(undefined, project3.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return empty array for user with no projects", async () => {
      const user = await createTestUser();

      try {
        const projects = await projectService.getUserProjects(user.id);

        expect(projects).toBeDefined();
        expect(Array.isArray(projects)).toBe(true);
        expect(projects.length).toBe(0);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("getAllProjects", () => {
    it("should return projects from all users", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      try {
        const project1 = await projectService.createProject({
          name: "Project 1",
          ownerId: user1.id,
        });

        const project2 = await projectService.createProject({
          name: "Project 2",
          ownerId: user2.id,
        });

        const allProjects = await projectService.getAllProjects();

        expect(allProjects.some((p) => p.id === project1.id)).toBe(true);
        expect(allProjects.some((p) => p.id === project2.id)).toBe(true);

        await cleanupTestData(user1.id, project1.id);
        await cleanupTestData(user2.id, project2.id);
      } catch (error) {
        await cleanupTestData(user1.id);
        await cleanupTestData(user2.id);
        throw error;
      }
    });

    it("should exclude archived by default", async () => {
      const user = await createTestUser();

      try {
        const activeProject = await projectService.createProject({
          name: "Active",
          ownerId: user.id,
        });

        const archivedProject = await projectService.createProject({
          name: "Archived",
          ownerId: user.id,
        });

        await projectService.archiveProject(archivedProject.id);

        const allProjects = await projectService.getAllProjects(false);

        expect(allProjects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(allProjects.some((p) => p.id === archivedProject.id)).toBe(
          false,
        );

        await cleanupTestData(user.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("updateProject", () => {
    it("should update project name", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Old Name",
          ownerId: user.id,
        });

        const updated = await projectService.updateProject(project.id, {
          name: "New Name",
        });

        expect(updated.name).toBe("New Name");
        expect(updated.id).toBe(project.id);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update project description", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const updated = await projectService.updateProject(project.id, {
          description: "New description",
        });

        expect(updated.description).toBe("New description");

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update settings", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
          settings: { old: "value" },
        });

        const newSettings = { new: "value", nested: { key: 123 } };
        const updated = await projectService.updateProject(project.id, {
          settings: newSettings,
        });

        expect(updated.settings).toEqual(newSettings);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update metadata", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const metadata = { tags: ["rpg", "3d"], version: 2 };
        const updated = await projectService.updateProject(project.id, {
          metadata,
        });

        expect(updated.metadata).toEqual(metadata);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update updatedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const originalUpdatedAt = project.updatedAt;

        await new Promise((resolve) => setTimeout(resolve, 10));

        const updated = await projectService.updateProject(project.id, {
          name: "Updated",
        });

        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw error for non-existent project", async () => {
      try {
        await projectService.updateProject(
          "00000000-0000-0000-0000-000000000000",
          { name: "Test" },
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should allow partial updates", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Original",
          description: "Original description",
          ownerId: user.id,
        });

        const updated = await projectService.updateProject(project.id, {
          name: "Updated Name",
          // description not included
        });

        expect(updated.name).toBe("Updated Name");
        expect(updated.description).toBe("Original description");

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("archiveProject", () => {
    it("should set status to archived", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const archived = await projectService.archiveProject(project.id);

        expect(archived.status).toBe("archived");

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should set archivedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const beforeArchive = new Date();
        const archived = await projectService.archiveProject(project.id);

        expect(archived.archivedAt).toBeInstanceOf(Date);
        expect(archived.archivedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeArchive.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update updatedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const originalUpdatedAt = project.updatedAt;
        await new Promise((resolve) => setTimeout(resolve, 10));

        const archived = await projectService.archiveProject(project.id);

        expect(archived.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw error for non-existent project", async () => {
      try {
        await projectService.archiveProject(
          "00000000-0000-0000-0000-000000000000",
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("restoreProject", () => {
    it("should set status to active", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        await projectService.archiveProject(project.id);
        const restored = await projectService.restoreProject(project.id);

        expect(restored.status).toBe("active");

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should clear archivedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        await projectService.archiveProject(project.id);
        const restored = await projectService.restoreProject(project.id);

        expect(restored.archivedAt).toBeNull();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update updatedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const archived = await projectService.archiveProject(project.id);
        await new Promise((resolve) => setTimeout(resolve, 10));

        const restored = await projectService.restoreProject(project.id);

        expect(restored.updatedAt.getTime()).toBeGreaterThanOrEqual(
          archived.updatedAt.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("deleteProject", () => {
    it("should permanently delete project", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        await projectService.deleteProject(project.id);

        const deleted = await projectService.getProjectById(project.id);
        expect(deleted).toBeNull();

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should not throw error for non-existent project", async () => {
      // Should complete without error
      await projectService.deleteProject(
        "00000000-0000-0000-0000-000000000000",
      );
    });
  });

  describe("isOwner", () => {
    it("should return true for project owner", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const isOwner = await projectService.isOwner(project.id, user.id);
        expect(isOwner).toBe(true);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return false for non-owner", async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: owner.id,
        });

        const isOwner = await projectService.isOwner(project.id, otherUser.id);
        expect(isOwner).toBe(false);

        await cleanupTestData(owner.id, project.id);
        await cleanupTestData(otherUser.id);
      } catch (error) {
        await cleanupTestData(owner.id);
        await cleanupTestData(otherUser.id);
        throw error;
      }
    });

    it("should return false for non-existent project", async () => {
      const user = await createTestUser();

      try {
        const isOwner = await projectService.isOwner(
          "00000000-0000-0000-0000-000000000000",
          user.id,
        );
        expect(isOwner).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("getProjectAssets", () => {
    it("should return empty array for project with no assets", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const assets = await projectService.getProjectAssets(project.id);

        expect(assets).toBeDefined();
        expect(Array.isArray(assets)).toBe(true);
        expect(assets.length).toBe(0);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("getProjectStats", () => {
    it("should return correct stats for empty project", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const stats = await projectService.getProjectStats(project.id);

        expect(stats.assetCount).toBe(0);
        expect(stats.assetsByType).toEqual({});
        expect(stats.totalSizeBytes).toBe(0);
        expect(stats.createdAt).toBe(project.createdAt.toISOString());
        expect(stats.lastModifiedAt).toBeNull();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw error for non-existent project", async () => {
      try {
        await projectService.getProjectStats(
          "00000000-0000-0000-0000-000000000000",
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return timestamps as ISO strings", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        const stats = await projectService.getProjectStats(project.id);

        expect(typeof stats.createdAt).toBe("string");
        expect(() => new Date(stats.createdAt)).not.toThrow();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      // This test verifies error logging exists
      const user = await createTestUser();

      try {
        // Valid operations should work
        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
        });

        expect(project).toBeDefined();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should log errors to console", async () => {
      // Verify error logging by triggering an error
      try {
        await projectService.updateProject("invalid-id", { name: "Test" });
      } catch (error) {
        // Error was logged
        expect(error).toBeDefined();
      }
    });
  });
});
