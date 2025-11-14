#!/usr/bin/env bun
/**
 * Cleanup E2E Test World Configurations
 * Removes any world configurations created during testing
 */

import { WorldConfigService } from "../server/services/WorldConfigService";

async function cleanupTestConfigs() {
  const worldConfigService = new WorldConfigService();

  console.log("🔍 Searching for E2E test world configurations...");

  try {
    const result = await worldConfigService.listConfigurations({});
    const configs = result.configs || [];
    console.log(`Found ${configs.length} total configurations`);

    const testConfigs = configs.filter(
      (config) =>
        config.name.includes("E2E Test World") ||
        config.name.includes("Test World") ||
        config.description.includes("end-to-end testing") ||
        config.description.includes("for testing"),
    );

    if (testConfigs.length === 0) {
      console.log("✅ No E2E test configurations found!");
      return;
    }

    console.log(`\n🗑️  Found ${testConfigs.length} test configuration(s):`);
    testConfigs.forEach((config) => {
      console.log(`   - ${config.name} (${config.id})`);
      console.log(`     Genre: ${config.genre}, Active: ${config.isActive}`);
    });

    console.log("\n🧹 Cleaning up test configurations...");

    for (const config of testConfigs) {
      try {
        // Deactivate if active
        if (config.isActive) {
          console.log(`   ⏸️  Deactivating: ${config.name}`);
          await worldConfigService.updateConfiguration(config.id, {
            isActive: false,
          });
        }

        // Delete
        console.log(`   🗑️  Deleting: ${config.name}`);
        await worldConfigService.deleteConfiguration(config.id);
        console.log(`   ✅ Deleted successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to delete ${config.name}:`, error);
      }
    }

    console.log("\n✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupTestConfigs();
