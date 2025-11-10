/**
 * Content Generation Data Model Classes
 * Classes for NPC, quest, dialogue, and lore generation with validation and helper methods
 */

import type {
  ContentType,
  QualityLevel,
  NPCPersonality,
  NPCAppearance,
  NPCDialogue,
  NPCBehavior,
  QuestObjective,
  QuestRewards,
  QuestRequirements,
  DialogueNode,
  DialogueMetadata,
  GeneratedContentMetadata,
} from "./content";

export class NPCData {
  constructor(
    public name: string,
    public archetype: string,
    public personality: NPCPersonality,
    public appearance: NPCAppearance,
    public dialogue: NPCDialogue,
    public behavior: NPCBehavior,
  ) {}

  static create(data: {
    name: string;
    archetype: string;
    personality: NPCPersonality;
    appearance: NPCAppearance;
    dialogue: NPCDialogue;
    behavior: NPCBehavior;
  }): NPCData {
    return new NPCData(
      data.name,
      data.archetype,
      data.personality,
      data.appearance,
      data.dialogue,
      data.behavior,
    );
  }

  get fullDescription(): string {
    return `${this.name}, a ${this.archetype}. ${this.personality.background}`;
  }

  get hasRelationships(): boolean {
    return (
      !!this.behavior.relationships && this.behavior.relationships.length > 0
    );
  }

  get traitCount(): number {
    return this.personality.traits.length;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("NPC name is required");
    }

    if (!this.archetype || this.archetype.trim().length === 0) {
      errors.push("NPC archetype is required");
    }

    if (!this.personality.traits || this.personality.traits.length === 0) {
      errors.push("NPC must have at least one personality trait");
    }

    if (!this.dialogue.greeting) {
      errors.push("NPC must have a greeting dialogue");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      name: this.name,
      archetype: this.archetype,
      personality: this.personality,
      appearance: this.appearance,
      dialogue: this.dialogue,
      behavior: this.behavior,
    };
  }

  static fromJSON(json: {
    name: string;
    archetype: string;
    personality: NPCPersonality;
    appearance: NPCAppearance;
    dialogue: NPCDialogue;
    behavior: NPCBehavior;
  }): NPCData {
    return new NPCData(
      json.name,
      json.archetype,
      json.personality,
      json.appearance,
      json.dialogue,
      json.behavior,
    );
  }
}

export class QuestData {
  constructor(
    public title: string,
    public description: string,
    public objectives: QuestObjective[],
    public rewards: QuestRewards,
    public requirements: QuestRequirements,
    public npcs: string[],
    public location: string,
    public story: string,
  ) {}

  static create(data: {
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: QuestRewards;
    requirements: QuestRequirements;
    npcs: string[];
    location: string;
    story: string;
  }): QuestData {
    return new QuestData(
      data.title,
      data.description,
      data.objectives,
      data.rewards,
      data.requirements,
      data.npcs,
      data.location,
      data.story,
    );
  }

  get objectiveCount(): number {
    return this.objectives.length;
  }

  get totalRewardGold(): number {
    return this.rewards.gold;
  }

  get hasPrerequisites(): boolean {
    return (
      this.requirements.level > 1 || this.requirements.previousQuests.length > 0
    );
  }

  get involvesNPCs(): boolean {
    return this.npcs.length > 0;
  }

  getObjectivesByType(type: "kill" | "collect" | "talk" | "explore") {
    return this.objectives.filter((obj) => obj.type === type);
  }

  getTotalItemsToCollect(): number {
    return this.objectives
      .filter((obj) => obj.type === "collect")
      .reduce((sum, obj) => sum + obj.count, 0);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push("Quest title is required");
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push("Quest description is required");
    }

    if (!this.objectives || this.objectives.length === 0) {
      errors.push("Quest must have at least one objective");
    }

    if (this.requirements.level < 1) {
      errors.push("Quest level requirement must be at least 1");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      title: this.title,
      description: this.description,
      objectives: this.objectives,
      rewards: this.rewards,
      requirements: this.requirements,
      npcs: this.npcs,
      location: this.location,
      story: this.story,
    };
  }

  static fromJSON(json: {
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: QuestRewards;
    requirements: QuestRequirements;
    npcs: string[];
    location: string;
    story: string;
  }): QuestData {
    return new QuestData(
      json.title,
      json.description,
      json.objectives,
      json.rewards,
      json.requirements,
      json.npcs,
      json.location,
      json.story,
    );
  }
}

export class DialogueData {
  constructor(
    public nodes: DialogueNode[],
    public metadata?: DialogueMetadata,
  ) {}

  static create(data: {
    nodes: DialogueNode[];
    metadata?: DialogueMetadata;
  }): DialogueData {
    return new DialogueData(data.nodes, data.metadata);
  }

  get nodeCount(): number {
    return this.nodes.length;
  }

  get hasCharacterInfo(): boolean {
    return !!this.metadata?.characterName;
  }

  getNodeById(id: string): DialogueNode | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  getStartNode(): DialogueNode | undefined {
    return this.nodes[0];
  }

  getResponseCount(nodeId: string): number {
    const node = this.getNodeById(nodeId);
    return node?.responses?.length || 0;
  }

  /**
   * Get all node IDs that are referenced in responses
   */
  getReferencedNodeIds(): Set<string> {
    const referenced = new Set<string>();
    for (const node of this.nodes) {
      if (node.responses) {
        for (const response of node.responses) {
          if (response.nextNodeId) {
            referenced.add(response.nextNodeId);
          }
        }
      }
    }
    return referenced;
  }

  /**
   * Find orphaned nodes (not referenced by any response)
   */
  getOrphanedNodes(): DialogueNode[] {
    const referenced = this.getReferencedNodeIds();
    return this.nodes.filter(
      (node, index) => index > 0 && !referenced.has(node.id),
    );
  }

  /**
   * Find dead-end nodes (no responses)
   */
  getDeadEndNodes(): DialogueNode[] {
    return this.nodes.filter(
      (node) => !node.responses || node.responses.length === 0,
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.nodes || this.nodes.length === 0) {
      errors.push("Dialogue must have at least one node");
    }

    // Check for duplicate node IDs
    const ids = new Set<string>();
    for (const node of this.nodes) {
      if (ids.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      ids.add(node.id);
    }

    // Check for broken references
    const nodeIds = new Set(this.nodes.map((n) => n.id));
    for (const node of this.nodes) {
      if (node.responses) {
        for (const response of node.responses) {
          if (response.nextNodeId && !nodeIds.has(response.nextNodeId)) {
            errors.push(
              `Node ${node.id} references non-existent node: ${response.nextNodeId}`,
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      nodes: this.nodes,
      metadata: this.metadata,
    };
  }

  static fromJSON(json: {
    nodes: DialogueNode[];
    metadata?: DialogueMetadata;
  }): DialogueData {
    return new DialogueData(json.nodes, json.metadata);
  }
}

export class LoreData {
  constructor(
    public title: string,
    public category: string,
    public content: string,
    public summary: string,
    public relatedTopics: string[],
    public timeline?: string,
    public characters?: string[],
  ) {}

  static create(data: {
    title: string;
    category: string;
    content: string;
    summary: string;
    relatedTopics: string[];
    timeline?: string;
    characters?: string[];
  }): LoreData {
    return new LoreData(
      data.title,
      data.category,
      data.content,
      data.summary,
      data.relatedTopics,
      data.timeline,
      data.characters,
    );
  }

  get wordCount(): number {
    return this.content.split(/\s+/).length;
  }

  get hasTimeline(): boolean {
    return !!this.timeline;
  }

  get hasCharacters(): boolean {
    return !!this.characters && this.characters.length > 0;
  }

  get relatedTopicCount(): number {
    return this.relatedTopics.length;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push("Lore title is required");
    }

    if (!this.category || this.category.trim().length === 0) {
      errors.push("Lore category is required");
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push("Lore content is required");
    }

    if (!this.summary || this.summary.trim().length === 0) {
      errors.push("Lore summary is required");
    }

    if (this.wordCount < 10) {
      errors.push("Lore content is too short");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      title: this.title,
      category: this.category,
      content: this.content,
      summary: this.summary,
      relatedTopics: this.relatedTopics,
      timeline: this.timeline,
      characters: this.characters,
    };
  }

  static fromJSON(json: {
    title: string;
    category: string;
    content: string;
    summary: string;
    relatedTopics: string[];
    timeline?: string;
    characters?: string[];
  }): LoreData {
    return new LoreData(
      json.title,
      json.category,
      json.content,
      json.summary,
      json.relatedTopics,
      json.timeline,
      json.characters,
    );
  }
}

export class GeneratedContent {
  constructor(
    public id: string,
    public type: ContentType,
    public name: string,
    public data: NPCData | QuestData | DialogueData | LoreData,
    public metadata: GeneratedContentMetadata,
    public createdAt: Date,
  ) {}

  static create(data: {
    id?: string;
    type: ContentType;
    name: string;
    data: NPCData | QuestData | DialogueData | LoreData;
    metadata: GeneratedContentMetadata;
    createdAt?: Date;
  }): GeneratedContent {
    return new GeneratedContent(
      data.id || crypto.randomUUID(),
      data.type,
      data.name,
      data.data,
      data.metadata,
      data.createdAt || new Date(),
    );
  }

  get isNPC(): boolean {
    return this.type === "npc" && this.data instanceof NPCData;
  }

  get isQuest(): boolean {
    return this.type === "quest" && this.data instanceof QuestData;
  }

  get isDialogue(): boolean {
    return this.type === "dialogue" && this.data instanceof DialogueData;
  }

  get isLore(): boolean {
    return this.type === "lore" && this.data instanceof LoreData;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Content name is required");
    }

    // Validate the nested data
    if (this.data instanceof NPCData) {
      const result = this.data.validate();
      errors.push(...result.errors);
    } else if (this.data instanceof QuestData) {
      const result = this.data.validate();
      errors.push(...result.errors);
    } else if (this.data instanceof DialogueData) {
      const result = this.data.validate();
      errors.push(...result.errors);
    } else if (this.data instanceof LoreData) {
      const result = this.data.validate();
      errors.push(...result.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      data: this.data.toJSON?.() || this.data,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
    };
  }

  static fromJSON(json: {
    id: string;
    type: ContentType;
    name: string;
    data: any;
    metadata: GeneratedContentMetadata;
    createdAt: string | Date;
  }): GeneratedContent {
    let data: NPCData | QuestData | DialogueData | LoreData;

    switch (json.type) {
      case "npc":
        data = NPCData.fromJSON(json.data);
        break;
      case "quest":
        data = QuestData.fromJSON(json.data);
        break;
      case "dialogue":
        data = DialogueData.fromJSON(json.data);
        break;
      case "lore":
        data = LoreData.fromJSON(json.data);
        break;
      default:
        throw new Error(`Unknown content type: ${json.type}`);
    }

    return new GeneratedContent(
      json.id,
      json.type,
      json.name,
      data,
      json.metadata,
      typeof json.createdAt === "string"
        ? new Date(json.createdAt)
        : json.createdAt,
    );
  }
}
