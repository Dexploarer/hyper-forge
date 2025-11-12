/**
 * Project API Service
 * Type-safe wrapper for project API endpoints
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  status: string;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ProjectCreateData {
  name: string;
  description?: string;
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

export interface ProjectsResponse {
  projects: Project[];
  total: number;
}

export interface ProjectResponse {
  project: Project;
}

class ProjectServiceClass {
  private baseUrl = "/api/projects";

  /**
   * Get auth token from Privy
   */
  private async getAuthToken(): Promise<string> {
    // Get token from global Privy instance
    const privy = (window as any).__PRIVY__;
    if (!privy?.getAccessToken) {
      throw new Error("Privy not initialized");
    }
    const token = await privy.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  /**
   * Create new project
   */
  async createProject(data: ProjectCreateData): Promise<Project> {
    const response = await this.request<ProjectResponse>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.project;
  }

  /**
   * Get user's projects
   */
  async getProjects(includeArchived: boolean = false): Promise<Project[]> {
    const query = includeArchived ? "?includeArchived=true" : "";
    const response = await this.request<ProjectsResponse>(`/${query}`);
    return response.projects;
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project> {
    const response = await this.request<ProjectResponse>(`/${id}`);
    return response.project;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    updates: ProjectUpdateData,
  ): Promise<Project> {
    const response = await this.request<ProjectResponse>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return response.project;
  }

  /**
   * Archive project (soft delete)
   */
  async archiveProject(id: string): Promise<Project> {
    const response = await this.request<ProjectResponse>(`/${id}/archive`, {
      method: "POST",
    });
    return response.project;
  }

  /**
   * Restore archived project
   */
  async restoreProject(id: string): Promise<Project> {
    const response = await this.request<ProjectResponse>(`/${id}/restore`, {
      method: "POST",
    });
    return response.project;
  }

  /**
   * Delete project (hard delete)
   */
  async deleteProject(id: string): Promise<void> {
    await this.request(`/${id}`, { method: "DELETE" });
  }
}

export const ProjectService = new ProjectServiceClass();
