import { Book, Loader2, Zap, Shield, Sparkles } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Textarea } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { notify } from '@/utils/notify'
import type { LoreData, QualityLevel } from '@/types/content'

interface LoreGenerationCardProps {
  onGenerated?: (lore: LoreData & { id: string; metadata: any }, rawResponse: string) => void
  initialPrompt?: string
}

const CATEGORIES = [
  'History', 'Religion', 'Culture', 'Geography', 'Magic System',
  'Mythology', 'Politics', 'Technology', 'Factions', 'Artifacts', 'Events'
]

export const LoreGenerationCard: React.FC<LoreGenerationCardProps> = ({ onGenerated, initialPrompt }) => {
  const [apiClient] = useState(() => new ContentAPIClient())
  const [category, setCategory] = useState('History')
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [quality, setQuality] = useState<QualityLevel>('balanced')
  const [isGenerating, setIsGenerating] = useState(false)

  // Populate topic from initialPrompt
  useEffect(() => {
    if (initialPrompt && !topic) {
      setTopic(initialPrompt)
    }
  }, [initialPrompt, topic])

  const handleGenerate = async () => {
    if (!category || !topic) {
      notify.warning('Please select a category and enter a topic')
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiClient.generateLore({
        category,
        topic,
        context: context || undefined,
        quality
      })

      onGenerated?.(result.lore, result.rawResponse)
      notify.success('Lore generated successfully!')
    } catch (error) {
      console.error('Failed to generate lore:', error)
      notify.error('Failed to generate lore')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-orange-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 rounded-xl">
            <Book className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">World Lore Generation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Create rich world-building lore</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Topic / Subject</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Great Dragon War, Council of Elders, Ancient Runes..."
            className="w-full"
            maxLength={100}
          />
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Additional Context (Optional)</label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., High fantasy setting with multiple kingdoms, magic is feared and regulated..."
            className="w-full min-h-[80px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={300}
          />
          <div className="text-xs text-text-tertiary text-right">{context.length} / 300</div>
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
          disabled={!category || !topic || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Lore...
            </>
          ) : (
            <>
              <Book className="w-5 h-5 mr-2" />
              Generate Lore
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
