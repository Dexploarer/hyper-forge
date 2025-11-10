/**
 * useWorldConfigOptions Hook
 * Fetches world configuration and extracts dropdown options for content generation
 */

import { useState, useEffect } from "react";
import {
  worldConfigClient,
  type WorldConfigurationData,
} from "@/services/api/WorldConfigAPIClient";

export interface WorldConfigOptions {
  // NPC options
  npcArchetypes: string[];
  characterClasses: string[];
  races: string[];
  personalityTraits: string[];

  // Quest options
  questTypes: string[];
  difficulties: string[];

  // Lore options
  loreCategories: string[];
  religions: string[];
  magicSystems: string[];
  creatureTypes: string[];
  culturalElements: string[];

  // Loading/error state
  loading: boolean;
  error: string | null;
  config: WorldConfigurationData | null;
}

export function useWorldConfigOptions(
  worldConfigId: string | null,
): WorldConfigOptions {
  const [options, setOptions] = useState<WorldConfigOptions>({
    npcArchetypes: [],
    characterClasses: [],
    races: [],
    personalityTraits: [],
    questTypes: [],
    difficulties: [],
    loreCategories: [],
    religions: [],
    magicSystems: [],
    creatureTypes: [],
    culturalElements: [],
    loading: false,
    error: null,
    config: null,
  });

  useEffect(() => {
    // If no worldConfigId provided, try to get active configuration
    const fetchConfig = async () => {
      if (!worldConfigId) {
        // Try to get active configuration
        try {
          setOptions((prev) => ({ ...prev, loading: true, error: null }));
          const result = await worldConfigClient.getActiveConfiguration();
          if (result.configuration) {
            parseConfigOptions(result.configuration);
          } else {
            // No active config, return empty options
            setOptions((prev) => ({ ...prev, loading: false }));
          }
        } catch (err) {
          console.error("Failed to fetch active world config:", err);
          setOptions((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to load world configuration",
          }));
        }
        return;
      }

      // Fetch specific configuration by ID
      try {
        setOptions((prev) => ({ ...prev, loading: true, error: null }));
        const result = await worldConfigClient.getConfiguration(worldConfigId);
        parseConfigOptions(result.configuration);
      } catch (err) {
        console.error("Failed to fetch world config:", err);
        setOptions((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load world configuration",
        }));
      }
    };

    fetchConfig();
  }, [worldConfigId]);

  const parseConfigOptions = (config: WorldConfigurationData) => {
    // Extract NPC archetypes from multiple sources
    const npcArchetypes: string[] = [];
    config.npcCategories
      ?.filter((cat) => cat.enabled)
      .forEach((cat) => {
        if (cat.archetypes) {
          npcArchetypes.push(...cat.archetypes);
        }
      });

    // Extract character classes
    const characterClasses =
      config.characterClasses
        ?.filter((cls) => cls.enabled)
        .map((cls) => cls.name) || [];

    // Extract races
    const races =
      config.races?.filter((race) => race.enabled).map((race) => race.name) ||
      [];

    // Extract personality traits from NPC categories
    const personalityTraits: string[] = [];
    config.npcCategories
      ?.filter((cat) => cat.enabled)
      .forEach((cat) => {
        if (cat.commonTraits) {
          personalityTraits.push(...cat.commonTraits);
        }
      });

    // Extract quest types
    const questTypes =
      config.questConfig?.types
        ?.filter((type) => type.enabled)
        .map((type) => type.name) || [];

    // Extract difficulties
    const difficulties =
      config.questConfig?.difficulties
        ?.filter((diff) => diff.enabled)
        .map((diff) => diff.name) || [];

    // Extract religions
    const religions =
      config.religions?.filter((rel) => rel.enabled).map((rel) => rel.name) ||
      [];

    // Extract magic systems
    const magicSystems =
      config.magicSystems
        ?.filter((mag) => mag.enabled)
        .map((mag) => mag.name) || [];

    // Extract creature types
    const creatureTypes =
      config.creatureTypes
        ?.filter((creature) => creature.enabled)
        .map((creature) => creature.name) || [];

    // Extract cultural elements
    const culturalElements =
      config.culturalElements
        ?.filter((elem) => elem.enabled)
        .map((elem) => elem.name) || [];

    // Build lore categories from multiple sources
    const loreCategories: string[] = [];
    if (religions.length > 0) loreCategories.push("Religions");
    if (magicSystems.length > 0) loreCategories.push("Magic Systems");
    if (creatureTypes.length > 0) loreCategories.push("Creatures");
    if (culturalElements.length > 0) loreCategories.push("Culture");

    setOptions({
      npcArchetypes: [...new Set(npcArchetypes)], // Remove duplicates
      characterClasses,
      races,
      personalityTraits: [...new Set(personalityTraits)], // Remove duplicates
      questTypes,
      difficulties,
      loreCategories,
      religions,
      magicSystems,
      creatureTypes,
      culturalElements,
      loading: false,
      error: null,
      config,
    });
  };

  return options;
}
