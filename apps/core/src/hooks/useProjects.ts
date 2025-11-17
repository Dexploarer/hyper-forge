/**
 * Project Hooks - Powered by TanStack Query
 *
 * Modernized project data fetching with automatic caching
 * and background refetching.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsQueries } from "@/queries/projects.queries";
import { getAuthToken, onTokenUpdate } from "@/utils/auth-token-store";

/**
 * Fetch all projects for the current user
 * REQUIRES AUTHENTICATION - query is disabled when user is not authenticated
 *
 * Usage:
 * ```typescript
 * const { data: projects, isLoading, error } = useProjects()
 * ```
 *
 * @param includeArchived - Whether to include archived projects (default: false)
 */
export const useProjects = (includeArchived: boolean = false) => {
  // Subscribe to auth token changes for reactive enabled state
  const [hasToken, setHasToken] = useState(() => !!getAuthToken());

  useEffect(() => {
    // Update state when token changes
    const unsubscribe = onTokenUpdate((token) => {
      setHasToken(!!token);
    });
    return unsubscribe;
  }, []);

  return useQuery({
    ...projectsQueries.list(includeArchived),
    enabled: hasToken, // Only fetch when user is authenticated
  });
};

/**
 * Fetch a single project by ID
 * REQUIRES AUTHENTICATION - query is disabled when user is not authenticated
 *
 * Usage:
 * ```typescript
 * const { data: project, isLoading } = useProject('project-uuid')
 * ```
 *
 * @param projectId - UUID of the project to fetch (nullable for conditional fetching)
 */
export const useProject = (projectId: string | null) => {
  // Subscribe to auth token changes for reactive enabled state
  const [hasToken, setHasToken] = useState(() => !!getAuthToken());

  useEffect(() => {
    // Update state when token changes
    const unsubscribe = onTokenUpdate((token) => {
      setHasToken(!!token);
    });
    return unsubscribe;
  }, []);

  return useQuery({
    ...projectsQueries.detail(projectId!),
    enabled: !!projectId && hasToken, // Only fetch if projectId provided AND user is authenticated
  });
};
