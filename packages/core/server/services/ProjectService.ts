/**
 * Project Service
 * Manages project database operations
 */

import { db } from "../db/db";
import { projects, type Project, type NewProject } from "../db/schema";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

export interface ProjectCreateData {
  name: string;
  description?: string;
  ownerId: string;
  status?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  status?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class ProjectService {
  /**
   * Create new project
   */
  async createProject(data: ProjectCreateData): Promise<Project> {
    try {
      const [project] = await db
        .insert(projects)
        .values({
          name: data.name,
          description: data.description || null,
          ownerId: data.ownerId,
          status: data.status || "active",
          settings: data.settings || {},
          metadata: data.metadata || {},
        })
        .returning();

      console.log(`[ProjectService] Created project: ${project.id}`);
      return project;
    } catch (error) {
      console.error("[ProjectService] Failed to create project:", error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });

      return project || null;
    } catch (error) {
      console.error("[ProjectService] Failed to get project:", error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(
    userId: string,
    includeArchived: boolean = false,
  ): Promise<Project[]> {
    try {
      const query = includeArchived
        ? db.query.projects.findMany({
            where: eq(projects.ownerId, userId),
            orderBy: [desc(projects.createdAt)],
          })
        : db.query.projects.findMany({
            where: and(
              eq(projects.ownerId, userId),
              eq(projects.status, "active"),
            ),
            orderBy: [desc(projects.createdAt)],
          });

      return await query;
    } catch (error) {
      console.error("[ProjectService] Failed to get user projects:", error);
      throw error;
    }
  }

  /**
   * Get all projects (admin only)
   */
  async getAllProjects(includeArchived: boolean = false): Promise<Project[]> {
    try {
      const query = includeArchived
        ? db.query.projects.findMany({
            orderBy: [desc(projects.createdAt)],
          })
        : db.query.projects.findMany({
            where: eq(projects.status, "active"),
            orderBy: [desc(projects.createdAt)],
          });

      return await query;
    } catch (error) {
      console.error("[ProjectService] Failed to get all projects:", error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    updates: ProjectUpdateData,
  ): Promise<Project> {
    try {
      const [updatedProject] = await db
        .update(projects)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!updatedProject) {
        throw new Error(`Project not found: ${id}`);
      }

      console.log(`[ProjectService] Updated project: ${id}`);
      return updatedProject;
    } catch (error) {
      console.error("[ProjectService] Failed to update project:", error);
      throw error;
    }
  }

  /**
   * Archive project (soft delete)
   */
  async archiveProject(id: string): Promise<Project> {
    try {
      const [archivedProject] = await db
        .update(projects)
        .set({
          status: "archived",
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!archivedProject) {
        throw new Error(`Project not found: ${id}`);
      }

      console.log(`[ProjectService] Archived project: ${id}`);
      return archivedProject;
    } catch (error) {
      console.error("[ProjectService] Failed to archive project:", error);
      throw error;
    }
  }

  /**
   * Restore archived project
   */
  async restoreProject(id: string): Promise<Project> {
    try {
      const [restoredProject] = await db
        .update(projects)
        .set({
          status: "active",
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!restoredProject) {
        throw new Error(`Project not found: ${id}`);
      }

      console.log(`[ProjectService] Restored project: ${id}`);
      return restoredProject;
    } catch (error) {
      console.error("[ProjectService] Failed to restore project:", error);
      throw error;
    }
  }

  /**
   * Delete project (hard delete)
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await db.delete(projects).where(eq(projects.id, id));

      console.log(`[ProjectService] Deleted project: ${id}`);
    } catch (error) {
      console.error("[ProjectService] Failed to delete project:", error);
      throw error;
    }
  }

  /**
   * Check if user owns project
   */
  async isOwner(projectId: string, userId: string): Promise<boolean> {
    try {
      const project = await this.getProjectById(projectId);
      return project?.ownerId === userId;
    } catch (error) {
      console.error("[ProjectService] Failed to check ownership:", error);
      return false;
    }
  }

  /**
   * Get all assets for a project
   */
  async getProjectAssets(
    projectId: string,
    filters?: { type?: string; status?: string },
  ): Promise<any[]> {
    try {
      // Import assets schema
      const { assets } = await import("../db/schema");

      // Build where conditions
      const whereConditions: any[] = [eq(assets.projectId, projectId)];

      if (filters?.type) {
        whereConditions.push(eq(assets.type, filters.type));
      }

      if (filters?.status) {
        whereConditions.push(eq(assets.status, filters.status));
      }

      // Query assets
      const projectAssets = await db.query.assets.findMany({
        where: and(...whereConditions),
        orderBy: [desc(assets.createdAt)],
      });

      return projectAssets;
    } catch (error) {
      console.error("[ProjectService] Failed to get project assets:", error);
      throw error;
    }
  }

  /**
   * Get project statistics
   * Optimized with SQL aggregation to avoid N+1 queries
   */
  async getProjectStats(projectId: string): Promise<{
    assetCount: number;
    assetsByType: Record<string, number>;
    totalSizeBytes: number;
    createdAt: string;
    lastModifiedAt: string | null;
  }> {
    try {
      // Import assets schema
      const { assets } = await import("../db/schema");

      // Get project
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Count total assets using SQL aggregation
      const [assetCountResult] = await db
        .select({ count: count() })
        .from(assets)
        .where(eq(assets.projectId, projectId));
      const assetCount = Number(assetCountResult.count);

      // Count assets by type using SQL GROUP BY
      const assetsByTypeResults = await db
        .select({
          type: assets.type,
          count: count(),
        })
        .from(assets)
        .where(eq(assets.projectId, projectId))
        .groupBy(assets.type);

      const assetsByType: Record<string, number> = {};
      for (const result of assetsByTypeResults) {
        const type = result.type || "unknown";
        assetsByType[type] = Number(result.count);
      }

      // Sum file sizes using SQL aggregation
      const [sizeResult] = await db
        .select({
          totalSize: sum(assets.fileSize),
        })
        .from(assets)
        .where(eq(assets.projectId, projectId));
      const totalSizeBytes = Number(sizeResult.totalSize || 0);

      // Get most recent asset update using SQL MAX
      const [lastUpdateResult] = await db
        .select({
          lastUpdate: sql<Date | null>`MAX(${assets.updatedAt})`,
        })
        .from(assets)
        .where(eq(assets.projectId, projectId));

      const lastModifiedAt = lastUpdateResult.lastUpdate;

      return {
        assetCount,
        assetsByType,
        totalSizeBytes,
        createdAt: project.createdAt.toISOString(),
        lastModifiedAt: lastModifiedAt ? lastModifiedAt.toISOString() : null,
      };
    } catch (error) {
      console.error("[ProjectService] Failed to get project stats:", error);
      throw error;
    }
  }

  /**
   * Get public projects for a user
   */
  async getPublicProjects(userId: string): Promise<Project[]> {
    try {
      const publicProjects = await db.query.projects.findMany({
        where: and(eq(projects.ownerId, userId), eq(projects.status, "active")),
        orderBy: [desc(projects.createdAt)],
      });

      // Filter only public projects
      return publicProjects.filter((p) => p.isPublic);
    } catch (error) {
      console.error("[ProjectService] Failed to get public projects:", error);
      throw error;
    }
  }

  /**
   * Update project visibility
   */
  async updateProjectVisibility(
    projectId: string,
    isPublic: boolean,
  ): Promise<Project> {
    try {
      const [updatedProject] = await db
        .update(projects)
        .set({
          isPublic,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();

      if (!updatedProject) {
        throw new Error(`Project not found: ${projectId}`);
      }

      console.log(
        `[ProjectService] Updated visibility for project ${projectId}: isPublic=${isPublic}`,
      );
      return updatedProject;
    } catch (error) {
      console.error(
        "[ProjectService] Failed to update project visibility:",
        error,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();
