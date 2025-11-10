import { MessageSquare, Loader2, Zap, Shield, Sparkles, TestTube2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Textarea } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { notify } from '@/utils/notify'
import { useNavigation } from '@/hooks/useNavigation'
import type { DialogueNode, QualityLevel } from '@/types/content'

interface DialogueGenerationCardProps {
  onGenerated?: (nodes: DialogueNode[], rawResponse: string) => void
  initialPrompt?: string
}

export const DialogueGenerationCard: React.FC<DialogueGenerationCardProps> = ({ onGenerated, initialPrompt }) => {
  const { navigateToPlaytester } = useNavigation()
  const [apiClient] = useState(() => new ContentAPIClient())
  const [npcName, setNpcName] = useState('')
  const [personality, setPersonality] = useState('')
  const [context, setContext] = useState('')
  const [quality, setQuality] = useState<QualityLevel>('speed')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedDialogue, setLastGeneratedDialogue] = useState<DialogueNode[] | null>(null)

  // Populate personality or context from initialPrompt
  useEffect(() => {
    if (initialPrompt && !personality && !context) {
      // Use personality field for dialogue prompts
      setPersonality(initialPrompt)
    }
  }, [initialPrompt, personality, context])

  const handleGenerate = async () => {
    if (!npcName || !personality) {
      notify.warning('Please enter NPC name and personality')
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiClient.generateDialogue({
        npcName,
        npcPersonality: personality,
        context: context || undefined,
        quality
      })

      setLastGeneratedDialogue(result.nodes)
      onGenerated?.(result.nodes, result.rawResponse)
      notify.success(`Generated ${result.nodes.length} dialogue nodes!`)
    } catch (error) {
      console.error('Failed to generate dialogue:', error)
      notify.error('Failed to generate dialogue')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-green-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-500/10 rounded-xl">
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Dialogue Tree Generation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Generate branching NPC dialogue</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* NPC Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">NPC Name</label>
          <Input
            value={npcName}
            onChange={(e) => setNpcName(e.target.value)}
            placeholder="e.g., Elder Thornwood, Captain Blackwood..."
            className="w-full"
            maxLength={50}
          />
        </div>

        {/* Personality */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Personality / Traits</label>
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="e.g., Wise and patient, speaks in riddles, former warrior turned scholar..."
            className="w-full min-h-[100px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={300}
          />
          <div className="text-xs text-text-tertiary text-right">{personality.length} / 300</div>
        </div>

        {/* Optional Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Context / Situation (Optional)</label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Player meets NPC at the crossroads after completing the previous quest..."
            className="w-full min-h-[80px] bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            maxLength={200}
          />
          <div className="text-xs text-text-tertiary text-right">{context.length} / 200</div>
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

        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={!npcName || !personality || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Dialogue...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 mr-2" />
                Generate Dialogue
              </>
            )}
          </Button>
          
          {lastGeneratedDialogue && (
            <Button
              onClick={() => {
                navigateToPlaytester(lastGeneratedDialogue, 'dialogue')
                notify.success('Imported dialogue to playtester!')
              }}
              variant="secondary"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              size="lg"
            >
              <TestTube2 className="w-5 h-5 mr-2" />
              Import to Playtester
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
