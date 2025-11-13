/**
 * Privy Mock Helper for Testing
 * November 2025 Best Practices:
 * - Mock Privy client authentication
 * - Integrate with existing auth helpers
 * - Enable testing without real Privy API calls
 */

import { beforeEach } from "bun:test";
import type { AuthUser } from "../../server/middleware/auth";

/**
 * Mock Privy verification result
 */
export interface MockPrivyVerification {
  userId: string;
  email?: string;
}

/**
 * Setup Privy mock for test environment
 * Call this in your test's beforeEach
 */
export function setupPrivyMock() {
  // Mock the Privy client module
  const mockVerify = async (token: string): Promise<MockPrivyVerification> => {
    // Decode mock JWT token (created by createMockJWT in auth.ts)
    try {
      const parts = token.replace("Bearer ", "").split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  };

  return { mockVerify };
}

/**
 * Create a complete mock user for testing
 * This creates an AuthUser object that matches the middleware output
 */
export function createMockAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: overrides?.id || "test-user-id",
    privyUserId: overrides?.privyUserId || "privy-test-user",
    email: overrides?.email || "test@example.com",
    walletAddress: overrides?.walletAddress || "0x1234567890abcdef",
    displayName: overrides?.displayName || "Test User",
    role: overrides?.role || "member",
    profileCompleted: overrides?.profileCompleted || new Date(),
    createdAt: overrides?.createdAt || new Date(),
  };
}

/**
 * Create a mock admin user for testing
 */
export function createMockAdminUser(overrides?: Partial<AuthUser>): AuthUser {
  return createMockAuthUser({
    id: overrides?.id || "admin-user-id",
    privyUserId: overrides?.privyUserId || "privy-admin-user",
    email: overrides?.email || "admin@example.com",
    displayName: overrides?.displayName || "Admin User",
    role: "admin",
    ...overrides,
  });
}
