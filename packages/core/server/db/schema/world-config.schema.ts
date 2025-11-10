/**
 * World Configuration Schema
 * Master parameters for AI content generation
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * World Configurations table
 * Master configuration for world parameters that guide AI generation
 */
export const worldConfigurations = pgTable(
  "world_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Basic Info
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    genre: varchar("genre", { length: 100 }).notNull(), // fantasy, sci-fi, modern, etc.

    // Active status
    isActive: boolean("is_active").notNull().default(false),

    // User tracking
    createdBy: varchar("created_by", { length: 255 }),
    walletAddress: varchar("wallet_address", { length: 255 }),

    // Configuration sections stored as JSONB
    races: jsonb("races").$type<WorldRace[]>().notNull().default([]),
    factions: jsonb("factions").$type<WorldFaction[]>().notNull().default([]),
    skills: jsonb("skills").$type<WorldSkill[]>().notNull().default([]),
    npcCategories: jsonb("npc_categories")
      .$type<NPCCategory[]>()
      .notNull()
      .default([]),
    questConfig: jsonb("quest_config").$type<QuestConfiguration>().notNull(),
    itemsConfig: jsonb("items_config").$type<ItemsConfiguration>().notNull(),
    locationsConfig: jsonb("locations_config")
      .$type<LocationsConfiguration>()
      .notNull(),
    economySettings: jsonb("economy_settings")
      .$type<EconomySettings>()
      .notNull(),
    aiPreferences: jsonb("ai_preferences")
      .$type<AIGenerationPreferences>()
      .notNull(),

    // Enhanced Configuration (Optional)
    characterClasses: jsonb("character_classes")
      .$type<CharacterClass[]>()
      .notNull()
      .default([]),
    magicSystems: jsonb("magic_systems")
      .$type<MagicSystem[]>()
      .notNull()
      .default([]),
    creatureTypes: jsonb("creature_types")
      .$type<CreatureType[]>()
      .notNull()
      .default([]),
    religions: jsonb("religions").$type<Religion[]>().notNull().default([]),
    culturalElements: jsonb("cultural_elements")
      .$type<CulturalElement[]>()
      .notNull()
      .default([]),

    // Metadata
    version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),

    // Template info
    isTemplate: boolean("is_template").notNull().default(false),
    templateName: varchar("template_name", { length: 100 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_world_configs_name").on(table.name),
    genreIdx: index("idx_world_configs_genre").on(table.genre),
    activeIdx: index("idx_world_configs_active").on(table.isActive),
    createdByIdx: index("idx_world_configs_created_by").on(table.createdBy),
    templateIdx: index("idx_world_configs_template").on(table.isTemplate),
  }),
);

/**
 * Configuration Change History table
 * Track changes to configurations for versioning
 */
export const configurationHistory = pgTable(
  "configuration_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    configId: uuid("config_id")
      .notNull()
      .references(() => worldConfigurations.id, { onDelete: "cascade" }),

    // Change tracking
    changeType: varchar("change_type", { length: 50 }).notNull(), // created, updated, activated, cloned
    changedBy: varchar("changed_by", { length: 255 }),

    // Store snapshot of config at this point
    snapshot: jsonb("snapshot").notNull(),

    // Change details
    changeDescription: text("change_description"),
    changedFields: jsonb("changed_fields")
      .$type<string[]>()
      .notNull()
      .default([]),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    configIdIdx: index("idx_config_history_config_id").on(table.configId),
    typeIdx: index("idx_config_history_type").on(table.changeType),
  }),
);

// TypeScript Types for JSONB fields
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
  rivals: string[]; // IDs of rival factions
  allies: string[]; // IDs of allied factions
  enabled: boolean;
  createdAt: string;
}

export interface WorldSkill {
  id: string;
  name: string;
  category: "combat" | "magic" | "stealth" | "social" | "crafting";
  description: string;
  prerequisites: string[]; // IDs of prerequisite skills
  tier: number; // 1-5
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

// Enhanced Configuration Types (Optional)
export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  primaryStats: string[]; // e.g., ["strength", "constitution"]
  abilities: string[];
  startingEquipment: string[];
  enabled: boolean;
  createdAt: string;
}

export interface MagicSystem {
  id: string;
  name: string;
  description: string;
  sourceType: string; // e.g., "divine", "arcane", "elemental", "psionic"
  spellCategories: string[];
  restrictions: string[]; // e.g., ["requires focus", "verbal components"]
  enabled: boolean;
  createdAt: string;
}

export interface CreatureType {
  id: string;
  name: string;
  description: string;
  habitat: string; // e.g., "forest", "mountains", "underground"
  dangerLevel: number; // 1-10
  behaviors: string[]; // e.g., ["aggressive", "territorial", "nocturnal"]
  lootTables: string[];
  enabled: boolean;
  createdAt: string;
}

export interface Religion {
  id: string;
  name: string;
  description: string;
  deity: string; // Name of the deity or pantheon
  tenets: string[]; // Core beliefs
  rituals: string[];
  followers: string[]; // Race/faction IDs that follow this religion
  enabled: boolean;
  createdAt: string;
}

export interface CulturalElement {
  id: string;
  name: string;
  type: "tradition" | "festival" | "art" | "language" | "custom" | "taboo";
  description: string;
  prevalence: "rare" | "uncommon" | "common" | "widespread";
  associatedRaces: string[]; // Race IDs
  enabled: boolean;
  createdAt: string;
}

// Type exports
export type WorldConfiguration = typeof worldConfigurations.$inferSelect;
export type NewWorldConfiguration = typeof worldConfigurations.$inferInsert;
export type ConfigurationHistory = typeof configurationHistory.$inferSelect;
export type NewConfigurationHistory = typeof configurationHistory.$inferInsert;
