/**
 * Content Database Service
 * CRUD operations for AI-generated content (NPCs, quests, dialogue, lore)
 * Automatically indexes to Qdrant vector database for semantic search
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import {
  npcs,
  quests,
  dialogues,
  lores,
  locations,
  type NPC,
  type NewNPC,
  type Quest,
  type NewQuest,
  type Dialogue,
  type NewDialogue,
  type Lore,
  type NewLore,
  type Location,
} from "../db/schema";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import { embeddingService } from "./EmbeddingService";
import { qdrantService, type CollectionName } from "./QdrantService";

export class ContentDatabaseService {
  // ====================
  // NPC Operations
  // ====================

  /**
   * Create NPC record
   */
  async createNPC(data: NewNPC): Promise<NPC> {
    try {
      const [npc] = await db
        .insert(npcs)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info(
        { context: "ContentDatabaseService" },
        `Created NPC: ${npc.name}`,
      );

      // Index to Qdrant (async, don't block)
      this.indexNPC(npc).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to index NPC embedding:`,
          error,
        );
      });

      return npc;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to create NPC:",
      );
      throw error;
    }
  }

  /**
   * Get NPC by ID
   */
  async getNPC(id: string): Promise<NPC | null> {
    try {
      const result = await db
        .select()
        .from(npcs)
        .where(and(eq(npcs.id, id)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to get NPC:",
      );
      return null;
    }
  }

  /**
   * List all NPCs (newest first)
   */
  async listNPCs(limit = 50, offset = 0): Promise<NPC[]> {
    try {
      // P1: Cap limits to prevent resource exhaustion
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);

      const result = await db
        .select()
        .from(npcs)
        
        .orderBy(desc(npcs.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to list NPCs:",
      );
      return [];
    }
  }

  /**
   * Update NPC by ID
   */
  async updateNPC(
    id: string,
    userId: string,
    data: Partial<NewNPC>,
  ): Promise<NPC> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(npcs)
        .where(
          and(
            eq(npcs.id, id),
            eq(npcs.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("NPC not found or access denied");
      }

      // P1: Check .returning() results for silent failures
      const results = await db
        .update(npcs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(npcs.id, id))
        .returning();

      if (results.length === 0) {
        throw new Error("Update failed");
      }

      const npc = results[0];

      logger.info(
        { context: "ContentDatabaseService" },
        `Updated NPC: ${npc.name}`,
      );

      // Re-index to Qdrant (async, don't block)
      this.indexNPC(npc).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to re-index NPC embedding:`,
          error,
        );
      });

      return npc;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to update NPC:",
      );
      throw error;
    }
  }

  /**
   * Delete NPC by ID
   */
  async deleteNPC(id: string, userId: string): Promise<void> {
    try {
      // P0-CRITICAL: Ownership validation
      // Allow deletion if user owns it OR if created_by is null (legacy data)
      const [existing] = await db
        .select()
        .from(npcs)
        .where(
          and(
            eq(npcs.id, id),
            or(eq(npcs.createdBy, userId), isNull(npcs.createdBy)),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("NPC not found or access denied");
      }

      await db.delete(npcs).where(eq(npcs.id, id));
      logger.info({ context: "ContentDatabaseService" }, `Deleted NPC: ${id}`);

      // Delete from Qdrant (async, don't block)
      if (process.env.QDRANT_URL) {
        qdrantService.delete("npcs", id).catch((error) => {
          logger.warn(
            `[ContentDatabaseService] Failed to delete NPC embedding:`,
            error,
          );
        });
      }
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to delete NPC:",
      );
      throw error;
    }
  }

  // ====================
  // Quest Operations
  // ====================

  /**
   * Create Quest record
   */
  async createQuest(data: NewQuest): Promise<Quest> {
    try {
      const [quest] = await db
        .insert(quests)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info(
        { context: "ContentDatabaseService" },
        `Created Quest: ${quest.title}`,
      );

      // Index to Qdrant (async, don't block)
      this.indexQuest(quest).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to index Quest embedding:`,
          error,
        );
      });

      return quest;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to create Quest:",
      );
      throw error;
    }
  }

  /**
   * Get Quest by ID
   */
  async getQuest(id: string): Promise<Quest | null> {
    try {
      const result = await db
        .select()
        .from(quests)
        .where(and(eq(quests.id, id)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to get Quest:",
      );
      return null;
    }
  }

  /**
   * List all Quests (newest first)
   */
  async listQuests(limit = 50, offset = 0): Promise<Quest[]> {
    try {
      // P1: Cap limits to prevent resource exhaustion
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);

      const result = await db
        .select()
        .from(quests)
        
        .orderBy(desc(quests.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to list Quests:",
      );
      return [];
    }
  }

  /**
   * Update Quest by ID
   */
  async updateQuest(
    id: string,
    userId: string,
    data: Partial<NewQuest>,
  ): Promise<Quest> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(quests)
        .where(
          and(
            eq(quests.id, id),
            eq(quests.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Quest not found or access denied");
      }

      // P1: Check .returning() results for silent failures
      const results = await db
        .update(quests)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(quests.id, id))
        .returning();

      if (results.length === 0) {
        throw new Error("Update failed");
      }

      const quest = results[0];

      logger.info(
        { context: "ContentDatabaseService" },
        `Updated Quest: ${quest.title}`,
      );

      // Re-index to Qdrant (async, don't block)
      this.indexQuest(quest).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to re-index Quest embedding:`,
          error,
        );
      });

      return quest;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to update Quest:",
      );
      throw error;
    }
  }

  /**
   * Delete Quest by ID
   */
  async deleteQuest(id: string, userId: string): Promise<void> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(quests)
        .where(
          and(
            eq(quests.id, id),
            eq(quests.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Quest not found or access denied");
      }

      await db.delete(quests).where(eq(quests.id, id));
      logger.info(
        { context: "ContentDatabaseService" },
        `Deleted Quest: ${id}`,
      );

      // Delete from Qdrant (async, don't block)
      if (process.env.QDRANT_URL) {
        qdrantService.delete("quests", id).catch((error) => {
          logger.warn(
            `[ContentDatabaseService] Failed to delete Quest embedding:`,
            error,
          );
        });
      }
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to delete Quest:",
      );
      throw error;
    }
  }

  // ====================
  // Dialogue Operations
  // ====================

  /**
   * Create Dialogue record
   */
  async createDialogue(data: NewDialogue): Promise<Dialogue> {
    try {
      const [dialogue] = await db
        .insert(dialogues)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info(
        `[ContentDatabaseService] Created Dialogue for: ${dialogue.npcName}`,
      );

      // Index to Qdrant (async, don't block)
      this.indexDialogue(dialogue).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to index Dialogue embedding:`,
          error,
        );
      });

      return dialogue;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to create Dialogue",
      );
      throw error;
    }
  }

  /**
   * Get Dialogue by ID
   */
  async getDialogue(id: string): Promise<Dialogue | null> {
    try {
      const result = await db
        .select()
        .from(dialogues)
        .where(and(eq(dialogues.id, id)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to get Dialogue:",
      );
      return null;
    }
  }

  /**
   * List all Dialogues (newest first)
   */
  async listDialogues(limit = 50, offset = 0): Promise<Dialogue[]> {
    try {
      // P1: Cap limits to prevent resource exhaustion
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);

      const result = await db
        .select()
        .from(dialogues)
        
        .orderBy(desc(dialogues.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Failed to list Dialogues`,
      );
      return [];
    }
  }

  /**
   * Update Dialogue by ID
   */
  async updateDialogue(
    id: string,
    userId: string,
    data: Partial<NewDialogue>,
  ): Promise<Dialogue> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(dialogues)
        .where(
          and(
            eq(dialogues.id, id),
            eq(dialogues.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Dialogue not found or access denied");
      }

      // P1: Check .returning() results for silent failures
      const results = await db
        .update(dialogues)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(dialogues.id, id))
        .returning();

      if (results.length === 0) {
        throw new Error("Update failed");
      }

      const dialogue = results[0];

      logger.info(
        `[ContentDatabaseService] Updated Dialogue for: ${dialogue.npcName}`,
      );

      // Re-index to Qdrant (async, don't block)
      this.indexDialogue(dialogue).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to re-index Dialogue embedding:`,
          error,
        );
      });

      return dialogue;
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Failed to update Dialogue`,
      );
      throw error;
    }
  }

  /**
   * Delete Dialogue by ID
   */
  async deleteDialogue(id: string, userId: string): Promise<void> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(dialogues)
        .where(
          and(
            eq(dialogues.id, id),
            eq(dialogues.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Dialogue not found or access denied");
      }

      await db.delete(dialogues).where(eq(dialogues.id, id));
      logger.info(
        { context: "ContentDatabaseService" },
        `Deleted Dialogue: ${id}`,
      );

      // Delete from Qdrant (async, don't block)
      if (process.env.QDRANT_URL) {
        qdrantService.delete("dialogues", id).catch((error) => {
          logger.warn(
            `[ContentDatabaseService] Failed to delete Dialogue embedding:`,
            error,
          );
        });
      }
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Failed to delete Dialogue`,
      );
      throw error;
    }
  }

  // ====================
  // Lore Operations
  // ====================

  /**
   * Create Lore record
   */
  async createLore(data: NewLore): Promise<Lore> {
    try {
      const [lore] = await db
        .insert(lores)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info(
        { context: "ContentDatabaseService" },
        `Created Lore: ${lore.title}`,
      );

      // Index to Qdrant (async, don't block)
      this.indexLore(lore).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to index Lore embedding:`,
          error,
        );
      });

      return lore;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to create Lore:",
      );
      throw error;
    }
  }

  /**
   * Get Lore by ID
   */
  async getLore(id: string): Promise<Lore | null> {
    try {
      const result = await db
        .select()
        .from(lores)
        .where(and(eq(lores.id, id)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to get Lore:",
      );
      return null;
    }
  }

  /**
   * List all Lore (newest first)
   */
  async listLores(limit = 50, offset = 0): Promise<Lore[]> {
    try {
      // P1: Cap limits to prevent resource exhaustion
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);

      const result = await db
        .select()
        .from(lores)
        
        .orderBy(desc(lores.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to list Lores:",
      );
      return [];
    }
  }

  /**
   * Update Lore by ID
   */
  async updateLore(
    id: string,
    userId: string,
    data: Partial<NewLore>,
  ): Promise<Lore> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(lores)
        .where(
          and(
            eq(lores.id, id),
            eq(lores.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Lore not found or access denied");
      }

      // P1: Check .returning() results for silent failures
      const results = await db
        .update(lores)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(lores.id, id))
        .returning();

      if (results.length === 0) {
        throw new Error("Update failed");
      }

      const lore = results[0];

      logger.info(
        { context: "ContentDatabaseService" },
        `Updated Lore: ${lore.title}`,
      );

      // Re-index to Qdrant (async, don't block)
      this.indexLore(lore).catch((error) => {
        logger.warn(
          `[ContentDatabaseService] Failed to re-index Lore embedding:`,
          error,
        );
      });

      return lore;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to update Lore:",
      );
      throw error;
    }
  }

  /**
   * Delete Lore by ID
   */
  async deleteLore(id: string, userId: string): Promise<void> {
    try {
      // P0-CRITICAL: Ownership validation
      const [existing] = await db
        .select()
        .from(lores)
        .where(
          and(
            eq(lores.id, id),
            eq(lores.createdBy, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Lore not found or access denied");
      }

      await db.delete(lores).where(eq(lores.id, id));
      logger.info({ context: "ContentDatabaseService" }, `Deleted Lore: ${id}`);

      // Delete from Qdrant (async, don't block)
      if (process.env.QDRANT_URL) {
        qdrantService.delete("lore", id).catch((error) => {
          logger.warn(
            `[ContentDatabaseService] Failed to delete Lore embedding:`,
            error,
          );
        });
      }
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to delete Lore:",
      );
      throw error;
    }
  }

  // ====================
  // Location Operations
  // ====================

  /**
   * List all Locations (newest first)
   */
  async listLocations(limit = 50, offset = 0): Promise<Location[]> {
    try {
      // P1: Cap limits to prevent resource exhaustion
      const safeLimit = Math.min(limit || 20, 100);
      const safeOffset = Math.max(offset || 0, 0);

      const result = await db
        .select()
        .from(locations)
        
        .orderBy(desc(locations.createdAt))
        .limit(safeLimit)
        .offset(safeOffset);

      return result;
    } catch (error) {
      logger.error(
        { err: error },
        "[ContentDatabaseService] Failed to list Locations:",
      );
      return [];
    }
  }

  // ====================
  // Private Embedding Helpers
  // ====================

  /**
   * Index NPC to Qdrant
   */
  private async indexNPC(npc: NPC): Promise<void> {
    if (!process.env.QDRANT_URL) return;

    try {
      const text = embeddingService.prepareNPCText(npc);
      const { embedding } = await embeddingService.generateEmbedding(text);

      await qdrantService.upsert({
        collection: "npcs",
        id: npc.id,
        vector: embedding,
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
      });

      logger.info(
        { context: "ContentDatabaseService" },
        `Indexed NPC to Qdrant: ${npc.id}`,
      );
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Error indexing NPC ${npc.id} to Qdrant`,
      );
      throw error;
    }
  }

  /**
   * Index Quest to Qdrant
   */
  private async indexQuest(quest: Quest): Promise<void> {
    if (!process.env.QDRANT_URL) return;

    try {
      const text = embeddingService.prepareQuestText(quest);
      const { embedding } = await embeddingService.generateEmbedding(text);

      await qdrantService.upsert({
        collection: "quests",
        id: quest.id,
        vector: embedding,
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
      });

      logger.info(
        `[ContentDatabaseService] Indexed Quest to Qdrant: ${quest.id}`,
      );
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Error indexing Quest ${quest.id} to Qdrant`,
      );
      throw error;
    }
  }

  /**
   * Index Lore to Qdrant
   */
  private async indexLore(lore: Lore): Promise<void> {
    if (!process.env.QDRANT_URL) return;

    try {
      const text = embeddingService.prepareLoreText(lore);
      const { embedding } = await embeddingService.generateEmbedding(text);

      await qdrantService.upsert({
        collection: "lore",
        id: lore.id,
        vector: embedding,
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
      });

      logger.info(
        `[ContentDatabaseService] Indexed Lore to Qdrant: ${lore.id}`,
      );
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Error indexing Lore ${lore.id} to Qdrant`,
      );
      throw error;
    }
  }

  /**
   * Index Dialogue to Qdrant
   */
  private async indexDialogue(dialogue: Dialogue): Promise<void> {
    if (!process.env.QDRANT_URL) return;

    try {
      const text = embeddingService.prepareDialogueText(dialogue);
      const { embedding } = await embeddingService.generateEmbedding(text);

      await qdrantService.upsert({
        collection: "dialogues",
        id: dialogue.id,
        vector: embedding,
        payload: {
          type: "dialogue",
          npcName: dialogue.npcName,
          context: dialogue.context,
          metadata: {
            createdBy: dialogue.createdBy,
            createdAt: dialogue.createdAt?.toISOString(),
          },
        },
      });

      logger.info(
        `[ContentDatabaseService] Indexed Dialogue to Qdrant: ${dialogue.id}`,
      );
    } catch (error) {
      logger.error(
        { err: error },
        `[ContentDatabaseService] Error indexing Dialogue ${dialogue.id} to Qdrant`,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const contentDatabaseService = new ContentDatabaseService();
