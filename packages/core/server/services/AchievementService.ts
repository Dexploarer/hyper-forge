/**
 * Achievement Service
 * Manages achievements, medals, and user progress tracking
 */

import { db } from "../db/db";
import { logger } from '../utils/logger';
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
  userId: string;
  totalAchievements: number;
  unlockedAchievements: number;
  totalMedals: number;
  totalPoints: number;
  achievements: (AchievementProgress & { code?: string; unlocked?: boolean })[];
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

      // Build progress array with additional fields for test compatibility
      const progress = allAchievements.map((achievement) => {
        const earned = earnedMap.get(achievement.id);
        return {
          achievementId: achievement.id,
          achievement,
          code: achievement.code,
          unlocked: !!earned,
          progress: earned?.progress || 0,
          maxProgress: achievement.maxProgress,
          isEarned: !!earned,
          earnedAt: earned?.earnedAt || null,
        };
      });

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
        userId,
        totalAchievements,
        unlockedAchievements: earned.length,
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
  ): Promise<{
    success: boolean;
    message?: string;
    achievement?: UserAchievement & {
      code?: string;
      unlocked?: boolean;
      progress?: number;
      metadata?: any;
    };
  }> {
    try {
      // Get achievement
      const achievement = await this.getAchievementByCode(achievementCode);
      if (!achievement) {
        return {
          success: false,
          message: `Achievement not found: ${achievementCode}`,
        };
      }

      if (!achievement.isActive) {
        return {
          success: false,
          message: `Achievement is not active: ${achievementCode}`,
        };
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
        return {
          success: false,
          message: "Achievement already earned by user",
          achievement: {
            ...existing,
            code: achievementCode,
            unlocked: true,
          },
        };
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

      return {
        success: true,
        achievement: {
          ...newUserAchievement,
          code: achievementCode,
          unlocked: true,
        },
      };
    } catch (error) {
      console.error(
        `[AchievementService] Failed to award achievement: ${achievementCode}`,
        error,
      );
      return {
        success: false,
        message: `Failed to award achievement: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
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
  ): Promise<{
    success: boolean;
    message?: string;
    achievement?: UserAchievement & {
      code?: string;
      unlocked?: boolean;
      progress?: number;
      metadata?: any;
    };
  }> {
    try {
      // Get achievement
      const achievement = await this.getAchievementByCode(achievementCode);
      if (!achievement) {
        return {
          success: false,
          message: `Achievement not found: ${achievementCode}`,
        };
      }

      if (!achievement.isActive) {
        return {
          success: false,
          message: `Achievement is not active: ${achievementCode}`,
        };
      }

      if (!achievement.maxProgress) {
        return {
          success: false,
          message: `Achievement ${achievementCode} is not a progressive achievement`,
        };
      }

      // Check if user already has this achievement or progress
      const existing = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id),
        ),
      });

      // Handle increment option
      const options = metadata as any;
      const increment = options?.increment || false;
      let finalProgress = progress;

      if (increment && existing) {
        finalProgress = (existing.progress || 0) + progress;
      } else if (existing) {
        // Already has progress/achievement
        // Check if it's fully unlocked (progress meets goal)
        if (existing.progress >= achievement.maxProgress) {
          return {
            success: false,
            message: "Achievement already earned",
            achievement: {
              ...existing,
              code: achievementCode,
              unlocked: true,
            },
          };
        }
        // Update existing progress
        finalProgress = increment
          ? (existing.progress || 0) + progress
          : progress;
      }

      // Clamp negative progress to 0
      if (finalProgress < 0) {
        finalProgress = 0;
      }

      // Check if progress meets requirement
      if (finalProgress >= achievement.maxProgress) {
        // Award achievement (or update to completed)
        if (existing) {
          // Update existing record to mark as complete
          const [updated] = await db
            .update(userAchievements)
            .set({
              progress: achievement.maxProgress,
              metadata: metadata || existing.metadata || {},
            })
            .where(eq(userAchievements.id, existing.id))
            .returning();

          return {
            success: true,
            achievement: {
              ...updated,
              code: achievementCode,
              unlocked: true,
            },
          };
        }

        return await this.awardAchievement(
          userId,
          achievementCode,
          achievement.maxProgress,
          metadata,
        );
      }

      // Progress not yet complete - create/update progress tracking
      const progressRecord = await db.transaction(async (tx) => {
        if (existing) {
          // Update existing progress
          const [updated] = await tx
            .update(userAchievements)
            .set({
              progress: finalProgress,
              metadata: metadata || existing.metadata || {},
            })
            .where(eq(userAchievements.id, existing.id))
            .returning();
          return updated;
        } else {
          // Create new progress record
          const [record] = await tx
            .insert(userAchievements)
            .values({
              userId,
              achievementId: achievement.id,
              progress: finalProgress,
              metadata: metadata || {},
            })
            .returning();
          return record;
        }
      });

      return {
        success: true,
        achievement: {
          ...progressRecord,
          code: achievementCode,
          unlocked: false,
        },
      };
    } catch (error) {
      console.error(
        `[AchievementService] Failed to update progress: ${achievementCode}`,
        error,
      );
      return {
        success: false,
        message: `Failed to update progress: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
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
          rarity: "bronze",
          points: 10,
        },
        {
          code: "first_generation",
          name: "First Generation",
          description: "Complete your first generation",
          icon: "sparkles",
          type: "achievement",
          category: "generation",
          rarity: "bronze",
          points: 10,
        },
        {
          code: "profile_complete",
          name: "Profile Complete",
          description: "Complete your user profile",
          icon: "user-check",
          type: "achievement",
          category: "social",
          rarity: "bronze",
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
          rarity: "silver",
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
          rarity: "gold",
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
          rarity: "gold",
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
          rarity: "silver",
          points: 50,
        },
        {
          code: "power_user",
          name: "Power User",
          description: "Generated assets across multiple categories",
          icon: "medal",
          type: "medal",
          category: "milestone",
          rarity: "gold",
          points: 150,
          maxProgress: 50,
          progressType: "count",
        },
      ];

      // Insert or update achievements
      for (const achievement of defaultAchievements) {
        try {
          const existing = await this.getAchievementByCode(achievement.code);
          if (!existing) {
            await db.insert(achievements).values(achievement);
            console.log(
              `[AchievementService] Created default achievement: ${achievement.code}`,
            );
          } else {
            // Update existing achievement to match current definition
            // Only update if values have actually changed to reduce database writes
            const hasChanges =
              existing.name !== achievement.name ||
              existing.description !== achievement.description ||
              existing.icon !== achievement.icon ||
              existing.type !== achievement.type ||
              existing.category !== achievement.category ||
              existing.rarity !== achievement.rarity ||
              existing.points !== achievement.points ||
              existing.maxProgress !== achievement.maxProgress ||
              existing.progressType !== achievement.progressType ||
              (achievement.isActive !== undefined &&
                existing.isActive !== achievement.isActive);

            if (hasChanges) {
              await db
                .update(achievements)
                .set({
                  name: achievement.name,
                  description: achievement.description,
                  icon: achievement.icon,
                  type: achievement.type,
                  category: achievement.category,
                  rarity: achievement.rarity,
                  points: achievement.points,
                  maxProgress: achievement.maxProgress,
                  progressType: achievement.progressType,
                  isActive: achievement.isActive ?? true,
                  updatedAt: new Date(),
                })
                .where(eq(achievements.code, achievement.code));
              console.log(
                `[AchievementService] Updated achievement definition: ${achievement.code}`,
              );
            }
          }
        } catch (innerError) {
          console.warn(
            `[AchievementService] Failed to create/update achievement ${achievement.code}:`,
            innerError,
          );
          // Continue with other achievements
        }
      }

      logger.info({ }, '[AchievementService] Achievement initialization complete');
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
