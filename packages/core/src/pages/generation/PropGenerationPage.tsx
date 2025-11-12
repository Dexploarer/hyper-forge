import React, { useState, useEffect } from "react";
import {
  Sword,
  Shield,
  Sparkles,
  Loader2,
  Wrench,
  Home,
  Apple,
  Gem,
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
  MaterialVariantsCard,
} from "@/components/generation";
import { useMaterialPresets } from "@/hooks";
import { AssetService } from "@/services/api/AssetService";
import { MaterialPreset } from "@/types";

interface PropGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

type PropCategory =
  | "weapon"
  | "armor"
  | "tool"
  | "furniture"
  | "consumable"
  | "resource"
  | "custom";
type ItemStyle =
  | "medieval"
  | "fantasy"
  | "scifi"
  | "steampunk"
  | "modern"
  | "tribal";

const PROP_CATEGORIES = {
  weapon: {
    label: "Weapon",
    icon: Sword,
    description: "Swords, axes, bows, and more",
    examples: ["Longsword", "Battle Axe", "Crossbow", "Magic Staff"],
  },
  armor: {
    label: "Armor",
    icon: Shield,
    description: "Armor, shields, and protection",
    examples: ["Plate Armor", "Leather Vest", "Iron Shield", "Helmet"],
  },
  tool: {
    label: "Tool",
    icon: Wrench,
    description: "Tools and utility items",
    examples: ["Pickaxe", "Hammer", "Fishing Rod", "Torch"],
  },
  furniture: {
    label: "Furniture",
    icon: Home,
    description: "Furniture and decorations",
    examples: ["Wooden Chair", "Table", "Barrel", "Bookshelf"],
  },
  consumable: {
    label: "Consumable",
    icon: Apple,
    description: "Potions, food, and consumables",
    examples: ["Health Potion", "Bread", "Magic Scroll", "Elixir"],
  },
  resource: {
    label: "Resource",
    icon: Gem,
    description: "Materials and resources",
    examples: ["Gold Ore", "Wood Log", "Iron Ingot", "Crystal"],
  },
};

const STYLE_OPTIONS = [
  {
    value: "medieval",
    label: "Medieval",
    emoji: "⚔️",
    description: "Swords, shields, castles",
  },
  {
    value: "fantasy",
    label: "Fantasy",
    emoji: "🔮",
    description: "Magical, enchanted items",
  },
  {
    value: "scifi",
    label: "Sci-Fi",
    emoji: "🚀",
    description: "Futuristic technology",
  },
  {
    value: "steampunk",
    label: "Steampunk",
    emoji: "⚙️",
    description: "Victorian-era tech",
  },
  {
    value: "modern",
    label: "Modern",
    emoji: "🏙️",
    description: "Contemporary design",
  },
  {
    value: "tribal",
    label: "Tribal",
    emoji: "🗿",
    description: "Primitive, organic",
  },
];

const SIZE_PRESETS = [
  { label: "Small", value: "small", description: "Hand-held items" },
  { label: "Medium", value: "medium", description: "One-handed weapons" },
  { label: "Large", value: "large", description: "Two-handed items" },
];

export function PropGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: PropGenerationPageProps) {
  const [apiClient] = useState(() => new GenerationAPIClient());
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const {
    generationType,
    activeView,
    assetName,
    description,
    enableRetexturing,
    quality,
    isGenerating,
    pipelineStages,
    generatedAssets,
    selectedAsset,
    materialPresets,
    isLoadingMaterials,
    selectedMaterials,
    customMaterials,
    materialPromptOverrides,
    editMaterialPrompts,
    editingPreset,
    showDeleteConfirm,
    setGenerationType,
    setActiveView,
    setAssetName,
    setAssetType,
    setDescription,
    setEnableRetexturing,
    setQuality,
    setIsGenerating,
    setCurrentPipelineId,
    setPipelineStages,
    setGeneratedAssets,
    setSelectedAsset,
    setMaterialPresets,
    setIsLoadingMaterials,
    setSelectedMaterials,
    setCustomMaterials,
    setMaterialPromptOverrides,
    setEditMaterialPrompts,
    setEditingPreset,
    setShowDeleteConfirm,
    toggleMaterialSelection,
    addCustomMaterial,
    initializePipelineStages,
  } = useGenerationStore();

  const { handleSaveCustomMaterials, handleUpdatePreset, handleDeletePreset } =
    useMaterialPresets();

  const [propCategory, setPropCategory] = useState<PropCategory>("weapon");
  const [customPropCategory, setCustomPropCategory] = useState<string>("");
  const [itemStyle, setItemStyle] = useState<ItemStyle | "custom">("fantasy");
  const [customItemStyle, setCustomItemStyle] = useState<string>("");
  const [itemSize, setItemSize] = useState<string>("medium");

  // Set generation type to item on mount and update asset type when category changes
  useEffect(() => {
    setGenerationType("item");
    const actualCategory =
      propCategory === "custom" ? customPropCategory || "item" : propCategory;
    setAssetType(actualCategory);
    setEnableRetexturing(true); // Enable material variants by default for props
  }, [
    setGenerationType,
    setAssetType,
    setEnableRetexturing,
    propCategory,
    customPropCategory,
  ]);

  // Initialize pipeline stages
  useEffect(() => {
    initializePipelineStages();
  }, [initializePipelineStages]);

  // Load material presets
  useEffect(() => {
    let didCancel = false;
    const loadMaterialPresets = async () => {
      try {
        setIsLoadingMaterials(true);
        const data = await AssetService.getMaterialPresets();
        if (!Array.isArray(data)) {
          throw new Error("Material presets data is not an array");
        }
        if (didCancel) return;
        setMaterialPresets(data);

        // Set defaults only if nothing selected yet
        if (selectedMaterials.length === 0) {
          const defaults = ["bronze", "steel", "mithril"];
          const available = defaults.filter((id) =>
            data.some((p: MaterialPreset) => p.id === id),
          );
          setSelectedMaterials(available);
        }
      } catch (error) {
        console.error(
          "[MaterialPresets] Failed to load material presets:",
          error,
        );
      } finally {
        if (!didCancel) setIsLoadingMaterials(false);
      }
    };
    loadMaterialPresets();
    return () => {
      didCancel = true;
    };
  }, []);

  // Auto-fill description based on selections
  useEffect(() => {
    if (!description && propCategory && itemStyle) {
      const actualCategory =
        propCategory === "custom" ? customPropCategory : propCategory;
      const actualStyle = itemStyle === "custom" ? customItemStyle : itemStyle;

      if (actualCategory && actualStyle) {
        let example = "";
        if (propCategory !== "custom") {
          const preset =
            PROP_CATEGORIES[propCategory as keyof typeof PROP_CATEGORIES];
          example = preset.examples[0].toLowerCase();
        } else if (customPropCategory) {
          example = customPropCategory.toLowerCase();
        }

        if (example) {
          setDescription(`A ${actualStyle} ${example}, ${itemSize} size`);
        }
      }
    }
  }, [
    propCategory,
    customPropCategory,
    itemStyle,
    customItemStyle,
    itemSize,
    description,
    setDescription,
  ]);

  const handleStartGeneration = async () => {
    if (!assetName || !description) {
      notify.warning("Please fill in item name and description");
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

    const actualCategory =
      propCategory === "custom" ? customPropCategory : propCategory;
    const actualStyle = itemStyle === "custom" ? customItemStyle : itemStyle;

    const config = buildGenerationConfig({
      assetName,
      assetType: actualCategory || "item",
      description: `${description}. Item category: ${actualCategory}. Style: ${actualStyle}. Size: ${itemSize}.`,
      generationType: "item",
      gameStyle: "generic",
      customStyle: undefined,
      customGamePrompt: "low-poly 3D game prop",
      customAssetTypePrompt: "",
      useGPT4Enhancement: false,
      enableRetexturing,
      enableSprites: false,
      enableRigging: false,
      characterHeight: 0,
      selectedMaterials,
      materialPresets,
      materialPromptOverrides,
      materialPromptTemplates: {},
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with tabs */}
        <div className="mb-6">
          <TabNavigation
            activeView={activeView}
            generatedAssetsCount={generatedAssets.length}
            onTabChange={setActiveView}
          />
        </div>

        {/* Configuration View */}
        {activeView === "config" && (
          <div className="space-y-6">
            {/* Prop Category Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Item Category
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {(
                    Object.entries(PROP_CATEGORIES) as [
                      PropCategory,
                      typeof PROP_CATEGORIES.weapon,
                    ][]
                  ).map(([category, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={category}
                        onClick={() => setPropCategory(category)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          propCategory === category
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

                  {/* Custom Category Button */}
                  <button
                    onClick={() => setPropCategory("custom")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      propCategory === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                    }`}
                  >
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium text-text-primary">
                      Custom
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Define your own category
                    </div>
                  </button>
                </div>

                {/* Custom Category Input */}
                {propCategory === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={customPropCategory}
                      onChange={(e) => setCustomPropCategory(e.target.value)}
                      placeholder="e.g., Vehicle, Building, Pet, Gadget"
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Examples for selected category */}
                {propCategory !== "custom" && (
                  <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-secondary mb-2">
                      Examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PROP_CATEGORIES[
                        propCategory as keyof typeof PROP_CATEGORIES
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

            {/* Item Style & Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Style */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Visual Style
                  </h3>
                  <div className="space-y-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setItemStyle(style.value as ItemStyle)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          itemStyle === style.value
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <span className="text-xl">{style.emoji}</span>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-text-primary">
                            {style.label}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {style.description}
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Custom Style Button */}
                    <button
                      onClick={() => setItemStyle("custom")}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        itemStyle === "custom"
                          ? "border-primary bg-primary/10"
                          : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                      }`}
                    >
                      <span className="text-xl">✨</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-text-primary">
                          Custom
                        </div>
                        <div className="text-xs text-text-secondary">
                          Define your own style
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Custom Style Input */}
                  {itemStyle === "custom" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Custom Style Name
                      </label>
                      <input
                        type="text"
                        value={customItemStyle}
                        onChange={(e) => setCustomItemStyle(e.target.value)}
                        placeholder="e.g., Cyberpunk, Post-Apocalyptic, Anime"
                        className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Size */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Item Size
                  </h3>
                  <div className="space-y-2">
                    {SIZE_PRESETS.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setItemSize(size.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          itemSize === size.value
                            ? "border-primary bg-primary/10"
                            : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                        }`}
                      >
                        <div className="text-sm font-medium text-text-primary">
                          {size.label}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {size.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Item Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Item Details
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g., Enchanted Sword"
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
                    placeholder="Describe your item's appearance, materials, special features, etc."
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
                    onChange={(e) =>
                      setQuality(
                        e.target.value as
                          | "preview"
                          | "standard"
                          | "high"
                          | "ultra",
                      )
                    }
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

            {/* Material Variants */}
            {enableRetexturing && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Material Variants
                  </h3>
                  <MaterialVariantsCard
                    gameStyle="generic"
                    isLoadingMaterials={isLoadingMaterials}
                    materialPresets={materialPresets}
                    selectedMaterials={selectedMaterials}
                    customMaterials={customMaterials}
                    materialPromptOverrides={materialPromptOverrides}
                    editMaterialPrompts={editMaterialPrompts}
                    onToggleMaterialSelection={toggleMaterialSelection}
                    onEditMaterialPromptsToggle={() =>
                      setEditMaterialPrompts(!editMaterialPrompts)
                    }
                    onMaterialPromptOverride={(materialId, prompt) => {
                      setMaterialPromptOverrides({
                        ...materialPromptOverrides,
                        [materialId]: prompt,
                      });
                    }}
                    onAddCustomMaterial={addCustomMaterial}
                    onUpdateCustomMaterial={(index, material) => {
                      const updated = [...customMaterials];
                      updated[index] = material;
                      setCustomMaterials(updated);
                    }}
                    onRemoveCustomMaterial={(index) => {
                      setCustomMaterials(
                        customMaterials.filter((_, i) => i !== index),
                      );
                    }}
                    onSaveCustomMaterials={handleSaveCustomMaterials}
                    onEditPreset={setEditingPreset}
                    onDeletePreset={setShowDeleteConfirm}
                  />
                </CardContent>
              </Card>
            )}

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
                      Generating Item...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                      Generate Item
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
    </div>
  );
}

export default PropGenerationPage;
