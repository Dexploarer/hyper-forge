/**
 * Admin-Only Middleware
 * Requires valid Privy JWT AND user.role === 'admin'
 * Returns 401 if not authenticated, 403 if not admin
 */

import { requireAuth, AuthUser } from "./auth";

/**
 * Require admin role - returns 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin({
  request,
  headers,
}: {
  request: Request;
  headers: Record<string, string | undefined>;
}): Promise<{ user: AuthUser } | Response> {
  // First check if user is authenticated
  const authResult = await requireAuth({ request, headers });

  // If requireAuth returned a Response (error), pass it through
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;

  // Check if user has admin role
  if (user.role !== "admin") {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Admin access required",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return { user };
}
