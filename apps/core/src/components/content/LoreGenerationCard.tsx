import {
  Book,
  Loader2,
  Zap,
  Shield,
  Sparkles,
  Save,
  FolderOpen,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
  SelectOrCustom,
  LoadingSpinner,
} from "../common";
import { WorldConfigSelector } from "../world-config";
import { SavePromptModal, PromptLibraryModal } from "../prompts";
import { api } from "@/lib/api-client";
import { useWorldConfigOptions } from "@/hooks/useWorldConfigOptions";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { usePromptKeyboardShortcuts } from "@/hooks/usePromptKeyboardShortcuts";
import { notify } from "@/utils/notify";
import type { LoreData, QualityLevel } from "@/types/content";

interface LoreGenerationCardProps {
  onGenerated?: (
    lore: LoreData & { id: string; metadata: any },
    rawResponse: string,
  ) => void;
  initialPrompt?: string;
}

const CATEGORIES = [
  "History",
  "Religion",
  "Culture",
  "Geography",
  "Magic System",
  "Mythology",
  "Politics",
  "Technology",
  "Factions",
  "Artifacts",
  "Events",
];

export const LoreGenerationCard: React.FC<LoreGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [worldConfigId, setWorldConfigId] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityLevel>("balanced");
  const [isGenerating, setIsGenerating] = useState(false);

  // Prompt library
  const {
    savePrompt,
    updatePrompt,
    isLoading: isSavingPrompt,
  } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  // Fetch world config options
  const worldConfigOptions = useWorldConfigOptions(worldConfigId);

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, prompt]);

  const handleGenerate = async () => {
    if (!prompt && !topic) {
      notify.warning("Please enter a prompt or topic to generate lore");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await api.api.content["generate-lore"].post({
        prompt: prompt || undefined,
        category: category || undefined,
        topic: topic || undefined,
        context: context || undefined,
        quality,
        worldConfigId: worldConfigId || undefined,
      });

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate lore",
        );
      }

      if (result.data) {
        // API returns plain object, cast to expected type
        const loreWithMeta = {
          ...result.data.lore,
          metadata: result.data.lore.metadata || {},
        } as LoreData & { id: string; metadata: any };
        onGenerated?.(loreWithMeta, result.data.rawResponse);
        notify.success("Lore generated successfully!");
      }
    } catch (error) {
      console.error("Failed to generate lore:", error);
      notify.error("Failed to generate lore");
    } finally {
      setIsGenerating(false);
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
        type: "lore",
        name: data.name,
        content: {
          prompt,
          category: category || undefined,
          topic: topic || undefined,
          context: context || undefined,
        },
        description: data.description,
        isPublic: data.isPublic,
        metadata: {
          quality,
          worldConfigId: worldConfigId || undefined,
        },
      });
      setEditingPrompt(null);
    } else {
      // CREATE new prompt
      await savePrompt({
        type: "lore",
        name: data.name,
        content: {
          prompt,
          category: category || undefined,
          topic: topic || undefined,
          context: context || undefined,
        },
        description: data.description,
        isPublic: data.isPublic,
        metadata: {
          quality,
          worldConfigId: worldConfigId || undefined,
        },
      });
    }
    setShowSavePrompt(false);
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setPrompt(loadedPrompt.content.prompt || "");
    setCategory(loadedPrompt.content.category || "");
    setTopic(loadedPrompt.content.topic || "");
    setContext(loadedPrompt.content.context || "");
    if (loadedPrompt.metadata?.quality) {
      setQuality(loadedPrompt.metadata.quality);
    }
    if (loadedPrompt.metadata?.worldConfigId) {
      setWorldConfigId(loadedPrompt.metadata.worldConfigId);
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
      if (prompt || topic) {
        setShowSavePrompt(true);
      }
    },
    onLoad: () => setShowLoadPrompt(true),
    enabled: true,
  });

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-orange-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <Book className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                World Lore Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Create rich world-building lore
              </CardDescription>
            </div>
          </div>

          {/* Prompt Library Buttons */}
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
              disabled={!prompt && !topic}
              className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save current prompt"
            >
              <Save className="w-4 h-4 text-text-secondary hover:text-primary" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Description / Requirements{" "}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create lore about an ancient war between dragons and humans that shaped the current political landscape..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {prompt.length} / 500
          </div>
        </div>

        {/* Category Selection */}
        <SelectOrCustom
          value={category}
          onChange={setCategory}
          options={[
            ...CATEGORIES,
            ...(worldConfigOptions.loreCategories || []),
          ].filter((v, i, a) => a.indexOf(v) === i)} // Remove duplicates
          label="Category"
          required={false}
          disabled={isGenerating}
          customPlaceholder="Enter custom category..."
          allowEmpty={true}
        />

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Topic / Subject{" "}
            <span className="text-text-tertiary font-normal text-xs">
              (Optional)
            </span>
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Great Dragon War, Council of Elders, Ancient Runes..."
            className="w-full"
            maxLength={100}
          />
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Additional Context (Optional)
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., High fantasy setting with multiple kingdoms, magic is feared and regulated..."
            className="w-full min-h-[80px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={300}
          />
          <div className="text-xs text-text-tertiary text-right">
            {context.length} / 300
          </div>
        </div>

        {/* World Configuration */}
        <WorldConfigSelector
          value={worldConfigId}
          onChange={setWorldConfigId}
          disabled={isGenerating}
        />

        {/* Quality Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setQuality("speed")}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === "speed"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50"
              }`}
            >
              <Zap className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Speed</div>
            </button>
            <button
              onClick={() => setQuality("balanced")}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === "balanced"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50"
              }`}
            >
              <Shield className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Balanced</div>
            </button>
            <button
              onClick={() => setQuality("quality")}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === "quality"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50"
              }`}
            >
              <Sparkles className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Quality</div>
            </button>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={(!prompt && !topic) || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="md" className="mr-2" />
              Generating Lore...
            </>
          ) : (
            <>
              <Book className="w-5 h-5 mr-2" />
              Generate Lore
            </>
          )}
        </Button>
      </CardContent>

      {/* Prompt Library Modals */}
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => {
          setShowSavePrompt(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        promptType="lore"
        currentContent={{
          prompt,
          category: category || undefined,
          topic: topic || undefined,
          context: context || undefined,
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
        promptType="lore"
      />
    </Card>
  );
};
