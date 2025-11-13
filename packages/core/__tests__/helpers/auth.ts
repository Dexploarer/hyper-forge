/**
 * Authentication Test Helper
 * November 2025 Best Practices:
 * - Mock JWT tokens for testing
 * - Privy authentication helpers
 * - Test authentication contexts
 */

import type { AuthUser } from "../../server/middleware/auth";

/**
 * Generate a mock JWT token for testing
 * Note: This is NOT cryptographically valid, just for testing
 */
export function createMockJWT(payload: {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: payload.iat || Math.floor(Date.now() / 1000),
      exp: payload.exp || Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }),
  ).toString("base64");
  const signature = "mock-signature";

  return `${header}.${body}.${signature}`;
}

/**
 * Create Authorization header with Bearer token
 */
export function createAuthHeader(privyUserId: string, email?: string): string {
  const token = createMockJWT({ sub: privyUserId, email });
  return `Bearer ${token}`;
}

/**
 * Create a Request object with authentication
 */
export function createAuthRequest(
  url: string,
  authUser: AuthUser,
  options: RequestInit = {},
): Request {
  return new Request(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: createAuthHeader(
        authUser.privyUserId,
        authUser.email || undefined,
      ),
    },
  });
}

/**
 * Create a mock auth context for testing
 * This simulates the Elysia context after authentication middleware
 */
export function createAuthContext(authUser: AuthUser | undefined) {
  return {
    user: authUser,
  };
}

/**
 * Mock Privy verify function for testing
 * Returns a successful verification result
 */
export async function mockPrivyVerify(token: string): Promise<{
  userId: string;
  email?: string;
}> {
  // Decode the mock JWT (not cryptographically secure, just for testing)
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
}

/**
 * Check if a request has valid authorization header
 */
export function hasAuthHeader(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  return authHeader !== null && authHeader.startsWith("Bearer ");
}

/**
 * Extract auth token from request
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}
