/**
 * User Service
 * Manages user database operations
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import { users, type User, type NewUser } from "../db/schema";
import { eq, desc, and, count } from "drizzle-orm";

export interface UserProfileUpdate {
  displayName?: string;
  email?: string;
  discordUsername?: string;
}

export class UserService {
  /**
   * Find user by Privy user ID
   */
  async findByPrivyUserId(privyUserId: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.privyUserId, privyUserId),
      });

      return user || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[UserService] Failed to find user by privyUserId:",
      );
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      return user || null;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to find user by id:");
      throw error;
    }
  }

  /**
   * Create new user
   * Uses transaction to ensure user creation is atomic
   * Future: Can include initial achievement grants, welcome data, etc.
   */
  async createUser(data: {
    privyUserId: string;
    email?: string;
    walletAddress?: string;
    role?: string;
  }): Promise<User> {
    try {
      const user = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            privyUserId: data.privyUserId,
            email: data.email || null,
            walletAddress: data.walletAddress || null,
            role: data.role || "member", // Default role
          })
          .returning();

        logger.info(
          `[UserService] Created new user: ${newUser.id} (${data.privyUserId})`,
        );

        // Future: Add initial achievements, welcome notifications, etc. here
        // All within the same transaction for atomicity

        return newUser;
      });

      return user;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to create user:");
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));

      logger.info({ userId }, "Updated last login for user");
    } catch (error) {
      logger.error(
        { err: error },
        "[UserService] Failed to update last login:",
      );
      // Don't throw - this is non-critical
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: UserProfileUpdate,
    markCompleted: boolean = false,
  ): Promise<User> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date(),
      };

      // Set profileCompleted timestamp on first completion
      if (markCompleted) {
        updateData.profileCompleted = new Date();
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error(`User not found: ${userId}`);
      }

      logger.info({ userId }, "Updated profile for user");
      return updatedUser;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to update profile:");
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, role: "admin" | "member"): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error(`User not found: ${userId}`);
      }

      logger.info({ userId, role }, "Updated role for user");
      return updatedUser;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to update role:");
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: {
    role?: "admin" | "member";
    profileCompleted?: boolean;
    search?: string;
  }): Promise<User[]> {
    try {
      // Build where conditions
      const whereConditions: any[] = [];

      if (filters?.role) {
        whereConditions.push(eq(users.role, filters.role));
      }

      // Note: profileCompleted filter is applied post-query due to IS NULL / IS NOT NULL complexity
      // We'll filter after fetching results

      // Execute query
      let query = db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
      });

      if (whereConditions.length > 0) {
        query = db.query.users.findMany({
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          orderBy: [desc(users.createdAt)],
        });
      }

      let allUsers = await query;

      // Apply profileCompleted filter post-query
      if (filters?.profileCompleted !== undefined) {
        allUsers = allUsers.filter((user) => {
          const hasCompletedProfile = user.profileCompleted !== null;
          return hasCompletedProfile === filters.profileCompleted;
        });
      }

      // Apply search filter (case-insensitive search in name, email, privyId)
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        allUsers = allUsers.filter((user) => {
          return (
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.privyUserId.toLowerCase().includes(searchLower)
          );
        });
      }

      return allUsers;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to get all users:");
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<User> {
    try {
      // Get current user to merge settings
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        throw new Error(`User not found: ${userId}`);
      }

      // Merge new settings with existing ones
      const currentSettings =
        (currentUser.settings as Record<string, any>) || {};
      const mergedSettings = { ...currentSettings, ...settings };

      const [updatedUser] = await db
        .update(users)
        .set({
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error(`User not found: ${userId}`);
      }

      logger.info({ userId }, "Updated settings for user");
      return updatedUser;
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to update settings:");
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, userId));

      logger.info({ userId }, "Deleted user");
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to delete user:");
      throw error;
    }
  }

  /**
   * Get public profile data for a user
   */
  async getPublicProfile(userId: string): Promise<{
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    profileCompleted: Date | null;
    createdAt: Date;
  } | null> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        return null;
      }

      // Return only public profile fields
      return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error(
        { err: error },
        "[UserService] Failed to get public profile:",
      );
      throw error;
    }
  }

  /**
   * Get user statistics (assets, projects, achievements)
   * Optimized with SQL aggregation to avoid N+1 queries
   */
  async getUserStats(userId: string): Promise<{
    totalAssets: number;
    publicAssets: number;
    totalProjects: number;
    publicProjects: number;
    totalAchievements: number;
  }> {
    try {
      // Import schemas dynamically to avoid circular dependencies
      const { assets } = await import("../db/schema/assets.schema");
      const { projects } = await import("../db/schema/users.schema");
      const { userAchievements } = await import(
        "../db/schema/achievements.schema"
      );

      // Count total assets using SQL aggregation
      const [totalAssetsResult] = await db
        .select({ count: count() })
        .from(assets)
        .where(eq(assets.ownerId, userId));
      const totalAssets = Number(totalAssetsResult.count);

      // Count public assets using SQL aggregation
      const [publicAssetsResult] = await db
        .select({ count: count() })
        .from(assets)
        .where(
          and(eq(assets.ownerId, userId), eq(assets.visibility, "public")),
        );
      const publicAssets = Number(publicAssetsResult.count);

      // Count total projects using SQL aggregation
      const [totalProjectsResult] = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.ownerId, userId));
      const totalProjects = Number(totalProjectsResult.count);

      // Count public projects using SQL aggregation
      const [publicProjectsResult] = await db
        .select({ count: count() })
        .from(projects)
        .where(and(eq(projects.ownerId, userId), eq(projects.isPublic, true)));
      const publicProjects = Number(publicProjectsResult.count);

      // Count achievements using SQL aggregation
      const [achievementsResult] = await db
        .select({ count: count() })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      const totalAchievements = Number(achievementsResult.count);

      return {
        totalAssets,
        publicAssets,
        totalProjects,
        publicProjects,
        totalAchievements,
      };
    } catch (error) {
      logger.error({ err: error }, "[UserService] Failed to get user stats:");
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
