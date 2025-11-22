#!/usr/bin/env bun

/**
 * Railway Configuration Verification Script
 * Checks if all required environment variables are properly configured
 * Run this with: railway run bun scripts/verify-railway-config.ts
 */

console.log("🔍 Railway Configuration Verification");
console.log("=".repeat(60));

// Check if running in Railway environment
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
console.log(`\n📍 Environment: ${isRailway ? "Railway" : "Local"}`);

if (isRailway) {
  console.log(`   Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`   Service: ${process.env.RAILWAY_SERVICE_NAME}`);
  console.log(`   Private Domain: ${process.env.RAILWAY_PRIVATE_DOMAIN}`);
}

// Required variables
const requiredVars = [
  "DATABASE_URL",
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
] as const;

// Optional but recommended
const optionalVars = [
  "AI_GATEWAY_API_KEY",
  "MESHY_API_KEY",
  "ELEVENLABS_API_KEY",
  "ADMIN_UPLOAD_TOKEN",
] as const;

console.log("\n✅ Required Variables:");
let missingRequired = 0;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    // Sanitize for display
    const display =
      varName.includes("SECRET") || varName.includes("KEY")
        ? `${value.slice(0, 8)}...`
        : varName === "DATABASE_URL"
          ? sanitizeDbUrl(value)
          : value.slice(0, 20) + "...";
    console.log(`   ✓ ${varName}: ${display}`);
  } else {
    console.log(`   ✗ ${varName}: MISSING`);
    missingRequired++;
  }
}

console.log("\n⚙️  Optional Variables:");
let missingOptional = 0;
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    const display = value.slice(0, 8) + "...";
    console.log(`   ✓ ${varName}: ${display}`);
  } else {
    console.log(`   ⚠ ${varName}: Not set`);
    missingOptional++;
  }
}

// Test DATABASE_URL format
console.log("\n🗄️  Database Configuration:");
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || "5432"}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);

    // Check if it's using private networking (Railway internal domain)
    const isPrivate = url.hostname.includes("railway.internal");
    console.log(
      `   Networking: ${isPrivate ? "✓ Private" : "⚠ Public (consider switching to private)"}`,
    );
  } catch (error) {
    console.log(`   ✗ Invalid DATABASE_URL format: ${error}`);
  }
} else {
  console.log("   ✗ DATABASE_URL not set");
}

// Test database connection
console.log("\n🔌 Testing Database Connection:");
if (dbUrl) {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(dbUrl, {
      max: 1,
      connect_timeout: 5,
      onnotice: () => {},
    });

    const result = await sql`SELECT version() as version`;
    console.log("   ✓ Connection successful");
    console.log(`   PostgreSQL: ${result[0].version.split(" ")[1]}`);

    await sql.end();
  } catch (error: any) {
    console.log("   ✗ Connection failed");
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);

    if (error.code === "28P01") {
      console.log("\n   💡 Authentication failed. Fix this by:");
      console.log(
        "      1. Go to Railway Dashboard → Your Service → Variables",
      );
      console.log("      2. Set DATABASE_URL to: ${{Postgres.DATABASE_URL}}");
      console.log("      3. Redeploy your service");
    }
  }
}

// Summary
console.log("\n" + "=".repeat(60));
if (missingRequired > 0) {
  console.log(
    `❌ Verification FAILED: ${missingRequired} required variable(s) missing`,
  );
  process.exit(1);
} else {
  console.log("✅ All required variables are set");
  if (missingOptional > 0) {
    console.log(`⚠️  Note: ${missingOptional} optional variable(s) not set`);
  }
  console.log("\n✅ Configuration looks good!");
  process.exit(0);
}

// Helper function
function sanitizeDbUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = "****";
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ":****@");
  }
}
