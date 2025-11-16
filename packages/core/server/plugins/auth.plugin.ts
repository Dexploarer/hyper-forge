/**
 * Authentication Plugin for Elysia
 * Provides authentication and authorization using .derive() pattern
 *
 * This plugin consolidates auth logic into reusable plugins:
 * - Injects optional user context into all requests
 * - Provides requireAuthGuard for protected routes
 * - Provides requireAdminGuard for admin routes
 *
 * Usage:
 * ```typescript
 * // Apply to entire app for optional auth on all routes
 * app.use(authPlugin)
 *
 * // Protected route group
 * app.use(requireAuthGuard)
 *   .get('/api/assets', handler)
 *
 * // Admin-only route group
 * app.use(requireAdminGuard)
 *   .get('/api/admin/users', handler)
 * ```
 *
 * Benefits:
 * - Consistent auth pattern across all routes
 * - Type-safe user context injection
 * - Centralized auth logic (no middleware files needed)
 * - Self-contained plugin with all auth logic
 */

import { Elysia } from "elysia";
import { PrivyClient } from "@privy-io/server-auth";
import { UnauthorizedError, ForbiddenError } from "../errors";
import type { AuthUser } from "../types/auth";
import { userService } from "../services/UserService";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// Initialize Privy client
const privy = new PrivyClient(
  env.PRIVY_APP_ID || "",
  env.PRIVY_APP_SECRET || "",
);

/**
 * Optional auth helper - attaches user if valid token present
 * Does not error if no token - use requireAuth for protected routes
 */
export async function optionalAuth({
  request,
  headers,
}: {
  request: Request;
  headers: Record<string, string | undefined>;
}): Promise<{ user?: AuthUser }> {
  try {
    // Extract token from Authorization header
    const authHeader =
      headers?.authorization || request?.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without user
      return {};
    }

    const token = authHeader.replace("Bearer ", "");

    let privyUserId: string;

    // In test mode, decode JWT without verifying signature
    if (env.NODE_ENV === "test") {
      try {
        // Decode JWT payload (part between first and second dot)
        const parts = token.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        privyUserId = payload.sub;
        console.log(
          `[Auth Plugin] TEST MODE - Decoded token for userId: ${privyUserId}`,
        );
      } catch (error) {
        console.error(
          "[Auth Plugin] TEST MODE - Failed to decode token:",
          error,
        );
        return {};
      }
    } else {
      // Production: Verify Privy JWT with cryptographic signature
      const verifiedClaims = await privy.verifyAuthToken(token);
      privyUserId = verifiedClaims.userId;
      console.log(
        `[Auth Plugin] Verifying token for Privy userId: ${privyUserId}`,
      );
    }

    // Find or create user in database
    let user = await userService.findByPrivyUserId(privyUserId);

    if (!user) {
      console.log(
        `[Auth Plugin] User not found for Privy userId ${privyUserId}, creating new user...`,
      );
      // Auto-create user on first request with valid Privy token
      try {
        user = await userService.createUser({
          privyUserId,
          role: "member", // Default role - admins must be promoted manually
        });
        console.log(
          `[Auth Plugin] Created new user: ${user.id} for Privy userId: ${privyUserId}`,
        );
      } catch (error) {
        console.error(
          `[Auth Plugin] Failed to create user for Privy userId ${privyUserId}:`,
          error,
        );
        throw error;
      }
    } else {
      console.log(
        `[Auth Plugin] Found existing user: ${user.id} for Privy userId: ${privyUserId}`,
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
        isAdmin: user.role === "admin",
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    // Invalid token or verification failed - continue without user
    logger.error({ err: error }, "Auth plugin error:");
    return {};
  }
}

/**
 * Require authentication - throws error if no valid token
 */
export async function requireAuth({
  request,
  headers,
}: {
  request: Request;
  headers: Record<string, string | undefined>;
}): Promise<{ user: AuthUser } | Response> {
  const result = await optionalAuth({ request, headers });

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

/**
 * Base Authentication Plugin
 * Injects optional user context into all requests using .derive()
 *
 * This plugin attaches user info if a valid token is present,
 * but doesn't block requests without authentication.
 *
 * Injects: { user?: AuthUser }
 */
export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "scoped" },
  async (context) => {
    const result = await optionalAuth(context);
    return { user: result.user } as { user?: AuthUser };
  },
);

/**
 * Require Authentication Guard
 * Ensures user is authenticated or throws 401 error
 *
 * Use this for routes that require authentication but not admin access.
 *
 * Injects: { user: AuthUser } (guaranteed to exist)
 */
export const requireAuthGuard = new Elysia({
  name: "require-auth-guard",
}).derive({ as: "scoped" }, async (context) => {
  const result = await requireAuth(context);

  // If requireAuth returned a Response, it means authentication failed
  if (result instanceof Response) {
    throw new UnauthorizedError("Authentication required");
  }

  return { user: result.user } as { user: AuthUser };
});

/**
 * Require Admin Guard
 * Ensures user is authenticated AND has admin role
 *
 * Use this for admin-only routes.
 *
 * Injects: { user: AuthUser } (guaranteed to exist and be admin)
 */
export const requireAdminGuard = new Elysia({
  name: "require-admin-guard",
}).derive({ as: "scoped" }, async (context) => {
  const result = await requireAuth(context);

  // Check if authentication failed
  if (result instanceof Response) {
    throw new UnauthorizedError("Authentication required");
  }

  // Check if user is admin
  if (result.user.role !== "admin") {
    throw new ForbiddenError("Admin access required", {
      userRole: result.user.role,
      requiredRole: "admin",
    });
  }

  return { user: result.user } as { user: AuthUser };
});
