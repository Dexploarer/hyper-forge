/**
 * User Service
 * Manages user database operations
 */

import { db } from "../db/db";
import { users, type User, type NewUser } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

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
      console.error("[UserService] Failed to find user by privyUserId:", error);
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
      console.error("[UserService] Failed to find user by id:", error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(data: {
    privyUserId: string;
    email?: string;
    walletAddress?: string;
    role?: string;
  }): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          privyUserId: data.privyUserId,
          email: data.email || null,
          walletAddress: data.walletAddress || null,
          role: data.role || "member", // Default role
        })
        .returning();

      console.log(
        `[UserService] Created new user: ${user.id} (${data.privyUserId})`,
      );
      return user;
    } catch (error) {
      console.error("[UserService] Failed to create user:", error);
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

      console.log(`[UserService] Updated last login for user: ${userId}`);
    } catch (error) {
      console.error("[UserService] Failed to update last login:", error);
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

      console.log(`[UserService] Updated profile for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error("[UserService] Failed to update profile:", error);
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

      console.log(`[UserService] Updated role for user: ${userId} to ${role}`);
      return updatedUser;
    } catch (error) {
      console.error("[UserService] Failed to update role:", error);
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
      console.error("[UserService] Failed to get all users:", error);
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

      console.log(`[UserService] Updated settings for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error("[UserService] Failed to update settings:", error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, userId));

      console.log(`[UserService] Deleted user: ${userId}`);
    } catch (error) {
      console.error("[UserService] Failed to delete user:", error);
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
      console.error("[UserService] Failed to get public profile:", error);
      throw error;
    }
  }

  /**
   * Get user statistics (assets, projects, achievements)
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

      // Count assets
      const userAssets = await db.query.assets.findMany({
        where: eq(assets.ownerId, userId),
      });
      const totalAssets = userAssets.length;
      const publicAssets = userAssets.filter(
        (a) => a.visibility === "public",
      ).length;

      // Count projects
      const userProjects = await db.query.projects.findMany({
        where: eq(projects.ownerId, userId),
      });
      const totalProjects = userProjects.length;
      const publicProjects = userProjects.filter((p) => p.isPublic).length;

      // Count achievements
      const achievements = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
      });
      const totalAchievements = achievements.length;

      return {
        totalAssets,
        publicAssets,
        totalProjects,
        publicProjects,
        totalAchievements,
      };
    } catch (error) {
      console.error("[UserService] Failed to get user stats:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
