/**
 * Authentication Types
 * Shared types for authentication across the application
 */

export interface AuthUser {
  id: string;
  privyUserId: string;
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
  role: string;
  isAdmin: boolean;
  profileCompleted: Date | null;
  createdAt: Date;
}
