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

    let privyUserId: string;

    // In test mode, decode JWT without verifying signature
    if (process.env.NODE_ENV === "test" || Bun.env.NODE_ENV === "test") {
      try {
        // Decode JWT payload (part between first and second dot)
        const parts = token.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        privyUserId = payload.sub;
        console.log(
          `[Auth Middleware] TEST MODE - Decoded token for userId: ${privyUserId}`,
        );
      } catch (error) {
        console.error(
          "[Auth Middleware] TEST MODE - Failed to decode token:",
          error,
        );
        return {};
      }
    } else {
      // Production: Verify Privy JWT with cryptographic signature
      const verifiedClaims = await privy.verifyAuthToken(token);
      privyUserId = verifiedClaims.userId;
      console.log(
        `[Auth Middleware] Verifying token for Privy userId: ${privyUserId}`,
      );
    }

    // Find or create user in database
    let user = await userService.findByPrivyUserId(privyUserId);

    if (!user) {
      console.log(
        `[Auth Middleware] User not found for Privy userId ${privyUserId}, creating new user...`,
      );
      // Auto-create user on first request with valid Privy token
      try {
        user = await userService.createUser({
          privyUserId,
          role: "member", // Default role - admins must be promoted manually
        });
        console.log(
          `[Auth Middleware] Created new user: ${user.id} for Privy userId: ${privyUserId}`,
        );
      } catch (error) {
        console.error(
          `[Auth Middleware] Failed to create user for Privy userId ${privyUserId}:`,
          error,
        );
        throw error;
      }
    } else {
      console.log(
        `[Auth Middleware] Found existing user: ${user.id} for Privy userId: ${privyUserId}`,
      );
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
