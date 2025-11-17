#!/usr/bin/env bun
/**
 * Run CDN Import on Railway
 * Calls the admin endpoint to import CDN assets to the database
 */

const API_URL =
  process.env.VITE_API_URL || "https://hyperforge-production.up.railway.app";
const CDN_API_KEY = process.env.CDN_API_KEY;

if (!CDN_API_KEY) {
  console.error("Error: CDN_API_KEY not found in environment");
  console.error("Please set CDN_API_KEY in your .env file");
  process.exit(1);
}

async function runImport() {
  try {
    console.log("🚀 Starting CDN asset import on Railway...");
    console.log(`   API URL: ${API_URL}`);

    // For now, we'll need to call the endpoint without auth
    // The endpoint checks for admin, but we can modify it temporarily
    // or create a system user token

    const response = await fetch(`${API_URL}/api/admin/import-cdn-assets`, {
      method: "POST",
      headers: [
        ["Content-Type", "application/json"],
        ["X-API-Key", CDN_API_KEY ?? ""],
      ],
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Import failed:");
      console.error(data);
      process.exit(1);
    }

    console.log("✅ Import completed successfully:");
    console.log(`   Imported: ${data.imported}`);
    console.log(`   Skipped: ${data.skipped}`);
    console.log(`   Failed: ${data.failed}`);
    console.log(`   Message: ${data.message}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error calling import endpoint:", error);
    process.exit(1);
  }
}

runImport();