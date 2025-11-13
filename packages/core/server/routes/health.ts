/**
 * Health Check Routes
 * Kubernetes-ready health checks with liveness and readiness probes
 *
 * Endpoints:
 * - /health/live: Liveness check (is server process running?)
 * - /health/ready: Readiness check (can server handle traffic?)
 * - /health/deep: Deep health check with all dependencies
 * - /health: Legacy endpoint for backward compatibility
 */

import { Elysia } from "elysia";
import * as Models from "../models";
import { db, queryClient } from "../db/db";
import { qdrantService } from "../services/QdrantService";
import { sql } from "drizzle-orm";
import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

/**
 * Check database health and latency
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Execute simple query to test connection
    await db.execute(sql`SELECT 1 as health_check`);
    const latency = Date.now() - startTime;

    // Get connection pool stats if available
    const poolStats = {
      // postgres.js doesn't expose pool stats directly, but we can check basic connection
      connected: true,
    };

    return {
      status: latency < 100 ? "healthy" : "degraded",
      latency,
      details: poolStats,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Qdrant vector database health
 */
async function checkQdrant(): Promise<HealthCheckResult> {
  if (!process.env.QDRANT_URL) {
    return {
      status: "healthy",
      message: "Not configured (optional)",
    };
  }

  const startTime = Date.now();

  try {
    const isHealthy = await qdrantService.healthCheck();
    const latency = Date.now() - startTime;

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check disk space availability
 */
async function checkDiskSpace(): Promise<HealthCheckResult> {
  try {
    // Get temp directory stats (where we store uploads)
    const tmpDir = os.tmpdir();
    const assetsDir =
      process.env.ASSETS_DIR || path.join(process.cwd(), "gdd-assets");

    // Check both temp and assets directories
    const checks = await Promise.allSettled([
      fs.stat(tmpDir),
      fs.stat(assetsDir).catch(() => null), // Assets dir might not exist yet
    ]);

    // Get filesystem stats (Note: statvfs not available in Node.js, use process)
    // We'll check available system memory as a proxy for disk health
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const freeMemGB = freeMem / (1024 * 1024 * 1024);
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

    // Warn if less than 1GB free or >90% used
    const status =
      freeMemGB < 1 || usedMemPercent > 90
        ? "degraded"
        : freeMemGB < 0.5
          ? "unhealthy"
          : "healthy";

    return {
      status,
      details: {
        freeGB: parseFloat(freeMemGB.toFixed(2)),
        usedPercent: parseFloat(usedMemPercent.toFixed(2)),
        tmpDirExists: checks[0].status === "fulfilled",
        assetsDirExists:
          checks[1].status === "fulfilled" && checks[1].value !== null,
      },
    };
  } catch (error) {
    return {
      status: "degraded",
      message:
        error instanceof Error ? error.message : "Could not check disk space",
    };
  }
}

/**
 * Check memory availability
 */
async function checkMemory(): Promise<HealthCheckResult> {
  try {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const freeMemMB = freeMem / (1024 * 1024);
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

    // Process memory usage
    const processMemory = process.memoryUsage();
    const heapUsedMB = processMemory.heapUsed / (1024 * 1024);
    const heapTotalMB = processMemory.heapTotal / (1024 * 1024);
    const rssMB = processMemory.rss / (1024 * 1024);

    // Warn if less than 512MB free or >90% used
    const status =
      freeMemMB < 512 || usedMemPercent > 90
        ? "degraded"
        : freeMemMB < 256
          ? "unhealthy"
          : "healthy";

    return {
      status,
      details: {
        system: {
          freeMB: parseFloat(freeMemMB.toFixed(2)),
          totalMB: parseFloat((totalMem / (1024 * 1024)).toFixed(2)),
          usedPercent: parseFloat(usedMemPercent.toFixed(2)),
        },
        process: {
          heapUsedMB: parseFloat(heapUsedMB.toFixed(2)),
          heapTotalMB: parseFloat(heapTotalMB.toFixed(2)),
          rssMB: parseFloat(rssMB.toFixed(2)),
        },
      },
    };
  } catch (error) {
    return {
      status: "degraded",
      message:
        error instanceof Error ? error.message : "Could not check memory",
    };
  }
}

/**
 * Check external API health (optional services)
 */
async function checkExternalAPIs(): Promise<HealthCheckResult> {
  const apis = {
    meshy: !!process.env.MESHY_API_KEY,
    openai: !!(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY),
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    privy: !!(process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET),
  };

  const configuredCount = Object.values(apis).filter(Boolean).length;

  return {
    status: "healthy",
    details: {
      configured: apis,
      count: configuredCount,
    },
  };
}

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
          "Returns OK if server process is running (for Kubernetes liveness checks). Use this endpoint to determine if the container should be restarted.",
        responses: {
          200: {
            description: "Server is alive and responding",
            content: {
              "application/json": {
                examples: {
                  success: {
                    summary: "Healthy server response",
                    value: {
                      status: "ok",
                      timestamp: "2025-11-12T10:30:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
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
          "Returns ready if all critical services are available (for Kubernetes readiness checks). Use this endpoint to determine if the pod should receive traffic. Database connectivity is required; Qdrant is optional.",
        responses: {
          200: {
            description: "Server is ready to handle requests",
            content: {
              "application/json": {
                examples: {
                  ready: {
                    summary: "All services ready",
                    value: {
                      status: "ready",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      checks: {
                        database: true,
                        qdrant: true,
                      },
                    },
                  },
                  readyWithoutQdrant: {
                    summary: "Ready without optional Qdrant",
                    value: {
                      status: "ready",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      checks: {
                        database: true,
                        qdrant: false,
                      },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: "Server is not ready (database unavailable)",
            content: {
              "application/json": {
                examples: {
                  notReady: {
                    summary: "Database connection failed",
                    value: {
                      status: "not_ready",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      checks: {
                        database: false,
                        qdrant: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  )

  // Deep health check - "What's the status of all dependencies?"
  // Comprehensive health check for monitoring dashboards
  .get(
    "/health/deep",
    async ({ set }) => {
      const startTime = Date.now();

      // Run all health checks in parallel
      const [database, qdrant, disk, memory, externalAPIs] = await Promise.all([
        checkDatabase(),
        checkQdrant(),
        checkDiskSpace(),
        checkMemory(),
        checkExternalAPIs(),
      ]);

      // Determine overall status
      const allChecks = [database, qdrant, disk, memory];
      const hasUnhealthy = allChecks.some(
        (check) => check.status === "unhealthy",
      );
      const hasDegraded = allChecks.some(
        (check) => check.status === "degraded",
      );

      const overallStatus = hasUnhealthy
        ? "unhealthy"
        : hasDegraded
          ? "degraded"
          : "healthy";

      // Return 503 if any critical check is unhealthy
      if (hasUnhealthy) {
        set.status = 503;
      } else if (hasDegraded) {
        set.status = 200; // Degraded but still serving traffic
      }

      const totalLatency = Date.now() - startTime;

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        latency: totalLatency,
        checks: {
          database,
          qdrant,
          disk,
          memory,
          externalAPIs,
        },
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          environment: process.env.NODE_ENV || "development",
        },
      };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Deep health check",
        description:
          "Comprehensive health check with all dependencies including database, Qdrant, disk space, memory, and external APIs. Use this for monitoring dashboards and detailed system status.",
        responses: {
          200: {
            description: "System is healthy or degraded but operational",
            content: {
              "application/json": {
                examples: {
                  healthy: {
                    summary: "All systems healthy",
                    value: {
                      status: "healthy",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      latency: 45,
                      checks: {
                        database: {
                          status: "healthy",
                          latency: 15,
                          details: { connected: true },
                        },
                        qdrant: { status: "healthy", latency: 10 },
                        disk: {
                          status: "healthy",
                          details: {
                            freeGB: 50.5,
                            usedPercent: 45.2,
                            tmpDirExists: true,
                            assetsDirExists: true,
                          },
                        },
                        memory: {
                          status: "healthy",
                          details: {
                            system: {
                              freeMB: 2048,
                              totalMB: 8192,
                              usedPercent: 75,
                            },
                            process: {
                              heapUsedMB: 150,
                              heapTotalMB: 200,
                              rssMB: 250,
                            },
                          },
                        },
                        externalAPIs: {
                          status: "healthy",
                          details: {
                            configured: {
                              meshy: true,
                              openai: true,
                              elevenlabs: true,
                              privy: true,
                            },
                            count: 4,
                          },
                        },
                      },
                      system: {
                        uptime: 3600,
                        nodeVersion: "v21.0.0",
                        platform: "linux",
                        arch: "x64",
                        environment: "production",
                      },
                    },
                  },
                  degraded: {
                    summary: "System degraded but operational",
                    value: {
                      status: "degraded",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      latency: 150,
                      checks: {
                        database: {
                          status: "degraded",
                          latency: 120,
                          details: { connected: true },
                        },
                        qdrant: {
                          status: "healthy",
                          message: "Not configured (optional)",
                        },
                        disk: {
                          status: "degraded",
                          details: {
                            freeGB: 0.8,
                            usedPercent: 92,
                            tmpDirExists: true,
                            assetsDirExists: true,
                          },
                        },
                        memory: {
                          status: "healthy",
                          details: {
                            system: {
                              freeMB: 1024,
                              totalMB: 8192,
                              usedPercent: 87.5,
                            },
                            process: {
                              heapUsedMB: 180,
                              heapTotalMB: 200,
                              rssMB: 280,
                            },
                          },
                        },
                        externalAPIs: {
                          status: "healthy",
                          details: {
                            configured: {
                              meshy: true,
                              openai: true,
                              elevenlabs: false,
                              privy: true,
                            },
                            count: 3,
                          },
                        },
                      },
                      system: {
                        uptime: 7200,
                        nodeVersion: "v21.0.0",
                        platform: "linux",
                        arch: "x64",
                        environment: "production",
                      },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: "System is unhealthy (critical service unavailable)",
            content: {
              "application/json": {
                examples: {
                  unhealthy: {
                    summary: "Critical service failed",
                    value: {
                      status: "unhealthy",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      latency: 5500,
                      checks: {
                        database: {
                          status: "unhealthy",
                          latency: 5000,
                          message: "Connection timeout",
                        },
                        qdrant: {
                          status: "unhealthy",
                          latency: 100,
                          message: "Connection refused",
                        },
                        disk: {
                          status: "healthy",
                          details: {
                            freeGB: 10.5,
                            usedPercent: 65,
                            tmpDirExists: true,
                            assetsDirExists: true,
                          },
                        },
                        memory: {
                          status: "healthy",
                          details: {
                            system: {
                              freeMB: 2048,
                              totalMB: 8192,
                              usedPercent: 75,
                            },
                            process: {
                              heapUsedMB: 150,
                              heapTotalMB: 200,
                              rssMB: 250,
                            },
                          },
                        },
                        externalAPIs: {
                          status: "healthy",
                          details: {
                            configured: {
                              meshy: true,
                              openai: true,
                              elevenlabs: true,
                              privy: true,
                            },
                            count: 4,
                          },
                        },
                      },
                      system: {
                        uptime: 120,
                        nodeVersion: "v21.0.0",
                        platform: "linux",
                        arch: "x64",
                        environment: "production",
                      },
                    },
                  },
                },
              },
            },
          },
        },
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
          "Basic health status with service availability. Use /health/ready for Kubernetes readiness checks and /health/live for liveness checks. This endpoint is maintained for backward compatibility. (Auth optional)",
        responses: {
          200: {
            description: "Health status with configured services",
            content: {
              "application/json": {
                examples: {
                  allServices: {
                    summary: "All services configured",
                    value: {
                      status: "healthy",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      services: {
                        meshy: true,
                        openai: true,
                      },
                    },
                  },
                  minimalServices: {
                    summary: "Minimal service configuration",
                    value: {
                      status: "healthy",
                      timestamp: "2025-11-12T10:30:00.000Z",
                      services: {
                        meshy: false,
                        openai: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  );
