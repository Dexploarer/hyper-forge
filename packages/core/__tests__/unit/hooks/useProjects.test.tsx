/**
 * useProjects Hook Tests
 *
 * Tests for project fetching hooks (list and detail).
 * Uses Bun test (NOT Vitest) and mocks only external API services.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useProjects, useProject } from "@/hooks/useProjects";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { ProjectService } from "@/services/api/ProjectService";
import type { Project } from "@/services/api/ProjectService";

// Mock project data
const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "RPG Project",
    description: "A fantasy RPG project",
    ownerId: "user-1",
    status: "active",
    settings: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
  },
  {
    id: "project-2",
    name: "Shooter Project",
    description: "A sci-fi shooter project",
    ownerId: "user-1",
    status: "active",
    settings: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
  },
];

const archivedProject: Project = {
  id: "project-3",
  name: "Archived Project",
  description: "An archived project",
  ownerId: "user-1",
  status: "archived",
  settings: {},
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archivedAt: new Date().toISOString(),
};

// Mock the ProjectService
mock.module("@/services/api/ProjectService", () => ({
  ProjectService: {
    getProjects: mock((includeArchived: boolean) => {
      if (includeArchived) {
        return Promise.resolve([...mockProjects, archivedProject]);
      }
      return Promise.resolve([...mockProjects]);
    }),
    getProjectById: mock((id: string) => {
      const allProjects = [...mockProjects, archivedProject];
      const project = allProjects.find((p) => p.id === id);
      if (!project) {
        return Promise.reject(new Error("Project not found"));
      }
      return Promise.resolve(project);
    }),
  },
}));

describe("useProjects", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should fetch projects on mount", async () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify projects are loaded
    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].name).toBe("RPG Project");
    expect(result.current.projects[1].name).toBe("Shooter Project");
  });

  it("should exclude archived projects by default", async () => {
    const { result } = renderHook(() => useProjects(false), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects.every((p) => !p.archivedAt)).toBe(true);
  });

  it("should include archived projects when requested", async () => {
    const { result } = renderHook(() => useProjects(true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.projects.some((p) => p.archivedAt)).toBe(true);
  });

  it("should provide React Query API with convenience aliases", async () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // React Query API
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current).toHaveProperty("isFetching");

    // Convenience aliases
    expect(result.current).toHaveProperty("projects");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("reloadProjects");
    expect(result.current).toHaveProperty("forceReload");
    expect(typeof result.current.reloadProjects).toBe("function");
    expect(typeof result.current.forceReload).toBe("function");
  });

  it("should reload projects when reloadProjects is called", async () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call reload
    await result.current.reloadProjects();

    // Should still have projects
    expect(result.current.projects).toHaveLength(2);
  });

  it("should handle empty project list", async () => {
    // Mock empty response
    ProjectService.getProjects = mock(() => Promise.resolve([]));

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toHaveLength(0);
    expect(result.current.projects).toEqual([]);
  });
});

describe("useProject", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should fetch a single project by ID", async () => {
    const { result } = renderHook(() => useProject("project-1"), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.project).toBeDefined();
    expect(result.current.project?.id).toBe("project-1");
    expect(result.current.project?.name).toBe("RPG Project");
  });

  it("should not fetch when projectId is null", async () => {
    const { result } = renderHook(() => useProject(null), {
      wrapper: createWrapper(queryClient),
    });

    // Should not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.project).toBeNull();
  });

  it("should provide React Query API with convenience aliases", async () => {
    const { result } = renderHook(() => useProject("project-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // React Query API
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
    expect(result.current).toHaveProperty("isSuccess");

    // Convenience aliases
    expect(result.current).toHaveProperty("project");
    expect(result.current).toHaveProperty("loading");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("should handle project not found error", async () => {
    // Mock error
    ProjectService.getProjectById = mock(() =>
      Promise.reject(new Error("Project not found"))
    );

    const { result } = renderHook(() => useProject("non-existent"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.project).toBeNull();
  });

  it("should refetch project when refetch is called", async () => {
    const { result } = renderHook(() => useProject("project-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Call refetch and wait for completion
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for the refetch to complete and data to be available
    await waitFor(() => {
      expect(result.current.project).toBeDefined();
      expect(result.current.project?.id).toBe("project-1");
    });
  });
});
