#!/usr/bin/env bun
/**
 * Run CDN Import on Railway
 * Calls the admin endpoint to import CDN assets to the database
 */

const API_URL =
  process.env.VITE_API_URL || "https://hyperforge-production.up.railway.app";
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!PRIVY_APP_SECRET) {
  console.error("Error: PRIVY_APP_SECRET not found in environment");
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
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authentication header when needed
      },
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
