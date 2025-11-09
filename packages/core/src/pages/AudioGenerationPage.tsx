import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

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
import { Button } from '@/components/common'
import type { AudioType, AudioView, GeneratedAudio } from '@/types/audio'

export const AudioGenerationPage: React.FC = () => {
  // Audio type selection
  const [audioType, setAudioType] = useState<AudioType | null>(null)

  // View management
  const [activeView, setActiveView] = useState<AudioView>('config')

  // Generated audios
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([])
  const [selectedAudio, setSelectedAudio] = useState<GeneratedAudio | null>(null)

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Generation Card */}
              <div className="lg:col-span-2">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-4 text-text-secondary hover:text-text-primary"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to audio types
                </Button>

                {audioType === 'voice' && (
                  <VoiceGenerationCard onGenerated={handleAudioGenerated} />
                )}
                {audioType === 'sfx' && (
                  <SFXGenerationCard onGenerated={handleAudioGenerated} />
                )}
                {audioType === 'music' && (
                  <MusicGenerationCard onGenerated={handleAudioGenerated} />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-3">
                {/* Voice Service Status - Only show for voice generation */}
                {audioType === 'voice' && (
                  <VoiceServiceStatus autoRefresh={true} refreshInterval={60000} />
                )}

                {/* Recent Audios */}
                <GeneratedAudioList
                  audios={generatedAudios.slice(0, 5)}
                  selectedAudio={selectedAudio}
                  onAudioSelect={(audio) => {
                    setSelectedAudio(audio)
                    setActiveView('results')
                  }}
                />

                {generatedAudios.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveView('results')}
                    className="w-full"
                  >
                    View All ({generatedAudios.length})
                  </Button>
                )}
              </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Audio List */}
              <GeneratedAudioList
                audios={generatedAudios}
                selectedAudio={selectedAudio}
                onAudioSelect={setSelectedAudio}
              />

              {/* Audio Preview */}
              <div className="lg:col-span-3">
                {selectedAudio ? (
                  <AudioPreviewCard audio={selectedAudio} />
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    <p>Select an audio file to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioGenerationPage
