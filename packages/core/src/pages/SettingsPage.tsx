import {
  Settings as SettingsIcon,
  FileText,
  Palette,
  Package,
  Sparkles,
  Zap,
  Target,
  RefreshCw,
  Copy,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { promptsClient, type PromptData } from '@/services/api/PromptsAPIClient'
import { cn } from '@/styles'

type PromptCategory =
  | 'gameStyles'
  | 'assetTypes'
  | 'materials'
  | 'generation'
  | 'gpt4Enhancement'
  | 'weaponDetection'

interface CategoryInfo {
  id: PromptCategory
  name: string
  icon: React.ReactNode
  description: string
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'gameStyles',
    name: 'Game Styles',
    icon: <Palette className="w-5 h-5" />,
    description: 'Art style and aesthetic prompts for different game genres',
  },
  {
    id: 'assetTypes',
    name: 'Asset Types',
    icon: <Package className="w-5 h-5" />,
    description: 'Prompts for generating different types of 3D assets',
  },
  {
    id: 'materials',
    name: 'Materials',
    icon: <FileText className="w-5 h-5" />,
    description: 'Material and texture prompt templates',
  },
  {
    id: 'generation',
    name: 'Generation',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Core generation pipeline prompts',
  },
  {
    id: 'gpt4Enhancement',
    name: 'GPT-4 Enhancement',
    icon: <Zap className="w-5 h-5" />,
    description: 'Prompt enhancement and refinement templates',
  },
  {
    id: 'weaponDetection',
    name: 'Weapon Detection',
    icon: <Target className="w-5 h-5" />,
    description: 'AI vision prompts for weapon handle detection',
  },
]

export const SettingsPage: React.FC = () => {
  // State
  const [activeCategory, setActiveCategory] = useState<PromptCategory>('gameStyles')
  const [prompts, setPrompts] = useState<Record<PromptCategory, PromptData | null>>({
    gameStyles: null,
    assetTypes: null,
    materials: null,
    generation: null,
    gpt4Enhancement: null,
    weaponDetection: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCategory, setCopiedCategory] = useState<PromptCategory | null>(null)

  // Load all prompts on mount
  useEffect(() => {
    loadAllPrompts()
  }, [])

  const loadAllPrompts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allPrompts = await promptsClient.getAllPrompts()
      setPrompts(allPrompts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyJSON = async (category: PromptCategory) => {
    const data = prompts[category]
    if (!data) return

    try {
      const formatted = promptsClient.formatJSON(data)
      await navigator.clipboard.writeText(formatted)
      setCopiedCategory(category)
      setTimeout(() => setCopiedCategory(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const activeCategoryData = prompts[activeCategory]
  const promptCount = activeCategoryData
    ? promptsClient.countPrompts(activeCategoryData)
    : 0

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-border-primary rounded-xl">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings & Configuration</h1>
            <p className="text-sm text-text-secondary">
              View and manage system prompts and configurations
            </p>
          </div>
          <button
            onClick={loadAllPrompts}
            disabled={isLoading}
            className="ml-auto p-3 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh prompts"
          >
            <RefreshCw
              className={cn('w-5 h-5 text-primary', isLoading && 'animate-spin')}
            />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Category Sidebar */}
          <div className="lg:col-span-1 space-y-1.5">
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide px-3 mb-3">
              Prompt Categories
            </h2>
            {CATEGORIES.map((category) => {
              const data = prompts[category.id]
              const count = data ? promptsClient.countPrompts(data) : 0

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    activeCategory === category.id
                      ? 'bg-primary/20 border-2 border-primary/50 text-primary'
                      : 'bg-bg-secondary border border-border-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0',
                      activeCategory === category.id ? 'text-primary' : 'text-text-tertiary',
                    )}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">{category.name}</div>
                    <div className="text-xs opacity-70">{count} prompts</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Prompt Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden">
              {/* Category Header */}
              {CATEGORIES.map(
                (category) =>
                  activeCategory === category.id && (
                    <div
                      key={category.id}
                      className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border-primary"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            {category.icon}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-text-primary">
                              {category.name}
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">
                              {category.description}
                            </p>
                            {activeCategoryData && (
                              <div className="flex items-center gap-4 mt-2">
                                <div className="text-xs text-text-tertiary">
                                  {promptCount} prompts
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  {Object.keys(activeCategoryData).length} keys
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyJSON(activeCategory)}
                          disabled={!activeCategoryData}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Copy JSON to clipboard"
                        >
                          {copiedCategory === activeCategory ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-primary" />
                              <span className="text-sm text-primary">Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ),
              )}

              {/* Prompt Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm">Loading prompts...</p>
                  </div>
                ) : activeCategoryData ? (
                  <div className="space-y-4">
                    <pre className="bg-bg-tertiary border border-border-primary rounded-lg p-4 overflow-x-auto text-xs text-text-primary font-mono max-h-[600px] overflow-y-auto">
                      {promptsClient.formatJSON(activeCategoryData)}
                    </pre>

                    {/* Extracted Prompt Texts */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-text-primary">
                        Extracted Prompts
                      </h3>
                      <div className="space-y-2">
                        {promptsClient.extractPromptText(activeCategoryData).map((prompt, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-bg-tertiary border border-border-primary rounded-lg"
                          >
                            <p className="text-xs text-text-secondary leading-relaxed">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-tertiary">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No prompt data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
