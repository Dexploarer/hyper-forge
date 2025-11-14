import React, { useState, useEffect } from "react";
import { List } from "lucide-react";

import {
  AudioTypeSelector,
  TabNavigation,
  VoiceGenerationCard,
  SFXGenerationCard,
  MusicGenerationCard,
  GeneratedAudioList,
  AudioPreviewCard,
} from "@/components/audio";
import { Button, Drawer } from "@/components/common";
import type { AudioType, AudioView, GeneratedAudio } from "@/types/audio";
import { notify } from "@/utils/notify";
import { api } from "@/lib/api-client";

interface AudioGenerationPageProps {
  initialPrompt?: string;
  initialType?: AudioType; // Optional initial audio type to skip selector
}

export const AudioGenerationPage: React.FC<AudioGenerationPageProps> = ({
  initialPrompt,
  initialType,
}) => {
  // Audio type selection
  const [audioType, setAudioType] = useState<AudioType | null>(
    initialType || null,
  );

  // View management
  const [activeView, setActiveView] = useState<AudioView>("config");

  // Generated audios
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<GeneratedAudio | null>(
    null,
  );
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);

  // Auto-detect audio type from prompt and set it (only if no initialType provided)
  useEffect(() => {
    if (initialPrompt && !audioType && !initialType) {
      const lowerPrompt = initialPrompt.toLowerCase();
      // Detect audio type from keywords
      if (
        lowerPrompt.includes("voice") ||
        lowerPrompt.includes("speech") ||
        lowerPrompt.includes("tts") ||
        lowerPrompt.includes("narrat")
      ) {
        setAudioType("voice");
      } else if (
        lowerPrompt.includes("sfx") ||
        lowerPrompt.includes("sound effect") ||
        lowerPrompt.includes("effect")
      ) {
        setAudioType("sfx");
      } else if (
        lowerPrompt.includes("music") ||
        lowerPrompt.includes("song") ||
        lowerPrompt.includes("track") ||
        lowerPrompt.includes("soundtrack")
      ) {
        setAudioType("music");
      } else {
        // Default to music if unclear
        setAudioType("music");
      }
    }
  }, [initialPrompt, audioType, initialType]);

  // Load saved audio from database when page mounts or audio type changes
  useEffect(() => {
    const loadSavedAudio = async () => {
      try {
        console.log(
          `[AudioGenerationPage] Loading saved audio${audioType ? ` of type: ${audioType}` : ""}`,
        );

        const response = await api.api.voice.saved.get({
          query: {
            type: audioType || undefined,
            limit: "50",
          },
        });

        if (response.data && response.data.audio) {
          // Transform database records to GeneratedAudio format
          const loadedAudio: GeneratedAudio[] = response.data.audio.map(
            (record: any) => ({
              id: record.id,
              type: record.type,
              name:
                record.metadata?.text ||
                record.metadata?.prompt ||
                record.fileName ||
                "Saved Audio",
              audioUrl: record.fileUrl,
              audioData: undefined, // Don't need to load the base64 data
              metadata: record.metadata || {},
              createdAt: record.createdAt,
            }),
          );

          console.log(
            `[AudioGenerationPage] Loaded ${loadedAudio.length} saved audio files`,
          );

          // Only set if we have existing state (prepend) or if this is initial load
          if (generatedAudios.length === 0) {
            setGeneratedAudios(loadedAudio);
            if (loadedAudio.length > 0 && !selectedAudio) {
              setSelectedAudio(loadedAudio[0]);
            }
          }
        }
      } catch (error) {
        console.error(
          "[AudioGenerationPage] Failed to load saved audio:",
          error,
        );
        // Don't show error to user - they can still generate new audio
      }
    };

    // Only load if we have an audio type selected
    if (audioType) {
      loadSavedAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioType]); // Only run when audioType changes or on mount

  // Handle audio generation completion
  const handleAudioGenerated = async (
    audioData: string | Blob,
    metadata: any,
  ) => {
    const id = `audio-${Date.now()}`;
    let audioUrl: string;
    let base64Data: string;

    // Convert to base64 if it's a Blob
    if (audioData instanceof Blob) {
      audioUrl = URL.createObjectURL(audioData);
      // Convert blob to base64 for saving
      const arrayBuffer = await audioData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      base64Data = btoa(String.fromCharCode(...bytes));
    } else {
      // It's base64 audio data
      audioUrl = `data:audio/mpeg;base64,${audioData}`;
      base64Data = audioData;
    }

    const audioName =
      metadata.prompt ||
      metadata.text ||
      metadata.description ||
      `${metadata.type || audioType} ${generatedAudios.length + 1}`;

    const newAudio: GeneratedAudio = {
      id,
      type: metadata.type || audioType || "voice",
      name: audioName,
      audioUrl,
      audioData: base64Data,
      metadata,
      createdAt: new Date().toISOString(),
    };

    // Save to database in the background
    try {
      const response = await api.api.voice.save.post({
        name: audioName,
        type: metadata.type || audioType || "voice",
        audioData: base64Data,
        metadata: {
          voiceId: metadata.voiceId,
          voiceName: metadata.voiceName,
          text: metadata.text,
          prompt: metadata.prompt,
          description: metadata.description,
          duration: metadata.duration,
          mimeType: metadata.mimeType || "audio/mpeg",
          settings: metadata.settings,
        },
      });

      if (response.data) {
        // Update the audio with the saved ID and persistent fileUrl
        newAudio.id = response.data.id;
        newAudio.audioUrl = response.data.fileUrl;
        console.log(
          `[AudioGenerationPage] Audio saved to database: ${response.data.fileUrl}`,
        );
      }
    } catch (error) {
      console.error("[AudioGenerationPage] Failed to save audio:", error);
      notify.error("Audio generated but failed to save to database");
    }

    setGeneratedAudios((prev) => [newAudio, ...prev]);
    setSelectedAudio(newAudio);
    setActiveView("results");
  };

  // Show type selector if no type selected
  if (!audioType) {
    return (
      <div className="h-full overflow-y-auto">
        <AudioTypeSelector onSelectType={setAudioType} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-3 pb-4">
        {/* Header with tabs */}
        <div className="mb-3">
          <TabNavigation
            activeView={activeView}
            generatedAudiosCount={generatedAudios.length}
            onTabChange={setActiveView}
          />
        </div>

        {/* Config View */}
        {activeView === "config" && (
          <div className="animate-fade-in">
            {/* Audio List Button */}
            {generatedAudios.length > 0 && (
              <div className="flex justify-end mb-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAudioDrawer(true)}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  <span>Recent Audio ({generatedAudios.length})</span>
                </Button>
              </div>
            )}

            {/* Main Generation Card */}
            <div className="mx-auto space-y-4">
              {audioType === "voice" && (
                <VoiceGenerationCard
                  onGenerated={handleAudioGenerated}
                  initialPrompt={initialPrompt}
                />
              )}
              {audioType === "sfx" && (
                <SFXGenerationCard
                  onGenerated={handleAudioGenerated}
                  initialPrompt={initialPrompt}
                />
              )}
              {audioType === "music" && (
                <MusicGenerationCard
                  onGenerated={handleAudioGenerated}
                  initialPrompt={initialPrompt}
                />
              )}
            </div>
          </div>
        )}

        {/* Progress View */}
        {activeView === "progress" && (
          <div className="animate-fade-in text-center py-12">
            <p className="text-text-secondary">
              Progress tracking coming soon...
            </p>
          </div>
        )}

        {/* Results View */}
        {activeView === "results" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-text-primary">
                Generated Audio
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAudioDrawer(true)}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                <span>View List ({generatedAudios.length})</span>
              </Button>
            </div>

            {/* Audio Preview */}
            <div className="mx-auto">
              {selectedAudio ? (
                <AudioPreviewCard audio={selectedAudio} />
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p>Select an audio file to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Audio List Drawer */}
      <Drawer
        open={showAudioDrawer}
        onClose={() => setShowAudioDrawer(false)}
        side="right"
        size="md"
        title={`Generated Audio (${generatedAudios.length})`}
      >
        <div className="p-6">
          <GeneratedAudioList
            audios={
              activeView === "results"
                ? generatedAudios
                : generatedAudios.slice(0, 5)
            }
            selectedAudio={selectedAudio}
            onAudioSelect={(audio) => {
              setSelectedAudio(audio);
              setActiveView("results");
              setShowAudioDrawer(false);
            }}
          />
          {activeView === "config" && generatedAudios.length > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setActiveView("results");
                  setShowAudioDrawer(false);
                }}
                className="w-full"
              >
                View All ({generatedAudios.length})
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default AudioGenerationPage;
