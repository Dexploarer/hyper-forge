import { retryWithBackoff, RetryOptions } from "./retry";
import { getAuthToken } from "./auth-token-store";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retry?: RetryOptions | boolean;
}

// Get API base URL for constructing full URLs
// In development: Always use relative URLs (Vite proxy handles /api -> localhost:3004)
// In production: Use VITE_API_URL if set, otherwise relative URLs (same domain)
const getApiBaseUrl = (): string => {
  // In dev mode, always use proxy (ignore VITE_API_URL)
  if (import.meta.env.DEV) {
    return "";
  }

  // In production, use VITE_API_URL if set, otherwise relative URLs
  // Remove trailing slash to prevent double-slash URLs (e.g., //api/users/me)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export async function apiFetch(
  input: string,
  init: RequestOptions = {},
): Promise<Response> {
  const { timeoutMs = 15000, signal, retry: retryConfig, ...rest } = init;

  // Construct full URL if input is a relative path
  // If input is already absolute (http:// or https://), use it as-is
  // Otherwise, prepend base URL (empty string in dev/prod means relative URL)
  const url =
    input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `${getApiBaseUrl()}${input.startsWith("/") ? input : `/${input}`}`;

  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new DOMException("Timeout", "AbortError")),
      timeoutMs,
    );

    try {
      // Get auth token and add to headers
      // Only set Authorization from global token if not already explicitly provided
      const token = getAuthToken();

      // Convert rest.headers to a plain object, handling Headers objects, arrays, and plain objects
      const headers: Record<string, string> = {};

      if (rest.headers) {
        if (rest.headers instanceof Headers) {
          // Headers object - iterate over entries
          rest.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(rest.headers)) {
          // Array of [key, value] tuples
          rest.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          // Plain object
          Object.assign(headers, rest.headers);
        }
      }

      // Only set Authorization header from global token if it's not already set
      // This allows explicit Authorization headers (e.g., from accessToken parameter) to take precedence
      // Check both 'Authorization' and 'authorization' for case-insensitivity
      const hasAuthHeader =
        headers["Authorization"] || headers["authorization"];
      if (token && !hasAuthHeader) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...rest,
        headers,
        signal: signal ?? controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Apply retry logic if enabled
  if (retryConfig) {
    const retryOptions = retryConfig === true ? {} : retryConfig;
    const result = await retryWithBackoff(fetchWithTimeout, retryOptions);

    if (result.success && result.data) {
      return result.data;
    }

    throw result.error || new Error("Request failed after retries");
  }

  // No retry - direct fetch
  return fetchWithTimeout();
}
