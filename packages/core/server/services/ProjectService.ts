/**
 * Project Service
 * Manages project database operations
 */

import { db } from "../db/db";
import { projects, type Project, type NewProject } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

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
}

// Export singleton instance
export const projectService = new ProjectService();
