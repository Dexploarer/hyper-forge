/**
 * Achievement Service
 * Manages achievements, medals, and user progress tracking
 */

import { db } from "../db/db";
import {
  achievements,
  userAchievements,
  type Achievement,
  type UserAchievement,
  type NewAchievement,
} from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface AchievementProgress {
  achievementId: string;
  achievement: Achievement;
  progress: number;
  maxProgress: number | null;
  isEarned: boolean;
  earnedAt: Date | null;
}

export interface UserAchievementSummary {
  totalAchievements: number;
  totalMedals: number;
  totalPoints: number;
  achievements: AchievementProgress[];
  recentAchievements: UserAchievement[];
}

export class AchievementService {
  /**
   * Get all active achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const allAchievements = await db.query.achievements.findMany({
        where: eq(achievements.isActive, true),
        orderBy: [
          achievements.category,
          achievements.rarity,
          achievements.name,
        ],
      });

      return allAchievements;
    } catch (error) {
      console.error(
        "[AchievementService] Failed to get all achievements:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get achievement by code
   */
  async getAchievementByCode(code: string): Promise<Achievement | null> {
    try {
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.code, code),
      });

      return achievement || null;
    } catch (error) {
      console.error(
        `[AchievementService] Failed to get achievement by code: ${code}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string): Promise<AchievementProgress[]> {
    try {
      // Get all active achievements
      const allAchievements = await this.getAllAchievements();

      // Get user's earned achievements
      const earnedAchievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
      });

      // Get achievement details for earned achievements
      const earnedAchievementIds = earnedAchievementsList.map(
        (ua) => ua.achievementId,
      );
      const earnedAchievementDetails =
        earnedAchievementIds.length > 0
          ? await db.query.achievements.findMany({
              where: inArray(achievements.id, earnedAchievementIds),
            })
          : [];

      // Create a map of earned achievements (just the UserAchievement, we'll look up achievement separately)
      const earnedMap = new Map<string, UserAchievement>();
      earnedAchievementsList.forEach((ua) => {
        earnedMap.set(ua.achievementId, ua);
      });

      // Build progress array
      const progress: AchievementProgress[] = allAchievements.map(
        (achievement) => {
          const earned = earnedMap.get(achievement.id);
          return {
            achievementId: achievement.id,
            achievement,
            progress: earned?.progress || 0,
            maxProgress: achievement.maxProgress,
            isEarned: !!earned,
            earnedAt: earned?.earnedAt || null,
          };
        },
      );

      return progress;
    } catch (error) {
      console.error(
        `[AchievementService] Failed to get user achievements: ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get user achievement summary
   */
  async getUserAchievementSummary(
    userId: string,
  ): Promise<UserAchievementSummary> {
    try {
      const progress = await this.getUserAchievements(userId);

      // Calculate totals
      const earned = progress.filter((p) => p.isEarned);
      const totalAchievements = earned.filter(
        (p) => p.achievement.type === "achievement",
      ).length;
      const totalMedals = earned.filter(
        (p) => p.achievement.type === "medal",
      ).length;
      const totalPoints = earned.reduce(
        (sum, p) => sum + (p.achievement.points || 0),
        0,
      );

      // Get recent achievements (last 10)
      const recentAchievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
        orderBy: [desc(userAchievements.earnedAt)],
        limit: 10,
      });

      // Get achievement details for recent achievements
      const recentAchievementIds = recentAchievementsList.map(
        (ua) => ua.achievementId,
      );
      const recentAchievementDetails =
        recentAchievementIds.length > 0
          ? await db.query.achievements.findMany({
              where: inArray(achievements.id, recentAchievementIds),
            })
          : [];

      // Map recent achievements with details
      const recentAchievements = recentAchievementsList.map((ua) => {
        const achievement = recentAchievementDetails.find(
          (a) => a.id === ua.achievementId,
        );
        return {
          ...ua,
          achievement: achievement || ({} as Achievement),
        };
      });

      return {
        totalAchievements,
        totalMedals,
        totalPoints,
        achievements: progress,
        recentAchievements,
      };
    } catch (error) {
      console.error(
        `[AchievementService] Failed to get user achievement summary: ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Award an achievement to a user
   * Returns true if newly earned, false if already earned
   * Uses transaction to ensure achievement is awarded atomically
   */
  async awardAchievement(
    userId: string,
    achievementCode: string,
    progress?: number,
    metadata?: Record<string, any>,
  ): Promise<{ earned: boolean; userAchievement: UserAchievement | null }> {
    try {
      // Get achievement
      const achievement = await this.getAchievementByCode(achievementCode);
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementCode}`);
      }

      if (!achievement.isActive) {
        throw new Error(`Achievement is not active: ${achievementCode}`);
      }

      // Check if user already has this achievement (outside transaction for performance)
      const existing = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id),
        ),
      });

      if (existing) {
        // Already earned
        return { earned: false, userAchievement: existing };
      }

      // Determine progress value
      const finalProgress = progress ?? achievement.maxProgress ?? 1;

      // Award achievement in transaction
      const newUserAchievement = await db.transaction(async (tx) => {
        const [awarded] = await tx
          .insert(userAchievements)
          .values({
            userId,
            achievementId: achievement.id,
            progress: finalProgress,
            metadata: metadata || {},
          })
          .returning();

        console.log(
          `[AchievementService] Awarded achievement ${achievementCode} to user ${userId}`,
        );

        return awarded;
      });

      return { earned: true, userAchievement: newUserAchievement };
    } catch (error) {
      console.error(
        `[AchievementService] Failed to award achievement: ${achievementCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update progress for a progressive achievement
   */
  async updateProgress(
    userId: string,
    achievementCode: string,
    progress: number,
    metadata?: Record<string, any>,
  ): Promise<{ earned: boolean; userAchievement: UserAchievement | null }> {
    try {
      // Get achievement
      const achievement = await this.getAchievementByCode(achievementCode);
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementCode}`);
      }

      if (!achievement.isActive) {
        throw new Error(`Achievement is not active: ${achievementCode}`);
      }

      if (!achievement.maxProgress) {
        throw new Error(
          `Achievement ${achievementCode} is not a progressive achievement`,
        );
      }

      // Check if user already has this achievement
      const existing = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id),
        ),
      });

      if (existing) {
        // Already earned, no update needed
        return { earned: false, userAchievement: existing };
      }

      // Check if progress meets requirement
      if (progress >= achievement.maxProgress) {
        // Award achievement
        return await this.awardAchievement(
          userId,
          achievementCode,
          achievement.maxProgress,
          metadata,
        );
      }

      // Progress not yet complete
      return { earned: false, userAchievement: null };
    } catch (error) {
      console.error(
        `[AchievementService] Failed to update progress: ${achievementCode}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize default achievements
   */
  async initializeDefaultAchievements(): Promise<void> {
    try {
      const defaultAchievements: NewAchievement[] = [
        // First Steps
        {
          code: "first_asset",
          name: "First Creation",
          description: "Generate your first 3D asset",
          icon: "sparkles",
          type: "achievement",
          category: "generation",
          rarity: "common",
          points: 10,
        },
        {
          code: "profile_complete",
          name: "Profile Complete",
          description: "Complete your user profile",
          icon: "user-check",
          type: "achievement",
          category: "social",
          rarity: "common",
          points: 5,
        },
        // Generation Milestones
        {
          code: "ten_assets",
          name: "Asset Creator",
          description: "Generate 10 assets",
          icon: "package",
          type: "achievement",
          category: "generation",
          rarity: "common",
          points: 25,
          maxProgress: 10,
          progressType: "count",
        },
        {
          code: "fifty_assets",
          name: "Prolific Creator",
          description: "Generate 50 assets",
          icon: "package",
          type: "achievement",
          category: "generation",
          rarity: "rare",
          points: 100,
          maxProgress: 50,
          progressType: "count",
        },
        {
          code: "hundred_assets",
          name: "Master Creator",
          description: "Generate 100 assets",
          icon: "package",
          type: "achievement",
          category: "generation",
          rarity: "epic",
          points: 250,
          maxProgress: 100,
          progressType: "count",
        },
        // Medals
        {
          code: "early_adopter",
          name: "Early Adopter",
          description: "Joined during the alpha phase",
          icon: "medal",
          type: "medal",
          category: "milestone",
          rarity: "rare",
          points: 50,
        },
        {
          code: "power_user",
          name: "Power User",
          description: "Generated assets across multiple categories",
          icon: "medal",
          type: "medal",
          category: "milestone",
          rarity: "epic",
          points: 150,
        },
      ];

      // Insert achievements that don't exist
      for (const achievement of defaultAchievements) {
        try {
          const existing = await this.getAchievementByCode(achievement.code);
          if (!existing) {
            await db.insert(achievements).values(achievement);
            console.log(
              `[AchievementService] Created default achievement: ${achievement.code}`,
            );
          }
        } catch (innerError) {
          console.warn(
            `[AchievementService] Failed to create achievement ${achievement.code}:`,
            innerError,
          );
          // Continue with other achievements
        }
      }

      console.log("[AchievementService] Achievement initialization complete");
    } catch (error) {
      console.error(
        "[AchievementService] Failed to initialize default achievements:",
        error,
      );
      // Don't throw - allow server to start even if achievements fail to initialize
      return;
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService();
