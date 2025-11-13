/**
 * useProjects Hook Tests
 *
 * Tests for the useProjects hook which fetches and manages user projects.
 * Tests both modern React Query API and backward-compatible API.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useProjects, useProject } from "@/hooks/useProjects";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import { ProjectService } from "@/services/api/ProjectService";
import type { Project } from "@/services/api/ProjectService";

// Mock Projects
const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "RPG Adventure",
    description: "A fantasy RPG project",
    ownerId: "user-123",
    visibility: "private",
    isArchived: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "project-2",
    name: "FPS Shooter",
    description: "Modern warfare shooter",
    ownerId: "user-123",
    visibility: "public",
    isArchived: false,
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
  },
  {
    id: "project-3",
    name: "Old Project",
    description: "Archived project",
    ownerId: "user-123",
    visibility: "private",
    isArchived: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("useProjects Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
  });

  describe("Fetching Projects", () => {
    it("should fetch active projects by default", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock((includeArchived: boolean) =>
            Promise.resolve(
              mockProjects.filter((p) => includeArchived || !p.isArchived)
            )
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.projects).toEqual([]);

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should only have non-archived projects
      expect(result.current.projects).toHaveLength(2);
      expect(result.current.projects[0].name).toBe("RPG Adventure");
      expect(result.current.projects[1].name).toBe("FPS Shooter");
      expect(result.current.projects.every((p) => !p.isArchived)).toBe(true);
    });

    it("should fetch archived projects when includeArchived=true", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock((includeArchived: boolean) =>
            Promise.resolve(
              mockProjects.filter((p) => includeArchived || !p.isArchived)
            )
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(true), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have all projects including archived
      expect(result.current.projects).toHaveLength(3);
      expect(result.current.projects.some((p) => p.isArchived)).toBe(true);
    });

    it("should provide modern React Query API", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() =>
            Promise.resolve(mockProjects.filter((p) => !p.isArchived))
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Modern API
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should provide backward-compatible API", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() =>
            Promise.resolve(mockProjects.filter((p) => !p.isArchived))
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Backward-compatible API
      expect(result.current.projects).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.reloadProjects).toBeInstanceOf(Function);
      expect(result.current.forceReload).toBeInstanceOf(Function);
    });
  });

  describe("Refetching Projects", () => {
    it("should refetch when reloadProjects is called", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() =>
            Promise.resolve(mockProjects.filter((p) => !p.isArchived))
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialProjects = result.current.projects;
      expect(initialProjects).toHaveLength(2);

      // Call reloadProjects
      await result.current.reloadProjects();

      // Should have refetched
      expect(result.current.projects).toHaveLength(2);
    });

    it("should refetch when forceReload is called", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() =>
            Promise.resolve(mockProjects.filter((p) => !p.isArchived))
          ),
        },
      }));

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Call forceReload
      await result.current.forceReload();

      // Should have refetched
      expect(result.current.projects).toHaveLength(2);
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() => Promise.reject(new Error("Network error"))),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have error
      expect(result.current.error).toBeTruthy();
      expect(result.current.projects).toEqual([]);
    });
  });

  describe("Empty State", () => {
    it("should handle empty projects list", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock(() => Promise.resolve([])),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.projects).toEqual([]);
      expect(result.current.projects).toHaveLength(0);
    });
  });

  describe("Query Key Differentiation", () => {
    it("should maintain separate caches for includeArchived true/false", async () => {
      mock.module("@/services/api/ProjectService", () => ({
        ProjectService: {
          getProjects: mock((includeArchived: boolean) =>
            Promise.resolve(
              mockProjects.filter((p) => includeArchived || !p.isArchived)
            )
          ),
        },
      }));

      // Render with includeArchived=false
      const { result: result1 } = renderHook(() => useProjects(false), {
        wrapper,
      });
      await waitFor(() => expect(result1.current.loading).toBe(false));
      expect(result1.current.projects).toHaveLength(2);

      // Render with includeArchived=true
      const { result: result2 } = renderHook(() => useProjects(true), {
        wrapper,
      });
      await waitFor(() => expect(result2.current.loading).toBe(false));
      expect(result2.current.projects).toHaveLength(3);

      // Both should maintain their own data
      expect(result1.current.projects).toHaveLength(2);
      expect(result2.current.projects).toHaveLength(3);
    });
  });
});

describe("useProject Hook (Single Project)", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
  });

  it("should fetch a single project by ID", async () => {
    mock.module("@/services/api/ProjectService", () => ({
      ProjectService: {
        getProjectById: mock((id: string) =>
          Promise.resolve(mockProjects.find((p) => p.id === id) || null)
        ),
      },
    }));

    const { result } = renderHook(() => useProject("project-1"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.project).toBeDefined();
    expect(result.current.project?.id).toBe("project-1");
    expect(result.current.project?.name).toBe("RPG Adventure");
  });

  it("should return null for non-existent project", async () => {
    mock.module("@/services/api/ProjectService", () => ({
      ProjectService: {
        getProjectById: mock(() => Promise.resolve(null)),
      },
    }));

    const { result } = renderHook(() => useProject("non-existent"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.project).toBeNull();
  });

  it("should not fetch if ID is null", async () => {
    const { result } = renderHook(() => useProject(null), { wrapper });

    // Should not be loading since query is disabled
    expect(result.current.loading).toBe(false);
    expect(result.current.project).toBeNull();
  });

  it("should provide modern React Query API", async () => {
    mock.module("@/services/api/ProjectService", () => ({
      ProjectService: {
        getProjectById: mock((id: string) =>
          Promise.resolve(mockProjects.find((p) => p.id === id) || null)
        ),
      },
    }));

    const { result } = renderHook(() => useProject("project-1"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(result.current.isSuccess).toBe(true);
  });

  it("should provide backward-compatible API", async () => {
    mock.module("@/services/api/ProjectService", () => ({
      ProjectService: {
        getProjectById: mock((id: string) =>
          Promise.resolve(mockProjects.find((p) => p.id === id) || null)
        ),
      },
    }));

    const { result } = renderHook(() => useProject("project-1"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.project).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.refetch).toBeInstanceOf(Function);
  });

  it("should refetch when refetch is called", async () => {
    mock.module("@/services/api/ProjectService", () => ({
      ProjectService: {
        getProjectById: mock((id: string) =>
          Promise.resolve(mockProjects.find((p) => p.id === id) || null)
        ),
      },
    }));

    const { result } = renderHook(() => useProject("project-1"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.refetch();

    expect(result.current.project?.id).toBe("project-1");
  });
});
