/**
 * World Configuration API Client
 * Client for managing world configurations, templates, and AI context
 */

import { apiFetch } from "@/utils/api";

export interface WorldConfigurationData {
  id: string;
  name: string;
  description: string;
  genre: string;
  isActive: boolean;
  createdBy: string | null;
  walletAddress: string | null;
  races: WorldRace[];
  factions: WorldFaction[];
  skills: WorldSkill[];
  npcCategories: NPCCategory[];
  questConfig: QuestConfiguration;
  itemsConfig: ItemsConfiguration;
  locationsConfig: LocationsConfiguration;
  economySettings: EconomySettings;
  aiPreferences: AIGenerationPreferences;
  characterClasses: CharacterClass[];
  magicSystems: MagicSystem[];
  creatureTypes: CreatureType[];
  religions: Religion[];
  culturalElements: CulturalElement[];
  version: string;
  tags: string[];
  isTemplate: boolean;
  templateName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldRace {
  id: string;
  name: string;
  description: string;
  traits: string[];
  culturalBackground: string;
  enabled: boolean;
  createdAt: string;
}

export interface WorldFaction {
  id: string;
  name: string;
  description: string;
  alignment: "good" | "neutral" | "evil";
  goals: string[];
  rivals: string[];
  allies: string[];
  enabled: boolean;
  createdAt: string;
}

export interface WorldSkill {
  id: string;
  name: string;
  category: "combat" | "magic" | "stealth" | "social" | "crafting";
  description: string;
  prerequisites: string[];
  tier: number;
  enabled: boolean;
  createdAt: string;
}

export interface NPCCategory {
  id: string;
  name: string;
  archetypes: string[];
  commonTraits: string[];
  typicalRoles: string[];
  enabled: boolean;
}

export interface QuestConfiguration {
  types: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  difficulties: Array<{
    id: string;
    name: string;
    levelRange: { min: number; max: number };
    rewardMultiplier: number;
    enabled: boolean;
  }>;
  objectiveTypes: string[];
  defaultRewards: {
    experienceBase: number;
    goldBase: number;
  };
}

export interface ItemsConfiguration {
  categories: Array<{
    id: string;
    name: string;
    subcategories: string[];
    enabled: boolean;
  }>;
  rarities: Array<{
    id: string;
    name: string;
    dropChance: number;
    statMultiplier: number;
    enabled: boolean;
  }>;
  enchantments: Array<{
    id: string;
    name: string;
    effect: string;
    tier: number;
    enabled: boolean;
  }>;
}

export interface LocationsConfiguration {
  biomes: Array<{
    id: string;
    name: string;
    climate: string;
    terrain: string[];
    dangerLevel: number;
    enabled: boolean;
  }>;
  settlementTypes: Array<{
    id: string;
    name: string;
    populationRange: { min: number; max: number };
    commonBuildings: string[];
    enabled: boolean;
  }>;
  dungeonTypes: Array<{
    id: string;
    name: string;
    themes: string[];
    difficultyRange: { min: number; max: number };
    enabled: boolean;
  }>;
}

export interface EconomySettings {
  currencyName: string;
  priceRanges: {
    consumables: { min: number; max: number };
    equipment: { min: number; max: number };
    services: { min: number; max: number };
    housing: { min: number; max: number };
  };
  tradingEnabled: boolean;
  barterEnabled: boolean;
  inflationRate: number;
}

export interface AIGenerationPreferences {
  defaultQuality: "quality" | "speed" | "balanced";
  toneAndStyle: {
    narrative: "dark" | "lighthearted" | "serious" | "humorous" | "epic";
    dialogueFormality: "formal" | "casual" | "mixed";
    detailLevel: "minimal" | "moderate" | "verbose";
  };
  contentGuidelines: {
    violenceLevel: "none" | "mild" | "moderate" | "high";
    magicPrevalence: "none" | "rare" | "common" | "ubiquitous";
    technologyLevel:
      | "primitive"
      | "medieval"
      | "renaissance"
      | "industrial"
      | "modern"
      | "futuristic";
  };
  generationConstraints: {
    maxNPCsPerLocation: number;
    maxQuestChainLength: number;
    minQuestObjectives: number;
    maxQuestObjectives: number;
  };
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  primaryStats: string[];
  abilities: string[];
  startingEquipment: string[];
  enabled: boolean;
  createdAt: string;
}

export interface MagicSystem {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  spellCategories: string[];
  restrictions: string[];
  enabled: boolean;
  createdAt: string;
}

export interface CreatureType {
  id: string;
  name: string;
  description: string;
  habitat: string;
  dangerLevel: number;
  behaviors: string[];
  lootTables: string[];
  enabled: boolean;
  createdAt: string;
}

export interface Religion {
  id: string;
  name: string;
  description: string;
  deity: string;
  tenets: string[];
  rituals: string[];
  followers: string[];
  enabled: boolean;
  createdAt: string;
}

export interface CulturalElement {
  id: string;
  name: string;
  type: "tradition" | "festival" | "art" | "language" | "custom" | "taboo";
  description: string;
  prevalence: "rare" | "uncommon" | "common" | "widespread";
  associatedRaces: string[];
  enabled: boolean;
  createdAt: string;
}

export interface CreateWorldConfigParams {
  name: string;
  description: string;
  genre: string;
  races?: WorldRace[];
  factions?: WorldFaction[];
  skills?: WorldSkill[];
  npcCategories?: NPCCategory[];
  questConfig?: QuestConfiguration;
  itemsConfig?: ItemsConfiguration;
  locationsConfig?: LocationsConfiguration;
  economySettings?: EconomySettings;
  aiPreferences?: AIGenerationPreferences;
  characterClasses?: CharacterClass[];
  magicSystems?: MagicSystem[];
  creatureTypes?: CreatureType[];
  religions?: Religion[];
  culturalElements?: CulturalElement[];
  tags?: string[];
  isTemplate?: boolean;
  templateName?: string;
}

export interface UpdateWorldConfigParams {
  name?: string;
  description?: string;
  genre?: string;
  isActive?: boolean;
  races?: WorldRace[];
  factions?: WorldFaction[];
  skills?: WorldSkill[];
  npcCategories?: NPCCategory[];
  questConfig?: QuestConfiguration;
  itemsConfig?: ItemsConfiguration;
  locationsConfig?: LocationsConfiguration;
  economySettings?: EconomySettings;
  aiPreferences?: AIGenerationPreferences;
  characterClasses?: CharacterClass[];
  magicSystems?: MagicSystem[];
  creatureTypes?: CreatureType[];
  religions?: Religion[];
  culturalElements?: CulturalElement[];
  tags?: string[];
  isTemplate?: boolean;
  templateName?: string;
}

export interface AIContextResponse {
  context: string;
  configId: string;
  configName: string;
  sections: {
    races: string;
    factions: string;
    skills: string;
    quests: string;
    items: string;
    locations: string;
    economy: string;
    ai: string;
    characterClasses?: string;
    magicSystems?: string;
    creatureTypes?: string;
    religions?: string;
    culturalElements?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  warnings: Array<{
    field: string;
    message: string;
    severity: "warning" | "error";
  }>;
}

const API_BASE = "/api/world-config";

export class WorldConfigAPIClient {
  // ==================== List & Get ====================

  /**
   * List all world configurations
   * Returns empty array if error occurs (world config is optional)
   */
  async listConfigurations(params?: {
    limit?: number;
    offset?: number;
    includeTemplates?: boolean;
  }): Promise<{
    success: boolean;
    configs: WorldConfigurationData[];
    count: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set("limit", params.limit.toString());
      if (params?.offset) queryParams.set("offset", params.offset.toString());
      if (params?.includeTemplates !== undefined) {
        queryParams.set("includeTemplates", params.includeTemplates.toString());
      }

      const url = `${API_BASE}${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await apiFetch(url);

      if (!response.ok) {
        // World config is optional - return empty array instead of throwing
        console.warn(
          `[WorldConfigAPIClient] Failed to list configurations: ${response.statusText}`,
        );
        return {
          success: true,
          configs: [],
          count: 0,
        };
      }

      const data = await response.json();
      // Handle both 'configs' and 'configurations' field names for backwards compatibility
      return {
        success: data.success,
        configs: data.configs || data.configurations || [],
        count: data.count || (data.configs || data.configurations || []).length,
      };
    } catch (error) {
      // World config is optional - return empty array instead of throwing
      console.warn(
        "[WorldConfigAPIClient] Error listing configurations:",
        error,
      );
      return {
        success: true,
        configs: [],
        count: 0,
      };
    }
  }

  /**
   * Get a specific configuration by ID
   */
  async getConfiguration(
    id: string,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get the active configuration
   * Returns null if no active configuration exists (this is optional)
   */
  async getActiveConfiguration(): Promise<{
    success: boolean;
    config: WorldConfigurationData | null;
  }> {
    try {
      const response = await apiFetch(`${API_BASE}/active`);

      if (!response.ok) {
        // World config is optional - return null instead of throwing
        console.warn(
          `[WorldConfigAPIClient] Failed to get active configuration: ${response.statusText}`,
        );
        return {
          success: true,
          config: null,
        };
      }

      const data = await response.json();
      // Handle both 'config' and 'configuration' field names for backwards compatibility
      return {
        success: data.success,
        config: data.config || data.configuration || null,
      };
    } catch (error) {
      // World config is optional - return null instead of throwing
      console.warn(
        "[WorldConfigAPIClient] Error fetching active configuration:",
        error,
      );
      return {
        success: true,
        config: null,
      };
    }
  }

  // ==================== Create & Update ====================

  /**
   * Create a new world configuration
   */
  async createConfiguration(
    data: CreateWorldConfigParams,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing configuration
   */
  async updateConfiguration(
    id: string,
    data: UpdateWorldConfigParams,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a specific section of configuration
   */
  async updateSection(
    id: string,
    section: string,
    data: any,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/${id}/${section}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update section: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a configuration
   */
  async deleteConfiguration(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_BASE}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Activation ====================

  /**
   * Activate a configuration
   */
  async activateConfiguration(
    id: string,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/${id}/activate`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to activate configuration: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  // ==================== Validation & AI Context ====================

  /**
   * Validate a configuration
   */
  async validateConfiguration(id: string): Promise<ValidationResult> {
    const response = await apiFetch(`${API_BASE}/${id}/validate`);

    if (!response.ok) {
      throw new Error(
        `Failed to validate configuration: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Build AI context from configuration
   */
  async buildAIContext(id: string): Promise<AIContextResponse> {
    const response = await apiFetch(`${API_BASE}/${id}/ai-context`);

    if (!response.ok) {
      throw new Error(`Failed to build AI context: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Templates ====================

  /**
   * List available templates
   */
  async listTemplates(): Promise<{
    success: boolean;
    templates: WorldConfigurationData[];
  }> {
    const response = await apiFetch(`${API_BASE}/templates/list`);

    if (!response.ok) {
      throw new Error(`Failed to list templates: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create configuration from template
   */
  async createFromTemplate(
    templateId: string,
    customizations?: Partial<CreateWorldConfigParams>,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/from-template/${templateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customizations || {}),
    });

    if (!response.ok) {
      throw new Error(`Failed to create from template: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Clone ====================

  /**
   * Clone an existing configuration
   */
  async cloneConfiguration(
    id: string,
    newName?: string,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: id, newName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to clone configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Import/Export ====================

  /**
   * Export configuration as JSON
   */
  async exportConfiguration(
    id: string,
  ): Promise<{ success: boolean; data: any; filename: string }> {
    const response = await apiFetch(`${API_BASE}/export/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to export configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(
    data: any,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const response = await apiFetch(`${API_BASE}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`Failed to import configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== History ====================

  /**
   * Get configuration change history
   */
  async getHistory(
    id: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    success: boolean;
    history: Array<{
      id: string;
      configId: string;
      changeType: string;
      changedBy: string | null;
      snapshot: any;
      changeDescription: string | null;
      changedFields: string[];
      createdAt: Date;
    }>;
  }> {
    const response = await apiFetch(
      `${API_BASE}/${id}/history?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Sub-Resource Management ====================

  /**
   * Add a race to configuration
   */
  async addRace(
    id: string,
    race: Omit<WorldRace, "id" | "createdAt">,
  ): Promise<{ success: boolean; race: WorldRace }> {
    const response = await apiFetch(`${API_BASE}/${id}/races`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(race),
    });

    if (!response.ok) {
      throw new Error(`Failed to add race: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a race
   */
  async updateRace(
    configId: string,
    raceId: string,
    updates: Partial<WorldRace>,
  ): Promise<{ success: boolean; race: WorldRace }> {
    const response = await apiFetch(`${API_BASE}/${configId}/races/${raceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update race: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a race
   */
  async deleteRace(
    configId: string,
    raceId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_BASE}/${configId}/races/${raceId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete race: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Add a faction to configuration
   */
  async addFaction(
    id: string,
    faction: Omit<WorldFaction, "id" | "createdAt">,
  ): Promise<{ success: boolean; faction: WorldFaction }> {
    const response = await apiFetch(`${API_BASE}/${id}/factions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faction),
    });

    if (!response.ok) {
      throw new Error(`Failed to add faction: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a faction
   */
  async updateFaction(
    configId: string,
    factionId: string,
    updates: Partial<WorldFaction>,
  ): Promise<{ success: boolean; faction: WorldFaction }> {
    const response = await apiFetch(
      `${API_BASE}/${configId}/factions/${factionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update faction: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a faction
   */
  async deleteFaction(
    configId: string,
    factionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(
      `${API_BASE}/${configId}/factions/${factionId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete faction: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Add a skill to configuration
   */
  async addSkill(
    id: string,
    skill: Omit<WorldSkill, "id" | "createdAt">,
  ): Promise<{ success: boolean; skill: WorldSkill }> {
    const response = await apiFetch(`${API_BASE}/${id}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(skill),
    });

    if (!response.ok) {
      throw new Error(`Failed to add skill: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a skill
   */
  async updateSkill(
    configId: string,
    skillId: string,
    updates: Partial<WorldSkill>,
  ): Promise<{ success: boolean; skill: WorldSkill }> {
    const response = await apiFetch(
      `${API_BASE}/${configId}/skills/${skillId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update skill: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete a skill
   */
  async deleteSkill(
    configId: string,
    skillId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(
      `${API_BASE}/${configId}/skills/${skillId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete skill: ${response.statusText}`);
    }

    return await response.json();
  }

  // ==================== Helper Methods ====================

  /**
   * Download exported configuration as file
   */
  async downloadConfiguration(id: string): Promise<void> {
    const result = await this.exportConfiguration(id);
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Upload and import configuration from file
   */
  async uploadConfiguration(
    file: File,
  ): Promise<{ success: boolean; configuration: WorldConfigurationData }> {
    const text = await file.text();
    const data = JSON.parse(text);
    return await this.importConfiguration(data);
  }
}

// Export singleton instance
export const worldConfigClient = new WorldConfigAPIClient();
