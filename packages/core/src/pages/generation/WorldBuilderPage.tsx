import React, { useState } from "react";
import {
  Globe,
  Sparkles,
  Loader2,
  MapPin,
  BookOpen,
  Users,
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/common";
import { notify } from "@/utils/notify";
import { api } from "@/lib/api-client";

interface WorldBuilderPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

type WorldTheme =
  | "fantasy"
  | "scifi"
  | "modern"
  | "apocalyptic"
  | "medieval"
  | "cyberpunk"
  | "custom";
type WorldComplexity = "simple" | "medium" | "complex" | "epic";

const WORLD_THEMES = {
  fantasy: {
    label: "Fantasy",
    emoji: "🏰",
    description: "Magical worlds with wizards and dragons",
    examples: ["Medieval Fantasy", "High Fantasy", "Dark Fantasy"],
  },
  scifi: {
    label: "Sci-Fi",
    emoji: "🚀",
    description: "Futuristic worlds with technology",
    examples: ["Space Opera", "Cybernetic", "Post-Human"],
  },
  medieval: {
    label: "Medieval",
    emoji: "⚔️",
    description: "Historical medieval settings",
    examples: ["Knights & Castles", "Feudal Era", "Crusades"],
  },
  apocalyptic: {
    label: "Apocalyptic",
    emoji: "☢️",
    description: "Post-apocalyptic wastelands",
    examples: ["Nuclear Wasteland", "Zombie Outbreak", "Climate Collapse"],
  },
  cyberpunk: {
    label: "Cyberpunk",
    emoji: "🌃",
    description: "High-tech, low-life dystopia",
    examples: ["Neon Cities", "Corporate Dystopia", "Hacker Underground"],
  },
  modern: {
    label: "Modern",
    emoji: "🏙️",
    description: "Contemporary real-world settings",
    examples: ["Urban City", "Suburban Life", "Rural Town"],
  },
};

const COMPLEXITY_OPTIONS = [
  {
    value: "simple",
    label: "Simple",
    description: "1-3 locations, basic lore",
    locationCount: "1-3 locations",
    loreDepth: "Basic backstory",
  },
  {
    value: "medium",
    label: "Medium",
    description: "4-8 locations, moderate depth",
    locationCount: "4-8 locations",
    loreDepth: "Moderate lore",
  },
  {
    value: "complex",
    label: "Complex",
    description: "9-15 locations, rich lore",
    locationCount: "9-15 locations",
    loreDepth: "Rich history",
  },
  {
    value: "epic",
    label: "Epic",
    description: "15+ locations, deep lore",
    locationCount: "15+ locations",
    loreDepth: "Epic saga",
  },
];

export function WorldBuilderPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: WorldBuilderPageProps) {
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [theme, setTheme] = useState<WorldTheme>("fantasy");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [complexity, setComplexity] = useState<WorldComplexity>("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorld, setGeneratedWorld] = useState<any>(null);

  const handleGenerateWorld = async () => {
    if (!worldName) {
      notify.warning("Please enter a world name");
      return;
    }

    setIsGenerating(true);

    try {
      notify.info("Generating world... This may take a few minutes.");

      const actualTheme = theme === "custom" ? customTheme : theme;

      const { data, error } = await api.api.content["generate-world"].post({
        theme: actualTheme || "fantasy",
        complexity,
        worldName,
        description: worldDescription || undefined,
      });

      if (error || !data) {
        throw new Error(
          typeof error === "string"
            ? error
            : JSON.stringify(error) || "Failed to generate world",
        );
      }

      setGeneratedWorld(data.world);
      notify.success(`World "${data.world.worldName}" generated successfully!`);
    } catch (error) {
      console.error("Failed to generate world:", error);
      notify.error("Failed to generate world. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-text-primary">
              World Builder
            </h1>
          </div>
          <p className="text-text-secondary">
            Generate complete game worlds with locations, NPCs, quests, and lore
          </p>
        </div>

        {!generatedWorld ? (
          <div className="space-y-6">
            {/* World Theme Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  World Theme
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {(
                    Object.entries(WORLD_THEMES) as [
                      WorldTheme,
                      typeof WORLD_THEMES.fantasy,
                    ][]
                  ).map(([themeKey, themeData]) => (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === themeKey
                          ? "border-primary bg-primary/10"
                          : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                      }`}
                    >
                      <div className="text-3xl mb-2">{themeData.emoji}</div>
                      <div className="text-sm font-medium text-text-primary">
                        {themeData.label}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {themeData.description}
                      </div>
                    </button>
                  ))}

                  {/* Custom Theme Button */}
                  <button
                    onClick={() => setTheme("custom")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                    }`}
                  >
                    <div className="text-3xl mb-2">✨</div>
                    <div className="text-sm font-medium text-text-primary">
                      Custom
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Define your own theme
                    </div>
                  </button>
                </div>

                {/* Custom Theme Input */}
                {theme === "custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Custom World Theme
                    </label>
                    <input
                      type="text"
                      value={customTheme}
                      onChange={(e) => setCustomTheme(e.target.value)}
                      placeholder="e.g., Steampunk, Gothic Horror, Mythological"
                      className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Examples */}
                {theme !== "custom" && (
                  <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                    <p className="text-xs text-text-secondary mb-2">
                      Examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {WORLD_THEMES[
                        theme as keyof typeof WORLD_THEMES
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

            {/* Complexity Selection */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  World Complexity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setComplexity(option.value as WorldComplexity)
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        complexity === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border-primary hover:border-primary/50 bg-bg-secondary"
                      }`}
                    >
                      <div className="text-sm font-bold text-text-primary mb-2">
                        {option.label}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <MapPin className="w-3 h-3" />
                          {option.locationCount}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <BookOpen className="w-3 h-3" />
                          {option.loreDepth}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* World Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  World Details
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    World Name *
                  </label>
                  <input
                    type="text"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    placeholder="e.g., Realm of Eldoria"
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={worldDescription}
                    onChange={(e) => setWorldDescription(e.target.value)}
                    placeholder="Add any specific details you want in your world..."
                    rows={4}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* What You'll Get */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  What You'll Get
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-text-primary">
                        Locations
                      </div>
                      <div className="text-sm text-text-secondary">
                        Cities, dungeons, and points of interest
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-text-primary">NPCs</div>
                      <div className="text-sm text-text-secondary">
                        Characters with backstories and roles
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-text-primary">
                        Quests
                      </div>
                      <div className="text-sm text-text-secondary">
                        Main storyline and side quests
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-text-primary">Lore</div>
                      <div className="text-sm text-text-secondary">
                        World history, factions, and mythology
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card className="overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <Button
                  onClick={handleGenerateWorld}
                  disabled={!worldName || isGenerating}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.01]"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating World...
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5 mr-2" />
                      Generate World
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Generated World Display */
          <div className="space-y-6">
            {/* World Overview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                      {generatedWorld.worldName}
                    </h2>
                    <p className="text-text-secondary">
                      {generatedWorld.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => setGeneratedWorld(null)}
                    variant="secondary"
                    size="sm"
                  >
                    Generate New World
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {generatedWorld.locations?.length || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Locations</div>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {generatedWorld.npcs?.length || 0}
                    </div>
                    <div className="text-xs text-text-secondary">NPCs</div>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {generatedWorld.quests?.length || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Quests</div>
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {generatedWorld.factions?.length || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Factions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* World Data Sections */}
            {generatedWorld.locations &&
              generatedWorld.locations.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Locations
                    </h3>
                    <div className="space-y-3">
                      {generatedWorld.locations.map(
                        (location: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 bg-bg-tertiary rounded-lg"
                          >
                            <div className="font-medium text-text-primary">
                              {location.name}
                            </div>
                            <div className="text-sm text-text-secondary mt-1">
                              {location.description}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {generatedWorld.lore && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    World Lore
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-text-secondary whitespace-pre-wrap">
                      {generatedWorld.lore}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Options */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Export World Data
                </h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      const json = JSON.stringify(generatedWorld, null, 2);
                      const blob = new Blob([json], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${generatedWorld.worldName.replace(/\s+/g, "_")}.json`;
                      a.click();
                    }}
                    variant="secondary"
                  >
                    Download JSON
                  </Button>
                  <Button
                    onClick={() => {
                      const text = JSON.stringify(generatedWorld, null, 2);
                      navigator.clipboard.writeText(text);
                      notify.success("World data copied to clipboard!");
                    }}
                    variant="secondary"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorldBuilderPage;
