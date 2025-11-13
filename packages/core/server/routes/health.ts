/**
 * Health Check Routes
 * Kubernetes-ready health checks with liveness and readiness probes
 *
 * Endpoints:
 * - /health/live: Liveness check (is server process running?)
 * - /health/ready: Readiness check (can server handle traffic?)
 * - /health: Legacy endpoint for backward compatibility
 */

import { Elysia } from "elysia";
import * as Models from "../models";
import { db } from "../db/db";
import { qdrantService } from "../services/QdrantService";
import { sql } from "drizzle-orm";

export const healthRoutes = new Elysia({ prefix: "/api", name: "health" })
  // Liveness check - "Am I alive?"
  // Used by Kubernetes to know if the container should be restarted
  .get(
    "/health/live",
    () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Liveness probe",
        description:
          "Returns OK if server process is running (for Kubernetes liveness checks)",
      },
    },
  )

  // Readiness check - "Can I handle traffic?"
  // Used by Kubernetes to know if the pod should receive traffic
  .get(
    "/health/ready",
    async ({ set }) => {
      const checks = {
        database: false,
        qdrant: false,
      };

      try {
        // Critical: Database must be reachable
        await db.execute(sql`SELECT 1`);
        checks.database = true;
      } catch (e) {
        console.error("[Health] Database check failed:", e);
      }

      try {
        // Optional: Qdrant (don't fail if not configured)
        checks.qdrant = await qdrantService.healthCheck();
      } catch (e) {
        // Non-critical - Qdrant is optional
      }

      // Server is ready if database is accessible (Qdrant is optional)
      const isReady = checks.database;

      if (!isReady) {
        set.status = 503; // Service Unavailable
      }

      return {
        status: isReady ? "ready" : "not_ready",
        timestamp: new Date().toISOString(),
        checks,
      };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Readiness probe",
        description:
          "Returns ready if all critical services are available (for Kubernetes readiness checks)",
      },
    },
  )

  // Legacy endpoint (keep for backward compatibility)
  .get(
    "/health",
    () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        meshy: !!process.env.MESHY_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
      },
    }),
    {
      response: Models.HealthResponse,
      detail: {
        tags: ["Health"],
        summary: "Legacy health check",
        description:
          "Basic health status (use /health/ready for Kubernetes). (Auth optional)",
      },
    },
  );
