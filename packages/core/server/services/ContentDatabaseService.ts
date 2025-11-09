/**
 * Content Database Service
 * CRUD operations for AI-generated content (NPCs, quests, dialogue, lore)
 */

import { db } from '../db/db'
import {
  npcs,
  quests,
  dialogues,
  lores,
  type NPC,
  type NewNPC,
  type Quest,
  type NewQuest,
  type Dialogue,
  type NewDialogue,
  type Lore,
  type NewLore
} from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export class ContentDatabaseService {
  // ====================
  // NPC Operations
  // ====================

  /**
   * Create NPC record
   */
  async createNPC(data: NewNPC): Promise<NPC> {
    try {
      const [npc] = await db.insert(npcs).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      console.log(`[ContentDatabaseService] Created NPC: ${npc.name}`)
      return npc
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to create NPC:`, error)
      throw error
    }
  }

  /**
   * Get NPC by ID
   */
  async getNPC(id: string): Promise<NPC | null> {
    try {
      const result = await db.select()
        .from(npcs)
        .where(eq(npcs.id, id))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to get NPC:`, error)
      return null
    }
  }

  /**
   * List all NPCs (newest first)
   */
  async listNPCs(limit = 50, offset = 0): Promise<NPC[]> {
    try {
      const result = await db.select()
        .from(npcs)
        .orderBy(desc(npcs.createdAt))
        .limit(limit)
        .offset(offset)

      return result
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to list NPCs:`, error)
      return []
    }
  }

  /**
   * Delete NPC by ID
   */
  async deleteNPC(id: string): Promise<void> {
    try {
      await db.delete(npcs).where(eq(npcs.id, id))
      console.log(`[ContentDatabaseService] Deleted NPC: ${id}`)
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to delete NPC:`, error)
      throw error
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
      const [quest] = await db.insert(quests).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      console.log(`[ContentDatabaseService] Created Quest: ${quest.title}`)
      return quest
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to create Quest:`, error)
      throw error
    }
  }

  /**
   * Get Quest by ID
   */
  async getQuest(id: string): Promise<Quest | null> {
    try {
      const result = await db.select()
        .from(quests)
        .where(eq(quests.id, id))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to get Quest:`, error)
      return null
    }
  }

  /**
   * List all Quests (newest first)
   */
  async listQuests(limit = 50, offset = 0): Promise<Quest[]> {
    try {
      const result = await db.select()
        .from(quests)
        .orderBy(desc(quests.createdAt))
        .limit(limit)
        .offset(offset)

      return result
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to list Quests:`, error)
      return []
    }
  }

  /**
   * Delete Quest by ID
   */
  async deleteQuest(id: string): Promise<void> {
    try {
      await db.delete(quests).where(eq(quests.id, id))
      console.log(`[ContentDatabaseService] Deleted Quest: ${id}`)
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to delete Quest:`, error)
      throw error
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
      const [dialogue] = await db.insert(dialogues).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      console.log(`[ContentDatabaseService] Created Dialogue for: ${dialogue.npcName}`)
      return dialogue
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to create Dialogue:`, error)
      throw error
    }
  }

  /**
   * Get Dialogue by ID
   */
  async getDialogue(id: string): Promise<Dialogue | null> {
    try {
      const result = await db.select()
        .from(dialogues)
        .where(eq(dialogues.id, id))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to get Dialogue:`, error)
      return null
    }
  }

  /**
   * List all Dialogues (newest first)
   */
  async listDialogues(limit = 50, offset = 0): Promise<Dialogue[]> {
    try {
      const result = await db.select()
        .from(dialogues)
        .orderBy(desc(dialogues.createdAt))
        .limit(limit)
        .offset(offset)

      return result
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to list Dialogues:`, error)
      return []
    }
  }

  /**
   * Delete Dialogue by ID
   */
  async deleteDialogue(id: string): Promise<void> {
    try {
      await db.delete(dialogues).where(eq(dialogues.id, id))
      console.log(`[ContentDatabaseService] Deleted Dialogue: ${id}`)
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to delete Dialogue:`, error)
      throw error
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
      const [lore] = await db.insert(lores).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      console.log(`[ContentDatabaseService] Created Lore: ${lore.title}`)
      return lore
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to create Lore:`, error)
      throw error
    }
  }

  /**
   * Get Lore by ID
   */
  async getLore(id: string): Promise<Lore | null> {
    try {
      const result = await db.select()
        .from(lores)
        .where(eq(lores.id, id))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to get Lore:`, error)
      return null
    }
  }

  /**
   * List all Lore (newest first)
   */
  async listLores(limit = 50, offset = 0): Promise<Lore[]> {
    try {
      const result = await db.select()
        .from(lores)
        .orderBy(desc(lores.createdAt))
        .limit(limit)
        .offset(offset)

      return result
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to list Lores:`, error)
      return []
    }
  }

  /**
   * Delete Lore by ID
   */
  async deleteLore(id: string): Promise<void> {
    try {
      await db.delete(lores).where(eq(lores.id, id))
      console.log(`[ContentDatabaseService] Deleted Lore: ${id}`)
    } catch (error) {
      console.error(`[ContentDatabaseService] Failed to delete Lore:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const contentDatabaseService = new ContentDatabaseService()
