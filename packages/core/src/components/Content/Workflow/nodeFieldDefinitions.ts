/**
 * Node Field Definitions Utility
 * Extracts field metadata from content nodes for database-like view
 */

import type { DialogueNode, QuestData, QuestObjective } from '@/types/content'

export interface FieldDefinition {
  key: string
  label: string
  type: string
  value: any
  description?: string
  nullable: boolean
  category?: 'basic' | 'relationships' | 'metadata'
}

/**
 * Get field definitions for a DialogueNode
 */
export function getDialogueNodeFields(node: DialogueNode): FieldDefinition[] {
  return [
    {
      key: 'id',
      label: 'ID',
      type: 'string',
      value: node.id,
      description: 'Unique identifier for this dialogue node',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'text',
      label: 'Dialogue Text',
      type: 'string',
      value: node.text,
      description: 'The NPC dialogue line displayed to the player',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'responses',
      label: 'Responses',
      type: 'DialogueResponse[]',
      value: node.responses,
      description: 'Player response options that lead to other nodes',
      nullable: true,
      category: 'relationships',
    },
    {
      key: 'responseCount',
      label: 'Response Count',
      type: 'number',
      value: node.responses?.length || 0,
      description: 'Number of available responses (computed)',
      nullable: false,
      category: 'metadata',
    },
    {
      key: 'hasConnections',
      label: 'Has Connections',
      type: 'boolean',
      value: node.responses && node.responses.length > 0,
      description: 'Whether this node has outgoing connections',
      nullable: false,
      category: 'metadata',
    },
    {
      key: 'nextNodeIds',
      label: 'Next Node IDs',
      type: 'string[]',
      value: node.responses?.map(r => r.nextNodeId).filter(Boolean) || [],
      description: 'IDs of nodes this node can connect to',
      nullable: false,
      category: 'relationships',
    },
  ]
}

/**
 * Get field definitions for a QuestObjective
 */
export function getQuestObjectiveFields(obj: QuestObjective, index: number): FieldDefinition[] {
  return [
    {
      key: 'index',
      label: 'Objective #',
      type: 'number',
      value: index + 1,
      description: 'Objective sequence number',
      nullable: false,
      category: 'metadata',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'string',
      value: obj.description,
      description: 'What the player needs to do',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'type',
      label: 'Type',
      type: "'kill' | 'collect' | 'talk' | 'explore'",
      value: obj.type,
      description: 'Type of objective action required',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'target',
      label: 'Target',
      type: 'string',
      value: obj.target,
      description: 'The specific target of the objective',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'count',
      label: 'Count',
      type: 'number',
      value: obj.count,
      description: 'How many times the action must be completed',
      nullable: false,
      category: 'basic',
    },
  ]
}

/**
 * Get field definitions for QuestData
 */
export function getQuestDataFields(quest: QuestData): FieldDefinition[] {
  return [
    {
      key: 'title',
      label: 'Title',
      type: 'string',
      value: quest.title,
      description: 'Quest title shown to player',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'string',
      value: quest.description,
      description: 'Brief overview of the quest',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'objectives',
      label: 'Objectives',
      type: 'QuestObjective[]',
      value: quest.objectives,
      description: 'List of objectives player must complete',
      nullable: false,
      category: 'relationships',
    },
    {
      key: 'objectiveCount',
      label: 'Objective Count',
      type: 'number',
      value: quest.objectives.length,
      description: 'Total number of objectives (computed)',
      nullable: false,
      category: 'metadata',
    },
    {
      key: 'rewards',
      label: 'Rewards',
      type: 'QuestRewards',
      value: quest.rewards,
      description: 'Rewards given upon quest completion',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'requirements',
      label: 'Requirements',
      type: 'QuestRequirements',
      value: quest.requirements,
      description: 'Requirements to start this quest',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'npcs',
      label: 'NPCs',
      type: 'string[]',
      value: quest.npcs,
      description: 'NPCs involved in this quest',
      nullable: false,
      category: 'relationships',
    },
    {
      key: 'location',
      label: 'Location',
      type: 'string',
      value: quest.location,
      description: 'Where the quest takes place',
      nullable: false,
      category: 'basic',
    },
    {
      key: 'story',
      label: 'Story',
      type: 'string',
      value: quest.story,
      description: 'Narrative context for the quest',
      nullable: false,
      category: 'basic',
    },
  ]
}

/**
 * Get TypeScript interface definition for a type
 */
export function getTypeDefinition(type: 'dialogue' | 'quest' | 'quest-objective'): string {
  switch (type) {
    case 'dialogue':
      return `interface DialogueNode {
  id: string
  text: string
  responses?: DialogueResponse[]
}

interface DialogueResponse {
  text: string
  nextNodeId?: string
}`

    case 'quest':
      return `interface QuestData {
  title: string
  description: string
  objectives: QuestObjective[]
  rewards: QuestRewards
  requirements: QuestRequirements
  npcs: string[]
  location: string
  story: string
}

interface QuestRewards {
  experience: number
  gold: number
  items: string[]
}

interface QuestRequirements {
  level: number
  previousQuests: string[]
}`

    case 'quest-objective':
      return `interface QuestObjective {
  description: string
  type: 'kill' | 'collect' | 'talk' | 'explore'
  target: string
  count: number
}`

    default:
      return '// Type definition not available'
  }
}
