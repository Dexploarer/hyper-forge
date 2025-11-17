#!/usr/bin/env bun
/**
 * Check Generation Status Script
 * Checks if there are any generation pipelines or jobs in progress
 */

import { db } from "../server/db/db";
import { sql } from "drizzle-orm";

async function checkGenerationStatus() {
  console.log("🔍 Checking generation pipelines and jobs...\n");

  try {
    // Check generation pipelines
    const [pipelineCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM generation_pipelines`
    );
    console.log(`🔄 Generation Pipelines: ${(pipelineCount as any).count}`);

    if ((pipelineCount as any).count > 0) {
      const pipelines = await db.execute(sql`
        SELECT id, status, created_at, updated_at 
        FROM generation_pipelines 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);
      console.log("\nRecent pipelines:");
      (pipelines as any).forEach((p: any, i: number) => {
        console.log(`  ${i + 1}. ${p.id} - ${p.status} (Updated: ${p.updated_at})`);
      });
    }

    // Check generation jobs
    const [jobCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM generation_jobs`
    );
    console.log(`\n📦 Generation Jobs: ${(jobCount as any).count}`);

    if ((jobCount as any).count > 0) {
      const jobs = await db.execute(sql`
        SELECT id, asset_id, status, job_type, created_at 
        FROM generation_jobs 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log("\nRecent jobs:");
      (jobs as any).forEach((j: any, i: number) => {
        console.log(`  ${i + 1}. ${j.job_type} - ${j.status} (${j.asset_id || 'no asset ID'})`);
      });
    }

    console.log("\n");

  } catch (error) {
    console.error("Error checking generation status:", error);
  }

  process.exit(0);
}

checkGenerationStatus().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
