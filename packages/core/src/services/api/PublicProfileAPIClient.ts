/**
 * Public Profile API Client
 * Client for accessing public user profile endpoints
 */

import { getAuthToken } from "@/utils/auth-token-store";

export interface PublicProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileCompleted: string | null;
  createdAt: string;
  isOwnProfile?: boolean;
}

export interface UserStats {
  totalAssets: number;
  publicAssets: number;
  totalProjects: number;
  publicProjects: number;
  totalAchievements: number;
}

export interface PublicProfileResponse {
  profile: PublicProfile;
  stats: UserStats;
}

export interface PublicAssetsResponse {
  assets: any[];
  total: number;
  isOwnProfile: boolean;
}

export interface PublicProjectsResponse {
  projects: any[];
  total: number;
  isOwnProfile: boolean;
}

export interface PublicAchievementsResponse {
  achievements: any[];
  total: number;
  isOwnProfile: boolean;
}

const API_BASE = "/api/public/users";

export class PublicProfileAPIClient {
  /**
   * Get auth token from auth-token-store (optional for public endpoints)
   */
  private getAuthToken(): string | null {
    return getAuthToken();
  }

  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${userId}/profile`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get public profile: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get public assets for a user
   */
  async getPublicAssets(
    userId: string,
    type?: string,
  ): Promise<PublicAssetsResponse> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = type
      ? `${API_BASE}/${userId}/assets?type=${encodeURIComponent(type)}`
      : `${API_BASE}/${userId}/assets`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to get public assets: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get public projects for a user
   */
  async getPublicProjects(userId: string): Promise<PublicProjectsResponse> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${userId}/projects`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get public projects: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get achievements for a user
   */
  async getPublicAchievements(
    userId: string,
  ): Promise<PublicAchievementsResponse> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${userId}/achievements`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get public achievements: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get user statistics
   */
  async getUserStats(
    userId: string,
  ): Promise<{ stats: UserStats; isOwnProfile: boolean }> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${userId}/stats`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get user stats: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const publicProfileClient = new PublicProfileAPIClient();
