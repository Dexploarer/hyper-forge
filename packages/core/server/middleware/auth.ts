/**
 * Optional Authentication Middleware
 * Verifies Privy JWT and attaches user to context if present
 * Does NOT block request if no auth - routes can check context.user
 */

import { PrivyClient } from "@privy-io/server-auth";
import { userService } from "../services/UserService";

// Initialize Privy client
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export interface AuthUser {
  id: string;
  privyUserId: string;
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
  role: string;
  profileCompleted: Date | null;
  createdAt: Date;
}

/**
 * Optional auth middleware - attaches user if valid token present
 * Does not error if no token - use requireAuth or requireAdmin for protected routes
 */
export async function optionalAuth(context: any): Promise<{ user?: AuthUser }> {
  try {
    // Extract token from Authorization header
    const authHeader =
      context.headers?.authorization ||
      context.request?.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without user
      return {};
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify Privy JWT
    const verifiedClaims = await privy.verifyAuthToken(token);
    const privyUserId = verifiedClaims.userId;

    // Find or create user in database
    let user = await userService.findByPrivyUserId(privyUserId);

    if (!user) {
      // Auto-create user on first request with valid Privy token
      user = await userService.createUser({
        privyUserId,
        role: "member", // Default role - admins must be promoted manually
      });
    }

    // Update last login timestamp
    await userService.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        privyUserId: user.privyUserId,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        role: user.role,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    // Invalid token or verification failed - continue without user
    console.error("Auth middleware error:", error);
    return {};
  }
}

/**
 * Require authentication - returns 401 if no valid token
 */
export async function requireAuth(
  context: any,
): Promise<{ user: AuthUser } | Response> {
  const result = await optionalAuth(context);

  if (!result.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return { user: result.user };
}
