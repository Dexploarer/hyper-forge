/**
 * Fetch with Timeout Utility
 * Wraps native fetch with AbortController for timeout handling
 *
 * Note: Elysia's server.timeout() is for HTTP idle timeout,
 * NOT for external API calls. This utility handles fetch timeouts.
 *
 * Usage:
 * ```typescript
 * const response = await fetchWithTimeout('https://api.example.com', {}, 5000);
 * ```
 */

/**
 * Fetch with automatic timeout using AbortController
 *
 * @param url - URL to fetch
 * @param options - Standard RequestInit options
 * @param timeoutMs - Timeout in milliseconds (default: 30000ms = 30s)
 * @returns Promise<Response>
 * @throws Error if request times out or fails
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    // Check if error is from timeout abort
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    // Re-throw other errors (network, DNS, etc)
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
