/**
 * Content API Response Types
 * Type-safe definitions for ContentAPIClient responses
 */

import type {
  NPCData,
  QuestData,
  DialogueNode,
  LoreData,
  DialogueMetadata,
  ContentType,
} from "../content";

// ==================== Base Database Fields ====================

/**
 * Common fields added by the database for all content entities
 */
export interface DatabaseFields {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ==================== Metadata Types ====================

/**
 * Metadata for NPC entities - stored in database metadata column
 */
export interface NPCMetadata {
  portraitUrl?: string;
  voiceId?: string;
  tags?: string[];
  worldConfigId?: string;
  prompt?: string;
  archetype?: string;
  quality?: string;
  generationDuration?: number;
  modelUsed?: string;
}

/**
 * Metadata for Quest entities - stored in database metadata column
 */
export interface QuestMetadata {
  bannerUrl?: string;
  tags?: string[];
  worldConfigId?: string;
  prompt?: string;
  questType?: string;
  difficulty?: string;
  quality?: string;
  generationDuration?: number;
  modelUsed?: string;
  npcGiverId?: string; // If quest is linked to an NPC
}

/**
 * Metadata for Lore entities - stored in database metadata column
 */
export interface LoreMetadata {
  tags?: string[];
  worldConfigId?: string;
  prompt?: string;
  category?: string;
  topic?: string;
  quality?: string;
  generationDuration?: number;
  modelUsed?: string;
  npcReferencedId?: string; // If lore is linked to an NPC
}

// ==================== Extended Entity Types ====================

/**
 * NPC entity as returned by the API - includes database fields and metadata
 */
export interface NPCEntity extends NPCData, DatabaseFields {
  metadata: NPCMetadata;
}

/**
 * Quest entity as returned by the API - includes database fields, metadata, and additional fields
 */
export interface QuestEntity extends QuestData, DatabaseFields {
  difficulty: string;
  questType: string;
  metadata: QuestMetadata;
}

/**
 * Dialogue entity as returned by the API - includes database fields
 */
export interface DialogueEntity extends DatabaseFields {
  npcName: string;
  context: string;
  nodes: DialogueNode[];
  metadata?: DialogueMetadata;
}

/**
 * Lore entity as returned by the API - includes database fields and metadata
 */
export interface LoreEntity extends LoreData, DatabaseFields {
  metadata: LoreMetadata;
}

// ==================== Media Types ====================

/**
 * Voice settings for text-to-speech generation
 */
export interface VoiceSettings {
  stability?: number; // 0-1
  similarityBoost?: number; // 0-1
  style?: number; // 0-1
  useSpeakerBoost?: boolean;
}

/**
 * Media asset entity as returned by the API
 */
export interface MediaAsset {
  id: string;
  entityType: string;
  entityId: string;
  type: string; // "portrait" | "banner" | "voice" | etc.
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  prompt?: string;
  model?: string;
  voiceId?: string;
  voiceSettings?: VoiceSettings;
  text?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ==================== Relationship Types ====================

/**
 * Content relationship entity (for linked content like quests given by NPCs)
 */
export interface ContentRelationship {
  id: string;
  sourceType: ContentType;
  sourceId: string;
  targetType: ContentType;
  targetId: string;
  relationshipType: string; // "gives_quest" | "mentions" | etc.
  createdAt: string;
  userId: string;
}

// ==================== API Response Types ====================

/**
 * Response from generateNPC
 */
export interface GenerateNPCResponse {
  npc: NPCEntity;
  rawResponse: string;
}

/**
 * Response from generateQuest
 */
export interface GenerateQuestResponse {
  quest: QuestEntity;
  rawResponse: string;
}

/**
 * Response from generateDialogue
 */
export interface GenerateDialogueResponse {
  nodes: DialogueNode[];
  rawResponse: string;
}

/**
 * Response from generateLore
 */
export interface GenerateLoreResponse {
  lore: LoreEntity;
  rawResponse: string;
}

/**
 * Response from image generation (portrait/banner)
 */
export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
}

/**
 * Response from list operations
 */
export interface ListNPCsResponse {
  success: boolean;
  npcs: NPCEntity[];
}

export interface ListQuestsResponse {
  success: boolean;
  quests: QuestEntity[];
}

export interface ListDialoguesResponse {
  success: boolean;
  dialogues: DialogueEntity[];
}

export interface ListLoresResponse {
  success: boolean;
  lores: LoreEntity[];
}

/**
 * Response from get operations
 */
export interface GetNPCResponse {
  success: boolean;
  npc: NPCEntity;
}

export interface GetQuestResponse {
  success: boolean;
  quest: QuestEntity;
}

export interface GetDialogueResponse {
  success: boolean;
  dialogue: DialogueEntity;
}

export interface GetLoreResponse {
  success: boolean;
  lore: LoreEntity;
}

/**
 * Response from update operations
 */
export interface UpdateNPCResponse {
  success: boolean;
  npc: NPCEntity;
}

export interface UpdateQuestResponse {
  success: boolean;
  quest: QuestEntity;
}

export interface UpdateDialogueResponse {
  success: boolean;
  dialogue: DialogueEntity;
}

export interface UpdateLoreResponse {
  success: boolean;
  lore: LoreEntity;
}

/**
 * Response from delete operations
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Response from savePortrait/saveVoice
 */
export interface SaveMediaResponse {
  success: boolean;
  mediaId: string;
  fileUrl: string;
}

/**
 * Response from getMediaForEntity
 */
export interface GetMediaResponse {
  success: boolean;
  media: MediaAsset[];
}

/**
 * Response from generateQuestForNPC
 */
export interface GenerateQuestForNPCResponse {
  success: boolean;
  quest: QuestEntity;
  questId: string;
  relationship: ContentRelationship;
}

/**
 * Response from generateLoreForNPC
 */
export interface GenerateLoreForNPCResponse {
  success: boolean;
  lore: LoreEntity;
  loreId: string;
  relationship: ContentRelationship;
}
