import React, { useState, useEffect } from 'react'
import { ChevronLeft, List } from 'lucide-react'

import {
  AudioTypeSelector,
  TabNavigation,
  VoiceGenerationCard,
  SFXGenerationCard,
  MusicGenerationCard,
  GeneratedAudioList,
  AudioPreviewCard
} from '@/components/Audio'
import { VoiceServiceStatus } from '@/components/Voice'
import { Button, Drawer } from '@/components/common'
import type { AudioType, AudioView, GeneratedAudio } from '@/types/audio'

interface AudioGenerationPageProps {
  initialPrompt?: string
}

export const AudioGenerationPage: React.FC<AudioGenerationPageProps> = ({ initialPrompt }) => {
  // Audio type selection
  const [audioType, setAudioType] = useState<AudioType | null>(null)

  // View management
  const [activeView, setActiveView] = useState<AudioView>('config')

  // Generated audios
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([])
  const [selectedAudio, setSelectedAudio] = useState<GeneratedAudio | null>(null)
  const [showAudioDrawer, setShowAudioDrawer] = useState(false)

  // Auto-detect audio type from prompt and set it
  useEffect(() => {
    if (initialPrompt && !audioType) {
      const lowerPrompt = initialPrompt.toLowerCase()
      // Detect audio type from keywords
      if (lowerPrompt.includes('voice') || lowerPrompt.includes('speech') || lowerPrompt.includes('tts') || lowerPrompt.includes('narrat')) {
        setAudioType('voice')
      } else if (lowerPrompt.includes('sfx') || lowerPrompt.includes('sound effect') || lowerPrompt.includes('effect')) {
        setAudioType('sfx')
      } else if (lowerPrompt.includes('music') || lowerPrompt.includes('song') || lowerPrompt.includes('track') || lowerPrompt.includes('soundtrack')) {
        setAudioType('music')
      } else {
        // Default to music if unclear
        setAudioType('music')
      }
    }
  }, [initialPrompt, audioType])

  // Handle audio generation completion
  const handleAudioGenerated = (audioData: string | Blob, metadata: any) => {
    const id = `audio-${Date.now()}`
    let audioUrl: string

    // Convert to object URL if it's a Blob
    if (audioData instanceof Blob) {
      audioUrl = URL.createObjectURL(audioData)
    } else {
      // It's base64 audio data
      audioUrl = `data:audio/mpeg;base64,${audioData}`
    }

    const newAudio: GeneratedAudio = {
      id,
      type: metadata.type || audioType || 'voice',
      name: metadata.prompt || metadata.text || metadata.description || `${metadata.type || audioType} ${generatedAudios.length + 1}`,
      audioUrl,
      audioData: audioData instanceof Blob ? undefined : audioData,
      metadata,
      createdAt: new Date().toISOString()
    }

    setGeneratedAudios(prev => [newAudio, ...prev])
    setSelectedAudio(newAudio)
    setActiveView('results')
  }

  // Reset to type selection
  const handleBack = () => {
    setAudioType(null)
    setActiveView('config')
  }

  // Show type selector if no type selected
  if (!audioType) {
    return (
      <div className="h-full overflow-y-auto">
        <AudioTypeSelector onSelectType={setAudioType} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto py-6 pb-12">
        {/* Header with tabs */}
        <div className="mb-6">
          <TabNavigation
            activeView={activeView}
            generatedAudiosCount={generatedAudios.length}
            onTabChange={setActiveView}
          />
        </div>

        {/* Config View */}
        {activeView === 'config' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to audio types
              </Button>

              {/* Audio List Button */}
              {generatedAudios.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAudioDrawer(true)}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  <span>Recent Audio ({generatedAudios.length})</span>
                </Button>
              )}
            </div>

            {/* Main Generation Card */}
            <div className="max-w-4xl space-y-4">
              {/* Voice Service Status - Only show for voice generation */}
              {audioType === 'voice' && (
                <VoiceServiceStatus autoRefresh={true} refreshInterval={60000} />
              )}

              {audioType === 'voice' && (
                <VoiceGenerationCard onGenerated={handleAudioGenerated} initialPrompt={initialPrompt} />
              )}
              {audioType === 'sfx' && (
                <SFXGenerationCard onGenerated={handleAudioGenerated} initialPrompt={initialPrompt} />
              )}
              {audioType === 'music' && (
                <MusicGenerationCard onGenerated={handleAudioGenerated} initialPrompt={initialPrompt} />
              )}
            </div>
          </div>
        )}

        {/* Progress View */}
        {activeView === 'progress' && (
          <div className="animate-fade-in text-center py-12">
            <p className="text-text-secondary">Progress tracking coming soon...</p>
          </div>
        )}

        {/* Results View */}
        {activeView === 'results' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Generated Audio</h2>
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
            <div className="max-w-4xl">
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
            audios={activeView === 'results' ? generatedAudios : generatedAudios.slice(0, 5)}
            selectedAudio={selectedAudio}
            onAudioSelect={(audio) => {
              setSelectedAudio(audio)
              setActiveView('results')
              setShowAudioDrawer(false)
            }}
          />
          {activeView === 'config' && generatedAudios.length > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setActiveView('results')
                  setShowAudioDrawer(false)
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
  )
}

export default AudioGenerationPage
