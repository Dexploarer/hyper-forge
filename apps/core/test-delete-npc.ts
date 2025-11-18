#!/usr/bin/env bun
/**
 * Test DELETE NPC endpoint to reproduce 500 error
 */

const NPC_ID = "3805d060-614b-465b-8a72-009d40949266";
const API_URL = process.env.API_URL || "http://localhost:3004";
const PRIVY_TOKEN = process.env.PRIVY_TOKEN || "";

if (!PRIVY_TOKEN) {
  console.error("❌ PRIVY_TOKEN environment variable is required");
  process.exit(1);
}

console.log("\n🧪 TEST DELETE NPC");
console.log("=".repeat(80));
console.log(`API URL: ${API_URL}`);
console.log(`NPC ID: ${NPC_ID}`);

try {
  console.log("\n1. Sending DELETE request...");
  const response = await fetch(`${API_URL}/api/content/npcs/${NPC_ID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${PRIVY_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${response.headers.get("content-type")}`);

  const text = await response.text();
  console.log(`\nResponse body:`);
  console.log(text);

  if (response.ok) {
    console.log("\n✅ DELETE successful!");
    const data = JSON.parse(text);
    console.log(data);
  } else {
    console.log("\n❌ DELETE failed!");
    try {
      const error = JSON.parse(text);
      console.log("\nError details:");
      console.log(JSON.stringify(error, null, 2));
    } catch {
      console.log("Could not parse error as JSON");
    }
  }
} catch (error) {
  console.error("\n❌ Exception:", error);
  if (error instanceof Error) {
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  }
}

console.log("\n" + "=".repeat(80));
console.log("✅ TEST COMPLETE\n");
