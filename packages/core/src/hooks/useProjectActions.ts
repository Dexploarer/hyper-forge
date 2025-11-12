/**
 * Project Actions Hook
 * CRUD operations for projects
 */

import { useState, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import {
  ProjectService,
  Project,
  ProjectCreateData,
  ProjectUpdateData,
} from "@/services/api/ProjectService";

export const useProjectActions = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showNotification } = useApp();

  const createProject = useCallback(
    async (data: ProjectCreateData): Promise<Project | null> => {
      setIsCreating(true);
      try {
        const project = await ProjectService.createProject(data);
        showNotification(
          `Project "${project.name}" created successfully`,
          "success",
        );
        return project;
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to create project",
          "error",
        );
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [showNotification],
  );

  const updateProject = useCallback(
    async (id: string, updates: ProjectUpdateData): Promise<Project | null> => {
      setIsUpdating(true);
      try {
        const project = await ProjectService.updateProject(id, updates);
        showNotification("Project updated successfully", "success");
        return project;
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to update project",
          "error",
        );
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [showNotification],
  );

  const archiveProject = useCallback(
    async (id: string): Promise<Project | null> => {
      setIsArchiving(true);
      try {
        const project = await ProjectService.archiveProject(id);
        showNotification("Project archived successfully", "success");
        return project;
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to archive project",
          "error",
        );
        return null;
      } finally {
        setIsArchiving(false);
      }
    },
    [showNotification],
  );

  const restoreProject = useCallback(
    async (id: string): Promise<Project | null> => {
      setIsRestoring(true);
      try {
        const project = await ProjectService.restoreProject(id);
        showNotification("Project restored successfully", "success");
        return project;
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to restore project",
          "error",
        );
        return null;
      } finally {
        setIsRestoring(false);
      }
    },
    [showNotification],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await ProjectService.deleteProject(id);
        showNotification("Project deleted successfully", "success");
        return true;
      } catch (err) {
        showNotification(
          err instanceof Error ? err.message : "Failed to delete project",
          "error",
        );
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [showNotification],
  );

  return {
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    isCreating,
    isUpdating,
    isArchiving,
    isRestoring,
    isDeleting,
  };
};
