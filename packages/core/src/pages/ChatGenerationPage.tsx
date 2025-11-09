import { Sparkles, Box, User, Scroll, MessageSquare, Book, Music, Send } from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '@/components/common'
import { cn } from '@/styles'
import { ContentGenerationPage } from './ContentGenerationPage'
import { GenerationPage } from './GenerationPage'
import { AudioGenerationPage } from './AudioGenerationPage'
import type { ContentType } from '@/types/content'

// Tool types that can be selected
type GenerationTool = '3d' | 'npc' | 'quest' | 'dialogue' | 'lore' | 'audio' | 'world' | null

interface GenerationToolOption {
  id: GenerationTool
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  gradient: string
  keywords: string[] // Keywords for intelligent routing
}

const GENERATION_TOOLS: GenerationToolOption[] = [
  {
    id: '3d',
    icon: Box,
    label: '3D Model',
    description: 'Generate 3D assets, items, and avatars',
    gradient: 'from-blue-500 to-cyan-500',
    keywords: ['3d', 'model', 'asset', 'item', 'weapon', 'armor', 'avatar', 'character model', 'mesh', 'image', 'sprite', '2d', 'texture']
  },
  {
    id: 'npc',
    icon: User,
    label: 'NPC',
    description: 'Create NPCs with personality and dialogue',
    gradient: 'from-purple-500 to-pink-500',
    keywords: ['npc', 'character', 'personality', 'merchant', 'vendor', 'guard', 'villager']
  },
  {
    id: 'quest',
    icon: Scroll,
    label: 'Quest',
    description: 'Design quests with objectives and rewards',
    gradient: 'from-amber-500 to-orange-500',
    keywords: ['quest', 'mission', 'task', 'objective', 'reward', 'bounty']
  },
  {
    id: 'dialogue',
    icon: MessageSquare,
    label: 'Dialogue',
    description: 'Generate branching conversation trees',
    gradient: 'from-green-500 to-emerald-500',
    keywords: ['dialogue', 'conversation', 'talk', 'chat', 'speech', 'branching']
  },
  {
    id: 'lore',
    icon: Book,
    label: 'Lore',
    description: 'Build world lore and story content',
    gradient: 'from-red-500 to-rose-500',
    keywords: ['lore', 'story', 'history', 'legend', 'mythology', 'backstory', 'world building']
  },
  {
    id: 'audio',
    icon: Music,
    label: 'Audio',
    description: 'Generate music and sound effects',
    gradient: 'from-indigo-500 to-violet-500',
    keywords: ['audio', 'music', 'sound', 'sfx', 'soundtrack', 'ambience', 'effect', 'voice', 'song', 'track']
  }
]

interface ChatGenerationPageProps {
  onNavigateToAssets?: () => void
  onNavigateToAsset?: (assetId: string) => void
}

export const ChatGenerationPage: React.FC<ChatGenerationPageProps> = ({
  onNavigateToAssets,
  onNavigateToAsset
}) => {
  const [prompt, setPrompt] = useState('')
  const [selectedTool, setSelectedTool] = useState<GenerationTool>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [shouldGenerateWorld, setShouldGenerateWorld] = useState(false)

  // Analyze prompt to determine which tool to use
  const analyzePrompt = (text: string): GenerationTool => {
    const lowerText = text.toLowerCase()

    // Check for multiple items requested (world generation)
    // Look for multiple keywords from different categories
    const detectedTools: GenerationTool[] = []
    
    for (const tool of GENERATION_TOOLS) {
      if (tool.id && tool.keywords.some(keyword => lowerText.includes(keyword))) {
        detectedTools.push(tool.id)
      }
    }

    // If multiple different tool types detected, route to world generation
    if (detectedTools.length > 1) {
      // Check if they're actually different categories (not just multiple keywords from same category)
      const uniqueTools = [...new Set(detectedTools)]
      if (uniqueTools.length > 1) {
        return 'world'
      }
    }

    // Check for explicit world generation keywords
    const worldKeywords = ['world', 'entire', 'complete', 'full', 'everything', 'all', 'multiple', 'several', 'and', 'with']
    const hasWorldKeywords = worldKeywords.some(keyword => lowerText.includes(keyword))
    
    // If prompt mentions multiple things explicitly (using "and", "with", etc.) and has multiple tool keywords
    if (hasWorldKeywords && detectedTools.length > 0) {
      // Check for conjunction words that indicate multiple items
      const conjunctionPatterns = [
        /\b(and|with|plus|including|also|as well as)\b/i,
        /,\s*(and|or)\s*/i,
        /\b(create|generate|make|build)\s+(a|an|the)?\s+\w+\s+(and|with|plus)\s+/i
      ]
      
      const hasConjunction = conjunctionPatterns.some(pattern => pattern.test(text))
      
      if (hasConjunction && detectedTools.length >= 1) {
        return 'world'
      }
    }

    // Return the first detected tool if only one category
    if (detectedTools.length > 0) {
      return detectedTools[0]
    }

    // Default to 3D if unclear
    return '3d'
  }

  // Handle tool selection (button click)
  const handleToolSelect = (toolId: GenerationTool) => {
    setSelectedTool(toolId)
    setUserPrompt('') // Clear prompt when manually selecting tool
  }

  // Handle prompt submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    // Analyze prompt to determine tool
    const detectedTool = analyzePrompt(prompt)
    
    // If world generation detected, set flag and route to 3D generation page
    if (detectedTool === 'world') {
      setShouldGenerateWorld(true)
      setSelectedTool('3d') // Route to GenerationPage which handles world generation
    } else {
      setShouldGenerateWorld(false)
      setSelectedTool(detectedTool)
    }
    
    setUserPrompt(prompt)
  }

  // Handle going back to tool selector
  const handleBack = () => {
    setSelectedTool(null)
    setPrompt('')
    setUserPrompt('')
    setShouldGenerateWorld(false)
  }

  // Render the appropriate generation component based on selected tool
  if (selectedTool === '3d') {
    return (
      <GenerationPage
        onNavigateToAssets={onNavigateToAssets}
        onNavigateToAsset={onNavigateToAsset}
        initialPrompt={userPrompt}
        shouldGenerateWorld={shouldGenerateWorld}
      />
    )
  }

  if (selectedTool === 'audio') {
    return <AudioGenerationPage initialPrompt={userPrompt} />
  }

  if (selectedTool === 'npc' || selectedTool === 'quest' || selectedTool === 'dialogue' || selectedTool === 'lore') {
    return <ContentGenerationPage initialType={selectedTool as ContentType} initialPrompt={userPrompt} />
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%)',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Greeting */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-600 dark:text-primary animate-pulse" />
            <h1 className="text-5xl font-bold text-text-primary">
              What would you like to create?
            </h1>
          </div>
          <p className="text-lg text-text-secondary">
            Choose a tool below or describe what you want to generate
          </p>
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full px-6 py-4 pr-14 rounded-2xl bg-bg-secondary/80 border-2 border-border-primary focus:border-primary text-text-primary placeholder:text-text-tertiary outline-none transition-all text-lg backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>

        {/* Tool Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GENERATION_TOOLS.map((tool) => {
            if (!tool.id) return null
            const Icon = tool.icon

            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={cn(
                  'group relative p-6 rounded-2xl border-2 transition-all duration-300',
                  'bg-bg-secondary/50 backdrop-blur-sm',
                  'border-border-primary hover:border-primary/50',
                  'hover:scale-105 hover:shadow-xl',
                  selectedTool === tool.id && 'border-primary shadow-lg scale-105'
                )}
              >
                {/* Icon with gradient */}
                <div className={cn(
                  'w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-md group-hover:shadow-lg transition-shadow',
                  tool.gradient
                )}>
                  <Icon className="w-7 h-7 text-purple-600 dark:text-white" />
                </div>

                {/* Label */}
                <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {tool.label}
                </h3>

                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed">
                  {tool.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Info footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-text-tertiary">
            Powered by AI • Simply describe what you need or select a tool above
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatGenerationPage
