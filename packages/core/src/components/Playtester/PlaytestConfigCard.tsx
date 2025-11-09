import { TestTube2, Loader2, Zap, Shield, Sparkles, AlertCircle } from 'lucide-react'
import React, { useState } from 'react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Textarea, Checkbox } from '../common'
import { PlaytesterAPIClient } from '@/services/api/PlaytesterAPIClient'
import { notify } from '@/utils/notify'
import type { PlaytestContentType, PlaytestResult } from '@/types/playtester'
import type { QualityLevel } from '@/types/content'

interface PlaytestConfigCardProps {
  contentType: PlaytestContentType
  selectedProfiles: string[]
  onTestCompleted?: (result: PlaytestResult) => void
}

export const PlaytestConfigCard: React.FC<PlaytestConfigCardProps> = ({
  contentType,
  selectedProfiles,
  onTestCompleted
}) => {
  const [apiClient] = useState(() => new PlaytesterAPIClient())
  const [contentJson, setContentJson] = useState('')
  const [quality, setQuality] = useState<QualityLevel>('quality')
  const [parallelTesting, setParallelTesting] = useState(true)
  const [temperature, setTemperature] = useState(0.7)
  const [isRunning, setIsRunning] = useState(false)

  const handleRunPlaytest = async () => {
    if (!contentJson.trim()) {
      notify.warning('Please enter content to test')
      return
    }

    if (selectedProfiles.length === 0) {
      notify.warning('Please select at least one tester profile')
      return
    }

    try {
      // Parse JSON content
      const contentToTest = JSON.parse(contentJson)

      setIsRunning(true)
      const result = await apiClient.runPlaytest({
        contentToTest,
        contentType,
        testerProfiles: selectedProfiles,
        testConfig: {
          parallel: parallelTesting,
          temperature
        },
        model: quality
      })

      onTestCompleted?.(result)
      notify.success(`Playtest completed! Grade: ${result.report.summary.grade}`)
    } catch (error) {
      console.error('Failed to run playtest:', error)
      if (error instanceof SyntaxError) {
        notify.error('Invalid JSON format. Please check your content.')
      } else if (error instanceof Error) {
        notify.error(error.message || 'Failed to run playtest')
      } else {
        notify.error('Failed to run playtest')
      }
    } finally {
      setIsRunning(false)
    }
  }

  const getPlaceholderContent = () => {
    switch (contentType) {
      case 'quest':
        return JSON.stringify({
          title: "The Lost Artifact",
          description: "Find and retrieve the ancient artifact from the ruins",
          objectives: [
            { description: "Travel to the Ancient Ruins", type: "explore", target: "Ancient Ruins", count: 1 },
            { description: "Defeat the Guardian", type: "kill", target: "Stone Guardian", count: 1 },
            { description: "Collect the Artifact", type: "collect", target: "Ancient Artifact", count: 1 }
          ],
          rewards: { experience: 500, gold: 100, items: ["Guardian's Helm"] }
        }, null, 2)
      case 'dialogue':
        return JSON.stringify([
          {
            id: "greeting",
            text: "Well met, traveler! What brings you to my shop?",
            responses: [
              { text: "I'm looking for weapons.", nextNodeId: "weapons" },
              { text: "Just browsing.", nextNodeId: "browsing" }
            ]
          }
        ], null, 2)
      case 'npc':
        return JSON.stringify({
          name: "Garrick the Blacksmith",
          archetype: "blacksmith",
          personality: { traits: ["Gruff", "Reliable"], background: "Veteran craftsman" },
          dialogue: { greeting: "What do you need?", farewell: "Come back soon." }
        }, null, 2)
      case 'combat':
        return JSON.stringify({
          encounter: "Forest Ambush",
          enemies: [{ name: "Bandit", level: 5, health: 100, damage: 15 }],
          difficulty: "medium",
          environment: "Dense forest with limited visibility"
        }, null, 2)
      case 'puzzle':
        return JSON.stringify({
          name: "Ancient Door Puzzle",
          description: "Arrange the symbols in the correct order",
          solution: ["sun", "moon", "star", "cloud"],
          hints: ["Look to the sky", "Follow the day's cycle"]
        }, null, 2)
      default:
        return '{}'
    }
  }

  return (
    <Card className="bg-gradient-to-br from-bg-primary via-bg-secondary to-purple-500/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl">
            <TestTube2 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold capitalize">Test {contentType}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Deploy AI playtesters to evaluate your content
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Content Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Content to Test (JSON)
          </label>
          <Textarea
            value={contentJson}
            onChange={(e) => setContentJson(e.target.value)}
            placeholder={getPlaceholderContent()}
            className="w-full min-h-[300px] font-mono text-xs bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
          />
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Paste your {contentType} data in JSON format</span>
          </div>
        </div>

        {/* Quality Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Model Quality</label>
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

        {/* Advanced Settings */}
        <div className="space-y-3 p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg">
          <h4 className="text-sm font-medium text-text-primary">Advanced Settings</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={parallelTesting}
                onChange={(e) => setParallelTesting(e.target.checked)}
              />
              <label className="text-sm text-text-secondary">Parallel testing (faster)</label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary flex items-center justify-between">
              <span>Temperature</span>
              <span className="text-text-tertiary text-xs">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Consistent</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <Button
          onClick={handleRunPlaytest}
          disabled={!contentJson.trim() || selectedProfiles.length === 0 || isRunning}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Running Playtest ({selectedProfiles.length} testers)...
            </>
          ) : (
            <>
              <TestTube2 className="w-5 h-5 mr-2" />
              Run Playtester Swarm ({selectedProfiles.length} testers)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
