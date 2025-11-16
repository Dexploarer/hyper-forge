/**
 * Metrics Plugin for Elysia
 * Consolidates Prometheus metrics and business metrics endpoints
 *
 * Provides:
 * - /metrics: Prometheus metrics for scraping (request counts, latencies, etc.)
 * - /metrics/business: Custom business metrics (users, assets, jobs, etc.)
 *
 * Uses elysia-prometheus for automatic HTTP metrics collection
 */

import { Elysia } from "elysia";
import prometheus from "elysia-prometheus";

/**
 * Metrics Plugin
 * Registers Prometheus and business metrics endpoints
 */
export const metricsPlugin = new Elysia({ name: "metrics" })
  // Prometheus metrics endpoint (automated HTTP metrics)
  .use(
    prometheus({
      metricsPath: "/metrics", // Prometheus scrape endpoint
    }),
  )

  // Enhanced metrics endpoint with business metrics
  .get("/metrics/business", async () => {
    const { getBusinessMetrics } = await import("../metrics/business");
    const metrics = await getBusinessMetrics();

    return new Response(metrics, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  });
