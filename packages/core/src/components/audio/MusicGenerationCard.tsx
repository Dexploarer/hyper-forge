import { Music, Loader2, Save, FolderOpen } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Textarea,
  Checkbox,
  LoadingSpinner,
} from "../common";
import { SavePromptModal, PromptLibraryModal } from "../prompts";
import { AudioAPIClient } from "@/services/api/AudioAPIClient";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { usePromptKeyboardShortcuts } from "@/hooks/usePromptKeyboardShortcuts";
import { notify } from "@/utils/notify";

interface MusicGenerationCardProps {
  onGenerated?: (audioBlob: Blob, metadata: any) => void;
  initialPrompt?: string;
}

export const MusicGenerationCard: React.FC<MusicGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const [apiClient] = useState(() => new AudioAPIClient());
  const [prompt, setPrompt] = useState("");

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt, prompt]);
  const [lengthSeconds, setLengthSeconds] = useState(30);
  const [forceInstrumental, setForceInstrumental] = useState(true);
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

  const handleGenerate = async () => {
    if (!prompt) {
      notify.warning("Please enter a music prompt");
      return;
    }

    try {
      setIsGenerating(true);
      const audioBlob = await apiClient.generateMusic({
        prompt,
        musicLengthMs: lengthSeconds * 1000,
        forceInstrumental,
      });

      onGenerated?.(audioBlob, {
        type: "music",
        prompt,
        lengthSeconds,
        forceInstrumental,
      });

      notify.success("Music generated successfully!");
    } catch (error) {
      console.error("Failed to generate music:", error);
      notify.error("Failed to generate music");
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
        type: "music",
        name: data.name,
        content: {
          prompt,
          settings: {
            lengthSeconds,
            forceInstrumental,
          },
        },
        description: data.description,
        isPublic: data.isPublic,
      });
      setEditingPrompt(null);
      setShowSavePrompt(false);
      notify.success(`Updated prompt: ${data.name}`);
    } else {
      // CREATE new prompt
      await savePrompt({
        type: "music",
        name: data.name,
        content: {
          prompt,
          settings: {
            lengthSeconds,
            forceInstrumental,
          },
        },
        description: data.description,
        isPublic: data.isPublic,
      });
      setShowSavePrompt(false);
    }
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    setPrompt(loadedPrompt.content.prompt || "");
    if (loadedPrompt.content.settings?.lengthSeconds) {
      setLengthSeconds(loadedPrompt.content.settings.lengthSeconds);
    }
    if (loadedPrompt.content.settings?.forceInstrumental !== undefined) {
      setForceInstrumental(loadedPrompt.content.settings.forceInstrumental);
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
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-orange-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <Music className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Music Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Generate AI music for your game
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Music Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., epic orchestral battle theme, calm ambient forest music, upbeat tavern music..."
            className="w-full min-h-[120px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">
            {prompt.length} / 500
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Length: {lengthSeconds}s ({Math.floor(lengthSeconds / 60)}:
            {(lengthSeconds % 60).toString().padStart(2, "0")})
          </label>
          <input
            type="range"
            min="10"
            max="300"
            step="5"
            value={lengthSeconds}
            onChange={(e) => setLengthSeconds(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-text-tertiary">
            Range: 10 seconds - 5 minutes
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="instrumental"
            checked={forceInstrumental}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForceInstrumental(e.target.checked)
            }
          />
          <label
            htmlFor="instrumental"
            className="text-sm text-text-primary cursor-pointer"
          >
            Instrumental only (no vocals)
          </label>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="md" className="mr-2" />
              Generating Music...
            </>
          ) : (
            <>
              <Music className="w-5 h-5 mr-2" />
              Generate Music
            </>
          )}
        </Button>

        <div className="text-xs text-text-tertiary text-center">
          Note: Music generation may take 30-60 seconds depending on length
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
        promptType="music"
        currentContent={{
          prompt,
          settings: {
            lengthSeconds,
            forceInstrumental,
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
        promptType="music"
      />
    </Card>
  );
};
