/**
 * Create System User for Webhook Uploads
 * This script creates a permanent system user that can be used for CDN webhook uploads
 */

import { db } from "../server/db/db";
import { users } from "../server/db/schema";
import { eq } from "drizzle-orm";

async function createSystemUser() {
  try {
    console.log("Creating system user for webhook uploads...");

    const systemUser = await db
      .insert(users)
      .values({
        privyUserId: "system-cdn-webhook",
        email: "system+cdn-webhook@hyperforge.app",
        displayName: "CDN Webhook System",
        role: "admin",
        settings: {
          description: "System user for assets uploaded via CDN webhook",
        },
      })
      .returning();

    console.log("✅ System user created successfully!");
    console.log(`   User ID: ${systemUser[0].id}`);
    console.log(`   Privy ID: ${systemUser[0].privyUserId}`);
    console.log(`   Email: ${systemUser[0].email}`);
    console.log("");
    console.log("🔧 Set this environment variable in Railway:");
    console.log(`   WEBHOOK_SYSTEM_USER_ID=${systemUser[0].id}`);

    process.exit(0);
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique constraint")) {
      console.log("ℹ️  System user already exists. Fetching existing user...");

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.privyUserId, "system-cdn-webhook"))
        .limit(1);

      if (existingUser.length > 0) {
        console.log("✅ Found existing system user!");
        console.log(`   User ID: ${existingUser[0].id}`);
        console.log(`   Privy ID: ${existingUser[0].privyUserId}`);
        console.log(`   Email: ${existingUser[0].email}`);
        console.log("");
        console.log("🔧 Set this environment variable in Railway:");
        console.log(`   WEBHOOK_SYSTEM_USER_ID=${existingUser[0].id}`);
        process.exit(0);
      }
    }

    console.error("❌ Failed to create system user:", error);
    process.exit(1);
  }
}

createSystemUser();
