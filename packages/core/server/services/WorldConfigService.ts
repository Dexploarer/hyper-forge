/**
 * World Configuration Service
 * Manages master parameters for AI content generation
 */

import { db } from "../db";
import {
  worldConfigurations,
  configurationHistory,
  type WorldConfiguration,
  type NewWorldConfiguration,
  type WorldRace,
  type WorldFaction,
  type WorldSkill,
  type NPCCategory,
  type QuestConfiguration,
  type ItemsConfiguration,
  type LocationsConfiguration,
  type EconomySettings,
  type AIGenerationPreferences,
  type CharacterClass,
  type MagicSystem,
  type CreatureType,
  type Religion,
  type CulturalElement,
} from "../db/schema/world-config.schema";
import { eq, desc } from "drizzle-orm";

export class WorldConfigService {
  // ============================================================================
  // Core CRUD Methods (8)
  // ============================================================================

  /**
   * List all configurations with pagination
   */
  async listConfigurations(params: {
    limit?: number;
    offset?: number;
    createdBy?: string;
    includeTemplates?: boolean;
  }): Promise<WorldConfiguration[]> {
    const {
      limit = 50,
      offset = 0,
      createdBy,
      includeTemplates = true,
    } = params;

    try {
      let query = db.select().from(worldConfigurations);

      // Apply filters
      const conditions: any[] = [];
      if (createdBy) {
        conditions.push(eq(worldConfigurations.createdBy, createdBy));
      }
      if (!includeTemplates) {
        conditions.push(eq(worldConfigurations.isTemplate, false));
      }

      if (conditions.length > 0) {
        query = query.where(conditions[0]) as any;
      }

      const results = await query
        .limit(limit)
        .offset(offset)
        .orderBy(desc(worldConfigurations.createdAt));

      return results;
    } catch (error) {
      console.error(
        "[WorldConfigService] Error listing configurations:",
        error,
      );
      // Return empty array instead of throwing - world config is optional
      return [];
    }
  }

  /**
   * Get specific configuration by ID
   */
  async getConfiguration(id: string): Promise<WorldConfiguration | null> {
    try {
      const results = await db
        .select()
        .from(worldConfigurations)
        .where(eq(worldConfigurations.id, id))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error getting configuration ${id}:`,
        error,
      );
      throw new Error("Failed to get configuration");
    }
  }

  /**
   * Get currently active configuration
   */
  async getActiveConfiguration(): Promise<WorldConfiguration | null> {
    try {
      const results = await db
        .select()
        .from(worldConfigurations)
        .where(eq(worldConfigurations.isActive, true))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error(
        "[WorldConfigService] Error getting active configuration:",
        error,
      );
      // Return null instead of throwing - world config is optional
      return null;
    }
  }

  /**
   * Create new configuration with defaults for all JSONB fields
   */
  async createConfiguration(
    data: Omit<
      NewWorldConfiguration,
      "id" | "createdAt" | "updatedAt" | "isActive"
    >,
    createdBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      // Prepare configuration with defaults
      const configData: NewWorldConfiguration = {
        name: data.name,
        description: data.description,
        genre: data.genre,
        isActive: false,
        createdBy: createdBy || data.createdBy,
        walletAddress: data.walletAddress,
        races: data.races || [],
        factions: data.factions || [],
        skills: data.skills || [],
        npcCategories: data.npcCategories || [],
        questConfig: data.questConfig || this.getDefaultQuestConfig(),
        itemsConfig: data.itemsConfig || this.getDefaultItemsConfig(),
        locationsConfig:
          data.locationsConfig || this.getDefaultLocationsConfig(),
        economySettings:
          data.economySettings || this.getDefaultEconomySettings(),
        aiPreferences: data.aiPreferences || this.getDefaultAIPreferences(),
        // Enhanced configuration (optional)
        characterClasses: (data as any).characterClasses || [],
        magicSystems: (data as any).magicSystems || [],
        creatureTypes: (data as any).creatureTypes || [],
        religions: (data as any).religions || [],
        culturalElements: (data as any).culturalElements || [],
        version: data.version || "1.0.0",
        tags: data.tags || [],
        isTemplate: data.isTemplate || false,
        templateName: data.templateName,
      };

      const results = await db
        .insert(worldConfigurations)
        .values(configData)
        .returning();

      const created = results[0];

      // Record change history
      await this.recordChange(
        created.id,
        "created",
        createdBy,
        created,
        "Configuration created",
      );

      console.log(
        `[WorldConfigService] Created configuration: ${created.name}`,
      );
      return created;
    } catch (error) {
      console.error(
        "[WorldConfigService] Error creating configuration:",
        error,
      );
      throw new Error("Failed to create configuration");
    }
  }

  /**
   * Update full configuration
   */
  async updateConfiguration(
    id: string,
    updates: Partial<Omit<NewWorldConfiguration, "id" | "createdAt">>,
    updatedBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      // Get current config to track changes
      const current = await this.getConfiguration(id);
      if (!current) {
        throw new Error("Configuration not found");
      }

      // Track changed fields
      const changedFields = Object.keys(updates).filter(
        (key) => updates[key as keyof typeof updates] !== undefined,
      );

      const results = await db
        .update(worldConfigurations)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(worldConfigurations.id, id))
        .returning();

      const updated = results[0];

      // Record change history
      await this.recordChange(
        id,
        "updated",
        updatedBy,
        updated,
        "Configuration updated",
        changedFields,
      );

      console.log(`[WorldConfigService] Updated configuration: ${id}`);
      return updated;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error updating configuration ${id}:`,
        error,
      );
      throw new Error("Failed to update configuration");
    }
  }

  /**
   * Update specific section only (partial update)
   */
  async updateSection(
    id: string,
    section:
      | "races"
      | "factions"
      | "skills"
      | "npcCategories"
      | "questConfig"
      | "itemsConfig"
      | "locationsConfig"
      | "economySettings"
      | "aiPreferences"
      | "characterClasses"
      | "magicSystems"
      | "creatureTypes"
      | "religions"
      | "culturalElements",
    data: any,
    updatedBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      const results = await db
        .update(worldConfigurations)
        .set({
          [section]: data,
          updatedAt: new Date(),
        })
        .where(eq(worldConfigurations.id, id))
        .returning();

      const updated = results[0];

      // Record change history
      await this.recordChange(
        id,
        "updated",
        updatedBy,
        updated,
        `Section updated: ${section}`,
        [section],
      );

      console.log(
        `[WorldConfigService] Updated section ${section} for config: ${id}`,
      );
      return updated;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error updating section ${section} for ${id}:`,
        error,
      );
      throw new Error("Failed to update section");
    }
  }

  /**
   * Delete configuration (throw error if active)
   */
  async deleteConfiguration(id: string): Promise<void> {
    try {
      const config = await this.getConfiguration(id);
      if (!config) {
        throw new Error("Configuration not found");
      }

      if (config.isActive) {
        throw new Error("Cannot delete active configuration");
      }

      await db
        .delete(worldConfigurations)
        .where(eq(worldConfigurations.id, id));

      console.log(`[WorldConfigService] Deleted configuration: ${id}`);
    } catch (error) {
      console.error(
        `[WorldConfigService] Error deleting configuration ${id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Set configuration as active (deactivate all others first)
   */
  async setActiveConfiguration(
    id: string,
    activatedBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      // First, deactivate all configurations
      await db
        .update(worldConfigurations)
        .set({ isActive: false, updatedAt: new Date() });

      // Then activate the specified one
      const results = await db
        .update(worldConfigurations)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(worldConfigurations.id, id))
        .returning();

      const activated = results[0];

      if (!activated) {
        throw new Error("Configuration not found");
      }

      // Record change history
      await this.recordChange(
        id,
        "activated",
        activatedBy,
        activated,
        "Configuration activated",
      );

      console.log(
        `[WorldConfigService] Activated configuration: ${activated.name}`,
      );
      return activated;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error activating configuration ${id}:`,
        error,
      );
      throw new Error("Failed to activate configuration");
    }
  }

  // ============================================================================
  // Clone & Templates (3 methods)
  // ============================================================================

  /**
   * Clone existing configuration
   */
  async cloneConfiguration(
    sourceId: string,
    newName: string,
    newDescription?: string,
    clonedBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      const source = await this.getConfiguration(sourceId);
      if (!source) {
        throw new Error("Source configuration not found");
      }

      // Create clone with new name/description
      const cloneData: Omit<
        NewWorldConfiguration,
        "id" | "createdAt" | "updatedAt" | "isActive"
      > = {
        name: newName,
        description: newDescription || `Clone of ${source.name}`,
        genre: source.genre,
        createdBy: clonedBy || source.createdBy,
        walletAddress: source.walletAddress,
        races: source.races,
        factions: source.factions,
        skills: source.skills,
        npcCategories: source.npcCategories,
        questConfig: source.questConfig,
        itemsConfig: source.itemsConfig,
        locationsConfig: source.locationsConfig,
        economySettings: source.economySettings,
        aiPreferences: source.aiPreferences,
        // Enhanced configuration (optional)
        characterClasses: source.characterClasses || [],
        magicSystems: source.magicSystems || [],
        creatureTypes: source.creatureTypes || [],
        religions: source.religions || [],
        culturalElements: source.culturalElements || [],
        version: source.version,
        tags: [...source.tags, "cloned"],
        isTemplate: false, // Clones are never templates
        templateName: undefined,
      };

      const results = await db
        .insert(worldConfigurations)
        .values(cloneData as NewWorldConfiguration)
        .returning();

      const cloned = results[0];

      // Record change history
      await this.recordChange(
        cloned.id,
        "cloned",
        clonedBy,
        cloned,
        `Cloned from: ${source.name}`,
      );

      console.log(`[WorldConfigService] Cloned configuration: ${newName}`);
      return cloned;
    } catch (error) {
      console.error(`[WorldConfigService] Error cloning configuration:`, error);
      throw new Error("Failed to clone configuration");
    }
  }

  /**
   * Get all template configurations
   */
  async getTemplates(): Promise<WorldConfiguration[]> {
    try {
      const results = await db
        .select()
        .from(worldConfigurations)
        .where(eq(worldConfigurations.isTemplate, true))
        .orderBy(desc(worldConfigurations.createdAt));

      return results;
    } catch (error) {
      console.error("[WorldConfigService] Error getting templates:", error);
      throw new Error("Failed to get templates");
    }
  }

  /**
   * Create configuration from template
   */
  async createFromTemplate(
    templateId: string,
    name: string,
    description?: string,
    createdBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      const template = await this.getConfiguration(templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      if (!template.isTemplate) {
        throw new Error("Source configuration is not a template");
      }

      // Clone the template
      return await this.cloneConfiguration(
        templateId,
        name,
        description,
        createdBy,
      );
    } catch (error) {
      console.error(
        "[WorldConfigService] Error creating from template:",
        error,
      );
      throw error;
    }
  }

  // ============================================================================
  // Import/Export (2 methods)
  // ============================================================================

  /**
   * Export configuration as JSON (remove sensitive fields)
   */
  async exportConfiguration(id: string): Promise<any> {
    try {
      const config = await this.getConfiguration(id);
      if (!config) {
        throw new Error("Configuration not found");
      }

      // Remove sensitive/meta fields
      const {
        id: _,
        createdAt,
        updatedAt,
        walletAddress,
        ...exportData
      } = config;

      return exportData;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error exporting configuration ${id}:`,
        error,
      );
      throw new Error("Failed to export configuration");
    }
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(
    jsonData: any,
    name: string,
    importedBy?: string,
  ): Promise<WorldConfiguration> {
    try {
      // Validate required fields
      if (!jsonData.genre) {
        throw new Error("Import data missing required field: genre");
      }

      // Create configuration from import data
      const importData: Omit<
        NewWorldConfiguration,
        "id" | "createdAt" | "updatedAt" | "isActive"
      > = {
        name,
        description: jsonData.description || "Imported configuration",
        genre: jsonData.genre,
        createdBy: importedBy,
        walletAddress: undefined,
        races: jsonData.races || [],
        factions: jsonData.factions || [],
        skills: jsonData.skills || [],
        npcCategories: jsonData.npcCategories || [],
        questConfig: jsonData.questConfig || this.getDefaultQuestConfig(),
        itemsConfig: jsonData.itemsConfig || this.getDefaultItemsConfig(),
        locationsConfig:
          jsonData.locationsConfig || this.getDefaultLocationsConfig(),
        economySettings:
          jsonData.economySettings || this.getDefaultEconomySettings(),
        aiPreferences: jsonData.aiPreferences || this.getDefaultAIPreferences(),
        // Enhanced configuration (optional)
        characterClasses: jsonData.characterClasses || [],
        magicSystems: jsonData.magicSystems || [],
        creatureTypes: jsonData.creatureTypes || [],
        religions: jsonData.religions || [],
        culturalElements: jsonData.culturalElements || [],
        version: jsonData.version || "1.0.0",
        tags: [...(jsonData.tags || []), "imported"],
        isTemplate: false,
        templateName: undefined,
      };

      const results = await db
        .insert(worldConfigurations)
        .values(importData as NewWorldConfiguration)
        .returning();

      const imported = results[0];

      // Record change history
      await this.recordChange(
        imported.id,
        "created",
        importedBy,
        imported,
        "Configuration imported from JSON",
      );

      console.log(`[WorldConfigService] Imported configuration: ${name}`);
      return imported;
    } catch (error) {
      console.error(
        "[WorldConfigService] Error importing configuration:",
        error,
      );
      throw new Error("Failed to import configuration");
    }
  }

  // ============================================================================
  // Validation (1 method)
  // ============================================================================

  /**
   * Validate configuration and return errors/warnings
   */
  async validateConfiguration(id: string): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: "error" | "warning";
    }>;
  }> {
    try {
      const config = await this.getConfiguration(id);
      if (!config) {
        throw new Error("Configuration not found");
      }

      const errors: Array<{
        field: string;
        message: string;
        severity: "error" | "warning";
      }> = [];

      // Check if no races enabled
      const enabledRaces = config.races.filter((r) => r.enabled);
      if (enabledRaces.length === 0) {
        errors.push({
          field: "races",
          message:
            "No races are enabled. Enable at least one race for character creation.",
          severity: "warning",
        });
      }

      // Check if no factions enabled
      const enabledFactions = config.factions.filter((f) => f.enabled);
      if (enabledFactions.length === 0) {
        errors.push({
          field: "factions",
          message:
            "No factions are enabled. Enable at least one faction for world dynamics.",
          severity: "warning",
        });
      }

      // Check faction rivals/allies exist
      config.factions.forEach((faction) => {
        if (faction.enabled) {
          const factionIds = config.factions.map((f) => f.id);

          faction.rivals.forEach((rivalId) => {
            if (!factionIds.includes(rivalId)) {
              errors.push({
                field: "factions",
                message: `Faction "${faction.name}" references non-existent rival: ${rivalId}`,
                severity: "error",
              });
            }
          });

          faction.allies.forEach((allyId) => {
            if (!factionIds.includes(allyId)) {
              errors.push({
                field: "factions",
                message: `Faction "${faction.name}" references non-existent ally: ${allyId}`,
                severity: "error",
              });
            }
          });
        }
      });

      // Check skill prerequisites exist
      const skillIds = config.skills.map((s) => s.id);
      config.skills.forEach((skill) => {
        if (skill.enabled) {
          skill.prerequisites.forEach((prereqId) => {
            if (!skillIds.includes(prereqId)) {
              errors.push({
                field: "skills",
                message: `Skill "${skill.name}" references non-existent prerequisite: ${prereqId}`,
                severity: "error",
              });
            }
          });
        }
      });

      const valid = errors.filter((e) => e.severity === "error").length === 0;

      return { valid, errors };
    } catch (error) {
      console.error(
        `[WorldConfigService] Error validating configuration ${id}:`,
        error,
      );
      throw new Error("Failed to validate configuration");
    }
  }

  // ============================================================================
  // AI Context Building (1 method)
  // ============================================================================

  /**
   * Build comprehensive AI-ready context string
   */
  async buildAIContext(
    id: string,
  ): Promise<{ context: string; sections: Record<string, string> }> {
    try {
      const config = await this.getConfiguration(id);
      if (!config) {
        throw new Error("Configuration not found");
      }

      const sections: Record<string, string> = {};

      // Races
      const enabledRaces = config.races.filter((r) => r.enabled);
      sections.races = enabledRaces.length
        ? `Available Races:\n${enabledRaces
            .map(
              (r) =>
                `- ${r.name}: ${r.description}\n  Traits: ${r.traits.join(", ")}\n  Culture: ${r.culturalBackground}`,
            )
            .join("\n\n")}`
        : "No races defined.";

      // Factions
      const enabledFactions = config.factions.filter((f) => f.enabled);
      sections.factions = enabledFactions.length
        ? `Active Factions:\n${enabledFactions
            .map(
              (f) =>
                `- ${f.name} (${f.alignment}): ${f.description}\n  Goals: ${f.goals.join(", ")}`,
            )
            .join("\n\n")}`
        : "No factions defined.";

      // Skills (grouped by category)
      const enabledSkills = config.skills.filter((s) => s.enabled);
      const skillsByCategory = this.groupSkillsByCategory(enabledSkills);
      sections.skills = Object.keys(skillsByCategory).length
        ? `Available Skills:\n${Object.entries(skillsByCategory)
            .map(
              ([category, skills]) =>
                `${category.toUpperCase()}:\n${skills.map((s) => `  - ${s.name} (Tier ${s.tier}): ${s.description}`).join("\n")}`,
            )
            .join("\n\n")}`
        : "No skills defined.";

      // NPC Categories
      sections.npcCategories = config.npcCategories.length
        ? `NPC Categories:\n${config.npcCategories
            .map(
              (c) =>
                `- ${c.name}\n  Archetypes: ${c.archetypes.join(", ")}\n  Typical Roles: ${c.typicalRoles.join(", ")}`,
            )
            .join("\n\n")}`
        : "No NPC categories defined.";

      // Quest Config
      sections.questConfig = `Quest Configuration:
Types: ${config.questConfig.types
        .filter((t) => t.enabled)
        .map((t) => t.name)
        .join(", ")}
Difficulties: ${config.questConfig.difficulties
        .filter((d) => d.enabled)
        .map((d) => d.name)
        .join(", ")}
Objective Types: ${config.questConfig.objectiveTypes.join(", ")}
Default Rewards: ${config.questConfig.defaultRewards.experienceBase} XP, ${config.questConfig.defaultRewards.goldBase} Gold`;

      // Items Config
      sections.itemsConfig = `Items Configuration:
Categories: ${config.itemsConfig.categories
        .filter((c) => c.enabled)
        .map((c) => c.name)
        .join(", ")}
Rarities: ${config.itemsConfig.rarities
        .filter((r) => r.enabled)
        .map((r) => r.name)
        .join(", ")}
Enchantments: ${config.itemsConfig.enchantments
        .filter((e) => e.enabled)
        .map((e) => e.name)
        .join(", ")}`;

      // Locations Config
      sections.locationsConfig = `Locations Configuration:
Biomes: ${config.locationsConfig.biomes
        .filter((b) => b.enabled)
        .map((b) => b.name)
        .join(", ")}
Settlement Types: ${config.locationsConfig.settlementTypes
        .filter((s) => s.enabled)
        .map((s) => s.name)
        .join(", ")}
Dungeon Types: ${config.locationsConfig.dungeonTypes
        .filter((d) => d.enabled)
        .map((d) => d.name)
        .join(", ")}`;

      // Economy Settings
      sections.economySettings = `Economy Settings:
Currency: ${config.economySettings.currencyName}
Trading: ${config.economySettings.tradingEnabled ? "Enabled" : "Disabled"}
Bartering: ${config.economySettings.barterEnabled ? "Enabled" : "Disabled"}
Inflation Rate: ${config.economySettings.inflationRate}`;

      // AI Preferences
      sections.aiPreferences = `AI Generation Preferences:
Quality: ${config.aiPreferences.defaultQuality}
Narrative Tone: ${config.aiPreferences.toneAndStyle.narrative}
Dialogue Formality: ${config.aiPreferences.toneAndStyle.dialogueFormality}
Detail Level: ${config.aiPreferences.toneAndStyle.detailLevel}
Violence Level: ${config.aiPreferences.contentGuidelines.violenceLevel}
Magic Prevalence: ${config.aiPreferences.contentGuidelines.magicPrevalence}
Technology Level: ${config.aiPreferences.contentGuidelines.technologyLevel}`;

      // Enhanced Configuration (Optional sections)
      if (config.characterClasses && config.characterClasses.length > 0) {
        const enabledClasses = config.characterClasses.filter((c) => c.enabled);
        if (enabledClasses.length > 0) {
          sections.characterClasses = `Character Classes:\n${enabledClasses
            .map(
              (c) =>
                `- ${c.name}: ${c.description}\n  Primary Stats: ${c.primaryStats.join(", ")}\n  Abilities: ${c.abilities.join(", ")}`,
            )
            .join("\n\n")}`;
        }
      }

      if (config.magicSystems && config.magicSystems.length > 0) {
        const enabledSystems = config.magicSystems.filter((m) => m.enabled);
        if (enabledSystems.length > 0) {
          sections.magicSystems = `Magic Systems:\n${enabledSystems
            .map(
              (m) =>
                `- ${m.name} (${m.sourceType}): ${m.description}\n  Categories: ${m.spellCategories.join(", ")}`,
            )
            .join("\n\n")}`;
        }
      }

      if (config.creatureTypes && config.creatureTypes.length > 0) {
        const enabledCreatures = config.creatureTypes.filter((c) => c.enabled);
        if (enabledCreatures.length > 0) {
          sections.creatureTypes = `Creature Types:\n${enabledCreatures
            .map(
              (c) =>
                `- ${c.name} (Danger Level ${c.dangerLevel}): ${c.description}\n  Habitat: ${c.habitat}\n  Behaviors: ${c.behaviors.join(", ")}`,
            )
            .join("\n\n")}`;
        }
      }

      if (config.religions && config.religions.length > 0) {
        const enabledReligions = config.religions.filter((r) => r.enabled);
        if (enabledReligions.length > 0) {
          sections.religions = `Religions:\n${enabledReligions
            .map(
              (r) =>
                `- ${r.name} (${r.deity}): ${r.description}\n  Tenets: ${r.tenets.join(", ")}`,
            )
            .join("\n\n")}`;
        }
      }

      if (config.culturalElements && config.culturalElements.length > 0) {
        const enabledElements = config.culturalElements.filter(
          (c) => c.enabled,
        );
        if (enabledElements.length > 0) {
          sections.culturalElements = `Cultural Elements:\n${enabledElements
            .map(
              (c) =>
                `- ${c.name} (${c.type}, ${c.prevalence}): ${c.description}`,
            )
            .join("\n")}`;
        }
      }

      // Build full context
      const context = `World Configuration: ${config.name}
Genre: ${config.genre}
Description: ${config.description}

${Object.values(sections).join("\n\n")}

Use this world configuration as the foundation for all generated content. Ensure consistency with these parameters.`;

      return { context, sections };
    } catch (error) {
      console.error(
        `[WorldConfigService] Error building AI context for ${id}:`,
        error,
      );
      throw new Error("Failed to build AI context");
    }
  }

  // ============================================================================
  // History (2 methods)
  // ============================================================================

  /**
   * Get configuration change history
   */
  async getConfigurationHistory(
    configId: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const results = await db
        .select()
        .from(configurationHistory)
        .where(eq(configurationHistory.configId, configId))
        .orderBy(desc(configurationHistory.createdAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error(
        `[WorldConfigService] Error getting history for ${configId}:`,
        error,
      );
      throw new Error("Failed to get configuration history");
    }
  }

  /**
   * Record configuration change (private helper)
   */
  private async recordChange(
    configId: string,
    changeType: string,
    changedBy: string | undefined,
    snapshot: any,
    description?: string,
    changedFields?: string[],
  ): Promise<void> {
    try {
      await db.insert(configurationHistory).values({
        configId,
        changeType,
        changedBy: changedBy || "system",
        snapshot,
        changeDescription: description,
        changedFields: changedFields || [],
      });
    } catch (error) {
      console.error("[WorldConfigService] Error recording change:", error);
      // Don't throw - history recording is non-critical
    }
  }

  // ============================================================================
  // Default Factories (5 private methods)
  // ============================================================================

  private getDefaultQuestConfig(): QuestConfiguration {
    return {
      types: [
        {
          id: "main_story",
          name: "Main Story",
          description: "Critical quests that advance the main storyline",
          enabled: true,
        },
        {
          id: "side_quest",
          name: "Side Quest",
          description: "Optional quests for additional rewards and lore",
          enabled: true,
        },
      ],
      difficulties: [
        {
          id: "easy",
          name: "Easy",
          levelRange: { min: 1, max: 10 },
          rewardMultiplier: 1.0,
          enabled: true,
        },
        {
          id: "normal",
          name: "Normal",
          levelRange: { min: 5, max: 20 },
          rewardMultiplier: 1.5,
          enabled: true,
        },
      ],
      objectiveTypes: ["kill", "collect", "talk", "explore"],
      defaultRewards: {
        experienceBase: 100,
        goldBase: 50,
      },
    };
  }

  private getDefaultItemsConfig(): ItemsConfiguration {
    return {
      categories: [
        {
          id: "weapons",
          name: "Weapons",
          subcategories: ["sword", "bow", "staff", "dagger"],
          enabled: true,
        },
      ],
      rarities: [
        {
          id: "common",
          name: "Common",
          dropChance: 0.6,
          statMultiplier: 1.0,
          enabled: true,
        },
      ],
      enchantments: [],
    };
  }

  private getDefaultLocationsConfig(): LocationsConfiguration {
    return {
      biomes: [
        {
          id: "forest",
          name: "Forest",
          climate: "Temperate",
          terrain: ["trees", "hills", "streams"],
          dangerLevel: 1,
          enabled: true,
        },
      ],
      settlementTypes: [
        {
          id: "village",
          name: "Village",
          populationRange: { min: 50, max: 500 },
          commonBuildings: ["inn", "blacksmith", "general_store"],
          enabled: true,
        },
      ],
      dungeonTypes: [],
    };
  }

  private getDefaultEconomySettings(): EconomySettings {
    return {
      currencyName: "Gold",
      priceRanges: {
        consumables: { min: 1, max: 50 },
        equipment: { min: 10, max: 1000 },
        services: { min: 5, max: 500 },
        housing: { min: 100, max: 10000 },
      },
      tradingEnabled: true,
      barterEnabled: false,
      inflationRate: 0.0,
    };
  }

  private getDefaultAIPreferences(): AIGenerationPreferences {
    return {
      defaultQuality: "balanced",
      toneAndStyle: {
        narrative: "serious",
        dialogueFormality: "mixed",
        detailLevel: "moderate",
      },
      contentGuidelines: {
        violenceLevel: "moderate",
        magicPrevalence: "common",
        technologyLevel: "medieval",
      },
      generationConstraints: {
        maxNPCsPerLocation: 10,
        maxQuestChainLength: 5,
        minQuestObjectives: 1,
        maxQuestObjectives: 5,
      },
    };
  }

  // ============================================================================
  // Helper Methods (1 private method)
  // ============================================================================

  private groupSkillsByCategory(
    skills: WorldSkill[],
  ): Record<string, WorldSkill[]> {
    const grouped: Record<string, WorldSkill[]> = {};

    skills.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });

    return grouped;
  }
}
