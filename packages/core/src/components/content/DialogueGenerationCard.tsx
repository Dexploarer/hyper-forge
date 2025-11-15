import {
  MessageSquare,
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
import type { DialogueNode, QualityLevel } from "@/types/content";

interface DialogueGenerationCardProps {
  onGenerated?: (nodes: DialogueNode[], rawResponse: string) => void;
  initialPrompt?: string;
}

export const DialogueGenerationCard: React.FC<DialogueGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const { navigateToPlaytester } = useNavigation();
  const [apiClient] = useState(() => new ContentAPIClient());
  const [prompt, setPrompt] = useState("");
  const [npcName, setNpcName] = useState("");
  const [personality, setPersonality] = useState("");
  const [context, setContext] = useState("");
  const [worldConfigId, setWorldConfigId] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityLevel>("speed");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedDialogue, setLastGeneratedDialogue] = useState<
    DialogueNode[] | null
  >(null);

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
    if (!prompt) {
      notify.warning("Please enter a prompt to generate dialogue");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await apiClient.generateDialogue({
        prompt,
        npcName: npcName || undefined,
        npcPersonality: personality || undefined,
        context: context || undefined,
        quality,
        worldConfigId: worldConfigId || undefined,
      });

      setLastGeneratedDialogue(result.nodes);
      onGenerated?.(result.nodes, result.rawResponse);
      notify.success(`Generated ${result.nodes.length} dialogue nodes!`);
    } catch (error) {
      console.error("Failed to generate dialogue:", error);
      notify.error("Failed to generate dialogue");
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
        type: "dialogue",
        name: data.name,
        content: {
          prompt,
          npcName: npcName || undefined,
          personality: personality || undefined,
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
        type: "dialogue",
        name: data.name,
        content: {
          prompt,
          npcName: npcName || undefined,
          personality: personality || undefined,
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
    setNpcName(loadedPrompt.content.npcName || "");
    setPersonality(loadedPrompt.content.personality || "");
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
      if (prompt) {
        setShowSavePrompt(true);
      }
    },
    onLoad: () => setShowLoadPrompt(true),
    enabled: true,
  });

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-green-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Dialogue Tree Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Generate branching NPC dialogue
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
        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Description / Requirements{" "}
            <span className="text-red-400 ml-1">*</span>
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a dialogue tree for a wise elder who offers cryptic advice about the upcoming danger..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {prompt.length} / 500
          </div>
        </div>

        {/* NPC Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            NPC Name{" "}
            <span className="text-text-tertiary font-normal text-xs">
              (Optional)
            </span>
          </label>
          <Input
            value={npcName}
            onChange={(e) => setNpcName(e.target.value)}
            placeholder="e.g., Elder Thornwood, Captain Blackwood..."
            className="w-full"
            maxLength={50}
          />
        </div>

        {/* Personality */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Personality / Traits{" "}
            <span className="text-text-tertiary font-normal text-xs">
              (Optional)
            </span>
          </label>

          {/* Helper: Personality Traits from World Config */}
          {worldConfigOptions.personalityTraits.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  // Append selected trait to personality field
                  const newPersonality = personality
                    ? `${personality}, ${e.target.value}`
                    : e.target.value;
                  setPersonality(newPersonality);
                  e.target.value = ""; // Reset dropdown
                }
              }}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-bg-tertiary/50 border border-border-primary/30 rounded-lg text-sm text-text-secondary focus:border-primary focus:outline-none [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
            >
              <option value="">💡 Quick add from world config...</option>
              {worldConfigOptions.personalityTraits.map((trait) => (
                <option key={trait} value={trait}>
                  {trait}
                </option>
              ))}
            </select>
          )}

          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="e.g., Wise and patient, speaks in riddles, former warrior turned scholar..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={300}
          />
          <div className="text-xs text-text-tertiary text-right">
            {personality.length} / 300
          </div>
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Context / Situation (Optional)
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Player meets NPC at the crossroads after completing the previous quest..."
            className="w-full min-h-[80px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={200}
          />
          <div className="text-xs text-text-tertiary text-right">
            {context.length} / 200
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
            disabled={!prompt || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="md" className="mr-2" />
                Generating Dialogue...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 mr-2" />
                Generate Dialogue
              </>
            )}
          </Button>

          {lastGeneratedDialogue && (
            <Button
              onClick={() => {
                navigateToPlaytester(lastGeneratedDialogue, "dialogue");
                notify.success("Imported dialogue to playtester!");
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
        promptType="dialogue"
        currentContent={{
          prompt,
          npcName: npcName || undefined,
          personality: personality || undefined,
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
        promptType="dialogue"
      />
    </Card>
  );
};
