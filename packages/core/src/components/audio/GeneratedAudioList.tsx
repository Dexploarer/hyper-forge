import { Music, Mic, Radio } from 'lucide-react'
import React from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '../common'
import { cn } from '@/styles'
import type { GeneratedAudio, AudioType } from '@/types/audio'

interface GeneratedAudioListProps {
  audios: GeneratedAudio[]
  selectedAudio: GeneratedAudio | null
  onAudioSelect: (audio: GeneratedAudio) => void
}

const getAudioIcon = (type: AudioType) => {
  switch (type) {
    case 'voice':
      return Mic
    case 'sfx':
      return Radio
    case 'music':
      return Music
    default:
      return Music
  }
}

const getAudioColor = (type: AudioType) => {
  switch (type) {
    case 'voice':
      return 'text-blue-500'
    case 'sfx':
      return 'text-purple-500'
    case 'music':
      return 'text-orange-500'
    default:
      return 'text-primary'
  }
}

export const GeneratedAudioList: React.FC<GeneratedAudioListProps> = ({
  audios,
  selectedAudio,
  onAudioSelect
}) => {
  return (
    <Card className="bg-bg-secondary/50 border-border-primary">
      <CardHeader>
        <CardTitle className="text-base">Generated Audio ({audios.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
        {audios.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No audio generated yet</p>
          </div>
        ) : (
          audios.map((audio) => {
            const Icon = getAudioIcon(audio.type)
            const colorClass = getAudioColor(audio.type)
            const isSelected = selectedAudio?.id === audio.id

            return (
              <div
                key={audio.id}
                onClick={() => onAudioSelect(audio)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all',
                  isSelected
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-bg-tertiary/50 border border-border-primary hover:border-primary/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg bg-bg-secondary', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">{audio.name}</h4>
                    <p className="text-xs text-text-tertiary capitalize">{audio.type}</p>
                    {audio.duration && (
                      <p className="text-xs text-text-secondary mt-1">
                        {audio.duration.toFixed(1)}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
