/**
 * Resilient HTTP Client
 *
 * Combines retry logic with circuit breaker pattern for robust external API calls.
 *
 * Features:
 * - Exponential backoff retry with configurable parameters
 * - Circuit breaker pattern via opossum
 * - Fresh AbortController per retry (Bun requirement)
 * - Configurable retryable status codes
 * - Fallback function support
 * - Event logging for circuit breaker state changes
 *
 * Usage:
 * ```typescript
 * const client = new ResilientHttpClient('MyAPI', {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 * }, {
 *   timeout: 30000,
 *   errorThresholdPercentage: 50,
 * });
 *
 * client.fallback(() => Response.json({ error: 'Service unavailable' }, { status: 503 }));
 *
 * const response = await client.fetch('https://api.example.com', {
 *   method: 'POST',
 *   body: JSON.stringify({ data: 'test' }),
 * });
 *
 * await client.shutdown();
 * ```
 */

import CircuitBreaker from "opossum";
import { logger } from '../utils/logger';

/**
 * Retry configuration for exponential backoff
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 30000ms = 30s) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
}

/**
 * Circuit breaker configuration
 */
export interface BreakerConfig {
  /** Request timeout in milliseconds (default: 30000ms = 30s) */
  timeout?: number;
  /** Error percentage threshold to open circuit (default: 50%) */
  errorThresholdPercentage?: number;
  /** Time in milliseconds before attempting to close circuit (default: 30000ms = 30s) */
  resetTimeout?: number;
  /** Minimum number of requests before circuit can open (default: 5) */
  volumeThreshold?: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Default circuit breaker configuration
 */
const DEFAULT_BREAKER_CONFIG: Required<BreakerConfig> = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

/**
 * Resilient HTTP Client with retry logic and circuit breaker
 */
export class ResilientHttpClient {
  private readonly name: string;
  private readonly retryConfig: Required<RetryConfig>;
  private readonly breaker: CircuitBreaker<
    [string | URL, RequestInit?],
    Response
  >;
  private fallbackFn?: () => Response | Promise<Response>;

  /**
   * Creates a new ResilientHttpClient
   *
   * @param name - Name for logging/identification
   * @param retryConfig - Retry configuration
   * @param breakerConfig - Circuit breaker configuration
   */
  constructor(
    name: string,
    retryConfig: RetryConfig = {},
    breakerConfig: BreakerConfig = {},
  ) {
    this.name = name;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    // Merge breaker config with defaults
    const finalBreakerConfig = { ...DEFAULT_BREAKER_CONFIG, ...breakerConfig };

    // Create circuit breaker with fetchWithRetry as the action
    this.breaker = new CircuitBreaker(
      (url: string | URL, options?: RequestInit) =>
        this.fetchWithRetry(url, options),
      {
        timeout: finalBreakerConfig.timeout,
        errorThresholdPercentage: finalBreakerConfig.errorThresholdPercentage,
        resetTimeout: finalBreakerConfig.resetTimeout,
        volumeThreshold: finalBreakerConfig.volumeThreshold,
        name: this.name,
      },
    );

    // Set up circuit breaker event logging
    this.breaker.on("open", () => {
      console.warn(
        `[${this.name}] Circuit breaker OPENED - too many failures, requests will fail fast`,
      );
    });

    this.breaker.on("halfOpen", () => {
      console.info(
        `[${this.name}] Circuit breaker HALF-OPEN - testing if service recovered`,
      );
    });

    this.breaker.on("close", () => {
      console.info(
        `[${this.name}] Circuit breaker CLOSED - service healthy, normal operation resumed`,
      );
    });

    // Set up fallback if configured
    this.breaker.fallback(() => {
      if (this.fallbackFn) {
        logger.warn({ }, '[${this.name}] Using fallback function');
        return this.fallbackFn();
      }
      throw new Error(
        `[${this.name}] Circuit breaker open and no fallback configured`,
      );
    });
  }

  /**
   * Fetches with retry logic and exponential backoff
   *
   * CRITICAL: Creates a new AbortController for each retry attempt (Bun requirement)
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @returns Response
   * @throws Error if all retries exhausted or non-retryable error
   */
  private async fetchWithRetry(
    url: string | URL,
    options: RequestInit = {},
  ): Promise<Response> {
    let lastError: Error | undefined;
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // CRITICAL: Create new AbortController for each attempt (Bun requirement)
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.retryConfig.maxDelay,
        );

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Check if response status is retryable
          if (this.retryConfig.retryableStatuses.includes(response.status)) {
            lastResponse = response;

            // If this is not the last attempt, retry with backoff
            if (attempt < this.retryConfig.maxRetries) {
              const delay = this.calculateBackoff(attempt);
              console.warn(
                `[${this.name}] Retryable status ${response.status} on attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}, retrying in ${delay}ms`,
              );
              await this.sleep(delay);
              continue;
            }

            // Last attempt failed, throw error
            throw new Error(
              `[${this.name}] Request failed with status ${response.status} after ${this.retryConfig.maxRetries + 1} attempts`,
            );
          }

          // Success - return response
          if (attempt > 0) {
            console.info(
              `[${this.name}] Request succeeded on attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}`,
            );
          }
          return response;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's an abort error (timeout)
        if (lastError.name === "AbortError") {
          lastError = new Error(
            `[${this.name}] Request timeout after ${this.retryConfig.maxDelay}ms`,
          );
        }

        // If this is not the last attempt, retry with backoff
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          console.warn(
            `[${this.name}] Request failed on attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}: ${lastError.message}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }

        // Last attempt failed
        console.error(
          `[${this.name}] Request failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError.message}`,
        );
      }
    }

    // All retries exhausted
    if (lastError) {
      throw lastError;
    }

    if (lastResponse) {
      throw new Error(
        `[${this.name}] Request failed with status ${lastResponse.status} after ${this.retryConfig.maxRetries + 1} attempts`,
      );
    }

    throw new Error(
      `[${this.name}] Request failed after ${this.retryConfig.maxRetries + 1} attempts`,
    );
  }

  /**
   * Calculates exponential backoff delay
   *
   * Formula: initialDelay * (backoffMultiplier ^ attemptCount)
   * Capped at maxDelay
   *
   * @param attemptCount - Zero-based attempt count
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attemptCount: number): number {
    const delay =
      this.retryConfig.initialDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attemptCount);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleeps for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetches a URL with circuit breaker protection
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @returns Response
   * @throws Error if circuit is open or request fails
   */
  public async fetch(
    url: string | URL,
    options?: RequestInit,
  ): Promise<Response> {
    return this.breaker.fire(url, options);
  }

  /**
   * Sets a fallback function to use when circuit is open
   *
   * @param fn - Fallback function that returns a Response
   */
  public fallback(fn: () => Response | Promise<Response>): void {
    this.fallbackFn = fn;
  }

  /**
   * Shuts down the circuit breaker and cleans up resources
   */
  public async shutdown(): Promise<void> {
    await this.breaker.shutdown();
    console.info(`[${this.name}] ResilientHttpClient shut down`);
  }

  /**
   * Gets circuit breaker statistics
   *
   * @returns Circuit breaker stats
   */
  public getStats() {
    return this.breaker.stats;
  }

  /**
   * Gets circuit breaker status
   *
   * @returns Circuit breaker status
   */
  public getStatus() {
    return {
      name: this.name,
      opened: this.breaker.opened,
      halfOpen: this.breaker.halfOpen,
      closed: this.breaker.closed,
      stats: this.breaker.stats,
    };
  }
}
