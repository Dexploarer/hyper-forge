/**
 * Authentication Guard Plugins
 * Elysia plugins for route-level authentication and authorization
 *
 * Usage:
 * - requireAuth: Ensures user is authenticated (returns 401 if not)
 * - requireAdmin: Ensures user is authenticated AND is an admin (returns 403 if not)
 *
 * Best Practice: Use these as guards in route definitions instead of manual auth checks
 *
 * Example:
 * app.guard({ beforeHandle: requireAuthGuard }, (app) =>
 *   app.get('/protected', () => 'Protected content')
 * )
 */

import { Elysia } from "elysia";
import { optionalAuth, requireAuth as requireAuthFn } from "../middleware/auth";
import { UnauthorizedError, ForbiddenError } from "../errors";

/**
 * Authentication guard plugin
 * Attaches authenticated user to context or returns 401
 *
 * Uses `as any` trick to extend context types properly
 * Injects: { user: AuthUser }
 */
export const requireAuthGuard = new Elysia({
  name: "require-auth-guard",
}).derive(async (context) => {
  const result = await requireAuthFn(context);

  // If requireAuth returned a Response, it means authentication failed
  if (result instanceof Response) {
    throw new UnauthorizedError("Authentication required");
  }

  return { user: result.user } as any;
});

/**
 * Admin authorization guard plugin
 * Requires authentication AND admin role
 *
 * Uses `as any` trick to extend context types properly
 * Injects: { user: AuthUser } (guaranteed to be admin)
 */
export const requireAdminGuard = new Elysia({
  name: "require-admin-guard",
}).derive(async (context) => {
  const result = await requireAuthFn(context);

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

  return { user: result.user } as any;
});

/**
 * Optional authentication plugin
 * Attaches user to context if authenticated, continues if not
 *
 * Uses `as any` trick to extend context types properly
 * Injects: { user?: AuthUser }
 */
export const optionalAuthGuard = new Elysia({
  name: "optional-auth-guard",
}).derive(async (context) => {
  const result = await optionalAuth(context);
  return { user: result.user } as any;
});
