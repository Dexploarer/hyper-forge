/**
 * Admin-Only Middleware
 * Requires valid Privy JWT AND user.role === 'admin'
 * Returns 401 if not authenticated, 403 if not admin
 */

import { requireAuth } from './auth';

/**
 * Require admin role - returns 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin(context: any): Promise<{ user: any } | Response> {
  // First check if user is authenticated
  const authResult = await requireAuth(context);

  // If requireAuth returned a Response (error), pass it through
  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;

  // Check if user has admin role
  if (user.role !== 'admin') {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Admin access required',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { user };
}
