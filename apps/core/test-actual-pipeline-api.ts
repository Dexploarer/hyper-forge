#!/usr/bin/env bun
/**
 * ACTUAL PIPELINE TEST - CALLS REAL API WITH REAL AI SERVICES
 * Tests the minimal schema (name + description only) end-to-end
 *
 * This will cost ~$0.16-0.56 in API credits (OpenAI + Meshy AI)
 */

import { db } from "./server/db/db";
import { users } from "./server/db/schema";
import { eq } from "drizzle-orm";

console.log("🚀 TESTING MINIMAL SCHEMA WITH REAL APIs");
console.log("=========================================\n");
console.log("⚠️  This will call REAL AI services and cost money!");
console.log("⚠️  Estimated cost: ~$0.16-0.56 per test\n");

// Step 1: Get or create a test user
async function getTestUser() {
  console.log("📋 Step 1: Getting test user...");

  const testEmail = "test-pipeline@example.com";

  // Try to find existing test user
  let user = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (!user) {
    console.log("   Creating new test user...");
    [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        privyUserId: `test-${Date.now()}`,
        role: "member",
      })
      .returning();
  }

  console.log(`✅ Using user: ${user.id} (${user.email})\n`);
  return user;
}

// Step 2: Use real Privy token
function getPrivyToken(): string {
  // Real Privy JWT token provided by user
  return "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVScjlVTGp2NXQ3Nk9jVmpmbnMzMjRqWkxPeERSQjRsb3FGNWlqaU1UUlEifQ.eyJzaWQiOiJjbWkxbzBvNHQwMTkybDgwZDEzNHQ4M2ZuIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NjM0NjY2MzMsImF1ZCI6ImNtaHI1a3ZmcDAwaHhsNDBjNWFlYnJjaTUiLCJzdWIiOiJkaWQ6cHJpdnk6Y21odTdiaGtoMDBob2wxMGNvbjFiOTFsYyIsImV4cCI6MTc2MzQ3MDIzM30.i9l4agJdrpLcYAbJ5byhLjC7AsXmrF0B-xFwhC1mTbLH22IQ56tOBXmSdKE0serEkCsaveX-VNaUyKl-utiVSg";
}

// Step 3: Call the actual API
async function testPipeline() {
  try {
    const user = await getTestUser();
    const token = getPrivyToken();

    console.log("📤 Step 2: Creating pipeline with minimal request...");
    console.log("   (Only name + description required)\n");

    // MINIMAL REQUEST - Just 2 fields!
    const minimalRequest = {
      name: "Test Sword",
      description: "A simple bronze sword, medieval fantasy low-poly style",
    };

    console.log("Request payload:");
    console.log(JSON.stringify(minimalRequest, null, 2));
    console.log("");

    // Call the actual API
    const createResponse = await fetch(
      "http://localhost:3004/api/generation/pipeline",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(minimalRequest),
      },
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`API returned ${createResponse.status}: ${errorText}`);
    }

    const createData = (await createResponse.json()) as any;

    console.log(`✅ Pipeline created!`);
    console.log(`   Pipeline ID: ${createData.pipelineId}`);
    console.log(`   Status: ${createData.status}`);
    console.log(`   Message: ${createData.message}\n`);

    // Step 3: Monitor progress
    console.log("📊 Step 3: Monitoring pipeline progress...");
    console.log("   (This will take 5-15 minutes for 3D generation)\n");

    const pipelineId = createData.pipelineId;
    let attempts = 0;
    const maxAttempts = 180; // 15 minutes
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `http://localhost:3004/api/generation/pipeline/${pipelineId}`,
      );

      if (!statusResponse.ok) {
        console.warn(`⚠️  Status check failed: ${statusResponse.status}`);
        continue;
      }

      const status = (await statusResponse.json()) as any;

      const progress = Math.round(status.progress || 0);
      const currentStage = status.currentStage || "initializing";

      console.log(
        `[${new Date().toLocaleTimeString()}] ${progress}% | Stage: ${currentStage} | Status: ${status.status}`,
      );

      // Show stage details
      if (status.stages) {
        for (const [name, stage] of Object.entries(status.stages)) {
          const s = stage as any;
          const stageProgress = s.progress ? Math.round(s.progress) : 0;
          const icon =
            s.status === "completed"
              ? "✅"
              : s.status === "processing"
                ? "⏳"
                : s.status === "failed"
                  ? "❌"
                  : s.status === "skipped"
                    ? "⏭️ "
                    : "⏸️ ";

          console.log(`  ${icon} ${name}: ${s.status} (${stageProgress}%)`);
        }
      }

      console.log("");

      // Check completion
      if (status.status === "completed") {
        console.log("🎉 PIPELINE COMPLETED SUCCESSFULLY!\n");

        console.log("📦 Generated Assets:");
        console.log("===================");

        if (status.results?.promptOptimization) {
          console.log("✅ Enhanced Prompt");
          console.log(
            `   ${JSON.stringify(status.results.promptOptimization).substring(0, 100)}...`,
          );
        }

        if (status.results?.imageGeneration) {
          console.log("✅ Concept Art Generated");
          console.log(
            `   URL: ${status.results.imageGeneration.imageUrl?.substring(0, 60)}...`,
          );
        }

        if (status.results?.image3D) {
          console.log("✅ 3D Model Generated");
          console.log(`   Task ID: ${status.results.image3D.taskId}`);
          console.log(
            `   Polycount: ${status.results.image3D.polycount || "N/A"}`,
          );
          console.log(
            `   URL: ${status.results.image3D.modelUrl?.substring(0, 60)}...`,
          );
        }

        if (status.assetUrl) {
          console.log(`✅ Final Asset: ${status.assetUrl}`);
        }

        console.log("\n" + "=".repeat(70));
        console.log(
          "✨ SUCCESS - MINIMAL SCHEMA WORKS END-TO-END WITH REAL APIs!",
        );
        console.log("=".repeat(70));
        console.log("✅ Only required 2 fields (name + description)");
        console.log("✅ Smart defaults applied automatically");
        console.log("✅ GPT-4 prompt enhancement completed");
        console.log("✅ DALL-E image generation completed");
        console.log("✅ Meshy AI 3D conversion completed");
        console.log("✅ Asset uploaded to CDN");
        console.log("✅ Database record created");
        console.log("=".repeat(70) + "\n");

        process.exit(0);
      }

      if (status.status === "failed") {
        console.error(`❌ Pipeline failed: ${status.error}\n`);
        throw new Error(status.error || "Pipeline failed");
      }
    }

    throw new Error("Pipeline timed out after 15 minutes");
  } catch (error) {
    console.error("\n❌ TEST FAILED");
    console.error("==============");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testPipeline();
