/**
 * Retry Utility with Exponential Backoff
 * Implements robust retry mechanisms for API calls with configurable strategies
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: unknown) => boolean
  onRetry?: (attempt: number, error: unknown) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryCondition' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
}

/**
 * Determines if an error should be retried
 * Retries on network errors, timeouts, and 5xx server errors
 */
const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true
    }
    // Abort errors (timeouts)
    if (error.name === 'AbortError') {
      return true
    }
    // Check if it's a fetch Response error
    if ('status' in error) {
      const status = (error as { status: number }).status
      // Retry on 5xx errors and 429 (Too Many Requests)
      return status >= 500 || status === 429
    }
  }
  return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options

  let lastError: unknown
  let attempts = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1

    try {
      const data = await fn()
      return { success: true, data, attempts }
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt < maxRetries && retryCondition(error)) {
        const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier)
        
        if (onRetry) {
          onRetry(attempt + 1, error)
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Don't retry - return error
      return { success: false, error, attempts }
    }
  }

  return { success: false, error: lastError, attempts }
}

/**
 * Create a retry wrapper for fetch requests
 */
export function createRetryableFetch(
  options: RetryOptions = {}
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetch(input, init)
        if (!response.ok) {
          // Create error-like object for retry condition
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          throw error
        }
        return response
      },
      options
    )

    if (result.success && result.data) {
      return result.data
    }

    throw result.error || new Error('Request failed after retries')
  }
}

