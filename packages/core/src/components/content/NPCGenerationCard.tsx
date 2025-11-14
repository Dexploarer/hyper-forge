import {
  BookOpen,
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
} from "../common";
import { WorldConfigSelector } from "../world-config";
import { SavePromptModal, PromptLibraryModal } from "../prompts";
import { ContentAPIClient } from "@/services/api/ContentAPIClient";
import { useWorldConfigOptions } from "@/hooks/useWorldConfigOptions";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { notify } from "@/utils/notify";
import { useNavigation } from "@/hooks/useNavigation";
import type { NPCData, QualityLevel } from "@/types/content";

interface NPCGenerationCardProps {
  onGenerated?: (
    npc: NPCData & { id: string; metadata: any },
    rawResponse: string,
  ) => void;
  initialPrompt?: string;
}

const ARCHETYPES = [
  "Merchant",
  "Guard",
  "Quest Giver",
  "Blacksmith",
  "Innkeeper",
  "Wizard",
  "Warrior",
  "Thief",
  "Priest",
  "Noble",
  "Villager",
  "Hunter",
  "Scholar",
  "Healer",
  "Bard",
];

export const NPCGenerationCard: React.FC<NPCGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const { navigateToPlaytester } = useNavigation();
  const [apiClient] = useState(() => new ContentAPIClient());
  const [archetype, setArchetype] = useState("");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [worldConfigId, setWorldConfigId] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityLevel>("quality");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedNPC, setLastGeneratedNPC] = useState<
    (NPCData & { id: string; metadata: any }) | null
  >(null);

  // Prompt library
  const { savePrompt, isLoading: isSavingPrompt } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  // Fetch world config options
  const worldConfigOptions = useWorldConfigOptions(worldConfigId);

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, prompt]);

  const handleGenerate = async () => {
    if (!prompt) {
      notify.warning("Please enter a prompt to generate an NPC");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await apiClient.generateNPC({
        prompt,
        archetype: archetype || undefined,
        context: context || undefined,
        quality,
        worldConfigId: worldConfigId || undefined,
      });

      setLastGeneratedNPC(result.npc);
      onGenerated?.(result.npc, result.rawResponse);
      notify.success("NPC generated successfully!");
    } catch (error) {
      console.error("Failed to generate NPC:", error);
      notify.error("Failed to generate NPC");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    await savePrompt({
      type: "npc",
      name: data.name,
      content: {
        prompt,
        archetype: archetype || undefined,
        context: context || undefined,
      },
      description: data.description,
      isPublic: data.isPublic,
      metadata: {
        quality,
        worldConfigId: worldConfigId || undefined,
      },
    });
    setShowSavePrompt(false);
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setPrompt(loadedPrompt.content.prompt || "");
    setArchetype(loadedPrompt.content.archetype || "");
    setContext(loadedPrompt.content.context || "");
    if (loadedPrompt.metadata?.quality) {
      setQuality(loadedPrompt.metadata.quality);
    }
    if (loadedPrompt.metadata?.worldConfigId) {
      setWorldConfigId(loadedPrompt.metadata.worldConfigId);
    }
    notify.success(`Loaded prompt: ${loadedPrompt.name}`);
  };

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-blue-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                NPC Character Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Create complete NPCs with AI
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
              disabled={!prompt}
              className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save current prompt"
            >
              <Save className="w-4 h-4 text-text-secondary hover:text-primary" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Archetype Selection */}
        <SelectOrCustom
          value={archetype}
          onChange={setArchetype}
          options={[
            ...ARCHETYPES,
            ...(worldConfigOptions.npcArchetypes || []),
            ...(worldConfigOptions.characterClasses || []),
            ...(worldConfigOptions.races || []),
          ].filter((v, i, a) => a.indexOf(v) === i)} // Remove duplicates
          label="Archetype"
          required={false}
          disabled={isGenerating}
          customPlaceholder="Enter custom archetype..."
          allowEmpty={true}
        />

        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Description / Requirements{" "}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A grumpy old blacksmith who has crafted legendary weapons for heroes..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {prompt.length} / 500
          </div>
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Additional Context (Optional)
          </label>
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Medieval fantasy setting, dwarven kingdom..."
            className="w-full"
            maxLength={200}
          />
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
            disabled={!prompt || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating NPC...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Generate NPC
              </>
            )}
          </Button>

          {lastGeneratedNPC && (
            <Button
              onClick={() => {
                const { id, metadata, ...npcData } = lastGeneratedNPC;
                navigateToPlaytester(npcData, "npc");
                notify.success("Imported NPC to playtester!");
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
        onClose={() => setShowSavePrompt(false)}
        onSave={handleSavePrompt}
        promptType="npc"
        currentContent={{
          prompt,
          archetype: archetype || undefined,
          context: context || undefined,
        }}
        loading={isSavingPrompt}
      />

      <PromptLibraryModal
        open={showLoadPrompt}
        onClose={() => setShowLoadPrompt(false)}
        onLoad={handleLoadPrompt}
        promptType="npc"
      />
    </Card>
  );
};
