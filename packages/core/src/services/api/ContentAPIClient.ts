/**
 * Content API Client
 * Client for NPC, quest, dialogue, and lore generation
 */

import type {
  NPCData,
  QuestData,
  DialogueNode,
  LoreData,
  GenerateNPCParams,
  GenerateQuestParams,
  GenerateDialogueParams,
  GenerateLoreParams,
} from "@/types/content";

const API_BASE = "/api";

export class ContentAPIClient {
  // ==================== NPC Generation ====================

  /**
   * Generate a complete NPC character
   */
  async generateNPC(params: GenerateNPCParams): Promise<{
    npc: NPCData & { id: string; metadata: any };
    rawResponse: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-npc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate NPC: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate a portrait image for an NPC character
   */
  async generateNPCPortrait(params: {
    npcName: string;
    archetype: string;
    appearance: string;
    personality: string;
  }): Promise<{
    success: boolean;
    imageUrl: string;
    prompt: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-npc-portrait`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate NPC portrait: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Generate a banner image for a quest
   */
  async generateQuestBanner(params: {
    questTitle: string;
    description: string;
    questType: string;
    difficulty: string;
  }): Promise<{
    success: boolean;
    imageUrl: string;
    prompt: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-quest-banner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate quest banner: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  // ==================== Quest Generation ====================

  /**
   * Generate a game quest
   */
  async generateQuest(params: GenerateQuestParams): Promise<{
    quest: QuestData & {
      id: string;
      difficulty: string;
      questType: string;
      metadata: any;
    };
    rawResponse: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-quest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate quest: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Dialogue Generation ====================

  /**
   * Generate NPC dialogue tree nodes
   */
  async generateDialogue(params: GenerateDialogueParams): Promise<{
    nodes: DialogueNode[];
    rawResponse: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-dialogue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate dialogue: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Lore Generation ====================

  /**
   * Generate world lore content
   */
  async generateLore(params: GenerateLoreParams): Promise<{
    lore: LoreData & { id: string; metadata: any };
    rawResponse: string;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-lore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate lore: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== NPC Retrieval ====================

  /**
   * List all NPCs
   */
  async listNPCs(
    limit = 50,
    offset = 0,
  ): Promise<{ success: boolean; npcs: any[] }> {
    const response = await fetch(
      `${API_BASE}/content/npcs?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to list NPCs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get NPC by ID
   */
  async getNPC(id: string): Promise<{ success: boolean; npc: any }> {
    const response = await fetch(`${API_BASE}/content/npcs/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get NPC: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete NPC by ID
   */
  async deleteNPC(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/content/npcs/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete NPC: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Quest Retrieval ====================

  /**
   * List all quests
   */
  async listQuests(
    limit = 50,
    offset = 0,
  ): Promise<{ success: boolean; quests: any[] }> {
    const response = await fetch(
      `${API_BASE}/content/quests?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to list quests: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get quest by ID
   */
  async getQuest(id: string): Promise<{ success: boolean; quest: any }> {
    const response = await fetch(`${API_BASE}/content/quests/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get quest: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete quest by ID
   */
  async deleteQuest(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/content/quests/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete quest: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Dialogue Retrieval ====================

  /**
   * List all dialogues
   */
  async listDialogues(
    limit = 50,
    offset = 0,
  ): Promise<{ success: boolean; dialogues: any[] }> {
    const response = await fetch(
      `${API_BASE}/content/dialogues?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to list dialogues: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get dialogue by ID
   */
  async getDialogue(id: string): Promise<{ success: boolean; dialogue: any }> {
    const response = await fetch(`${API_BASE}/content/dialogues/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get dialogue: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete dialogue by ID
   */
  async deleteDialogue(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/content/dialogues/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete dialogue: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Lore Retrieval ====================

  /**
   * List all lore entries
   */
  async listLores(
    limit = 50,
    offset = 0,
  ): Promise<{ success: boolean; lores: any[] }> {
    const response = await fetch(
      `${API_BASE}/content/lores?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to list lore: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get lore by ID
   */
  async getLore(id: string): Promise<{ success: boolean; lore: any }> {
    const response = await fetch(`${API_BASE}/content/lores/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get lore: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete lore by ID
   */
  async deleteLore(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/content/lores/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete lore: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Content Updates ====================

  /**
   * Update NPC by ID
   */
  async updateNPC(
    id: string,
    updates: Partial<NPCData>,
  ): Promise<{ success: boolean; npc: any }> {
    const response = await fetch(`${API_BASE}/content/npcs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update NPC: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update quest by ID
   */
  async updateQuest(
    id: string,
    updates: Partial<QuestData>,
  ): Promise<{ success: boolean; quest: any }> {
    const response = await fetch(`${API_BASE}/content/quests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update quest: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update dialogue by ID
   */
  async updateDialogue(
    id: string,
    updates: Partial<DialogueNode[]>,
  ): Promise<{ success: boolean; dialogue: any }> {
    const response = await fetch(`${API_BASE}/content/dialogues/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update dialogue: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update lore by ID
   */
  async updateLore(
    id: string,
    updates: Partial<LoreData>,
  ): Promise<{ success: boolean; lore: any }> {
    const response = await fetch(`${API_BASE}/content/lores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update lore: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Media Assets ====================

  /**
   * Save a portrait image to persistent storage
   */
  async savePortrait(params: {
    entityType: string;
    entityId: string;
    imageData: string; // base64 encoded
    type?: string; // "portrait" | "banner" | etc.
    prompt?: string;
    model?: string;
    createdBy?: string;
  }): Promise<{
    success: boolean;
    mediaId: string;
    fileUrl: string;
  }> {
    const response = await fetch(`${API_BASE}/content/media/save-portrait`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to save portrait: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Save a voice audio to persistent storage
   */
  async saveVoice(params: {
    entityType: string;
    entityId: string;
    audioData: string; // base64 encoded
    voiceId?: string;
    voiceSettings?: any;
    text?: string;
    duration?: number;
    createdBy?: string;
  }): Promise<{
    success: boolean;
    mediaId: string;
    fileUrl: string;
  }> {
    const response = await fetch(`${API_BASE}/content/media/save-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to save voice: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all media assets for an entity
   */
  async getMediaForEntity(
    entityType: string,
    entityId: string,
  ): Promise<{
    success: boolean;
    media: any[];
  }> {
    const response = await fetch(
      `${API_BASE}/content/media/${entityType}/${entityId}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get media for entity: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Linked Content Generation ====================

  /**
   * Generate a quest given by a specific NPC
   */
  async generateQuestForNPC(params: {
    npcId: string;
    npcName: string;
    archetype: string;
    personality?: string;
    questType: string;
    difficulty: string;
    theme?: string;
    quality?: "quality" | "speed" | "balanced";
    createdBy?: string;
  }): Promise<{
    success: boolean;
    quest: any;
    questId: string;
    relationship: any;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-quest-for-npc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate quest for NPC: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Generate lore that features/mentions a specific NPC
   */
  async generateLoreForNPC(params: {
    npcId: string;
    npcName: string;
    archetype: string;
    category: string;
    topic: string;
    additionalContext?: string;
    quality?: "quality" | "speed" | "balanced";
    createdBy?: string;
  }): Promise<{
    success: boolean;
    lore: any;
    loreId: string;
    relationship: any;
  }> {
    const response = await fetch(`${API_BASE}/content/generate-lore-for-npc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate lore for NPC: ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
