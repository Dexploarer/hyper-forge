/**
 * Public Profile API Client
 * Client for accessing public user profile endpoints
 */

import { apiClient } from "@/lib/api-client";

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

export class PublicProfileAPIClient {
  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const response = await apiClient.get(`/api/public/users/${userId}/profile`);
    return response.data;
  }

  /**
   * Get public assets for a user
   */
  async getPublicAssets(
    userId: string,
    type?: string,
  ): Promise<PublicAssetsResponse> {
    const params = type ? { type } : {};
    const response = await apiClient.get(`/api/public/users/${userId}/assets`, {
      params,
    });
    return response.data;
  }

  /**
   * Get public projects for a user
   */
  async getPublicProjects(userId: string): Promise<PublicProjectsResponse> {
    const response = await apiClient.get(
      `/api/public/users/${userId}/projects`,
    );
    return response.data;
  }

  /**
   * Get achievements for a user
   */
  async getPublicAchievements(
    userId: string,
  ): Promise<PublicAchievementsResponse> {
    const response = await apiClient.get(
      `/api/public/users/${userId}/achievements`,
    );
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getUserStats(
    userId: string,
  ): Promise<{ stats: UserStats; isOwnProfile: boolean }> {
    const response = await apiClient.get(`/api/public/users/${userId}/stats`);
    return response.data;
  }
}

// Export singleton instance
export const publicProfileClient = new PublicProfileAPIClient();
