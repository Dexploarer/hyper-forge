import { Scroll, Loader2, Zap, Shield, Sparkles } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Textarea } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { notify } from '@/utils/notify'
import type { QuestData, QualityLevel } from '@/types/content'

interface QuestGenerationCardProps {
  onGenerated?: (quest: QuestData & { id: string; difficulty: string; questType: string; metadata: any }, rawResponse: string) => void
  initialPrompt?: string
}

const QUEST_TYPES = [
  'Main Story', 'Side Quest', 'Fetch Quest', 'Kill Quest', 'Escort Quest',
  'Collection Quest', 'Exploration Quest', 'Puzzle Quest', 'Rescue Mission', 'Investigation'
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard', 'Epic']

export const QuestGenerationCard: React.FC<QuestGenerationCardProps> = ({ onGenerated, initialPrompt }) => {
  const [apiClient] = useState(() => new ContentAPIClient())
  const [questType, setQuestType] = useState('Side Quest')
  const [difficulty, setDifficulty] = useState('Medium')
  const [theme, setTheme] = useState('')
  const [context, setContext] = useState('')

  // Populate theme from initialPrompt
  useEffect(() => {
    if (initialPrompt && !theme) {
      setTheme(initialPrompt)
    }
  }, [initialPrompt, theme])
  const [quality, setQuality] = useState<QualityLevel>('quality')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!questType || !difficulty) {
      notify.warning('Please select quest type and difficulty')
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiClient.generateQuest({
        questType,
        difficulty,
        theme: theme || undefined,
        context: context || undefined,
        quality
      })

      onGenerated?.(result.quest, result.rawResponse)
      notify.success('Quest generated successfully!')
    } catch (error) {
      console.error('Failed to generate quest:', error)
      notify.error('Failed to generate quest')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-purple-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl">
            <Scroll className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Quest Generation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Create quests with AI</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Quest Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Quest Type</label>
          <select
            value={questType}
            onChange={(e) => setQuestType(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
          >
            {QUEST_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Difficulty</label>
          <div className="grid grid-cols-5 gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  difficulty === diff
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-primary bg-bg-tertiary/30 text-text-secondary hover:border-primary/50'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Theme (Optional)</label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., dark magic, ancient ruins, political intrigue..."
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
            placeholder="e.g., This quest takes place in a haunted forest where villagers have gone missing..."
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
          disabled={!questType || !difficulty || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Quest...
            </>
          ) : (
            <>
              <Scroll className="w-5 h-5 mr-2" />
              Generate Quest
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
