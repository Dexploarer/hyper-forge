/**
 * Startup Health Check
 * Automatically tests all API endpoints when the server starts
 * Ensures all routes are properly configured and accessible
 */

import { logger } from "./logger";

interface HealthCheckResult {
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL" | "SKIP";
  statusCode?: number;
  responseTime?: number;
  error?: string;
  requiresAuth: boolean;
}

export async function runStartupHealthCheck(
  baseUrl: string,
): Promise<{ passed: number; failed: number; skipped: number }> {
  logger.info({}, "\n🔍 [Startup] Running health check on all endpoints...");

  const results: HealthCheckResult[] = [];

  // Define all endpoints to test
  const endpoints = [
    // Public endpoints (no auth required)
    { path: "/api/health", method: "GET", requiresAuth: false },
    { path: "/swagger", method: "GET", requiresAuth: false },
    { path: "/metrics", method: "GET", requiresAuth: false },

    // Auth-optional endpoints (work without auth but return limited data)
    { path: "/api/assets", method: "GET", requiresAuth: false },
    { path: "/api/prompts", method: "GET", requiresAuth: false },
    { path: "/api/material-presets", method: "GET", requiresAuth: false },

    // Auth-required endpoints (skip in startup check)
    {
      path: "/api/generation/pipeline",
      method: "POST",
      requiresAuth: true,
      skip: true,
    },
    { path: "/api/retexture", method: "POST", requiresAuth: true, skip: true },
    { path: "/api/users/me", method: "GET", requiresAuth: true, skip: true },
  ];

  // Test each endpoint
  for (const endpoint of endpoints) {
    if (endpoint.skip) {
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: "SKIP",
        requiresAuth: endpoint.requiresAuth,
      });
      continue;
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;

      // Consider 200-299 and 401 (expected for auth endpoints) as passing
      const isPassing =
        (statusCode >= 200 && statusCode < 300) ||
        (endpoint.requiresAuth && statusCode === 401);

      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: isPassing ? "PASS" : "FAIL",
        statusCode,
        responseTime,
        requiresAuth: endpoint.requiresAuth,
        error: isPassing ? undefined : response.statusText,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: "FAIL",
        responseTime,
        requiresAuth: endpoint.requiresAuth,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Print results
  logger.info({}, "\n📊 [Startup] Health Check Results:");
  logger.info({}, "─".repeat(80));

  for (const result of results) {
    const statusIcon =
      result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️ ";
    const authIcon = result.requiresAuth ? "🔐" : "🌐";
    const timing = result.responseTime ? `${result.responseTime}ms` : "N/A";

    logger.info(
      {},
      `${statusIcon} ${authIcon} ${result.method.padEnd(6)} ${result.endpoint.padEnd(40)} ${timing.padStart(6)} ${result.statusCode ? `[${result.statusCode}]` : ""}`,
    );

    if (result.error && result.status === "FAIL") {
      logger.error({}, `   └─ Error: ${result.error}`);
    }
  }

  logger.info({}, "─".repeat(80));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  logger.info(
    {},
    `\n✅ Passed: ${passed}  ❌ Failed: ${failed}  ⏭️  Skipped: ${skipped}\n`,
  );

  // Warn if any critical endpoints failed
  const criticalFailed = results.filter(
    (r) => r.status === "FAIL" && r.endpoint === "/api/health",
  );

  if (criticalFailed.length > 0) {
    logger.error(
      {},
      "⚠️  CRITICAL: Health endpoint failed! Server may not be ready.",
    );
  }

  return { passed, failed, skipped };
}

/**
 * Test frontend-to-backend connectivity
 * Simulates browser requests with proper headers
 */
export async function testFrontendConnectivity(
  baseUrl: string,
): Promise<boolean> {
  logger.info({}, "\n🌐 [Startup] Testing frontend-to-backend connectivity...");

  try {
    // Test 1: Check if frontend HTML is served
    const frontendResponse = await fetch(baseUrl, {
      headers: {
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!frontendResponse.ok) {
      logger.error(
        {},
        `❌ Frontend HTML not accessible: ${frontendResponse.status}`,
      );
      return false;
    }

    const html = await frontendResponse.text();

    // Check for React root element
    if (!html.includes('id="root"')) {
      logger.error({}, "❌ Frontend HTML missing React root element");
      return false;
    }

    logger.info({}, "✅ Frontend HTML served correctly");

    // Test 2: Check if API is accessible from "browser" perspective
    const apiResponse = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Startup Health Check)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!apiResponse.ok) {
      logger.error({}, `❌ API not accessible: ${apiResponse.status}`);
      return false;
    }

    // Try to parse JSON, but handle non-JSON responses gracefully
    let healthData;
    const contentType = apiResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        healthData = await apiResponse.json();
        logger.info(
          {},
          `✅ API accessible: ${JSON.stringify(healthData).substring(0, 100)}...`,
        );
      } catch (parseError) {
        logger.warn(
          { err: parseError },
          "⚠️  API returned JSON content-type but failed to parse",
        );
        return false;
      }
    } else {
      const text = await apiResponse.text();
      logger.warn(
        {},
        `⚠️  API returned non-JSON response (${contentType}): ${text.substring(0, 100)}...`,
      );
      return false;
    }

    // Test 3: Check CORS headers
    const corsHeaders = {
      "access-control-allow-origin": apiResponse.headers.get(
        "access-control-allow-origin",
      ),
      "access-control-allow-credentials": apiResponse.headers.get(
        "access-control-allow-credentials",
      ),
    };

    if (
      corsHeaders["access-control-allow-origin"] &&
      corsHeaders["access-control-allow-credentials"]
    ) {
      logger.info({}, "✅ CORS headers configured correctly");
    } else {
      logger.warn({}, "⚠️  CORS headers may need verification");
    }

    logger.info({}, "\n✅ [Startup] Frontend-to-backend connectivity: OK\n");
    return true;
  } catch (error) {
    logger.error(
      { err: error },
      "❌ [Startup] Frontend connectivity test failed:",
    );
    return false;
  }
}
