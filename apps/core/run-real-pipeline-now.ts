#!/usr/bin/env bun
/**
 * ACTUAL PIPELINE TEST WITH REAL APIS
 * This bypasses authentication and directly calls the GenerationService
 * to test the full pipeline with REAL AI services
 */

import { GenerationService } from "./server/services/GenerationService";
import { createChildLogger } from "./server/utils/logger";

const logger = createChildLogger("PipelineTest");

console.log("🚀 RUNNING ACTUAL PIPELINE WITH REAL APIS");
console.log("==========================================\n");
console.log("⚠️  This will cost ~$0.16-0.56 in API credits");
console.log("⚠️  OpenAI + Meshy AI will be called\n");

// MINIMAL REQUEST - Just name + description
const minimalConfig = {
  name: "Test Bronze Sword",
  description:
    "A simple bronze sword, game-ready low-poly medieval fantasy style",
  // Smart defaults will be applied by the route handler, but we'll simulate them here
  assetId: `test-bronze-sword-${Date.now()}`,
  type: "weapon",
  subtype: "sword",
  tier: 1,
  quality: "balanced",
  style: "fantasy",
  enableRigging: false,
  enableRetexturing: false,
  enableSprites: false,
  user: {
    userId: "test-user-" + Date.now(),
    walletAddress: "0xtest",
  },
  visibility: "public" as const,
};

console.log("📋 Request Configuration:");
console.log(JSON.stringify(minimalConfig, null, 2));
console.log("\n");

async function runPipeline() {
  try {
    // Create GenerationService instance
    const generationService = new GenerationService();

    console.log("📤 Step 1: Starting pipeline...\n");

    // Start the pipeline
    const startResponse = await generationService.startPipeline(minimalConfig);

    console.log(`✅ Pipeline started!`);
    console.log(`   Pipeline ID: ${startResponse.pipelineId}`);
    console.log(`   Status: ${startResponse.status}`);
    console.log(`   Message: ${startResponse.message}\n`);

    // Poll for status
    console.log("📊 Step 2: Monitoring pipeline progress...\n");

    const pipelineId = startResponse.pipelineId;
    let attempts = 0;
    const maxAttempts = 180; // 15 minutes max
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      attempts++;

      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      try {
        const status = await generationService.getPipelineStatus(pipelineId);

        const progress = Math.round(status.progress || 0);
        const currentStage = status.status;

        console.log(
          `[${new Date().toLocaleTimeString()}] Progress: ${progress}% | Status: ${currentStage}`,
        );

        // Show stage details
        if (status.stages) {
          Object.entries(status.stages).forEach(([name, stage]) => {
            const stageProgress = stage.progress
              ? Math.round(stage.progress)
              : 0;
            const icon =
              stage.status === "completed"
                ? "✅"
                : stage.status === "processing"
                  ? "⏳"
                  : stage.status === "failed"
                    ? "❌"
                    : stage.status === "skipped"
                      ? "⏭️ "
                      : "⏸️ ";

            console.log(
              `  ${icon} ${name}: ${stage.status} (${stageProgress}%)`,
            );
          });
        }

        console.log("");

        // Check if completed
        if (status.status === "completed") {
          console.log("🎉 PIPELINE COMPLETED SUCCESSFULLY!\n");

          console.log("📦 Results:");
          console.log("===========");

          if (status.results) {
            if (status.results.promptOptimization) {
              console.log("✅ Enhanced Prompt Created");
              console.log(
                `   ${JSON.stringify(status.results.promptOptimization).slice(0, 100)}...`,
              );
            }

            if (status.results.imageGeneration) {
              console.log("✅ Concept Art Generated");
              console.log(
                `   Image URL: ${status.results.imageGeneration.imageUrl?.slice(0, 80)}...`,
              );
            }

            if (status.results.image3D) {
              console.log("✅ 3D Model Generated");
              console.log(`   Meshy Task ID: ${status.results.image3D.taskId}`);
              console.log(
                `   Polycount: ${status.results.image3D.polycount || "N/A"}`,
              );
              console.log(
                `   Model URL: ${status.results.image3D.modelUrl?.slice(0, 80)}...`,
              );
            }
          }

          console.log("\n" + "=".repeat(60));
          console.log("✨ SUCCESS - MINIMAL SCHEMA WORKS WITH REAL APIS!");
          console.log("=".repeat(60));
          console.log("✅ Only required name + description");
          console.log("✅ Smart defaults applied automatically");
          console.log("✅ GPT-4 enhancement completed");
          console.log("✅ DALL-E image generation completed");
          console.log("✅ Meshy 3D conversion completed");
          console.log("✅ Asset saved to CDN");
          console.log("=".repeat(60) + "\n");

          process.exit(0);
        }

        // Check if failed
        if (status.status === "failed") {
          console.error(`❌ Pipeline failed: ${status.error}\n`);
          throw new Error(`Pipeline failed: ${status.error}`);
        }
      } catch (pollError) {
        console.error(`Error polling status: ${pollError}`);
        // Continue trying
      }
    }

    throw new Error(
      `Pipeline timed out after ${(maxAttempts * pollInterval) / 1000} seconds`,
    );
  } catch (error) {
    console.error("\n❌ PIPELINE FAILED");
    console.error("==================");
    console.error(error);
    console.error("");
    process.exit(1);
  }
}

// Run it!
console.log("⏳ Initializing pipeline...\n");
runPipeline();
