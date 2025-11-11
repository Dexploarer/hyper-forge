/**
 * Query Generation Job
 * Temporary script to query generation job details
 */

import { db } from "./server/db/db";
import { generationJobs } from "./server/db/schema/generation-jobs.schema";
import { eq, gte, sql } from "drizzle-orm";

async function queryGenerationJob() {
  console.log("\n=== Querying Generation Job ===\n");

  // Query for the specific pipeline ID
  const pipelineId = "pipeline-1762861377631-59z2pfp7f";

  console.log(`Looking for pipeline_id: ${pipelineId}\n`);

  const specificJob = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.pipelineId, pipelineId))
    .limit(1);

  if (specificJob.length > 0) {
    const job = specificJob[0];
    console.log("=== FOUND JOB ===");
    console.log("\n1. FULL RECORD:");
    console.log(JSON.stringify(job, null, 2));

    console.log("\n2. STATUS & PROGRESS:");
    console.log(`   Status: ${job.status}`);
    console.log(`   Progress: ${job.progress}%`);

    console.log("\n3. STAGES:");
    console.log(JSON.stringify(job.stages, null, 2));

    console.log("\n4. ERROR MESSAGE:");
    console.log(job.error || "   (no error)");

    console.log("\n5. TIMESTAMPS:");
    console.log(`   Created: ${job.createdAt}`);
    console.log(`   Started: ${job.startedAt || "(not started)"}`);
    console.log(`   Completed: ${job.completedAt || "(not completed)"}`);
    console.log(`   Last Updated: ${job.lastUpdatedAt}`);
  } else {
    console.log("❌ No job found with that pipeline_id");
  }

  // Query recent jobs (last 10 minutes)
  console.log("\n\n=== RECENT GENERATION JOBS (Last 10 minutes) ===\n");

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const recentJobs = await db
    .select({
      pipelineId: generationJobs.pipelineId,
      assetName: generationJobs.assetName,
      status: generationJobs.status,
      progress: generationJobs.progress,
      createdAt: generationJobs.createdAt,
      error: generationJobs.error,
    })
    .from(generationJobs)
    .where(gte(generationJobs.createdAt, tenMinutesAgo))
    .orderBy(sql`${generationJobs.createdAt} DESC`)
    .limit(20);

  if (recentJobs.length > 0) {
    console.log(`Found ${recentJobs.length} recent jobs:\n`);
    recentJobs.forEach((job, idx) => {
      console.log(`${idx + 1}. ${job.pipelineId}`);
      console.log(`   Asset: ${job.assetName}`);
      console.log(`   Status: ${job.status} (${job.progress}%)`);
      console.log(`   Created: ${job.createdAt}`);
      if (job.error) {
        console.log(`   Error: ${job.error.substring(0, 100)}...`);
      }
      console.log("");
    });
  } else {
    console.log("No recent jobs found in the last 10 minutes");
  }

  // Close connection
  process.exit(0);
}

// Run query
queryGenerationJob().catch((error) => {
  console.error("Query failed:", error);
  process.exit(1);
});
