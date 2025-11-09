/**
 * Migration Script: Index Existing Data
 * Indexes all existing assets and content into Qdrant vector database
 *
 * Usage: bun run server/scripts/index-existing-data.ts
 */

import "dotenv/config";
import { db } from "../db/db";
import { assets } from "../db/schema/assets.schema";
import { npcs, quests, lores, dialogues } from "../db/schema/content.schema";
import { embeddingService } from "../services/EmbeddingService";
import { qdrantService } from "../services/QdrantService";
import { initializeQdrantCollections } from "../db/qdrant";

const BATCH_SIZE = 100; // Process 100 items at a time

interface IndexingStats {
  assets: { total: number; indexed: number; failed: number };
  npcs: { total: number; indexed: number; failed: number };
  quests: { total: number; indexed: number; failed: number };
  lores: { total: number; indexed: number; failed: number };
  dialogues: { total: number; indexed: number; failed: number };
}

/**
 * Index all assets
 */
async function indexAssets(stats: IndexingStats): Promise<void> {
  console.log("\n📦 Indexing Assets...");

  try {
    // Fetch all assets
    const allAssets = await db.select().from(assets);
    stats.assets.total = allAssets.length;

    console.log(`Found ${allAssets.length} assets to index`);

    // Process in batches
    for (let i = 0; i < allAssets.length; i += BATCH_SIZE) {
      const batch = allAssets.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allAssets.length / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNum}/${totalBatches} (${batch.length} assets)...`,
      );

      // Prepare texts for embedding
      const texts = batch.map((asset) =>
        embeddingService.prepareAssetText(asset),
      );

      try {
        // Generate embeddings
        const { embeddings } = await embeddingService.generateEmbeddings(texts);

        // Upsert to Qdrant
        const points = batch.map((asset, idx) => ({
          id: asset.id,
          vector: embeddings[idx].embedding,
          payload: {
            type: "asset",
            name: asset.name,
            assetType: asset.type,
            category: asset.category,
            tags: asset.tags,
            metadata: {
              description: asset.description,
              subtype: asset.subtype,
              status: asset.status,
              createdAt: asset.createdAt?.toISOString(),
            },
          },
        }));

        await qdrantService.upsertBatch("assets", points);

        stats.assets.indexed += batch.length;
        console.log(`✓ Indexed ${batch.length} assets`);
      } catch (error) {
        console.error(`✗ Failed to index batch:`, error);
        stats.assets.failed += batch.length;
      }
    }

    console.log(
      `✓ Assets indexing complete: ${stats.assets.indexed}/${stats.assets.total} successful`,
    );
  } catch (error) {
    console.error("Failed to index assets:", error);
  }
}

/**
 * Index all NPCs
 */
async function indexNPCs(stats: IndexingStats): Promise<void> {
  console.log("\n👤 Indexing NPCs...");

  try {
    const allNPCs = await db.select().from(npcs);
    stats.npcs.total = allNPCs.length;

    console.log(`Found ${allNPCs.length} NPCs to index`);

    for (let i = 0; i < allNPCs.length; i += BATCH_SIZE) {
      const batch = allNPCs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allNPCs.length / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNum}/${totalBatches} (${batch.length} NPCs)...`,
      );

      const texts = batch.map((npc) => embeddingService.prepareNPCText(npc));

      try {
        const { embeddings } = await embeddingService.generateEmbeddings(texts);

        const points = batch.map((npc, idx) => ({
          id: npc.id,
          vector: embeddings[idx].embedding,
          payload: {
            type: "npc",
            name: npc.name,
            archetype: npc.archetype,
            tags: npc.tags,
            metadata: {
              createdBy: npc.createdBy,
              createdAt: npc.createdAt?.toISOString(),
            },
          },
        }));

        await qdrantService.upsertBatch("npcs", points);

        stats.npcs.indexed += batch.length;
        console.log(`✓ Indexed ${batch.length} NPCs`);
      } catch (error) {
        console.error(`✗ Failed to index batch:`, error);
        stats.npcs.failed += batch.length;
      }
    }

    console.log(
      `✓ NPCs indexing complete: ${stats.npcs.indexed}/${stats.npcs.total} successful`,
    );
  } catch (error) {
    console.error("Failed to index NPCs:", error);
  }
}

/**
 * Index all Quests
 */
async function indexQuests(stats: IndexingStats): Promise<void> {
  console.log("\n⚔️  Indexing Quests...");

  try {
    const allQuests = await db.select().from(quests);
    stats.quests.total = allQuests.length;

    console.log(`Found ${allQuests.length} quests to index`);

    for (let i = 0; i < allQuests.length; i += BATCH_SIZE) {
      const batch = allQuests.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allQuests.length / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNum}/${totalBatches} (${batch.length} quests)...`,
      );

      const texts = batch.map((quest) =>
        embeddingService.prepareQuestText(quest),
      );

      try {
        const { embeddings } = await embeddingService.generateEmbeddings(texts);

        const points = batch.map((quest, idx) => ({
          id: quest.id,
          vector: embeddings[idx].embedding,
          payload: {
            type: "quest",
            title: quest.title,
            questType: quest.questType,
            difficulty: quest.difficulty,
            tags: quest.tags,
            metadata: {
              createdBy: quest.createdBy,
              createdAt: quest.createdAt?.toISOString(),
            },
          },
        }));

        await qdrantService.upsertBatch("quests", points);

        stats.quests.indexed += batch.length;
        console.log(`✓ Indexed ${batch.length} quests`);
      } catch (error) {
        console.error(`✗ Failed to index batch:`, error);
        stats.quests.failed += batch.length;
      }
    }

    console.log(
      `✓ Quests indexing complete: ${stats.quests.indexed}/${stats.quests.total} successful`,
    );
  } catch (error) {
    console.error("Failed to index quests:", error);
  }
}

/**
 * Index all Lore
 */
async function indexLore(stats: IndexingStats): Promise<void> {
  console.log("\n📜 Indexing Lore...");

  try {
    const allLores = await db.select().from(lores);
    stats.lores.total = allLores.length;

    console.log(`Found ${allLores.length} lore entries to index`);

    for (let i = 0; i < allLores.length; i += BATCH_SIZE) {
      const batch = allLores.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allLores.length / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNum}/${totalBatches} (${batch.length} lore entries)...`,
      );

      const texts = batch.map((lore) => embeddingService.prepareLoreText(lore));

      try {
        const { embeddings } = await embeddingService.generateEmbeddings(texts);

        const points = batch.map((lore, idx) => ({
          id: lore.id,
          vector: embeddings[idx].embedding,
          payload: {
            type: "lore",
            title: lore.title,
            category: lore.category,
            summary: lore.summary,
            tags: lore.tags,
            metadata: {
              createdBy: lore.createdBy,
              createdAt: lore.createdAt?.toISOString(),
            },
          },
        }));

        await qdrantService.upsertBatch("lore", points);

        stats.lores.indexed += batch.length;
        console.log(`✓ Indexed ${batch.length} lore entries`);
      } catch (error) {
        console.error(`✗ Failed to index batch:`, error);
        stats.lores.failed += batch.length;
      }
    }

    console.log(
      `✓ Lore indexing complete: ${stats.lores.indexed}/${stats.lores.total} successful`,
    );
  } catch (error) {
    console.error("Failed to index lore:", error);
  }
}

/**
 * Index all Dialogues
 */
async function indexDialogues(stats: IndexingStats): Promise<void> {
  console.log("\n💬 Indexing Dialogues...");

  try {
    const allDialogues = await db.select().from(dialogues);
    stats.dialogues.total = allDialogues.length;

    console.log(`Found ${allDialogues.length} dialogues to index`);

    for (let i = 0; i < allDialogues.length; i += BATCH_SIZE) {
      const batch = allDialogues.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allDialogues.length / BATCH_SIZE);

      console.log(
        `Processing batch ${batchNum}/${totalBatches} (${batch.length} dialogues)...`,
      );

      const texts = batch.map((dialogue) =>
        embeddingService.prepareDialogueText(dialogue),
      );

      try {
        const { embeddings } = await embeddingService.generateEmbeddings(texts);

        const points = batch.map((dialogue, idx) => ({
          id: dialogue.id,
          vector: embeddings[idx].embedding,
          payload: {
            type: "dialogue",
            npcName: dialogue.npcName,
            context: dialogue.context,
            metadata: {
              createdBy: dialogue.createdBy,
              createdAt: dialogue.createdAt?.toISOString(),
            },
          },
        }));

        await qdrantService.upsertBatch("dialogues", points);

        stats.dialogues.indexed += batch.length;
        console.log(`✓ Indexed ${batch.length} dialogues`);
      } catch (error) {
        console.error(`✗ Failed to index batch:`, error);
        stats.dialogues.failed += batch.length;
      }
    }

    console.log(
      `✓ Dialogues indexing complete: ${stats.dialogues.indexed}/${stats.dialogues.total} successful`,
    );
  } catch (error) {
    console.error("Failed to index dialogues:", error);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting Qdrant indexing migration...\n");

  // Check configuration
  if (!process.env.QDRANT_URL) {
    console.error("❌ QDRANT_URL not configured. Aborting.");
    process.exit(1);
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error(
      "❌ AI_GATEWAY_API_KEY or OPENAI_API_KEY required. Aborting.",
    );
    process.exit(1);
  }

  const stats: IndexingStats = {
    assets: { total: 0, indexed: 0, failed: 0 },
    npcs: { total: 0, indexed: 0, failed: 0 },
    quests: { total: 0, indexed: 0, failed: 0 },
    lores: { total: 0, indexed: 0, failed: 0 },
    dialogues: { total: 0, indexed: 0, failed: 0 },
  };

  try {
    // Initialize Qdrant collections
    console.log("Initializing Qdrant collections...");
    await initializeQdrantCollections();
    console.log("✓ Collections initialized\n");

    // Index all data
    await indexAssets(stats);
    await indexNPCs(stats);
    await indexQuests(stats);
    await indexLore(stats);
    await indexDialogues(stats);

    // Print final summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 INDEXING SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `Assets:    ${stats.assets.indexed}/${stats.assets.total} (${stats.assets.failed} failed)`,
    );
    console.log(
      `NPCs:      ${stats.npcs.indexed}/${stats.npcs.total} (${stats.npcs.failed} failed)`,
    );
    console.log(
      `Quests:    ${stats.quests.indexed}/${stats.quests.total} (${stats.quests.failed} failed)`,
    );
    console.log(
      `Lore:      ${stats.lores.indexed}/${stats.lores.total} (${stats.lores.failed} failed)`,
    );
    console.log(
      `Dialogues: ${stats.dialogues.indexed}/${stats.dialogues.total} (${stats.dialogues.failed} failed)`,
    );
    console.log("=".repeat(60));

    const totalIndexed =
      stats.assets.indexed +
      stats.npcs.indexed +
      stats.quests.indexed +
      stats.lores.indexed +
      stats.dialogues.indexed;
    const totalFailed =
      stats.assets.failed +
      stats.npcs.failed +
      stats.quests.failed +
      stats.lores.failed +
      stats.dialogues.failed;

    console.log(`\nTotal: ${totalIndexed} indexed, ${totalFailed} failed`);

    if (totalFailed === 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log(
        `\n⚠️  Migration completed with ${totalFailed} failures. Check logs above.`,
      );
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
main();
