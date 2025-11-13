/**
 * Business Metrics for Prometheus
 * Custom application-level metrics for monitoring business events
 *
 * Features:
 * - Asset generation metrics (counts, duration, errors)
 * - User activity metrics (logins, sessions, actions)
 * - Storage metrics (usage, uploads, downloads)
 * - API usage metrics (requests, latency per endpoint)
 *
 * Usage:
 * Import metrics and increment/observe in your service methods:
 *   import { assetGenerationCounter } from './metrics/business';
 *   assetGenerationCounter.inc({ type: 'character', status: 'success' });
 */

import { Counter, Gauge, Histogram, Registry } from "prom-client";

// Use a separate registry for business metrics to avoid conflicts with elysia-prometheus
export const businessRegistry = new Registry();

// ==================== ASSET GENERATION METRICS ====================

/**
 * Total asset generations by type and status
 * Labels: type (character, environment, prop, etc.), status (success, failure)
 */
export const assetGenerationCounter = new Counter({
  name: "asset_generations_total",
  help: "Total number of asset generations by type and status",
  labelNames: ["type", "status"],
  registers: [businessRegistry],
});

/**
 * Asset generation duration in seconds
 * Labels: type (character, environment, prop, etc.)
 * Buckets optimized for AI generation (5s to 5 minutes)
 */
export const assetGenerationDuration = new Histogram({
  name: "asset_generation_duration_seconds",
  help: "Time taken to generate assets in seconds",
  labelNames: ["type"],
  buckets: [5, 10, 30, 60, 120, 180, 300], // 5s, 10s, 30s, 1m, 2m, 3m, 5m
  registers: [businessRegistry],
});

/**
 * Failed asset generations by error type
 * Labels: type (character, environment, prop, etc.), error_type (timeout, api_error, validation_error, etc.)
 */
export const assetGenerationErrors = new Counter({
  name: "asset_generation_errors_total",
  help: "Total number of failed asset generations by error type",
  labelNames: ["type", "error_type"],
  registers: [businessRegistry],
});

// ==================== USER ACTIVITY METRICS ====================

/**
 * Total user logins by provider
 * Labels: provider (privy, wallet, etc.)
 */
export const userLoginsCounter = new Counter({
  name: "user_logins_total",
  help: "Total number of user logins by provider",
  labelNames: ["provider"],
  registers: [businessRegistry],
});

/**
 * Currently active user sessions
 * NOTE: This is a gauge (can go up and down)
 */
export const activeSessionsGauge = new Gauge({
  name: "user_active_sessions",
  help: "Number of currently active user sessions",
  registers: [businessRegistry],
});

/**
 * User actions by type
 * Labels: action (create, update, delete, view)
 */
export const userActionsCounter = new Counter({
  name: "user_actions_total",
  help: "Total number of user actions by type",
  labelNames: ["action", "resource_type"],
  registers: [businessRegistry],
});

// ==================== STORAGE METRICS ====================

/**
 * Total storage used in bytes
 * Labels: user_id (optional - only for aggregated metrics), project_id (optional)
 * NOTE: Use this sparingly to avoid high cardinality
 */
export const storageUsedGauge = new Gauge({
  name: "storage_used_bytes",
  help: "Total storage used in bytes",
  labelNames: ["context"], // context: user, project, system
  registers: [businessRegistry],
});

/**
 * File uploads by type
 * Labels: file_type (glb, png, jpg, vrm, etc.)
 */
export const fileUploadsCounter = new Counter({
  name: "file_uploads_total",
  help: "Total number of file uploads by file type",
  labelNames: ["file_type"],
  registers: [businessRegistry],
});

/**
 * File downloads by type
 * Labels: file_type (glb, png, jpg, vrm, etc.)
 */
export const fileDownloadsCounter = new Counter({
  name: "file_downloads_total",
  help: "Total number of file downloads by file type",
  labelNames: ["file_type"],
  registers: [businessRegistry],
});

// ==================== API USAGE METRICS ====================

/**
 * API requests by endpoint and method
 * Labels: endpoint (normalized path), method (GET, POST, etc.), status (2xx, 4xx, 5xx)
 */
export const apiRequestsCounter = new Counter({
  name: "api_requests_by_endpoint_total",
  help: "Total number of API requests by endpoint, method, and status",
  labelNames: ["endpoint", "method", "status_code"],
  registers: [businessRegistry],
});

/**
 * API response time by endpoint
 * Labels: endpoint (normalized path), method (GET, POST, etc.)
 * Buckets optimized for API responses (10ms to 30s)
 */
export const apiResponseTime = new Histogram({
  name: "api_response_time_by_endpoint_seconds",
  help: "API response time in seconds by endpoint and method",
  labelNames: ["endpoint", "method"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30], // 10ms, 50ms, 100ms, 500ms, 1s, 5s, 10s, 30s
  registers: [businessRegistry],
});

// ==================== AI/LLM METRICS ====================

/**
 * AI/LLM API calls by provider
 * Labels: provider (openai, anthropic, elevenlabs, meshy), model (gpt-4, claude-3, etc.), status (success, failure)
 */
export const aiApiCallsCounter = new Counter({
  name: "ai_api_calls_total",
  help: "Total number of AI/LLM API calls by provider and model",
  labelNames: ["provider", "model", "status"],
  registers: [businessRegistry],
});

/**
 * AI/LLM API latency by provider
 * Labels: provider (openai, anthropic, elevenlabs, meshy), model (gpt-4, claude-3, etc.)
 */
export const aiApiLatency = new Histogram({
  name: "ai_api_latency_seconds",
  help: "AI/LLM API latency in seconds by provider and model",
  labelNames: ["provider", "model"],
  buckets: [0.5, 1, 2, 5, 10, 30, 60, 120], // 500ms to 2 minutes
  registers: [businessRegistry],
});

/**
 * AI tokens used by provider and model
 * Labels: provider (openai, anthropic, etc.), model (gpt-4, claude-3, etc.), type (prompt, completion)
 */
export const aiTokensCounter = new Counter({
  name: "ai_tokens_used_total",
  help: "Total number of AI tokens used by provider, model, and type",
  labelNames: ["provider", "model", "type"],
  registers: [businessRegistry],
});

// ==================== DATABASE METRICS ====================

/**
 * Database query duration by operation
 * Labels: operation (select, insert, update, delete), table (assets, users, etc.)
 */
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Database query duration in seconds by operation and table",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5], // 1ms to 5s
  registers: [businessRegistry],
});

/**
 * Database connection pool metrics
 */
export const dbConnectionsActive = new Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
  registers: [businessRegistry],
});

export const dbConnectionsIdle = new Gauge({
  name: "db_connections_idle",
  help: "Number of idle database connections",
  registers: [businessRegistry],
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Normalize endpoint path for metrics (replace IDs with :id)
 * This prevents high cardinality in metrics
 */
export function normalizeEndpoint(path: string): string {
  return (
    path
      // Replace UUIDs with :id
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ":id",
      )
      // Replace numeric IDs with :id
      .replace(/\/\d+/g, "/:id")
      // Replace asset names/slugs with :slug
      .replace(/\/[a-z0-9-]+\.(glb|png|jpg|jpeg|vrm|mp3|wav)/gi, "/:file")
  );
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "unknown";
  return ext;
}

/**
 * Categorize HTTP status code
 */
export function getStatusCategory(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return "2xx";
  if (statusCode >= 300 && statusCode < 400) return "3xx";
  if (statusCode >= 400 && statusCode < 500) return "4xx";
  if (statusCode >= 500 && statusCode < 600) return "5xx";
  return "unknown";
}

/**
 * Timer helper for measuring duration
 */
export class MetricsTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedSeconds(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Observe duration in a histogram
   */
  observe(
    histogram: Histogram<string>,
    labels?: Record<string, string | number>,
  ) {
    const duration = this.getElapsedSeconds();
    histogram.observe(labels || {}, duration);
    return duration;
  }
}

/**
 * Export all metrics for scraping
 */
export async function getBusinessMetrics(): Promise<string> {
  return businessRegistry.metrics();
}
