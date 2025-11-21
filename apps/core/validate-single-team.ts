/**
 * Single-Team Architecture Validation Script
 *
 * This script comprehensively tests the single-team architecture by making
 * real API calls to verify:
 * 1. Unauthenticated access works
 * 2. No permission checks block access
 * 3. All routes are accessible without ownership checks
 * 4. No ForbiddenError (403) responses occur
 */

const API_BASE = "http://localhost:3001";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  results.push(result);
  const emoji = result.passed ? "✅" : "❌";
  console.log(`${emoji} ${result.name}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
  if (result.details) {
    console.log(`   Details:`, result.details);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    logTest({ name, passed: true, message: "Success" });
  } catch (error: any) {
    logTest({
      name,
      passed: false,
      message: error.message,
      details: error.response?.data || error.toString(),
    });
  }
}

// Helper to make API requests
async function makeRequest(
  method: string,
  path: string,
  options: {
    auth?: string;
    body?: any;
  } = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    headers["Authorization"] = `Bearer ${options.auth}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(
      `HTTP ${response.status}: ${data.message || data.error || "Unknown error"}`,
    );
    error.status = response.status;
    error.response = { data };
    throw error;
  }

  return { status: response.status, data };
}

async function runValidation() {
  console.log("\n🔍 SINGLE-TEAM ARCHITECTURE VALIDATION\n");
  console.log("Testing against:", API_BASE);
  console.log("=".repeat(60));

  // Test 1: Health check
  await test("1. API Server is running", async () => {
    const { data } = await makeRequest("GET", "/api/health");
    if (data.status !== "ok") {
      throw new Error("Health check failed");
    }
  });

  // Test 2: List projects WITHOUT authentication
  let projectsList: any;
  await test("2. List projects WITHOUT authentication", async () => {
    const { data } = await makeRequest("GET", "/api/projects");
    projectsList = data;
    console.log(`   Found ${data.projects?.length || 0} projects`);
  });

  // Test 3: List assets WITHOUT authentication
  await test("3. List assets WITHOUT authentication", async () => {
    const { data } = await makeRequest("GET", "/api/assets");
    console.log(`   Found ${data?.length || 0} assets`);
  });

  // Test 4: Create project WITHOUT authentication
  let createdProjectId: string;
  await test("4. Create project WITHOUT authentication", async () => {
    const { data } = await makeRequest("POST", "/api/projects", {
      body: {
        name: `Validation Test Project ${Date.now()}`,
        description: "Created by validation script to test single-team access",
      },
    });

    if (!data.success || !data.project?.id) {
      throw new Error("Failed to create project");
    }

    createdProjectId = data.project.id;
    console.log(`   Created project: ${createdProjectId}`);
  });

  // Test 5: Get project by ID WITHOUT authentication
  await test("5. Get project by ID WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "GET",
      `/api/projects/${createdProjectId}`,
    );

    if (!data.success || !data.project) {
      throw new Error("Failed to get project");
    }

    console.log(`   Retrieved project: ${data.project.name}`);
  });

  // Test 6: Update project WITHOUT authentication (no ownership check)
  await test("6. Update project WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "PATCH",
      `/api/projects/${createdProjectId}`,
      {
        body: {
          description:
            "Updated by validation script - testing single-team access",
        },
      },
    );

    if (!data.success) {
      throw new Error("Failed to update project");
    }

    console.log(`   Updated project successfully`);
  });

  // Test 7: Get project assets WITHOUT authentication
  await test("7. Get project assets WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "GET",
      `/api/projects/${createdProjectId}/assets`,
    );

    if (!data.success) {
      throw new Error("Failed to get project assets");
    }

    console.log(`   Retrieved ${data.assets?.length || 0} assets`);
  });

  // Test 8: Get project stats WITHOUT authentication
  await test("8. Get project stats WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "GET",
      `/api/projects/${createdProjectId}/stats`,
    );

    if (!data.success) {
      throw new Error("Failed to get project stats");
    }

    console.log(`   Retrieved stats: ${JSON.stringify(data.stats)}`);
  });

  // Test 9: Archive project WITHOUT authentication
  await test("9. Archive project WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "POST",
      `/api/projects/${createdProjectId}/archive`,
    );

    if (!data.success) {
      throw new Error("Failed to archive project");
    }

    console.log(`   Archived project successfully`);
  });

  // Test 10: Restore project WITHOUT authentication
  await test("10. Restore project WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "POST",
      `/api/projects/${createdProjectId}/restore`,
    );

    if (!data.success) {
      throw new Error("Failed to restore project");
    }

    console.log(`   Restored project successfully`);
  });

  // Test 11: Get all projects (admin route) WITHOUT authentication
  await test("11. Get all projects (admin route) WITHOUT authentication", async () => {
    const { data } = await makeRequest("GET", "/api/projects/admin/all");

    if (!data.success) {
      throw new Error("Failed to get all projects");
    }

    console.log(`   Retrieved ${data.projects?.length || 0} total projects`);
  });

  // Test 12: Verify NO 403 Forbidden errors occurred
  await test("12. Verify NO 403 Forbidden errors occurred", async () => {
    const forbiddenErrors = results.filter(
      (r) => r.details?.status === 403 || r.message?.includes("403"),
    );

    if (forbiddenErrors.length > 0) {
      throw new Error(
        `Found ${forbiddenErrors.length} Forbidden errors - permission checks still active!`,
      );
    }

    console.log(`   No permission denied errors found`);
  });

  // Test 13: Delete project WITHOUT authentication (permanent delete)
  await test("13. Delete project WITHOUT authentication", async () => {
    if (!createdProjectId) {
      throw new Error("No project ID from previous test");
    }

    const { data } = await makeRequest(
      "DELETE",
      `/api/projects/admin/${createdProjectId}`,
    );

    if (!data.success) {
      throw new Error("Failed to delete project");
    }

    console.log(`   Permanently deleted test project`);
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed === 0) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Single-team architecture is working correctly.",
    );
    console.log("\nValidated:");
    console.log("  ✅ Unauthenticated access to all routes");
    console.log("  ✅ No permission checks blocking access");
    console.log("  ✅ No ownership restrictions");
    console.log("  ✅ No 403 Forbidden errors");
    console.log("  ✅ CRUD operations work without auth");
    console.log("  ✅ Admin routes accessible without role checks");
  } else {
    console.log("\n⚠️  SOME TESTS FAILED - Review the results above.");
    process.exit(1);
  }
}

// Run validation
console.log("Starting validation in 2 seconds...");
console.log("Make sure the dev server is running on port 3001");

setTimeout(() => {
  runValidation().catch((error) => {
    console.error("\n❌ Validation failed with error:", error);
    process.exit(1);
  });
}, 2000);
