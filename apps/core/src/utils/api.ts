import { retryWithBackoff, RetryOptions } from './retry'
import { getAuthToken } from './auth-token-store'

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retry?: RetryOptions | boolean
}

// Get API base URL for constructing full URLs
// In production (Railway), frontend and API are served from same domain, so use relative URLs
// In development, Vite proxy handles /api routes, so use relative URLs
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use relative URLs (same domain)
  // In development, use relative URLs (Vite proxy handles /api -> backend)
  return "";
}

export async function apiFetch(input: string, init: RequestOptions = {}): Promise<Response> {
  const { timeoutMs = 15000, signal, retry: retryConfig, ...rest } = init
  
  // Construct full URL if input is a relative path
  // If input is already absolute (http:// or https://), use it as-is
  // Otherwise, prepend base URL (empty string in dev/prod means relative URL)
  const url = input.startsWith('http://') || input.startsWith('https://') 
    ? input 
    : `${getApiBaseUrl()}${input.startsWith('/') ? input : `/${input}`}`
  
  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('Timeout', 'AbortError')), timeoutMs)

    try {
      // Get auth token and add to headers
      // Only set Authorization from global token if not already explicitly provided
      const token = getAuthToken()
      
      // Convert rest.headers to a plain object, handling Headers objects, arrays, and plain objects
      const headers: Record<string, string> = {}
      
      if (rest.headers) {
        if (rest.headers instanceof Headers) {
          // Headers object - iterate over entries
          rest.headers.forEach((value, key) => {
            headers[key] = value
          })
        } else if (Array.isArray(rest.headers)) {
          // Array of [key, value] tuples
          rest.headers.forEach(([key, value]) => {
            headers[key] = value
          })
        } else {
          // Plain object
          Object.assign(headers, rest.headers)
        }
      }
      
      // Only set Authorization header from global token if it's not already set
      // This allows explicit Authorization headers (e.g., from accessToken parameter) to take precedence
      // Check both 'Authorization' and 'authorization' for case-insensitivity
      const hasAuthHeader = headers['Authorization'] || headers['authorization']
      if (token && !hasAuthHeader) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...rest,
        headers,
        signal: signal ?? controller.signal
      })
      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  // Apply retry logic if enabled
  if (retryConfig) {
    const retryOptions = retryConfig === true ? {} : retryConfig
    const result = await retryWithBackoff(fetchWithTimeout, retryOptions)
    
    if (result.success && result.data) {
      return result.data
    }
    
    throw result.error || new Error('Request failed after retries')
  }

  // No retry - direct fetch
  return fetchWithTimeout()
} 