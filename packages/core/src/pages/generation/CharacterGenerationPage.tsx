import React, { useState, useEffect } from "react";
import {
  User,
  Sparkles,
  Loader2,
  Users,
  Skull,
  Bot,
  Crown,
  Save,
  FolderOpen,
} from "lucide-react";
import { useGenerationStore } from "@/store";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, Button } from "@/components/common";
import { GenerationAPIClient } from "@/services/api/GenerationAPIClient";
import { buildGenerationConfig } from "@/utils/generationConfigBuilder";
import { notify } from "@/utils/notify";
import {
  TabNavigation,
  PipelineProgressCard,
  GeneratedAssetsList,
  AssetPreviewCard,
  NoAssetSelected,
} from "@/components/generation";
import { SavePromptModal, PromptLibraryModal } from "@/components/prompts";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";

interface CharacterGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

type CharacterType =
  | "humanoid"
  | "creature"
  | "monster"
  | "robot"
  | "npc"
  | "custom";
type CharacterClass =
  | "warrior"
  | "mage"
  | "archer"
  | "merchant"
  | "villain"
  | "hero";

const CHARACTER_PRESETS = {
  humanoid: {
    label: "Humanoid",
    icon: User,
    description: "Human or humanoid characters",
    examples: ["Knight", "Wizard", "Archer", "Villager"],
  },
  npc: {
    label: "NPC",
    icon: Users,
    description: "Non-player characters",
    examples: ["Merchant", "Guard", "Quest Giver", "Villager"],
  },
  creature: {
    label: "Creature",
    icon: Skull,
    description: "Fantasy creatures and beasts",
    examples: ["Dragon", "Griffin", "Unicorn", "Giant Spider"],
  },
  monster: {
    label: "Monster",
    icon: Crown,
    description: "Enemy monsters and bosses",
    examples: ["Orc", "Goblin", "Troll", "Demon"],
  },
  robot: {
    label: "Robot/Mech",
    icon: Bot,
    description: "Mechanical characters",
    examples: ["Battle Mech", "Android", "Cyborg", "Drone"],
  },
};

const CHARACTER_CLASSES = [
  { value: "warrior", label: "Warrior", emoji: "⚔️" },
  { value: "mage", label: "Mage", emoji: "🔮" },
  { value: "archer", label: "Archer", emoji: "🏹" },
  { value: "merchant", label: "Merchant", emoji: "💰" },
  { value: "villain", label: "Villain", emoji: "👹" },
  { value: "hero", label: "Hero", emoji: "🦸" },
];

const HEIGHT_PRESETS = [
  { label: "Short", value: 150, description: "~150cm" },
  { label: "Average", value: 175, description: "~175cm" },
  { label: "Tall", value: 200, description: "~200cm" },
  { label: "Giant", value: 300, description: "~300cm" },
];

export function CharacterGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: CharacterGenerationPageProps) {
  const [apiClient] = useState(() => new GenerationAPIClient());
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const {
    generationType,
    activeView,
    assetName,
    description,
    enableRigging,
    characterHeight,
    quality,
    isGenerating,
    pipelineStages,
    generatedAssets,
    selectedAsset,
    setGenerationType,
    setActiveView,
    setAssetName,
    setAssetType,
    setDescription,
    setEnableRigging,
    setCharacterHeight,
    setQuality,
    setIsGenerating,
    setCurrentPipelineId,
    setPipelineStages,
    setGeneratedAssets,
    setSelectedAsset,
    initializePipelineStages,
  } = useGenerationStore();

  const [characterType, setCharacterType] = useState<CharacterType>("humanoid");
  const [customCharacterType, setCustomCharacterType] = useState<string>("");
  const [characterClass, setCharacterClass] = useState<
    CharacterClass | "custom"
  >("warrior");
  const [customCharacterClass, setCustomCharacterClass] = useState<string>("");

  // Prompt library
  const { savePrompt, isLoading: isSavingPrompt } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  // Set generation type to avatar on mount
  useEffect(() => {
    setGenerationType("avatar");
    setAssetType("character");
    setEnableRigging(true); // Enable rigging by default for characters
  }, [setGenerationType, setAssetType, setEnableRigging]);

  // Initialize pipeline stages
  useEffect(() => {
    initializePipelineStages();
  }, [initializePipelineStages]);

  // Auto-fill description based on selections
  useEffect(() => {
    if (!description && characterType && characterClass) {
      const actualType =
        characterType === "custom" ? customCharacterType : characterType;
      const actualClass =
        characterClass === "custom" ? customCharacterClass : characterClass;

      if (actualType && actualClass) {
        let example = "";
        if (characterType !== "custom") {
          const preset =
            CHARACTER_PRESETS[characterType as keyof typeof CHARACTER_PRESETS];
          example = preset.examples[0].toLowerCase();
        } else if (customCharacterType) {
          example = customCharacterType.toLowerCase();
        }

        if (example) {
          setDescription(
            `A ${actualClass} ${actualType} character, ${example} style`,
          );
        }
      }
    }
  }, [
    characterType,
    customCharacterType,
    characterClass,
    customCharacterClass,
    description,
    setDescription,
  ]);

  const handleStartGeneration = async () => {
    if (!assetName || !description) {
      notify.warning("Please fill in character name and description");
      return;
    }

    if (!user?.id) {
      notify.error(
        "Authentication required: You must be logged in to generate assets",
      );
      return;
    }

    setIsGenerating(true);
    setActiveView("progress");

    const updatedPipelineStages = pipelineStages.map((stage) => ({
      ...stage,
      status:
        stage.id === "text-input" ? ("active" as const) : ("idle" as const),
    }));
    setPipelineStages(updatedPipelineStages);

    const actualType =
      characterType === "custom" ? customCharacterType : characterType;
    const actualClass =
      characterClass === "custom" ? customCharacterClass : characterClass;

    const config = buildGenerationConfig({
      assetName,
      assetType: "character",
      description: `${description}. Character type: ${actualType}. Character class: ${actualClass}.`,
      generationType: "avatar",
      gameStyle: "generic",
      customStyle: undefined,
      customGamePrompt: "low-poly 3D game character",
      customAssetTypePrompt: "",
      useGPT4Enhancement: false,
      enableRetexturing: false,
      enableSprites: false,
      enableRigging,
      characterHeight,
      selectedMaterials: [],
      materialPresets: [],
      materialPromptOverrides: {},
      materialPromptTemplates: undefined,
      gameStyleConfig: undefined,
      quality,
      user: { userId: user.id },
    });

    try {
      const accessToken = await getAccessToken();
      const pipelineId = await apiClient.startPipeline(
        config,
        accessToken || undefined,
      );
      setCurrentPipelineId(pipelineId);
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      notify.error("Failed to start generation. Please check the console.");
    }
  };

  const handleSavePrompt = async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    await savePrompt({
      type: "character",
      name: data.name,
      content: {
        prompt: description,
        assetName,
        characterType,
        customCharacterType,
        characterClass,
        customCharacterClass,
        characterHeight,
        enableRigging,
      },
      description: data.description,
      isPublic: data.isPublic,
      metadata: {
        quality,
      },
    });
    setShowSavePrompt(false);
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setDescription(loadedPrompt.content.prompt || "");
    setAssetName(loadedPrompt.content.assetName || "");
    if (loadedPrompt.content.characterType) {
      setCharacterType(loadedPrompt.content.characterType);
    }
    if (loadedPrompt.content.customCharacterType) {
      setCustomCharacterType(loadedPrompt.content.customCharacterType);
    }
    if (loadedPrompt.content.characterClass) {
      setCharacterClass(loadedPrompt.content.characterClass);
    }
    if (loadedPrompt.content.customCharacterClass) {
      setCustomCharacterClass(loadedPrompt.content.customCharacterClass);
    }
    if (loadedPrompt.content.characterHeight !== undefined) {
      setCharacterHeight(loadedPrompt.content.characterHeight);
    }
    if (loadedPrompt.content.enableRigging !== undefined) {
      setEnableRigging(loadedPrompt.content.enableRigging);
    }
    if (loadedPrompt.metadata?.quality) {
      setQuality(loadedPrompt.metadata.quality);
    }
    notify.success(`Loaded prompt: ${loadedPrompt.name}`);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <TabNavigation
              activeView={activeView}
              generatedAssetsCount={generatedAssets.length}
              onTabChange={setActiveView}
            />
            {/* Prompt Library Buttons */}
            {activeView === "config" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLoadPrompt(true)}
                  className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all"
                  title="Load saved prompt"
                >
                  <FolderOpen className="w-4 h-4 text-text-secondary hover:text-primary" />
                </button>
                <button
                  onClick={() => setShowSavePrompt(true)}
                  disabled={!description}
                  className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save current prompt"
                >
                  <Save className="w-4 h-4 text-text-secondary hover:text-primary" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Configuration View */}
        {activeView === "config" && (
          <div className="space-y-6">
            {/* Character Type Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Character Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(
                    Object.entries(CHARACTER_PRESETS) as [
                      CharacterType,
                      typeof CHARACTER_PRESETS.humanoid,
                    ][]
                  ).map(([type, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setCharacterType(type)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          characterType === type
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium text-text-primary">
                          {preset.label}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Character Type Button */}
                  <button
                    onClick={() => setCharacterType("custom")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      characterType === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                    }`}
                  >
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium text-text-primary">
                      Custom
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Define your own type
                    </div>
                  </button>
                </div>

                {/* Custom Character Type Input */}
                {characterType === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Custom Character Type
                    </label>
                    <input
                      type="text"
                      value={customCharacterType}
                      onChange={(e) => setCustomCharacterType(e.target.value)}
                      placeholder="e.g., Alien, Spirit, Elemental, Undead"
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Examples for selected type */}
                {characterType !== "custom" && (
                  <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-secondary mb-2">
                      Examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CHARACTER_PRESETS[
                        characterType as keyof typeof CHARACTER_PRESETS
                      ].examples.map((example) => (
                        <span
                          key={example}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Character Class */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Character Class{" "}
                  <span className="text-text-secondary text-sm font-normal">
                    (Quick Presets)
                  </span>
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  {CHARACTER_CLASSES.map((cls) => (
                    <button
                      key={cls.value}
                      onClick={() =>
                        setCharacterClass(cls.value as CharacterClass)
                      }
                      className={`p-3 rounded-lg border-2 transition-all ${
                        characterClass === cls.value
                          ? "border-primary bg-primary/10"
                          : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                      }`}
                    >
                      <div className="text-2xl mb-1">{cls.emoji}</div>
                      <div className="text-sm font-medium text-text-primary">
                        {cls.label}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setCharacterClass("custom")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      characterClass === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                    }`}
                  >
                    <div className="text-2xl mb-1">✨</div>
                    <div className="text-sm font-medium text-text-primary">
                      Custom
                    </div>
                  </button>
                </div>

                {/* Custom Class Input */}
                {characterClass === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Enter Your Custom Class
                    </label>
                    <input
                      type="text"
                      value={customCharacterClass}
                      onChange={(e) => setCustomCharacterClass(e.target.value)}
                      placeholder="e.g., Necromancer, Pirate, Scientist, etc."
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Character Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Character Details
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g., Knight Commander"
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your character's appearance, armor, weapons, etc."
                    rows={4}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Height Presets */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Character Height
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {HEIGHT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setCharacterHeight(preset.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          characterHeight === preset.value
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <div className="text-sm font-medium text-text-primary">
                          {preset.label}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">
                      Enable Rigging
                    </p>
                    <p className="text-sm text-text-secondary">
                      Add bones for animation
                    </p>
                  </div>
                  <button
                    onClick={() => setEnableRigging(!enableRigging)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableRigging ? "bg-primary" : "bg-border-primary"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enableRigging ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Map preview to standard since store doesn't support preview
                      setQuality(
                        (value === "preview" ? "standard" : value) as
                          | "standard"
                          | "high"
                          | "ultra",
                      );
                    }}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="preview">Preview (Fast)</option>
                    <option value="standard">Standard</option>
                    <option value="high">High Quality</option>
                    <option value="ultra">Ultra (Slow)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card className="overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <Button
                  onClick={handleStartGeneration}
                  disabled={!assetName || !description || isGenerating}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.01]"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Character...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                      Generate Character
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress View */}
        {activeView === "progress" && (
          <div className="space-y-4">
            <PipelineProgressCard
              pipelineStages={pipelineStages}
              generationType={generationType}
              isGenerating={isGenerating}
              onBackToConfig={() => setActiveView("config")}
            />
          </div>
        )}

        {/* Results View */}
        {activeView === "results" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <GeneratedAssetsList
                generatedAssets={generatedAssets}
                selectedAsset={selectedAsset}
                onAssetSelect={setSelectedAsset}
              />
            </div>
            <div className="lg:col-span-3">
              {selectedAsset ? (
                <AssetPreviewCard
                  selectedAsset={selectedAsset}
                  generationType={generationType}
                />
              ) : (
                <NoAssetSelected />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prompt Library Modals */}
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSave={handleSavePrompt}
        promptType="character"
        currentContent={{
          prompt: description,
          assetName,
          characterType,
          customCharacterType,
          characterClass,
          customCharacterClass,
          characterHeight,
          enableRigging,
        }}
        loading={isSavingPrompt}
      />

      <PromptLibraryModal
        open={showLoadPrompt}
        onClose={() => setShowLoadPrompt(false)}
        onLoad={handleLoadPrompt}
        promptType="character"
      />
    </div>
  );
}

export default CharacterGenerationPage;
