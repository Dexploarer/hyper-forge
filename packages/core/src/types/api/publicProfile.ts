/**
 * Public Profile API Response Types
 * Type-safe definitions for PublicProfileAPIClient responses
 */

import type { Asset } from "@/services/api/AssetService";

// ==================== Public Project Type ====================

/**
 * Public project information
 */
export interface PublicProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetCount?: number;
  thumbnailUrl?: string;
}

// ==================== Public Achievement Type ====================

/**
 * User achievement information
 */
export interface PublicAchievement {
  id: string;
  type: string;
  title: string;
  description?: string;
  iconUrl?: string;
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

// ==================== API Response Types ====================

/**
 * Response for public assets
 */
export interface PublicAssetsResponse {
  assets: Asset[];
  total: number;
  isOwnProfile: boolean;
}

/**
 * Response for public projects
 */
export interface PublicProjectsResponse {
  projects: PublicProject[];
  total: number;
  isOwnProfile: boolean;
}

/**
 * Response for public achievements
 */
export interface PublicAchievementsResponse {
  achievements: PublicAchievement[];
  total: number;
  isOwnProfile: boolean;
}
