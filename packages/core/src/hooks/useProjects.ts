/**
 * Project Hooks - Powered by TanStack Query
 *
 * Modernized project data fetching with automatic caching
 * and background refetching.
 *
 * Migration Notes:
 * - Removed manual useState/useEffect patterns
 * - Automatic request deduplication via React Query
 * - Maintained backward-compatible API for existing components
 */

import { useQuery } from "@tanstack/react-query";
import { projectsQueries } from "@/queries/projects.queries";

/**
 * Fetch all projects for the current user
 *
 * Modern API:
 * ```typescript
 * const { data: projects, isLoading, error } = useProjects()
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { projects, loading, reloadProjects } = useProjects()
 * ```
 *
 * @param includeArchived - Whether to include archived projects (default: false)
 */
export const useProjects = (includeArchived: boolean = false) => {
  const query = useQuery(projectsQueries.list(includeArchived));

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    projects: query.data ?? [],
    loading: query.isLoading,
    reloadProjects: query.refetch,
    forceReload: query.refetch,
  };
};

/**
 * Fetch a single project by ID
 *
 * Modern API:
 * ```typescript
 * const { data: project, isLoading } = useProject('project-uuid')
 * ```
 *
 * Backward-compatible API:
 * ```typescript
 * const { project, loading, refetch } = useProject('project-uuid')
 * ```
 *
 * @param projectId - UUID of the project to fetch (nullable for conditional fetching)
 */
export const useProject = (projectId: string | null) => {
  const query = useQuery({
    ...projectsQueries.detail(projectId!),
    enabled: !!projectId, // Only fetch if projectId is provided
  });

  return {
    // Modern React Query API
    ...query,

    // Backward-compatible properties
    project: query.data ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
