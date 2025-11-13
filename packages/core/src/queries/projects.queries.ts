/**
 * Projects Query Options
 *
 * Centralized query definitions for project-related data fetching.
 * Projects are user collections that organize assets and content.
 *
 * Features:
 * - Separate queries for archived vs active projects
 * - Individual project detail queries
 * - Smart caching with 1-minute stale time
 */

import { queryOptions } from "@tanstack/react-query";
import { ProjectService, type Project } from "@/services/api/ProjectService";
import { queryKeys } from "./query-keys";

/**
 * Projects List Query
 *
 * Fetches all projects for the current user.
 * Supports filtering by archived status.
 *
 * @param includeArchived - Whether to include archived projects in results
 *
 * Usage:
 * ```typescript
 * // Active projects only
 * useQuery(projectsQueries.list(false))
 *
 * // All projects including archived
 * useQuery(projectsQueries.list(true))
 * ```
 */
export const projectsQueries = {
  list: (includeArchived: boolean = false) =>
    queryOptions({
      queryKey: queryKeys.projects.list(includeArchived),
      queryFn: () => ProjectService.getProjects(includeArchived),
      staleTime: 60 * 1000, // Projects update less frequently than assets (1 minute)
    }),

  /**
   * Single Project Query
   *
   * Fetches a specific project by ID with all its details.
   *
   * @param projectId - UUID of the project to fetch
   *
   * Usage:
   * ```typescript
   * useQuery(projectsQueries.detail('project-uuid'))
   * ```
   */
  detail: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn: () => ProjectService.getProjectById(projectId),
      enabled: !!projectId,
      staleTime: 60 * 1000,
    }),
};
