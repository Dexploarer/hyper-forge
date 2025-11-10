import { Package, User, Home, Trees, Mountain, Sparkles } from "lucide-react";
import React, { useState } from "react";

type GenerationType = "item" | "avatar" | "building" | "environment" | "prop";

interface GenerationTypeSelectorProps {
  onSelectType: (type: GenerationType) => void;
  onGenerateWorld?: () => void;
}

export const GenerationTypeSelector: React.FC<GenerationTypeSelectorProps> = ({
  onSelectType,
  onGenerateWorld,
}) => {
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);

  const handleGenerateWorld = async () => {
    if (onGenerateWorld) {
      setIsGeneratingWorld(true);
      try {
        await onGenerateWorld();
      } finally {
        setIsGeneratingWorld(false);
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary overflow-hidden p-4">
      <div className="solid-panel rounded-2xl p-8 shadow-2xl border border-border-primary max-w-5xl w-full animate-scale-in">
        <h1 className="text-3xl font-bold text-text-primary text-center mb-2">
          What would you like to create?
        </h1>
        <p className="text-text-secondary text-center mb-8">
          Choose your generation type to get started
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Items Card */}
          <button
            onClick={() => onSelectType("item")}
            className="group relative bg-bg-secondary hover:bg-bg-tertiary border border-border-primary hover:border-primary rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center icon-bg-hover"
                style={{
                  backgroundColor: `rgba(99, 102, 241, var(--icon-bg-opacity, 0.1))`,
                }}
              >
                <Package size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Items</h2>
              <p className="text-xs text-text-secondary text-center">
                Weapons, armor, tools, and consumables
              </p>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
          </button>

          {/* Avatars Card */}
          <button
            onClick={() => onSelectType("avatar")}
            className="group relative bg-bg-secondary hover:bg-bg-tertiary border border-border-primary hover:border-secondary rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
                style={{
                  backgroundColor: `rgba(139, 92, 246, var(--icon-bg-opacity, 0.1))`,
                }}
              >
                <User size={32} className="text-secondary" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Avatars
              </h2>
              <p className="text-xs text-text-secondary text-center">
                Characters with auto-rigging support
              </p>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary to-primary opacity-0 group-hover:opacity-5 transition-opacity" />
          </button>

          {/* Buildings Card */}
          <button
            onClick={() => onSelectType("building")}
            className="group relative bg-bg-secondary hover:bg-bg-tertiary border border-border-primary hover:border-amber-500 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
                style={{
                  backgroundColor: `rgba(245, 158, 11, var(--icon-bg-opacity, 0.1))`,
                }}
              >
                <Home
                  size={32}
                  className="text-amber-600 dark:text-amber-500"
                />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Buildings
              </h2>
              <p className="text-xs text-text-secondary text-center">
                Structures, houses, and architecture
              </p>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity" />
          </button>

          {/* Environment Card */}
          <button
            onClick={() => onSelectType("environment")}
            className="group relative bg-bg-secondary hover:bg-bg-tertiary border border-border-primary hover:border-green-500 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
                style={{
                  backgroundColor: `rgba(34, 197, 94, var(--icon-bg-opacity, 0.1))`,
                }}
              >
                <Trees
                  size={32}
                  className="text-green-600 dark:text-green-500"
                />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Environment
              </h2>
              <p className="text-xs text-text-secondary text-center">
                Trees, rocks, plants, and nature
              </p>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity" />
          </button>

          {/* Props Card */}
          <button
            onClick={() => onSelectType("prop")}
            className="group relative bg-bg-secondary hover:bg-bg-tertiary border border-border-primary hover:border-purple-500 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:opacity-100"
                style={{
                  backgroundColor: `rgba(168, 85, 247, var(--icon-bg-opacity, 0.1))`,
                }}
              >
                <Mountain
                  size={32}
                  className="text-purple-600 dark:text-purple-500"
                />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Props</h2>
              <p className="text-xs text-text-secondary text-center">
                Furniture, decorations, and objects
              </p>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity" />
          </button>
        </div>

        {/* Generate World Button */}
        <div className="mt-8 pt-6 border-t border-border-primary">
          <button
            onClick={handleGenerateWorld}
            disabled={isGeneratingWorld}
            className="w-full group relative bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border border-primary rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Sparkles
                  size={24}
                  className={`text-white ${isGeneratingWorld ? "animate-spin" : "animate-pulse"}`}
                />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">
                  Generate Entire World
                </h2>
                <p className="text-sm text-white text-opacity-90">
                  {isGeneratingWorld
                    ? "Generating world with AI seed..."
                    : "AI-powered world generation with interconnected assets"}
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-text-tertiary text-center mt-6">
          Tip: World generation creates a complete game world with themed assets
          automatically
        </p>
      </div>
    </div>
  );
};
