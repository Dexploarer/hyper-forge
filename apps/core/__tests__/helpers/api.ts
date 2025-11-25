/**
 * API Test Helper
 * November 2025 Best Practices (Elysia):
 *
 * RECOMMENDED: Use Eden Treaty for type-safe testing
 * - Pass Elysia instance directly to treaty() - zero network overhead
 * - Full TypeScript autocomplete for routes
 * - Compile-time type checking for request/response
 *
 * ALTERNATIVE: Use app.handle() for low-level testing
 * - Manual Request construction
 * - Useful when you need fine-grained control
 *
 * @see https://elysiajs.com/patterns/unit-test
 * @see https://elysiajs.com/eden/treaty/unit-test
 */

import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import type { AuthUser } from "../../server/middleware/auth";
import { createAuthHeader } from "./auth";

/**
 * Type alias for any Elysia instance
 * Using Elysia base type allows TypeScript to infer specific type parameters
 * from the actual app instance passed to the functions below.
 */
type AnyElysiaApp = Elysia;

/**
 * Create a type-safe Eden Treaty client from an Elysia instance
 *
 * This is the RECOMMENDED approach for testing per Elysia best practices.
 * Eden Treaty provides:
 * - Full type safety with autocomplete
 * - Zero network overhead (calls app.handle() internally)
 * - Compile-time validation of requests/responses
 *
 * @example
 * ```typescript
 * const app = new Elysia().use(assetRoutes);
 * const api = createTestClient(app);
 *
 * // Type-safe requests with autocomplete
 * const { data, error } = await api.api.assets.get();
 * const { data: asset } = await api.api.assets({ id: 'test' }).get();
 * ```
 */
export function createTestClient<T extends AnyElysiaApp>(app: T) {
  return treaty(app);
}

/**
 * Create a type-safe Eden Treaty client with auth headers
 *
 * @example
 * ```typescript
 * const api = createAuthTestClient(app, testUser.authUser);
 * const { data } = await api.api.assets.get(); // Authenticated request
 * ```
 */
export function createAuthTestClient<T extends AnyElysiaApp>(
  app: T,
  user: AuthUser,
) {
  return treaty(app, {
    headers: {
      Authorization: createAuthHeader(
        user.privyUserId,
        user.email || undefined,
      ),
    },
  });
}

/**
 * Helper function to create a Request object
 * Based on Elysia test best practices
 */
export function req(
  path: string,
  options: RequestInit = {},
  baseURL = "http://test-server",
): Request {
  const url = path.startsWith("http") ? path : `${baseURL}${path}`;
  return new Request(url, options);
}

/**
 * Create a GET request
 */
export function get(path: string, headers?: HeadersInit): Request {
  return req(path, {
    method: "GET",
    headers,
  });
}

/**
 * Create a POST request with JSON body
 */
export function post(
  path: string,
  body: unknown,
  headers?: HeadersInit,
): Request {
  return req(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a PATCH request with JSON body
 */
export function patch(
  path: string,
  body: unknown,
  headers?: HeadersInit,
): Request {
  return req(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a DELETE request
 */
export function del(path: string, headers?: HeadersInit): Request {
  return req(path, {
    method: "DELETE",
    headers,
  });
}

/**
 * Create an authenticated GET request
 */
export function authGet(path: string, user: AuthUser): Request {
  return req(path, {
    method: "GET",
    headers: {
      Authorization: createAuthHeader(
        user.privyUserId,
        user.email || undefined,
      ),
    },
  });
}

/**
 * Create an authenticated POST request
 */
export function authPost(path: string, body: unknown, user: AuthUser): Request {
  return req(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createAuthHeader(
        user.privyUserId,
        user.email || undefined,
      ),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create an authenticated PATCH request
 */
export function authPatch(
  path: string,
  body: unknown,
  user: AuthUser,
): Request {
  return req(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: createAuthHeader(
        user.privyUserId,
        user.email || undefined,
      ),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create an authenticated DELETE request
 */
export function authDel(path: string, user: AuthUser): Request {
  return req(path, {
    method: "DELETE",
    headers: {
      Authorization: createAuthHeader(
        user.privyUserId,
        user.email || undefined,
      ),
    },
  });
}

/**
 * Test an Elysia route and return response
 * Following Elysia best practice: app.handle() instead of server
 */
export async function testRoute(
  app: Elysia,
  request: Request,
): Promise<Response> {
  return await app.handle(request);
}

/**
 * Test a route and parse JSON response
 */
export async function testRouteJSON<T = unknown>(
  app: Elysia,
  request: Request,
): Promise<{ response: Response; data: T }> {
  const response = await app.handle(request);
  const data = await response.json();
  return { response, data };
}

/**
 * Assert response status
 */
export function assertStatus(response: Response, expected: number) {
  if (response.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${response.status}`);
  }
}

/**
 * Assert response is OK (200-299)
 */
export function assertOK(response: Response) {
  if (!response.ok) {
    throw new Error(
      `Expected OK response, got ${response.status}: ${response.statusText}`,
    );
  }
}

/**
 * Assert response has specific header
 */
export function assertHeader(
  response: Response,
  headerName: string,
  expectedValue?: string,
) {
  const value = response.headers.get(headerName);
  if (value === null) {
    throw new Error(`Expected header "${headerName}" not found`);
  }
  if (expectedValue !== undefined && value !== expectedValue) {
    throw new Error(
      `Header "${headerName}" expected "${expectedValue}", got "${value}"`,
    );
  }
}

/**
 * Extract JSON from response with error handling
 */
export async function extractJSON<T = unknown>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}
