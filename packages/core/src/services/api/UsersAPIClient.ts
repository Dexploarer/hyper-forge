/**
 * Users API Client
 * Client for user profile management and authentication
 */

const API_BASE = "/api/users";

export interface User {
  id: string;
  privyUserId: string;
  displayName: string | null;
  email: string | null;
  discordUsername: string | null;
  walletAddress: string | null;
  role: string;
  profileCompleted: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface UserProfileUpdate {
  displayName: string;
  email: string;
  discordUsername: string;
}

export interface GetCurrentUserResponse {
  user: User | null;
}

export interface CompleteProfileResponse {
  user: User;
}

export interface GetAllUsersResponse {
  users: User[];
}

export class UsersAPIClient {
  /**
   * Get current user profile (creates if doesn't exist)
   */
  async getCurrentUser(sessionId: string): Promise<GetCurrentUserResponse> {
    const response = await fetch(
      `${API_BASE}/me?sessionId=${encodeURIComponent(sessionId)}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update/Complete user profile
   */
  async updateUserProfile(
    sessionId: string,
    profile: UserProfileUpdate,
  ): Promise<CompleteProfileResponse> {
    const response = await fetch(`${API_BASE}/complete-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        ...profile,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(
        error.error || `Failed to update profile: ${response.status}`,
      );
    }

    return await response.json();
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<GetAllUsersResponse> {
    const response = await fetch(`${API_BASE}/`);

    if (!response.ok) {
      throw new Error(`Failed to get all users: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check if user profile is complete
   */
  isProfileComplete(user: User | null): boolean {
    if (!user) return false;
    return Boolean(user.profileCompleted && user.displayName && user.email);
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(user: User | null): number {
    if (!user) return 0;

    const fields = [user.displayName, user.email, user.discordUsername];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }
}

export const usersClient = new UsersAPIClient();
