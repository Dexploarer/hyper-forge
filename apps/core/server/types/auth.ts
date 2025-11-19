/**
 * Authentication Types
 * Shared types for authentication across the application
 * Updated for optional auth - privy fields now nullable
 */

export interface AuthUser {
  id: string;
  privyUserId: string | null; // Optional - auth not required
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
  role: string;
  isAdmin: boolean;
  profileCompleted: Date | null;
  createdAt: Date;
}
