/**
 * Authentication Plugin for Elysia
 * Provides authentication using .derive() pattern
 *
 * SINGLE-TEAM APP: No role-based access control.
 * Auth is optional throughout the app and used only for tracking.
 *
 * This plugin consolidates auth logic into reusable plugins:
 * - authPlugin: Injects optional user context (recommended for all routes)
 * - requireAuthGuard: Requires authentication (rarely needed)
 *
 * Usage:
 * ```typescript
 * // Apply to entire app for optional auth on all routes
 * app.use(authPlugin)
 *   .get('/api/assets', handler) // Auth optional
 *
 * // If you need to require auth (rarely needed in single-team app)
 * app.use(requireAuthGuard)
 *   .get('/api/some-route', handler) // Auth required
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
import { ApiKeyService } from "../services/ApiKeyService";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// Initialize Privy client (only if credentials provided)
const privy =
  env.PRIVY_APP_ID && env.PRIVY_APP_SECRET
    ? new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET)
    : null;

/**
 * Optional auth helper - attaches user if valid token present
 * Does not error if no token - use requireAuth for protected routes
 *
 * NON-BREAKING: Supports both Privy JWT and API keys
 * - API keys start with "af_" (af_live_* or af_test_*)
 * - Privy JWT tokens are everything else
 */
export async function optionalAuth({
  request,
  headers,
}: {
  request: Request;
  headers: Record<string, string | undefined>;
}): Promise<{ user?: AuthUser; authMethod?: "privy" | "api_key" }> {
  try {
    // Extract token from Authorization header
    const authHeader =
      headers?.authorization || request?.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without user
      return {};
    }

    const token = authHeader.replace("Bearer ", "");

    // NEW: Check if this is an API key (starts with "af_")
    if (token.startsWith("af_")) {
      const apiKeyService = new ApiKeyService();
      const result = await apiKeyService.validateApiKey(token);

      if (!result) {
        // Invalid API key - continue without user
        logger.warn(
          { keyPrefix: token.substring(0, 16), context: "auth" },
          "Invalid API key provided",
        );
        return {};
      }

      // Get user from database
      const user = await userService.findById(result.userId);

      if (!user) {
        logger.error(
          {
            userId: result.userId,
            keyPrefix: token.substring(0, 16),
            context: "auth",
          },
          "API key references non-existent user",
        );
        return {};
      }

      logger.info(
        {
          userId: user.id,
          keyPrefix: token.substring(0, 16),
          context: "auth",
          authMethod: "api_key",
        },
        "Authenticated via API key",
      );

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
        authMethod: "api_key",
      };
    }

    // EXISTING: Privy JWT authentication (skip if Privy not configured)

    if (!privy) {
      logger.warn(
        { context: "auth" },
        "Privy client not initialized - authentication disabled",
      );
      return {};
    }

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
        logger.info(
          { privyUserId, context: "auth" },
          "TEST MODE - Decoded token for userId",
        );
      } catch (error) {
        logger.error(
          { err: error, context: "auth" },
          "TEST MODE - Failed to decode token",
        );
        return {};
      }
    } else {
      // Production: Verify Privy JWT with cryptographic signature
      const verifiedClaims = await privy.verifyAuthToken(token);
      privyUserId = verifiedClaims.userId;
      logger.info(
        { privyUserId, context: "auth" },
        "Verifying token for Privy userId",
      );
    }

    // Find or create user in database
    let user = await userService.findByPrivyUserId(privyUserId);

    if (!user) {
      logger.info(
        { privyUserId, context: "auth" },
        "User not found for Privy userId, checking for account linking",
      );

      // Fetch Privy user to get email/wallet for account linking check
      let privyUserEmail: string | undefined;
      let privyUserWallet: string | undefined;

      try {
        // Only fetch Privy user in production (test mode doesn't have real Privy)
        if (env.NODE_ENV !== "test" && privy) {
          const privyUser = await privy.getUser(privyUserId);
          // Extract email from linked accounts
          const emailAccount = privyUser.linkedAccounts?.find(
            (acc) => acc.type === "email",
          );
          privyUserEmail = emailAccount?.address;

          // Extract wallet address from linked accounts
          const walletAccount = privyUser.linkedAccounts?.find(
            (acc) => acc.type === "wallet",
          );
          privyUserWallet = walletAccount?.address;
        }
      } catch (error) {
        logger.warn(
          { err: error, privyUserId, context: "auth" },
          "Failed to fetch Privy user for account linking check, proceeding with new user creation",
        );
        // Continue with user creation even if Privy fetch fails
      }

      // Check for existing user with matching email or wallet (account linking)
      let existingUser: Awaited<ReturnType<typeof userService.findByEmail>> =
        null;
      if (privyUserEmail) {
        existingUser = await userService.findByEmail(privyUserEmail);
      }
      if (!existingUser && privyUserWallet) {
        existingUser = await userService.findByWalletAddress(privyUserWallet);
      }

      if (existingUser) {
        // Link the new Privy user ID to the existing account
        logger.info(
          {
            existingUserId: existingUser.id,
            existingPrivyUserId: existingUser.privyUserId,
            newPrivyUserId: privyUserId,
            email: privyUserEmail,
            wallet: privyUserWallet,
            context: "auth",
          },
          "Found existing user with matching email/wallet, linking Privy accounts",
        );

        try {
          user = await userService.linkPrivyUserId(
            existingUser.id,
            privyUserId,
            privyUserEmail,
            privyUserWallet,
          );
          logger.info(
            {
              userId: user.id,
              oldPrivyUserId: existingUser.privyUserId,
              newPrivyUserId: privyUserId,
              context: "auth",
            },
            "Successfully linked Privy user ID to existing account",
          );
        } catch (error) {
          logger.error(
            {
              err: error,
              existingUserId: existingUser.id,
              privyUserId,
              context: "auth",
            },
            "Failed to link Privy user ID, creating new user instead",
          );
          // Fall back to creating a new user if linking fails
          user = await userService.createUser({
            privyUserId,
            email: privyUserEmail,
            walletAddress: privyUserWallet,
            role: "member",
          });
        }
      } else {
        // No existing user found, create new user
        try {
          user = await userService.createUser({
            privyUserId,
            email: privyUserEmail,
            walletAddress: privyUserWallet,
            role: "member", // Default role - admins must be promoted manually
          });
          logger.info(
            { userId: user.id, privyUserId, context: "auth" },
            "Created new user for Privy userId",
          );
        } catch (error) {
          logger.error(
            { err: error, privyUserId, context: "auth" },
            "Failed to create user for Privy userId",
          );
          throw error;
        }
      }
    } else {
      logger.info(
        { userId: user.id, privyUserId, context: "auth" },
        "Found existing user for Privy userId",
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
      authMethod: "privy",
    };
  } catch (error) {
    // Invalid token or verification failed - continue without user
    logger.error({ err: error, context: "auth" }, "Auth plugin error");
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
 * NON-BREAKING: Supports both Privy JWT and API keys
 *
 * Injects: { user?: AuthUser; authMethod?: "privy" | "api_key" }
 */
export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "scoped" },
  async (context) => {
    const result = await optionalAuth(context);
    return {
      user: result.user,
      authMethod: result.authMethod,
    } as { user?: AuthUser; authMethod?: "privy" | "api_key" };
  },
);

/**
 * Require Authentication Guard
 * Ensures user is authenticated or throws 401 error
 *
 * Use this for routes that require authentication but not admin access.
 *
 * Injects: { user: AuthUser } (guaranteed to exist)
 *
 * NOTE: Errors thrown in .derive() are caught by the global error handler
 * (errorHandlerPlugin with `{ as: 'global' }`), which converts UnauthorizedError
 * to a proper 401 JSON response.
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
 * Require Admin Guard (DEPRECATED - Single-Team App)
 *
 * @deprecated This is a single-team app with no role-based access control.
 * This guard now behaves identically to requireAuthGuard - it only checks
 * authentication, not roles. All authenticated users have full access.
 *
 * For backwards compatibility, this is kept as an alias to requireAuthGuard.
 * Use authPlugin instead for optional auth (recommended for single-team).
 *
 * Injects: { user: AuthUser } (guaranteed to exist)
 */
export const requireAdminGuard = new Elysia({
  name: "require-admin-guard-deprecated",
}).derive({ as: "scoped" }, async (context) => {
  const result = await requireAuth(context);

  // Check if authentication failed
  if (result instanceof Response) {
    throw new UnauthorizedError("Authentication required");
  }

  // SINGLE-TEAM: No role check - all authenticated users have access
  logger.info(
    {
      userId: result.user.id,
      context: "auth",
    },
    "Admin guard (deprecated): Auth only, no role check in single-team app",
  );

  return { user: result.user } as { user: AuthUser };
});
