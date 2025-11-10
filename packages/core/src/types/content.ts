/**
 * Content Generation Types
 * TypeScript interfaces for NPC, quest, dialogue, and lore generation
 */

// Export content model classes
export {
  NPCData,
  QuestData,
  DialogueData,
  LoreData,
  GeneratedContent,
} from "./content-models";

// Content generation types
export type ContentType = "npc" | "quest" | "dialogue" | "lore";
export type ContentView = "config" | "progress" | "results";
export type QualityLevel = "quality" | "speed" | "balanced";

// NPC Generation
export interface NPCPersonality {
  traits: string[];
  background: string;
  motivations: string[];
}

export interface NPCAppearance {
  description: string;
  equipment: string[];
}

export interface NPCDialogue {
  greeting: string;
  farewell: string;
  idle: string[];
}

export interface NPCBehavior {
  role: string;
  schedule: string;
  relationships: string[];
}

// NPCData is now a class exported from content-models.ts

export interface GenerateNPCParams {
  archetype: string;
  prompt: string;
  context?: string;
  quality?: QualityLevel;
  worldConfigId?: string;
}

// Quest Generation
export interface QuestObjective {
  description: string;
  type: "kill" | "collect" | "talk" | "explore";
  target: string;
  count: number;
}

export interface QuestRewards {
  experience: number;
  gold: number;
  items: string[];
}

export interface QuestRequirements {
  level: number;
  previousQuests: string[];
}

// QuestData is now a class exported from content-models.ts

export interface GenerateQuestParams {
  questType: string;
  difficulty: string;
  theme?: string;
  context?: string;
  quality?: QualityLevel;
  worldConfigId?: string;
}

// Dialogue Generation
export interface DialogueResponse {
  text: string;
  nextNodeId?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  responses?: DialogueResponse[];
}

export interface DialogueMetadata {
  characterName?: string;
  description?: string;
  [key: string]: unknown;
}

// DialogueData is now a class exported from content-models.ts

export interface GenerateDialogueParams {
  npcName: string;
  npcPersonality: string;
  context?: string;
  existingNodes?: DialogueNode[];
  quality?: QualityLevel;
  worldConfigId?: string;
}

// Lore Generation
// LoreData is now a class exported from content-models.ts

export interface GenerateLoreParams {
  category: string;
  topic: string;
  context?: string;
  quality?: QualityLevel;
  worldConfigId?: string;
}

// Generated Content Result
export interface GeneratedContentMetadata {
  type: ContentType;
  prompt?: string;
  archetype?: string;
  questType?: string;
  difficulty?: string;
  category?: string;
  quality?: QualityLevel;
  [key: string]: unknown;
}

// GeneratedContent is now a class exported from content-models.ts
