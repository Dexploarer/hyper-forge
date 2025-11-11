#!/usr/bin/env bun

/**
 * Test HEAD Requests
 * Quick script to verify HEAD requests work properly
 */

const API_PORT = process.env.PORT || process.env.API_PORT || 3004;
const API_URL = process.env.API_URL || `http://localhost:${API_PORT}`;

async function testHeadRequest(url: string, description: string) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");

    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${contentType || "null"}`);

    if (response.status === 200 && contentType) {
      console.log(`   ✅ PASS`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ℹ️  404 (expected for non-existent files)`);
      return true;
    } else {
      console.log(`   ❌ FAIL - Missing content-type or unexpected status`);
      return false;
    }
  } catch (error) {
    console.log(
      `   ❌ FAIL - ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function main() {
  console.log("🚀 Starting HEAD Request Tests");
  console.log(`   API URL: ${API_URL}`);

  const tests = [
    [`${API_URL}/`, "SPA fallback root"],
    [`${API_URL}/equipment`, "SPA fallback nested route"],
    [`${API_URL}/api/health`, "API health endpoint"],
    [`${API_URL}/api/assets/test/model`, "Asset model endpoint (404 expected)"],
  ];

  let passed = 0;
  let failed = 0;

  for (const [url, description] of tests) {
    const result = await testHeadRequest(url, description);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
