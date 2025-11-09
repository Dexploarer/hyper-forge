import { Music, Loader2 } from 'lucide-react'
import React, { useState } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Textarea, Checkbox } from '../common'
import { AudioAPIClient } from '@/services/api/AudioAPIClient'
import { notify } from '@/utils/notify'

interface MusicGenerationCardProps {
  onGenerated?: (audioBlob: Blob, metadata: any) => void
}

export const MusicGenerationCard: React.FC<MusicGenerationCardProps> = ({ onGenerated }) => {
  const [apiClient] = useState(() => new AudioAPIClient())
  const [prompt, setPrompt] = useState('')
  const [lengthSeconds, setLengthSeconds] = useState(30)
  const [forceInstrumental, setForceInstrumental] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt) {
      notify.warning('Please enter a music prompt')
      return
    }

    try {
      setIsGenerating(true)
      const audioBlob = await apiClient.generateMusic({
        prompt,
        musicLengthMs: lengthSeconds * 1000,
        forceInstrumental
      })

      onGenerated?.(audioBlob, {
        type: 'music',
        prompt,
        lengthSeconds,
        forceInstrumental
      })

      notify.success('Music generated successfully!')
    } catch (error) {
      console.error('Failed to generate music:', error)
      notify.error('Failed to generate music')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-orange-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 rounded-xl">
            <Music className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Music Generation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Generate AI music for your game</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Music Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., epic orchestral battle theme, calm ambient forest music, upbeat tavern music..."
            className="w-full min-h-[120px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">{prompt.length} / 500</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Length: {lengthSeconds}s ({Math.floor(lengthSeconds / 60)}:{(lengthSeconds % 60).toString().padStart(2, '0')})
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
          <div className="text-xs text-text-tertiary">Range: 10 seconds - 5 minutes</div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="instrumental"
            checked={forceInstrumental}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForceInstrumental(e.target.checked)}
          />
          <label htmlFor="instrumental" className="text-sm text-text-primary cursor-pointer">
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
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
    </Card>
  )
}
