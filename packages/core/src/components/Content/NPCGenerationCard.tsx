import { BookOpen, Loader2, Zap, Shield, Sparkles } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Textarea } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { notify } from '@/utils/notify'
import type { NPCData, QualityLevel } from '@/types/content'

interface NPCGenerationCardProps {
  onGenerated?: (npc: NPCData & { id: string; metadata: any }, rawResponse: string) => void
  initialPrompt?: string
}

const ARCHETYPES = [
  'Merchant', 'Guard', 'Quest Giver', 'Blacksmith', 'Innkeeper',
  'Wizard', 'Warrior', 'Thief', 'Priest', 'Noble',
  'Villager', 'Hunter', 'Scholar', 'Healer', 'Bard'
]

export const NPCGenerationCard: React.FC<NPCGenerationCardProps> = ({ onGenerated, initialPrompt }) => {
  const [apiClient] = useState(() => new ContentAPIClient())
  const [archetype, setArchetype] = useState('Merchant')
  const [prompt, setPrompt] = useState('')
  const [context, setContext] = useState('')
  const [quality, setQuality] = useState<QualityLevel>('quality')
  const [isGenerating, setIsGenerating] = useState(false)

  // Populate prompt from initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt)
    }
  }, [initialPrompt, prompt])

  const handleGenerate = async () => {
    if (!archetype || !prompt) {
      notify.warning('Please select an archetype and enter a prompt')
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiClient.generateNPC({
        archetype,
        prompt,
        context: context || undefined,
        quality
      })

      onGenerated?.(result.npc, result.rawResponse)
      notify.success('NPC generated successfully!')
    } catch (error) {
      console.error('Failed to generate NPC:', error)
      notify.error('Failed to generate NPC')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-blue-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">NPC Character Generation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Create complete NPCs with AI</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Archetype Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Archetype</label>
          <select
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
          >
            {ARCHETYPES.map((arch) => (
              <option key={arch} value={arch}>{arch}</option>
            ))}
          </select>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Description / Requirements</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A grumpy old blacksmith who has crafted legendary weapons for heroes..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={500}
          />
          <div className="text-xs text-text-tertiary text-right">{prompt.length} / 500</div>
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Additional Context (Optional)</label>
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Medieval fantasy setting, dwarven kingdom..."
            className="w-full"
            maxLength={200}
          />
        </div>

        {/* Quality Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Quality</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setQuality('speed')}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === 'speed'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50'
              }`}
            >
              <Zap className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Speed</div>
            </button>
            <button
              onClick={() => setQuality('balanced')}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === 'balanced'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50'
              }`}
            >
              <Shield className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Balanced</div>
            </button>
            <button
              onClick={() => setQuality('quality')}
              className={`p-3 rounded-lg border-2 transition-all ${
                quality === 'quality'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50'
              }`}
            >
              <Sparkles className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium">Quality</div>
            </button>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!archetype || !prompt || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating NPC...
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5 mr-2" />
              Generate NPC
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
