/**
 * Content Generation Types
 * TypeScript interfaces for NPC, quest, dialogue, and lore generation
 */

// Content generation types
export type ContentType = 'npc' | 'quest' | 'dialogue' | 'lore'
export type ContentView = 'config' | 'progress' | 'results'
export type QualityLevel = 'quality' | 'speed' | 'balanced'

// NPC Generation
export interface NPCPersonality {
  traits: string[]
  background: string
  motivations: string[]
}

export interface NPCAppearance {
  description: string
  equipment: string[]
}

export interface NPCDialogue {
  greeting: string
  farewell: string
  idle: string[]
}

export interface NPCBehavior {
  role: string
  schedule: string
  relationships: string[]
}

export interface NPCData {
  name: string
  archetype: string
  personality: NPCPersonality
  appearance: NPCAppearance
  dialogue: NPCDialogue
  behavior: NPCBehavior
}

export interface GenerateNPCParams {
  archetype: string
  prompt: string
  context?: string
  quality?: QualityLevel
}

// Quest Generation
export interface QuestObjective {
  description: string
  type: 'kill' | 'collect' | 'talk' | 'explore'
  target: string
  count: number
}

export interface QuestRewards {
  experience: number
  gold: number
  items: string[]
}

export interface QuestRequirements {
  level: number
  previousQuests: string[]
}

export interface QuestData {
  title: string
  description: string
  objectives: QuestObjective[]
  rewards: QuestRewards
  requirements: QuestRequirements
  npcs: string[]
  location: string
  story: string
}

export interface GenerateQuestParams {
  questType: string
  difficulty: string
  theme?: string
  context?: string
  quality?: QualityLevel
}

// Dialogue Generation
export interface DialogueResponse {
  text: string
  nextNodeId?: string
}

export interface DialogueNode {
  id: string
  text: string
  responses?: DialogueResponse[]
}

export interface GenerateDialogueParams {
  npcName: string
  npcPersonality: string
  context?: string
  existingNodes?: DialogueNode[]
  quality?: QualityLevel
}

// Lore Generation
export interface LoreData {
  title: string
  category: string
  content: string
  summary: string
  relatedTopics: string[]
  timeline?: string
  characters?: string[]
}

export interface GenerateLoreParams {
  category: string
  topic: string
  context?: string
  quality?: QualityLevel
}

// Generated Content Result
export interface GeneratedContent {
  id: string
  type: ContentType
  name: string
  data: NPCData | QuestData | DialogueNode[] | LoreData
  metadata: {
    type: ContentType
    prompt?: string
    archetype?: string
    questType?: string
    difficulty?: string
    category?: string
    quality?: QualityLevel
    [key: string]: any
  }
  createdAt: string
}
