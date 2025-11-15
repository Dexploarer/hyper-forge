import React, { useState, useEffect } from "react";
import {
  Trees,
  Mountain,
  Building2,
  Sparkles,
  Loader2,
  Castle,
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
import { usePromptKeyboardShortcuts } from "@/hooks/usePromptKeyboardShortcuts";

interface EnvironmentGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

type EnvironmentType = "terrain" | "building" | "nature" | "dungeon" | "custom";
type BiomeType =
  | "forest"
  | "desert"
  | "ice"
  | "volcanic"
  | "grassland"
  | "mountain"
  | "custom";
type ScaleType = "small" | "medium" | "large";

const ENVIRONMENT_TYPES = {
  terrain: {
    label: "Terrain",
    icon: Mountain,
    description: "Ground, cliffs, and landforms",
    examples: ["Rocky Cliff", "Grassy Hill", "Desert Dune", "Mountain Peak"],
  },
  building: {
    label: "Building",
    icon: Building2,
    description: "Structures and architecture",
    examples: ["Stone Tower", "Wooden House", "Fortress", "Temple"],
  },
  nature: {
    label: "Nature",
    icon: Trees,
    description: "Plants, trees, and natural elements",
    examples: ["Oak Tree", "Bush", "Rock Formation", "Waterfall"],
  },
  dungeon: {
    label: "Dungeon",
    icon: Castle,
    description: "Dungeon pieces and interiors",
    examples: ["Stone Corridor", "Prison Cell", "Treasure Room", "Boss Arena"],
  },
};

const BIOME_OPTIONS = [
  {
    value: "forest",
    label: "Forest",
    emoji: "🌲",
    description: "Lush green vegetation",
  },
  {
    value: "desert",
    label: "Desert",
    emoji: "🏜️",
    description: "Sandy and arid",
  },
  { value: "ice", label: "Ice", emoji: "❄️", description: "Frozen and snowy" },
  {
    value: "volcanic",
    label: "Volcanic",
    emoji: "🌋",
    description: "Hot and fiery",
  },
  {
    value: "grassland",
    label: "Grassland",
    emoji: "🌾",
    description: "Open plains",
  },
  {
    value: "mountain",
    label: "Mountain",
    emoji: "⛰️",
    description: "High altitude",
  },
];

const SCALE_OPTIONS = [
  { value: "small", label: "Small Prop", description: "Individual object" },
  {
    value: "medium",
    label: "Medium Scene",
    description: "Small scene section",
  },
  {
    value: "large",
    label: "Large Environment",
    description: "Full environment piece",
  },
];

const MOOD_OPTIONS = [
  { value: "bright", label: "Bright", emoji: "☀️" },
  { value: "dark", label: "Dark", emoji: "🌙" },
  { value: "mysterious", label: "Mysterious", emoji: "🌫️" },
  { value: "welcoming", label: "Welcoming", emoji: "✨" },
];

export function EnvironmentGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: EnvironmentGenerationPageProps) {
  const [apiClient] = useState(() => new GenerationAPIClient());
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const {
    generationType,
    activeView,
    assetName,
    description,
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
    setQuality,
    setIsGenerating,
    setCurrentPipelineId,
    setPipelineStages,
    setGeneratedAssets,
    setSelectedAsset,
    initializePipelineStages,
  } = useGenerationStore();

  const [environmentType, setEnvironmentType] =
    useState<EnvironmentType>("terrain");
  const [customEnvironmentType, setCustomEnvironmentType] =
    useState<string>("");
  const [biome, setBiome] = useState<BiomeType>("forest");
  const [customBiome, setCustomBiome] = useState<string>("");
  const [scale, setScale] = useState<ScaleType>("medium");
  const [mood, setMood] = useState<string>("bright");

  // Prompt library
  const {
    savePrompt,
    updatePrompt,
    isLoading: isSavingPrompt,
  } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  // Set generation type to environment on mount
  useEffect(() => {
    setGenerationType("environment");
    setAssetType("environment");
  }, [setGenerationType, setAssetType]);

  // Initialize pipeline stages
  useEffect(() => {
    initializePipelineStages();
  }, [initializePipelineStages]);

  // Auto-fill description based on selections
  useEffect(() => {
    if (!description && environmentType && biome) {
      const actualType =
        environmentType === "custom" ? customEnvironmentType : environmentType;
      const actualBiome = biome === "custom" ? customBiome : biome;

      if (actualType && actualBiome) {
        let example = "";
        if (environmentType !== "custom") {
          const preset =
            ENVIRONMENT_TYPES[
              environmentType as keyof typeof ENVIRONMENT_TYPES
            ];
          example = preset.examples[0].toLowerCase();
        } else if (customEnvironmentType) {
          example = customEnvironmentType.toLowerCase();
        }

        if (example) {
          setDescription(
            `A ${mood} ${actualBiome} ${actualType}, ${example} style, ${scale} scale`,
          );
        }
      }
    }
  }, [
    environmentType,
    customEnvironmentType,
    biome,
    customBiome,
    scale,
    mood,
    description,
    setDescription,
  ]);

  const handleStartGeneration = async () => {
    if (!assetName || !description) {
      notify.warning("Please fill in environment name and description");
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
      environmentType === "custom" ? customEnvironmentType : environmentType;
    const actualBiome = biome === "custom" ? customBiome : biome;

    const config = buildGenerationConfig({
      assetName,
      assetType: "environment",
      description: `${description}. Environment type: ${actualType}. Biome: ${actualBiome}. Scale: ${scale}. Mood: ${mood}.`,
      generationType: "environment",
      gameStyle: "generic",
      customStyle: undefined,
      customGamePrompt: "low-poly 3D game environment",
      customAssetTypePrompt: "",
      useGPT4Enhancement: false,
      enableRetexturing: false,
      enableSprites: false,
      enableRigging: false,
      characterHeight: 0,
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
    if (editingPrompt) {
      // UPDATE existing prompt
      await updatePrompt(editingPrompt.id, {
        type: "environment",
        name: data.name,
        content: {
          prompt: description,
          assetName,
          environmentType,
          customEnvironmentType,
          biome,
          customBiome,
          scale,
          mood,
        },
        description: data.description,
        isPublic: data.isPublic,
        metadata: {
          quality,
        },
      });
      setEditingPrompt(null);
      setShowSavePrompt(false);
      notify.success(`Updated prompt: ${data.name}`);
    } else {
      // CREATE new prompt
      await savePrompt({
        type: "environment",
        name: data.name,
        content: {
          prompt: description,
          assetName,
          environmentType,
          customEnvironmentType,
          biome,
          customBiome,
          scale,
          mood,
        },
        description: data.description,
        isPublic: data.isPublic,
        metadata: {
          quality,
        },
      });
      setShowSavePrompt(false);
    }
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setDescription(loadedPrompt.content.prompt || "");
    setAssetName(loadedPrompt.content.assetName || "");
    if (loadedPrompt.content.environmentType) {
      setEnvironmentType(loadedPrompt.content.environmentType);
    }
    if (loadedPrompt.content.customEnvironmentType) {
      setCustomEnvironmentType(loadedPrompt.content.customEnvironmentType);
    }
    if (loadedPrompt.content.biome) {
      setBiome(loadedPrompt.content.biome);
    }
    if (loadedPrompt.content.customBiome) {
      setCustomBiome(loadedPrompt.content.customBiome);
    }
    if (loadedPrompt.content.scale) {
      setScale(loadedPrompt.content.scale);
    }
    if (loadedPrompt.content.mood) {
      setMood(loadedPrompt.content.mood);
    }
    if (loadedPrompt.metadata?.quality) {
      setQuality(loadedPrompt.metadata.quality);
    }
    notify.success(`Loaded prompt: ${loadedPrompt.name}`);
  };

  const handleEditPrompt = (prompt: any) => {
    // Load the prompt's content into the form
    handleLoadPrompt(prompt);

    // Set editing state
    setEditingPrompt(prompt);

    // Close library modal and open save modal
    setShowLoadPrompt(false);
    setShowSavePrompt(true);
  };

  // Keyboard shortcuts for prompt library
  usePromptKeyboardShortcuts({
    onSave: () => {
      if (description) {
        setShowSavePrompt(true);
      }
    },
    onLoad: () => setShowLoadPrompt(true),
    enabled: true,
  });

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
            {/* Environment Type Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Environment Type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(
                    Object.entries(ENVIRONMENT_TYPES) as [
                      EnvironmentType,
                      typeof ENVIRONMENT_TYPES.terrain,
                    ][]
                  ).map(([type, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setEnvironmentType(type)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          environmentType === type
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

                  {/* Custom Environment Type Button */}
                  <button
                    onClick={() => setEnvironmentType("custom")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      environmentType === "custom"
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

                {/* Custom Environment Type Input */}
                {environmentType === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Custom Environment Type
                    </label>
                    <input
                      type="text"
                      value={customEnvironmentType}
                      onChange={(e) => setCustomEnvironmentType(e.target.value)}
                      placeholder="e.g., Underwater, Floating Islands, Cave System"
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Examples for selected type */}
                {environmentType !== "custom" && (
                  <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-secondary mb-2">
                      Examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ENVIRONMENT_TYPES[
                        environmentType as keyof typeof ENVIRONMENT_TYPES
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

            {/* Biome Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Biome
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {BIOME_OPTIONS.map((biomeOption) => (
                    <button
                      key={biomeOption.value}
                      onClick={() => setBiome(biomeOption.value as BiomeType)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        biome === biomeOption.value
                          ? "border-primary bg-primary/10"
                          : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                      }`}
                    >
                      <div className="text-2xl mb-1">{biomeOption.emoji}</div>
                      <div className="text-sm font-medium text-text-primary">
                        {biomeOption.label}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {biomeOption.description}
                      </div>
                    </button>
                  ))}

                  {/* Custom Biome Button */}
                  <button
                    onClick={() => setBiome("custom")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      biome === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                    }`}
                  >
                    <div className="text-2xl mb-1">✨</div>
                    <div className="text-sm font-medium text-text-primary">
                      Custom
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Define your own biome
                    </div>
                  </button>
                </div>

                {/* Custom Biome Input */}
                {biome === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Custom Biome Name
                    </label>
                    <input
                      type="text"
                      value={customBiome}
                      onChange={(e) => setCustomBiome(e.target.value)}
                      placeholder="e.g., Swamp, Tundra, Jungle, Crystalline"
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scale & Mood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scale */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Scale
                  </h3>
                  <div className="space-y-2">
                    {SCALE_OPTIONS.map((scaleOption) => (
                      <button
                        key={scaleOption.value}
                        onClick={() => setScale(scaleOption.value as ScaleType)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          scale === scaleOption.value
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <div className="text-sm font-medium text-text-primary">
                          {scaleOption.label}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {scaleOption.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mood */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Mood/Atmosphere
                  </h3>
                  <div className="space-y-2">
                    {MOOD_OPTIONS.map((moodOption) => (
                      <button
                        key={moodOption.value}
                        onClick={() => setMood(moodOption.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          mood === moodOption.value
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <span className="text-xl">{moodOption.emoji}</span>
                        <div className="text-sm font-medium text-text-primary">
                          {moodOption.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environment Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Environment Details
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Environment Name *
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g., Ancient Forest Ruins"
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
                    placeholder="Describe your environment's appearance, features, atmosphere, etc."
                    rows={4}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
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
                      Generating Environment...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                      Generate Environment
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
        onClose={() => {
          setShowSavePrompt(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        promptType="environment"
        currentContent={{
          prompt: description,
          assetName,
          environmentType,
          customEnvironmentType,
          biome,
          customBiome,
          scale,
          mood,
        }}
        loading={isSavingPrompt}
        editingPrompt={
          editingPrompt
            ? {
                id: editingPrompt.id,
                name: editingPrompt.name,
                description: editingPrompt.description,
                isPublic: editingPrompt.isPublic,
              }
            : undefined
        }
      />

      <PromptLibraryModal
        open={showLoadPrompt}
        onClose={() => setShowLoadPrompt(false)}
        onLoad={handleLoadPrompt}
        onEdit={handleEditPrompt}
        promptType="environment"
      />
    </div>
  );
}

export default EnvironmentGenerationPage;
