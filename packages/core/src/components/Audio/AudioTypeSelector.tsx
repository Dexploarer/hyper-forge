import { Music, Mic, Radio } from 'lucide-react'
import React from 'react'

import { Card, CardContent } from '../common'
import { cn } from '@/styles'
import type { AudioType } from '@/types/audio'

interface AudioTypeSelectorProps {
  onSelectType: (type: AudioType) => void
}

interface AudioTypeOption {
  type: AudioType
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  gradient: string
}

const AUDIO_TYPES: AudioTypeOption[] = [
  {
    type: 'voice',
    icon: Mic,
    label: 'Voice Generation',
    description: 'Text-to-speech & voice design for NPCs',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'sfx',
    icon: Radio,
    label: 'Sound Effects',
    description: 'AI-powered game sound effects',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    type: 'music',
    icon: Music,
    label: 'Music',
    description: 'AI-generated game soundtracks',
    gradient: 'from-orange-500 to-red-500'
  }
]

export const AudioTypeSelector: React.FC<AudioTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Audio Generation
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Create voice, sound effects, and music for your game using ElevenLabs AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AUDIO_TYPES.map((audioType) => {
          const Icon = audioType.icon

          return (
            <Card
              key={audioType.type}
              className="group cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary hover:border-primary/50 overflow-hidden"
              onClick={() => onSelectType(audioType.type)}
            >
              <CardContent className="p-8 text-center">
                {/* Icon with gradient background */}
                <div className={cn(
                  'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-shadow',
                  audioType.gradient
                )}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                  {audioType.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed">
                  {audioType.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <span className="text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to start →
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info section */}
      <div className="mt-12 p-6 bg-bg-secondary/50 border border-border-primary rounded-lg">
        <div className="flex items-start gap-4">
          <Music className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Powered by ElevenLabs</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Generate high-quality audio content for your game. Voice generation includes TTS and voice design,
              sound effects support text-to-SFX with duration control, and music generation creates AI compositions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
