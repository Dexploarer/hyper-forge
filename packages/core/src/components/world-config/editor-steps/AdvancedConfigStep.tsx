import { Settings, Package, MapPin, DollarSign, Sparkles } from "lucide-react";
import React, { useState } from "react";

import { Button, Input, Textarea } from "@/components/common";

interface AdvancedConfigStepProps {
  data: any;
  onChange: (data: any) => void;
}

export const AdvancedConfigStep: React.FC<AdvancedConfigStepProps> = ({
  data,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    "items" | "locations" | "economy" | "ai"
  >("items");

  // Initialize defaults
  const itemsConfig = data.itemsConfig || {
    categories: [],
    rarities: [],
    enchantments: [],
  };

  const locationsConfig = data.locationsConfig || {
    biomes: [],
    settlementTypes: [],
    dungeonTypes: [],
  };

  const economySettings = data.economySettings || {
    currencyName: "Gold",
    priceRanges: {
      consumables: { min: 1, max: 50 },
      equipment: { min: 10, max: 1000 },
      services: { min: 5, max: 500 },
      housing: { min: 100, max: 10000 },
    },
    tradingEnabled: true,
    barterEnabled: false,
    inflationRate: 0,
  };

  const aiPreferences = data.aiPreferences || {
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

  const tabs = [
    { id: "items", label: "Items", icon: Package },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "economy", label: "Economy", icon: DollarSign },
    { id: "ai", label: "AI Preferences", icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">
          Advanced Configuration
        </h3>
        <p className="text-sm text-text-secondary">
          Configure items, locations, economy, and AI generation preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-primary">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "items" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Items configuration is managed through the backend defaults.
              Categories, rarities, and enchantments are automatically
              configured based on your genre selection.
            </p>
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <p className="text-xs text-text-tertiary">
                Current genre:{" "}
                <span className="text-text-primary">
                  {data.genre || "Not set"}
                </span>
              </p>
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Locations configuration is managed through the backend defaults.
              Biomes, settlement types, and dungeon types are automatically
              configured based on your genre selection.
            </p>
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <p className="text-xs text-text-tertiary">
                Current genre:{" "}
                <span className="text-text-primary">
                  {data.genre || "Not set"}
                </span>
              </p>
            </div>
          </div>
        )}

        {activeTab === "economy" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Currency Name
              </label>
              <Input
                value={economySettings.currencyName}
                onChange={(e) =>
                  onChange({
                    ...data,
                    economySettings: {
                      ...economySettings,
                      currencyName: e.target.value,
                    },
                  })
                }
                placeholder="e.g., Gold, Credits, Coins"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={economySettings.tradingEnabled}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      economySettings: {
                        ...economySettings,
                        tradingEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary bg-bg-tertiary border-border-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-text-primary">
                  Trading Enabled
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={economySettings.barterEnabled}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      economySettings: {
                        ...economySettings,
                        barterEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary bg-bg-tertiary border-border-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-text-primary">
                  Bartering Enabled
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Inflation Rate (%)
              </label>
              <Input
                type="number"
                value={economySettings.inflationRate}
                onChange={(e) =>
                  onChange({
                    ...data,
                    economySettings: {
                      ...economySettings,
                      inflationRate: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Default Quality
              </label>
              <select
                value={aiPreferences.defaultQuality}
                onChange={(e) =>
                  onChange({
                    ...data,
                    aiPreferences: {
                      ...aiPreferences,
                      defaultQuality: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="quality">Quality (Slower, Better)</option>
                <option value="balanced">Balanced</option>
                <option value="speed">Speed (Faster, Good)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Narrative Tone
                </label>
                <select
                  value={aiPreferences.toneAndStyle.narrative}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      aiPreferences: {
                        ...aiPreferences,
                        toneAndStyle: {
                          ...aiPreferences.toneAndStyle,
                          narrative: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="lighthearted">Lighthearted</option>
                  <option value="serious">Serious</option>
                  <option value="humorous">Humorous</option>
                  <option value="epic">Epic</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Dialogue Formality
                </label>
                <select
                  value={aiPreferences.toneAndStyle.dialogueFormality}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      aiPreferences: {
                        ...aiPreferences,
                        toneAndStyle: {
                          ...aiPreferences.toneAndStyle,
                          dialogueFormality: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Detail Level
                </label>
                <select
                  value={aiPreferences.toneAndStyle.detailLevel}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      aiPreferences: {
                        ...aiPreferences,
                        toneAndStyle: {
                          ...aiPreferences.toneAndStyle,
                          detailLevel: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="minimal">Minimal</option>
                  <option value="moderate">Moderate</option>
                  <option value="verbose">Verbose</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Technology Level
                </label>
                <select
                  value={aiPreferences.contentGuidelines.technologyLevel}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      aiPreferences: {
                        ...aiPreferences,
                        contentGuidelines: {
                          ...aiPreferences.contentGuidelines,
                          technologyLevel: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="primitive">Primitive</option>
                  <option value="medieval">Medieval</option>
                  <option value="renaissance">Renaissance</option>
                  <option value="industrial">Industrial</option>
                  <option value="modern">Modern</option>
                  <option value="futuristic">Futuristic</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
