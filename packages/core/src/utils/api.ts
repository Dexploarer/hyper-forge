import { retryWithBackoff, RetryOptions } from './retry'

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retry?: RetryOptions | boolean
}

export async function apiFetch(input: string, init: RequestOptions = {}): Promise<Response> {
  const { timeoutMs = 15000, signal, retry: retryConfig, ...rest } = init
  
  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('Timeout', 'AbortError')), timeoutMs)

    try {
      const response = await fetch(input, {
        ...rest,
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