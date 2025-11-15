import {
  Scroll,
  Loader2,
  Zap,
  Shield,
  Sparkles,
  TestTube2,
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
import { ContentAPIClient } from "@/services/api/ContentAPIClient";
import { useWorldConfigOptions } from "@/hooks/useWorldConfigOptions";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { usePromptKeyboardShortcuts } from "@/hooks/usePromptKeyboardShortcuts";
import { notify } from "@/utils/notify";
import { useNavigation } from "@/hooks/useNavigation";
import type { QuestData, QualityLevel } from "@/types/content";

interface QuestGenerationCardProps {
  onGenerated?: (
    quest: QuestData & {
      id: string;
      difficulty: string;
      questType: string;
      metadata: any;
    },
    rawResponse: string,
  ) => void;
  initialPrompt?: string;
}

const QUEST_TYPES = [
  "Main Story",
  "Side Quest",
  "Fetch Quest",
  "Kill Quest",
  "Escort Quest",
  "Collection Quest",
  "Exploration Quest",
  "Puzzle Quest",
  "Rescue Mission",
  "Investigation",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Very Hard", "Epic"];

export const QuestGenerationCard: React.FC<QuestGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const { navigateToPlaytester } = useNavigation();
  const [apiClient] = useState(() => new ContentAPIClient());
  const [questType, setQuestType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("");
  const [context, setContext] = useState("");
  const [worldConfigId, setWorldConfigId] = useState<string | null>(null);

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
  const [lastGeneratedQuest, setLastGeneratedQuest] = useState<
    | (QuestData & {
        id: string;
        difficulty: string;
        questType: string;
        metadata: any;
      })
    | null
  >(null);

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, prompt]);
  const [quality, setQuality] = useState<QualityLevel>("quality");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt && !theme) {
      notify.warning("Please enter a prompt or theme to generate a quest");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await apiClient.generateQuest({
        prompt: prompt || undefined,
        questType: questType || undefined,
        difficulty: difficulty || undefined,
        theme: theme || undefined,
        context: context || undefined,
        quality,
        worldConfigId: worldConfigId || undefined,
      });

      setLastGeneratedQuest(result.quest);
      onGenerated?.(result.quest, result.rawResponse);
      notify.success("Quest generated successfully!");
    } catch (error) {
      console.error("Failed to generate quest:", error);
      notify.error("Failed to generate quest");
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
        type: "quest",
        name: data.name,
        content: {
          prompt,
          archetype: questType || undefined,
          context: context || undefined,
          settings: {
            difficulty: difficulty || undefined,
            theme: theme || undefined,
          },
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
        type: "quest",
        name: data.name,
        content: {
          prompt,
          archetype: questType || undefined,
          context: context || undefined,
          settings: {
            difficulty: difficulty || undefined,
            theme: theme || undefined,
          },
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
    setQuestType(loadedPrompt.content.archetype || "");
    setContext(loadedPrompt.content.context || "");
    if (loadedPrompt.content.settings?.difficulty) {
      setDifficulty(loadedPrompt.content.settings.difficulty);
    }
    if (loadedPrompt.content.settings?.theme) {
      setTheme(loadedPrompt.content.settings.theme);
    }
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
      if (prompt || theme) {
        setShowSavePrompt(true);
      }
    },
    onLoad: () => setShowLoadPrompt(true),
    enabled: true,
  });

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-purple-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Scroll className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Quest Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Create quests with AI
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
              disabled={!prompt && !theme}
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
            placeholder="e.g., A quest where the player must retrieve a stolen artifact from a dragon's lair..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {prompt.length} / 500
          </div>
        </div>

        {/* Quest Type Selection */}
        <SelectOrCustom
          value={questType}
          onChange={setQuestType}
          options={[
            ...QUEST_TYPES,
            ...(worldConfigOptions.questTypes || []),
          ].filter((v, i, a) => a.indexOf(v) === i)} // Remove duplicates
          label="Quest Type"
          required={false}
          disabled={isGenerating}
          customPlaceholder="Enter custom quest type..."
          allowEmpty={true}
        />

        {/* Difficulty Selection */}
        <SelectOrCustom
          value={difficulty}
          onChange={setDifficulty}
          options={[
            ...DIFFICULTIES,
            ...(worldConfigOptions.difficulties || []),
          ].filter((v, i, a) => a.indexOf(v) === i)} // Remove duplicates
          label="Difficulty"
          required={false}
          disabled={isGenerating}
          customPlaceholder="Enter custom difficulty..."
          allowEmpty={true}
        />

        {/* Theme */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Theme (Optional)
          </label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., dark magic, ancient ruins, political intrigue..."
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
            placeholder="e.g., This quest takes place in a haunted forest where villagers have gone missing..."
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

        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={(!prompt && !theme) || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="md" className="mr-2" />
                Generating Quest...
              </>
            ) : (
              <>
                <Scroll className="w-5 h-5 mr-2" />
                Generate Quest
              </>
            )}
          </Button>

          {lastGeneratedQuest && (
            <Button
              onClick={() => {
                const { id, metadata, ...questData } = lastGeneratedQuest;
                navigateToPlaytester(questData, "quest");
                notify.success("Imported quest to playtester!");
              }}
              variant="secondary"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              size="lg"
            >
              <TestTube2 className="w-5 h-5 mr-2" />
              Import to Playtester
            </Button>
          )}
        </div>
      </CardContent>

      {/* Prompt Library Modals */}
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => {
          setShowSavePrompt(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        promptType="quest"
        currentContent={{
          prompt,
          archetype: questType || undefined,
          context: context || undefined,
          settings: {
            difficulty: difficulty || undefined,
            theme: theme || undefined,
          },
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
        promptType="quest"
      />
    </Card>
  );
};
