/**
 * Project Hooks
 * Fetch and manage user's projects
 */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { ProjectService, Project } from "@/services/api/ProjectService";

export const useProjects = (includeArchived: boolean = false) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useApp();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjects(includeArchived);
      setProjects(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load projects";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [includeArchived, showNotification]);

  const forceReload = useCallback(async () => {
    setProjects([]);
    await fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    reloadProjects: fetchProjects,
    forceReload,
  };
};

export const useProject = (projectId: string | null) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useApp();

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      return;
    }

    try {
      setLoading(true);
      const data = await ProjectService.getProjectById(projectId);
      setProject(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load project";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, showNotification]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    refetch: fetchProject,
  };
};
