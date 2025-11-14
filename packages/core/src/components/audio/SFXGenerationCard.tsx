import { Radio, Loader2, Save, FolderOpen } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Textarea,
} from "../common";
import { SavePromptModal, PromptLibraryModal } from "../prompts";
import { AudioAPIClient } from "@/services/api/AudioAPIClient";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { notify } from "@/utils/notify";

interface SFXGenerationCardProps {
  onGenerated?: (audioBlob: Blob, metadata: any) => void;
  initialPrompt?: string;
}

export const SFXGenerationCard: React.FC<SFXGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const [apiClient] = useState(() => new AudioAPIClient());
  const [description, setDescription] = useState("");

  // Populate description from initialPrompt
  useEffect(() => {
    if (initialPrompt && !description) {
      setDescription(initialPrompt);
    }
  }, [initialPrompt, description]);
  const [duration, setDuration] = useState(3);
  const [promptInfluence, setPromptInfluence] = useState(0.3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Prompt library
  const { savePrompt, isLoading: isSavingPrompt } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  const handleGenerate = async () => {
    if (!description) {
      notify.warning("Please enter a sound effect description");
      return;
    }

    try {
      setIsGenerating(true);
      const audioBlob = await apiClient.generateSFX({
        text: description,
        durationSeconds: duration,
        promptInfluence,
      });

      onGenerated?.(audioBlob, {
        type: "sfx",
        description,
        duration,
        promptInfluence,
      });

      notify.success("Sound effect generated successfully!");
    } catch (error) {
      console.error("Failed to generate SFX:", error);
      notify.error("Failed to generate sound effect");
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
      type: "sfx",
      name: data.name,
      content: {
        prompt: description,
        settings: {
          duration,
          promptInfluence,
        },
      },
      description: data.description,
      isPublic: data.isPublic,
    });
    setShowSavePrompt(false);
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setDescription(loadedPrompt.content.prompt || "");
    if (loadedPrompt.content.settings?.duration) {
      setDuration(loadedPrompt.content.settings.duration);
    }
    if (loadedPrompt.content.settings?.promptInfluence !== undefined) {
      setPromptInfluence(loadedPrompt.content.settings.promptInfluence);
    }
    notify.success(`Loaded prompt: ${loadedPrompt.name}`);
  };

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-purple-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Radio className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Sound Effects
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Generate game sound effects from text
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
              disabled={!description}
              className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save current prompt"
            >
              <Save className="w-4 h-4 text-text-secondary hover:text-primary" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Sound Effect Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., sword swinging through air, footsteps on stone floor, door creaking open..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {description.length} / 500
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Duration: {duration.toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.5"
            max="22"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-text-tertiary">
            Range: 0.5 - 22 seconds
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Prompt Influence: {promptInfluence.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={promptInfluence}
            onChange={(e) => setPromptInfluence(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-text-tertiary">
            Higher values stick closer to the description, lower values are more
            creative
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!description || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Radio className="w-5 h-5 mr-2" />
              Generate Sound Effect
            </>
          )}
        </Button>
      </CardContent>

      {/* Prompt Library Modals */}
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSave={handleSavePrompt}
        promptType="sfx"
        currentContent={{
          prompt: description,
          settings: {
            duration,
            promptInfluence,
          },
        }}
        loading={isSavingPrompt}
      />

      <PromptLibraryModal
        open={showLoadPrompt}
        onClose={() => setShowLoadPrompt(false)}
        onLoad={handleLoadPrompt}
        promptType="sfx"
      />
    </Card>
  );
};
