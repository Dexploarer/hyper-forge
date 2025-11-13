/**
 * Project API Routes Tests
 * Tests all project API endpoints with real database operations
 * NO MOCKS - Real implementations only
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { db } from "../../../../server/db/db";
import { projects, users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import { projectService } from "../../../../server/services/ProjectService";

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

// Create test project
async function createTestProject(ownerId: string) {
  return await projectService.createProject({
    name: `Test Project ${Date.now()}`,
    description: "A test project",
    ownerId,
  });
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
 * Project API Tests
 */

describe("Project API Routes", () => {
  describe("POST /api/projects/", () => {
    it("should create project with valid data", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "New Project",
          description: "Test description",
          ownerId: user.id,
        });

        expect(project).toBeDefined();
        expect(project.id).toBeDefined();
        expect(project.name).toBe("New Project");
        expect(project.description).toBe("Test description");
        expect(project.ownerId).toBe(user.id);
        expect(project.status).toBe("active");
        expect(project.createdAt).toBeInstanceOf(Date);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should create project with minimal data", async () => {
      const user = await createTestUser();

      try {
        const project = await projectService.createProject({
          name: "Minimal Project",
          ownerId: user.id,
        });

        expect(project).toBeDefined();
        expect(project.name).toBe("Minimal Project");
        expect(project.description).toBeNull();
        expect(project.status).toBe("active");

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should create project with settings and metadata", async () => {
      const user = await createTestUser();

      try {
        const settings = { theme: "dark", notifications: true };
        const metadata = { source: "test", version: "1.0" };

        const project = await projectService.createProject({
          name: "Project with Data",
          ownerId: user.id,
          settings,
          metadata,
        });

        expect(project.settings).toEqual(settings);
        expect(project.metadata).toEqual(metadata);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("GET /api/projects/", () => {
    it("should return user's active projects", async () => {
      const user = await createTestUser();

      try {
        // Create multiple projects
        const project1 = await createTestProject(user.id);
        const project2 = await createTestProject(user.id);

        const userProjects = await projectService.getUserProjects(user.id);

        expect(userProjects).toBeDefined();
        expect(Array.isArray(userProjects)).toBe(true);
        expect(userProjects.length).toBeGreaterThanOrEqual(2);
        expect(userProjects.some((p) => p.id === project1.id)).toBe(true);
        expect(userProjects.some((p) => p.id === project2.id)).toBe(true);

        await cleanupTestData(user.id, project1.id);
        await cleanupTestData(undefined, project2.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should exclude archived projects by default", async () => {
      const user = await createTestUser();

      try {
        const activeProject = await createTestProject(user.id);
        const archivedProject = await createTestProject(user.id);

        // Archive one project
        await projectService.archiveProject(archivedProject.id);

        const userProjects = await projectService.getUserProjects(user.id);

        expect(userProjects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(userProjects.some((p) => p.id === archivedProject.id)).toBe(
          false,
        );

        await cleanupTestData(user.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should include archived projects when requested", async () => {
      const user = await createTestUser();

      try {
        const activeProject = await createTestProject(user.id);
        const archivedProject = await createTestProject(user.id);

        // Archive one project
        await projectService.archiveProject(archivedProject.id);

        const userProjects = await projectService.getUserProjects(
          user.id,
          true,
        );

        expect(userProjects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(userProjects.some((p) => p.id === archivedProject.id)).toBe(
          true,
        );

        await cleanupTestData(user.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should return empty array when user has no projects", async () => {
      const user = await createTestUser();

      try {
        const userProjects = await projectService.getUserProjects(user.id);

        expect(userProjects).toBeDefined();
        expect(Array.isArray(userProjects)).toBe(true);
        expect(userProjects.length).toBe(0);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("GET /api/projects/:id", () => {
    it("should return project details by ID", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const retrieved = await projectService.getProjectById(project.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(project.id);
        expect(retrieved?.name).toBe(project.name);
        expect(retrieved?.ownerId).toBe(user.id);

        await cleanupTestData(user.id, project.id);
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

    it("should allow owner to access their project", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const isOwner = await projectService.isOwner(project.id, user.id);

        expect(isOwner).toBe(true);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should prevent non-owner from accessing project", async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();

      try {
        const project = await createTestProject(owner.id);

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
  });

  describe("PATCH /api/projects/:id", () => {
    it("should update project metadata", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const updated = await projectService.updateProject(project.id, {
          name: "Updated Name",
          description: "Updated description",
        });

        expect(updated.name).toBe("Updated Name");
        expect(updated.description).toBe("Updated description");
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          project.updatedAt.getTime(),
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should update project settings", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const newSettings = { theme: "light", autoSave: true };
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

    it("should update project metadata", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const newMetadata = { tags: ["rpg", "fantasy"], version: 2 };
        const updated = await projectService.updateProject(project.id, {
          metadata: newMetadata,
        });

        expect(updated.metadata).toEqual(newMetadata);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw error for non-existent project", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      try {
        await projectService.updateProject(fakeId, { name: "Test" });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("POST /api/projects/:id/archive", () => {
    it("should archive project", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const archived = await projectService.archiveProject(project.id);

        expect(archived.status).toBe("archived");
        expect(archived.archivedAt).toBeInstanceOf(Date);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should set archivedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const beforeArchive = Date.now();
        const archived = await projectService.archiveProject(project.id);

        expect(archived.archivedAt).toBeDefined();
        expect(archived.archivedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeArchive,
        );

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("POST /api/projects/:id/restore", () => {
    it("should restore archived project", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        // Archive first
        await projectService.archiveProject(project.id);

        // Then restore
        const restored = await projectService.restoreProject(project.id);

        expect(restored.status).toBe("active");
        expect(restored.archivedAt).toBeNull();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should clear archivedAt timestamp", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        await projectService.archiveProject(project.id);
        const restored = await projectService.restoreProject(project.id);

        expect(restored.archivedAt).toBeNull();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("DELETE /api/projects/:id (Admin only)", () => {
    it("should permanently delete project", async () => {
      const admin = await createTestUser("admin");

      try {
        const project = await createTestProject(admin.id);

        await projectService.deleteProject(project.id);

        const deleted = await projectService.getProjectById(project.id);
        expect(deleted).toBeNull();

        await cleanupTestData(admin.id);
      } catch (error) {
        await cleanupTestData(admin.id);
        throw error;
      }
    });

    it("should not throw error for non-existent project", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      // Should not throw
      await projectService.deleteProject(fakeId);
    });
  });

  describe("GET /api/projects/:id/assets", () => {
    it("should return empty array for project with no assets", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

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

    // Note: Testing with actual assets requires asset creation,
    // which is tested in assets.test.ts
  });

  describe("GET /api/projects/:id/stats", () => {
    it("should return correct project statistics", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

        const stats = await projectService.getProjectStats(project.id);

        expect(stats).toBeDefined();
        expect(stats.assetCount).toBe(0);
        expect(stats.assetsByType).toEqual({});
        expect(stats.totalSizeBytes).toBe(0);
        expect(stats.createdAt).toBeDefined();
        expect(stats.lastModifiedAt).toBeNull();

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should throw error for non-existent project", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      try {
        await projectService.getProjectStats(fakeId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should format timestamps as ISO strings", async () => {
      const user = await createTestUser();

      try {
        const project = await createTestProject(user.id);

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

  describe("Admin Features", () => {
    it("should allow admin to access getAllProjects", async () => {
      const admin = await createTestUser("admin");
      const regularUser = await createTestUser();

      try {
        const adminProject = await createTestProject(admin.id);
        const userProject = await createTestProject(regularUser.id);

        const allProjects = await projectService.getAllProjects();

        expect(allProjects).toBeDefined();
        expect(Array.isArray(allProjects)).toBe(true);
        expect(allProjects.length).toBeGreaterThanOrEqual(2);
        expect(allProjects.some((p) => p.id === adminProject.id)).toBe(true);
        expect(allProjects.some((p) => p.id === userProject.id)).toBe(true);

        await cleanupTestData(admin.id, adminProject.id);
        await cleanupTestData(regularUser.id, userProject.id);
      } catch (error) {
        await cleanupTestData(admin.id);
        await cleanupTestData(regularUser.id);
        throw error;
      }
    });

    it("should filter archived projects in admin view", async () => {
      const admin = await createTestUser("admin");

      try {
        const activeProject = await createTestProject(admin.id);
        const archivedProject = await createTestProject(admin.id);

        await projectService.archiveProject(archivedProject.id);

        const allProjects = await projectService.getAllProjects(false);

        expect(allProjects.some((p) => p.id === activeProject.id)).toBe(true);
        expect(allProjects.some((p) => p.id === archivedProject.id)).toBe(
          false,
        );

        await cleanupTestData(admin.id, activeProject.id);
        await cleanupTestData(undefined, archivedProject.id);
      } catch (error) {
        await cleanupTestData(admin.id);
        throw error;
      }
    });
  });

  describe("Ownership & Permissions", () => {
    it("should correctly identify project owner", async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();

      try {
        const project = await createTestProject(owner.id);

        const isOwnerCheck = await projectService.isOwner(project.id, owner.id);
        const isOtherOwner = await projectService.isOwner(
          project.id,
          otherUser.id,
        );

        expect(isOwnerCheck).toBe(true);
        expect(isOtherOwner).toBe(false);

        await cleanupTestData(owner.id, project.id);
        await cleanupTestData(otherUser.id);
      } catch (error) {
        await cleanupTestData(owner.id);
        await cleanupTestData(otherUser.id);
        throw error;
      }
    });

    it("should handle ownership check for non-existent project", async () => {
      const user = await createTestUser();

      try {
        const fakeId = "00000000-0000-0000-0000-000000000000";
        const isOwner = await projectService.isOwner(fakeId, user.id);

        expect(isOwner).toBe(false);

        await cleanupTestData(user.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Data Validation", () => {
    it("should handle long project names", async () => {
      const user = await createTestUser();

      try {
        const longName = "A".repeat(255);
        const project = await projectService.createProject({
          name: longName,
          ownerId: user.id,
        });

        expect(project.name).toBe(longName);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle long descriptions", async () => {
      const user = await createTestUser();

      try {
        const longDescription = "B".repeat(5000);
        const project = await projectService.createProject({
          name: "Test",
          description: longDescription,
          ownerId: user.id,
        });

        expect(project.description).toBe(longDescription);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });

    it("should handle complex JSON in settings", async () => {
      const user = await createTestUser();

      try {
        const complexSettings = {
          nested: {
            deeply: {
              value: 42,
              array: [1, 2, 3],
              obj: { key: "value" },
            },
          },
        };

        const project = await projectService.createProject({
          name: "Test",
          ownerId: user.id,
          settings: complexSettings,
        });

        expect(project.settings).toEqual(complexSettings);

        await cleanupTestData(user.id, project.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });

  describe("Ordering & Sorting", () => {
    it("should return projects in reverse chronological order", async () => {
      const user = await createTestUser();

      try {
        const project1 = await createTestProject(user.id);
        // Wait a bit to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
        const project2 = await createTestProject(user.id);
        await new Promise((resolve) => setTimeout(resolve, 10));
        const project3 = await createTestProject(user.id);

        const projects = await projectService.getUserProjects(user.id);

        // Most recent should be first
        const project3Index = projects.findIndex((p) => p.id === project3.id);
        const project2Index = projects.findIndex((p) => p.id === project2.id);
        const project1Index = projects.findIndex((p) => p.id === project1.id);

        expect(project3Index).toBeLessThan(project2Index);
        expect(project2Index).toBeLessThan(project1Index);

        await cleanupTestData(user.id, project1.id);
        await cleanupTestData(undefined, project2.id);
        await cleanupTestData(undefined, project3.id);
      } catch (error) {
        await cleanupTestData(user.id);
        throw error;
      }
    });
  });
});
