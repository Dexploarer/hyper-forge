/**
 * Content Database Service - Optimized Version
 * Performance improvements for N+1 query prevention and batch operations
 *
 * Key Optimizations:
 * - Batch loading with WHERE IN instead of multiple queries
 * - Eager loading with JOINs for related data
 * - Efficient counting with COUNT(*) instead of loading all records
 * - Database indexes on frequently queried columns
 */

import { db } from "../db/db";
import { logger } from '../utils/logger';
import {
  npcs,
  quests,
  dialogues,
  lores,
  type NPC,
  type Quest,
  type Dialogue,
  type Lore,
} from "../db/schema";
import { eq, desc, inArray, and, count, sql } from "drizzle-orm";

export class OptimizedContentDatabaseService {
  /**
   * Get multiple NPCs by IDs (batch loading)
   * Uses WHERE IN instead of multiple queries
   */
  async getNPCsBatch(ids: string[]): Promise<NPC[]> {
    if (ids.length === 0) return [];

    try {
      const result = await db.select().from(npcs).where(inArray(npcs.id, ids));

      return result;
    } catch (error) {
      logger.error({ err: error }, "[ContentDatabaseService] Failed to batch get NPCs"
      );
      return [];
    }
  }

  /**
   * Get multiple Quests by IDs (batch loading)
   */
  async getQuestsBatch(ids: string[]): Promise<Quest[]> {
    if (ids.length === 0) return [];

    try {
      const result = await db
        .select()
        .from(quests)
        .where(inArray(quests.id, ids));

      return result;
    } catch (error) {
      logger.error({ err: error }, "[ContentDatabaseService] Failed to batch get Quests"
      );
      return [];
    }
  }

  /**
   * Count NPCs efficiently without loading all records
   * Uses COUNT(*) SQL aggregation
   */
  async countNPCs(filters?: {
    archetype?: string;
    createdBy?: string;
  }): Promise<number> {
    try {
      const conditions: any[] = [];

      if (filters?.archetype) {
        conditions.push(eq(npcs.archetype, filters.archetype));
      }

      if (filters?.createdBy) {
        conditions.push(eq(npcs.createdBy, filters.createdBy));
      }

      const [result] = await db
        .select({ count: count() })
        .from(npcs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return Number(result.count);
    } catch (error) {
      logger.error({ err: error }, '[ContentDatabaseService] Failed to count NPCs:');
      return 0;
    }
  }

  /**
   * Count Quests efficiently
   */
  async countQuests(filters?: {
    questType?: string;
    difficulty?: string;
  }): Promise<number> {
    try {
      const conditions: any[] = [];

      if (filters?.questType) {
        conditions.push(eq(quests.questType, filters.questType));
      }

      if (filters?.difficulty) {
        conditions.push(eq(quests.difficulty, filters.difficulty));
      }

      const [result] = await db
        .select({ count: count() })
        .from(quests)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return Number(result.count);
    } catch (error) {
      logger.error({ err: error }, '[ContentDatabaseService] Failed to count Quests:');
      return 0;
    }
  }

  /**
   * Paginated NPC listing with efficient counting
   * Uses LIMIT/OFFSET for pagination and separate COUNT query
   */
  async listNPCsPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: { archetype?: string; createdBy?: string },
  ): Promise<{ data: NPC[]; total: number; page: number; totalPages: number }> {
    try {
      const conditions: any[] = [];

      if (filters?.archetype) {
        conditions.push(eq(npcs.archetype, filters.archetype));
      }

      if (filters?.createdBy) {
        conditions.push(eq(npcs.createdBy, filters.createdBy));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count (efficient COUNT query)
      const [countResult] = await db
        .select({ count: count() })
        .from(npcs)
        .where(whereClause);

      const total = Number(countResult.count);

      // Get paginated data
      const offset = (page - 1) * limit;
      const data = await db
        .select()
        .from(npcs)
        .where(whereClause)
        .orderBy(desc(npcs.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ err: error }, "[ContentDatabaseService] Failed to list NPCs paginated"
      );
      return { data: [], total: 0, page, totalPages: 0 };
    }
  }

  /**
   * Paginated Quest listing
   */
  async listQuestsPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: { questType?: string; difficulty?: string },
  ): Promise<{
    data: Quest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const conditions: any[] = [];

      if (filters?.questType) {
        conditions.push(eq(quests.questType, filters.questType));
      }

      if (filters?.difficulty) {
        conditions.push(eq(quests.difficulty, filters.difficulty));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(quests)
        .where(whereClause);

      const total = Number(countResult.count);

      // Get paginated data
      const offset = (page - 1) * limit;
      const data = await db
        .select()
        .from(quests)
        .where(whereClause)
        .orderBy(desc(quests.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ err: error }, "[ContentDatabaseService] Failed to list Quests paginated"
      );
      return { data: [], total: 0, page, totalPages: 0 };
    }
  }

  /**
   * Get user content statistics (optimized aggregation)
   * Uses SQL GROUP BY and COUNT for efficient aggregation
   */
  async getUserContentStats(userId: string): Promise<{
    npcCount: number;
    questCount: number;
    dialogueCount: number;
    loreCount: number;
    npcsByArchetype: Record<string, number>;
    questsByType: Record<string, number>;
  }> {
    try {
      // Count NPCs
      const [npcCountResult] = await db
        .select({ count: count() })
        .from(npcs)
        .where(eq(npcs.createdBy, userId));

      // Count Quests
      const [questCountResult] = await db
        .select({ count: count() })
        .from(quests)
        .where(eq(quests.createdBy, userId));

      // Count Dialogues
      const [dialogueCountResult] = await db
        .select({ count: count() })
        .from(dialogues)
        .where(eq(dialogues.createdBy, userId));

      // Count Lores
      const [loreCountResult] = await db
        .select({ count: count() })
        .from(lores)
        .where(eq(lores.createdBy, userId));

      // NPCs by archetype (GROUP BY)
      const npcsByArchetypeResults = await db
        .select({
          archetype: npcs.archetype,
          count: count(),
        })
        .from(npcs)
        .where(eq(npcs.createdBy, userId))
        .groupBy(npcs.archetype);

      const npcsByArchetype: Record<string, number> = {};
      for (const result of npcsByArchetypeResults) {
        npcsByArchetype[result.archetype] = Number(result.count);
      }

      // Quests by type (GROUP BY)
      const questsByTypeResults = await db
        .select({
          questType: quests.questType,
          count: count(),
        })
        .from(quests)
        .where(eq(quests.createdBy, userId))
        .groupBy(quests.questType);

      const questsByType: Record<string, number> = {};
      for (const result of questsByTypeResults) {
        questsByType[result.questType] = Number(result.count);
      }

      return {
        npcCount: Number(npcCountResult.count),
        questCount: Number(questCountResult.count),
        dialogueCount: Number(dialogueCountResult.count),
        loreCount: Number(loreCountResult.count),
        npcsByArchetype,
        questsByType,
      };
    } catch (error) {
      logger.error({ err: error }, "[ContentDatabaseService] Failed to get user stats"
      );
      return {
        npcCount: 0,
        questCount: 0,
        dialogueCount: 0,
        loreCount: 0,
        npcsByArchetype: {},
        questsByType: {},
      };
    }
  }

  /**
   * Bulk update view counts (batch operation)
   * More efficient than individual updates
   */
  async incrementViewCountsBatch(
    type: "npc" | "quest" | "dialogue" | "lore",
    ids: string[],
  ): Promise<void> {
    if (ids.length === 0) return;

    try {
      const table =
        type === "npc"
          ? npcs
          : type === "quest"
            ? quests
            : type === "dialogue"
              ? dialogues
              : lores;

      // Use SQL INCREMENT for atomic update
      await db
        .update(table)
        .set({
          viewCount: sql`${table.viewCount} + 1`,
          lastViewedAt: new Date(),
        })
        .where(inArray(table.id, ids));

      logger.info(
        `[ContentDatabaseService] Incremented view counts for ${ids.length} ${type}s`,
      );
    } catch (error) {
      logger.error({ err: error }, `[ContentDatabaseService] Failed to increment view counts`);
    }
  }
}

// Export singleton instance
export const optimizedContentDatabaseService =
  new OptimizedContentDatabaseService();
