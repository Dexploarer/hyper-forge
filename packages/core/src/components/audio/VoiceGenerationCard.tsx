import {
  Mic,
  Sparkles,
  Save,
  Play,
  Pause,
  Loader2,
  Settings,
  Search,
  FolderOpen,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
} from "../common";
import { SavePromptModal, PromptLibraryModal } from "../prompts";
import { AudioAPIClient } from "@/services/api/AudioAPIClient";
import { usePromptLibrary } from "@/hooks/usePromptLibrary";
import { notify } from "@/utils/notify";
import type {
  Voice,
  VoicePreview,
  VoiceMode,
  VoiceSettings,
} from "@/types/audio";
import { cn } from "@/styles";
import { NPC_VOICE_PROMPTS } from "@/constants/npc-prompts";

interface VoiceGenerationCardProps {
  onGenerated?: (audioData: string, metadata: any) => void;
  initialPrompt?: string;
}

export const VoiceGenerationCard: React.FC<VoiceGenerationCardProps> = ({
  onGenerated,
  initialPrompt,
}) => {
  const [apiClient] = useState(() => new AudioAPIClient());

  // Mode toggle
  const [mode, setMode] = useState<VoiceMode>("existing");

  // Existing voice mode
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [ttsText, setTtsText] = useState("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");

  // Voice design mode
  const [voiceDescription, setVoiceDescription] = useState("");
  const [previews, setPreviews] = useState<VoicePreview[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string>("");
  const [newVoiceName, setNewVoiceName] = useState("");

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !ttsText && !voiceDescription) {
      // If prompt mentions voice design keywords, use voiceDescription, otherwise use ttsText
      const lowerPrompt = initialPrompt.toLowerCase();
      if (
        lowerPrompt.includes("voice") &&
        (lowerPrompt.includes("design") ||
          lowerPrompt.includes("create") ||
          lowerPrompt.includes("new"))
      ) {
        setVoiceDescription(initialPrompt);
      } else {
        setTtsText(initialPrompt);
      }
    }
  }, [initialPrompt, ttsText, voiceDescription]);

  // Voice settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarityBoost: 0.75,
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Prompt library
  const { savePrompt, isLoading: isSavingPrompt } = usePromptLibrary();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  // Audio preview
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load voices on mount
  useEffect(() => {
    if (mode === "existing") {
      loadVoices();
    }
  }, [mode]);

  const loadVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const voiceList = await apiClient.getVoiceLibrary();

      // Check if we have cached gaming previews
      const cacheKey = "voice-gaming-previews";
      const cachedPreviews = localStorage.getItem(cacheKey);
      let gamingPreviews: Record<string, string> = {};

      if (cachedPreviews) {
        // Use cached previews
        gamingPreviews = JSON.parse(cachedPreviews);
        console.log(
          `[Voice] Using ${Object.keys(gamingPreviews).length} cached gaming previews`,
        );
      } else {
        // Generate gaming previews once and cache them
        console.log(
          `[Voice] Generating gaming previews for ${voiceList.length} voices...`,
        );
        notify.info(
          "Generating gaming voice previews... This only happens once!",
        );

        for (let i = 0; i < voiceList.length; i++) {
          const voice = voiceList[i];
          const npcPrompt = NPC_VOICE_PROMPTS[i % NPC_VOICE_PROMPTS.length];

          try {
            console.log(
              `[Voice] Generating preview ${i + 1}/${voiceList.length}: ${voice.name} - ${npcPrompt.archetype}`,
            );

            const audioData = await apiClient.generateVoice({
              text: npcPrompt.text,
              voiceId: voice.voiceId,
              settings,
            });

            // Cache the base64 audio data
            gamingPreviews[voice.voiceId] = audioData;
          } catch (error) {
            console.error(
              `[Voice] Failed to generate preview for ${voice.name}:`,
              error,
            );
            // Keep original preview URL if generation fails
          }
        }

        // Save to localStorage
        localStorage.setItem(cacheKey, JSON.stringify(gamingPreviews));
        notify.success("Gaming voice previews generated and cached!");
      }

      // Apply gaming previews and descriptions to voices
      const voicesWithGamePreviews = voiceList.map((voice, index) => {
        const npcPrompt = NPC_VOICE_PROMPTS[index % NPC_VOICE_PROMPTS.length];
        const cachedPreview = gamingPreviews[voice.voiceId];

        return {
          ...voice,
          // Use cached gaming preview if available, otherwise keep original
          previewUrl: cachedPreview
            ? `data:audio/mpeg;base64,${cachedPreview}`
            : voice.previewUrl,
          description: `${npcPrompt.archetype}: "${npcPrompt.text.substring(0, 60)}..."`,
        };
      });

      setVoices(voicesWithGamePreviews);
      if (voicesWithGamePreviews.length > 0 && !selectedVoice) {
        setSelectedVoice(voicesWithGamePreviews[0].voiceId);
      }
    } catch (error) {
      console.error("Failed to load voices:", error);
      notify.error("Failed to load voice library");
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!ttsText || !selectedVoice) {
      notify.warning("Please enter text and select a voice");
      return;
    }

    try {
      setIsGenerating(true);
      const audioData = await apiClient.generateVoice({
        text: ttsText,
        voiceId: selectedVoice,
        settings,
      });

      const selectedVoiceObj = voices.find((v) => v.voiceId === selectedVoice);

      onGenerated?.(audioData, {
        type: "voice",
        voiceId: selectedVoice,
        voiceName: selectedVoiceObj?.name || "Unknown",
        text: ttsText,
        settings,
      });

      notify.success("Voice generated successfully!");
    } catch (error) {
      console.error("Failed to generate voice:", error);
      notify.error("Failed to generate voice");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDesignVoice = async () => {
    if (!voiceDescription) {
      notify.warning("Please enter a voice description");
      return;
    }

    try {
      setIsDesigning(true);
      const result = await apiClient.designVoice({
        voiceDescription,
        autoGenerateText: true,
      });

      setPreviews(result.previews || []);
      notify.success(
        `Generated ${result.previews?.length || 0} voice previews!`,
      );
    } catch (error) {
      console.error("Failed to design voice:", error);
      notify.error("Failed to design voice");
    } finally {
      setIsDesigning(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!newVoiceName || !selectedPreview) {
      notify.warning("Please enter a name and select a preview");
      return;
    }

    try {
      setIsSaving(true);
      const newVoice = await apiClient.createVoiceFromPreview({
        voiceName: newVoiceName,
        voiceDescription,
        generatedVoiceId: selectedPreview,
      });

      notify.success(`Voice "${newVoice.name}" saved to library!`);

      // Reset and switch to existing mode
      setPreviews([]);
      setSelectedPreview("");
      setNewVoiceName("");
      setVoiceDescription("");
      setMode("existing");
      loadVoices();
    } catch (error) {
      console.error("Failed to save voice:", error);
      notify.error("Failed to save voice to library");
    } finally {
      setIsSaving(false);
    }
  };

  const playPreview = (audioSource: string, previewId: string) => {
    if (playingPreview === previewId) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        // Check if it's already a data URL, HTTP URL, or raw base64
        if (audioSource.startsWith("http") || audioSource.startsWith("data:")) {
          audioRef.current.src = audioSource;
        } else {
          // Raw base64, add the data URL prefix
          audioRef.current.src = `data:audio/mpeg;base64,${audioSource}`;
        }
        audioRef.current.play();
        setPlayingPreview(previewId);
      }
    }
  };

  const handleSavePrompt = async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    await savePrompt({
      type: "voice",
      name: data.name,
      content: {
        mode,
        text: ttsText || undefined,
        voiceId: selectedVoice || undefined,
        voiceDescription: voiceDescription || undefined,
        settings,
      },
      description: data.description,
      isPublic: data.isPublic,
    });
    setShowSavePrompt(false);
  };

  const handleLoadPrompt = (loadedPrompt: any) => {
    if (loadedPrompt.content.mode) {
      setMode(loadedPrompt.content.mode);
    }
    setTtsText(loadedPrompt.content.text || "");
    if (loadedPrompt.content.voiceId) {
      setSelectedVoice(loadedPrompt.content.voiceId);
    }
    setVoiceDescription(loadedPrompt.content.voiceDescription || "");
    if (loadedPrompt.content.settings) {
      setSettings(loadedPrompt.content.settings);
    }
    notify.success(`Loaded prompt: ${loadedPrompt.name}`);
  };

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-blue-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Mic className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Voice Generation
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {mode === "existing"
                  ? "Generate speech from text"
                  : "Design a custom voice"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={mode === "existing" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setMode("existing")}
              >
                Use Existing
              </Button>
              <Button
                variant={mode === "design" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setMode("design")}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Design Voice
              </Button>
            </div>

            {/* Prompt Library Buttons */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border-primary">
              <button
                onClick={() => setShowLoadPrompt(true)}
                className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all"
                title="Load saved prompt"
              >
                <FolderOpen className="w-4 h-4 text-text-secondary hover:text-primary" />
              </button>
              <button
                onClick={() => setShowSavePrompt(true)}
                disabled={!ttsText && !voiceDescription}
                className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-tertiary border border-border-primary hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save current prompt"
              >
                <Save className="w-4 h-4 text-text-secondary hover:text-primary" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {mode === "existing" ? (
          // Existing Voice Mode
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Select Voice
                </label>
                <span className="text-xs text-text-tertiary">
                  {voices.length} available
                </span>
              </div>

              {/* Voice Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search voices by name, category, or description..."
                  className="w-full pl-10 bg-bg-secondary/70 border-border-primary/50"
                />
              </div>

              {isLoadingVoices ? (
                <div className="text-center py-8 text-text-secondary">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading voices...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {voices
                    .filter((voice) => {
                      if (!voiceSearch) return true;
                      const search = voiceSearch.toLowerCase();
                      return (
                        voice.name.toLowerCase().includes(search) ||
                        voice.category?.toLowerCase().includes(search) ||
                        voice.description?.toLowerCase().includes(search)
                      );
                    })
                    .map((voice) => {
                      const isSelected = selectedVoice === voice.voiceId;
                      const isPlaying = playingPreview === voice.voiceId;

                      return (
                        <div
                          key={voice.voiceId}
                          onClick={() => setSelectedVoice(voice.voiceId)}
                          className={cn(
                            "p-3 rounded-lg border-2 cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                              : "border-border-primary bg-bg-tertiary/30 hover:border-primary/50 hover:bg-bg-tertiary/50",
                          )}
                        >
                          {/* Voice Name with Play Button */}
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className={cn(
                                "text-sm font-semibold flex-1 truncate",
                                isSelected
                                  ? "text-primary"
                                  : "text-text-primary",
                              )}
                            >
                              {voice.name}
                            </h4>
                            {voice.previewUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPreview(voice.previewUrl!, voice.voiceId);
                                }}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all flex-shrink-0",
                                  isPlaying
                                    ? "bg-primary text-white shadow-lg"
                                    : "bg-primary/20 hover:bg-primary/30 text-primary",
                                )}
                                title="Preview voice"
                              >
                                {isPlaying ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Voice Details */}
                          {voice.description && (
                            <p className="text-xs text-text-tertiary mb-2 line-clamp-2">
                              {voice.description}
                            </p>
                          )}
                          {voice.category && (
                            <span className="inline-block px-2 py-0.5 bg-bg-secondary rounded text-xs text-text-secondary capitalize">
                              {voice.category}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {!isLoadingVoices && voices.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No voices available</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Text to Speak
              </label>
              <Textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
                maxLength={1000}
              />
              <div className="text-xs text-text-tertiary text-right">
                {ttsText.length} / 1000
              </div>
            </div>

            {/* Voice Settings */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-primary hover:text-primary-light flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showSettings ? "Hide" : "Show"} Voice Settings
              </button>

              {showSettings && (
                <div className="p-4 bg-bg-tertiary/50 rounded-lg space-y-4">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">
                      Stability: {settings.stability?.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.stability || 0.5}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          stability: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">
                      Similarity Boost: {settings.similarityBoost?.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.similarityBoost || 0.75}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          similarityBoost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerateVoice}
              disabled={!ttsText || !selectedVoice || isGenerating}
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
                  <Mic className="w-5 h-5 mr-2" />
                  Generate Voice
                </>
              )}
            </Button>
          </>
        ) : (
          // Design Voice Mode
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Voice Description
              </label>
              <Textarea
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="Describe the voice you want to create, e.g., 'Deep male warrior voice with a slight rasp'"
                className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
                maxLength={500}
              />
              <div className="text-xs text-text-tertiary text-right">
                {voiceDescription.length} / 500
              </div>
            </div>

            <Button
              onClick={handleDesignVoice}
              disabled={!voiceDescription || isDesigning}
              className="w-full"
              size="lg"
            >
              {isDesigning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Designing Voice...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Voice Previews
                </>
              )}
            </Button>

            {/* Voice Previews */}
            {previews.length > 0 && (
              <div className="space-y-4 mt-6 pt-6 border-t border-border-primary">
                <h4 className="text-sm font-semibold text-text-primary">
                  Voice Previews
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {previews.map((preview, index) => (
                    <div
                      key={preview.generated_voice_id}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedPreview === preview.generated_voice_id
                          ? "border-primary bg-primary/10"
                          : "border-border-primary bg-bg-tertiary/30 hover:border-primary/50",
                      )}
                      onClick={() =>
                        setSelectedPreview(preview.generated_voice_id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                          Preview {index + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playPreview(
                              preview.audio_base_64,
                              preview.generated_voice_id,
                            );
                          }}
                          className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                        >
                          {playingPreview === preview.generated_voice_id ? (
                            <Pause className="w-4 h-4 text-primary" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Voice */}
                {selectedPreview && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-border-primary">
                    <Input
                      value={newVoiceName}
                      onChange={(e) => setNewVoiceName(e.target.value)}
                      placeholder="Enter a name for this voice..."
                      className="w-full"
                    />
                    <Button
                      onClick={handleSaveVoice}
                      disabled={!newVoiceName || isSaving}
                      className="w-full"
                      variant="primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Voice to Library
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Hidden audio element for previews */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingPreview(null)}
        style={{ display: "none" }}
      />

      {/* Prompt Library Modals */}
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSave={handleSavePrompt}
        promptType="voice"
        currentContent={{
          mode,
          text: ttsText || undefined,
          voiceId: selectedVoice || undefined,
          voiceDescription: voiceDescription || undefined,
          settings,
        }}
        loading={isSavingPrompt}
      />

      <PromptLibraryModal
        open={showLoadPrompt}
        onClose={() => setShowLoadPrompt(false)}
        onLoad={handleLoadPrompt}
        promptType="voice"
      />
    </Card>
  );
};
