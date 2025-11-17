/**
 * Achievements API Client
 * Client for user achievements and medals management
 */

import { apiFetch } from "@/utils/api";

import { getAuthToken } from "@/utils/auth-token-store";

const API_BASE = "/api/achievements";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  type: "achievement" | "medal" | "badge";
  category: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  maxProgress: number | null;
  progressType: string | null;
  metadata: Record<string, any>;
  isActive: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  progress: number;
  metadata: Record<string, any>;
  earnedAt: string;
}

export interface AchievementProgress {
  achievementId: string;
  achievement: Achievement;
  progress: number;
  maxProgress: number | null;
  isEarned: boolean;
  earnedAt: string | null;
}

export interface UserAchievementSummary {
  totalAchievements: number;
  totalMedals: number;
  totalPoints: number;
  achievements: AchievementProgress[];
  recentAchievements: UserAchievement[];
}

export interface GetAllAchievementsResponse {
  achievements: Achievement[];
}

export interface AwardAchievementResponse {
  earned: boolean;
  userAchievement: UserAchievement | null;
}

export interface UpdateProgressResponse {
  earned: boolean;
  userAchievement: UserAchievement | null;
}

export class AchievementsAPIClient {
  /**
   * Get auth token from auth-token-store
   */
  private getAuthToken(): string {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<GetAllAchievementsResponse> {
    const response = await apiFetch(`${API_BASE}/`);

    if (!response.ok) {
      throw new Error(`Failed to get achievements: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get current user's achievements
   */
  async getUserAchievements(): Promise<UserAchievementSummary> {
    const token = this.getAuthToken();
    const response = await apiFetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get user achievements: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Get specific user's achievements
   */
  async getUserAchievementsById(
    userId: string,
  ): Promise<UserAchievementSummary> {
    const token = this.getAuthToken();
    const response = await apiFetch(`${API_BASE}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get user achievements: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Award an achievement to a user
   */
  async awardAchievement(
    achievementCode: string,
    userId?: string,
    progress?: number,
    metadata?: Record<string, any>,
  ): Promise<AwardAchievementResponse> {
    const token = this.getAuthToken();
    const response = await apiFetch(`${API_BASE}/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        achievementCode,
        userId,
        progress,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        error.error || `Failed to award achievement: ${response.status}`,
      );
    }

    return await response.json();
  }

  /**
   * Update progress for a progressive achievement
   */
  async updateProgress(
    achievementCode: string,
    progress: number,
    metadata?: Record<string, any>,
  ): Promise<UpdateProgressResponse> {
    const token = this.getAuthToken();
    const response = await apiFetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        achievementCode,
        progress,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        error.error || `Failed to update progress: ${response.status}`,
      );
    }

    return await response.json();
  }
}

export const achievementsClient = new AchievementsAPIClient();
