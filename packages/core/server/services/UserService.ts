/**
 * User Service
 * Manages user database operations
 */

import { db } from "../db/db";
import { users, type User, type NewUser } from "../db/schema";
import { eq, desc } from "drizzle-orm";

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
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
      });

      return allUsers;
    } catch (error) {
      console.error("[UserService] Failed to get all users:", error);
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
}

// Export singleton instance
export const userService = new UserService();
