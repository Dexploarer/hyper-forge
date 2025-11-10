import { Sparkles, Box, User, Scroll, MessageSquare, Book, Music, Globe, Users } from 'lucide-react'
import React, { useState } from 'react'

import { Modal } from '@/components/common'
import { cn } from '@/styles'
import { ContentGenerationPage } from './ContentGenerationPage'
import { GenerationPage } from './GenerationPage'
import { AudioGenerationPage } from './AudioGenerationPage'
import type { ContentType } from '@/types/content'

// Category types
type GenerationCategory = 'world' | 'character' | 'lore' | null

// Tool types that can be selected
type GenerationTool = '3d' | 'npc' | 'quest' | 'dialogue' | 'lore' | 'audio' | 'world' | null

interface GenerationToolOption {
  id: GenerationTool
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  gradient: string
  keywords: string[]
}

interface CategoryOption {
  id: GenerationCategory
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  gradient: string
  tools: GenerationToolOption[]
}

// Individual tools
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
    id: 'audio',
    icon: Music,
    label: 'Audio',
    description: 'Generate music and sound effects',
    gradient: 'from-indigo-500 to-violet-500',
    keywords: ['audio', 'music', 'sound', 'sfx', 'soundtrack', 'ambience', 'effect', 'voice', 'song', 'track']
  },
  {
    id: 'world',
    icon: Globe,
    label: 'World Generation',
    description: 'Generate complete worlds with interconnected content',
    gradient: 'from-emerald-500 to-teal-500',
    keywords: ['world', 'environment', 'complete', 'full', 'everything']
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
    id: 'dialogue',
    icon: MessageSquare,
    label: 'Dialogue',
    description: 'Generate branching conversation trees',
    gradient: 'from-green-500 to-emerald-500',
    keywords: ['dialogue', 'conversation', 'talk', 'chat', 'speech', 'branching']
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
    id: 'lore',
    icon: Book,
    label: 'Lore',
    description: 'Build world lore and story content',
    gradient: 'from-red-500 to-rose-500',
    keywords: ['lore', 'story', 'history', 'legend', 'mythology', 'backstory', 'world building']
  }
]

// Categories with their associated tools
const GENERATION_CATEGORIES: CategoryOption[] = [
  {
    id: 'world',
    icon: Globe,
    label: 'World & Environment',
    description: 'Generate worlds, environments, and ambient content',
    gradient: 'from-emerald-500 to-teal-500',
    tools: GENERATION_TOOLS.filter(tool => ['3d', 'audio', 'world'].includes(tool.id || ''))
  },
  {
    id: 'character',
    icon: Users,
    label: 'Character',
    description: 'Create characters, NPCs, and dialogue systems',
    gradient: 'from-purple-500 to-pink-500',
    tools: GENERATION_TOOLS.filter(tool => ['npc', 'dialogue', '3d'].includes(tool.id || ''))
  },
  {
    id: 'lore',
    icon: Book,
    label: 'Lore',
    description: 'Build quests, lore, and narrative content',
    gradient: 'from-amber-500 to-orange-500',
    tools: GENERATION_TOOLS.filter(tool => ['lore', 'quest'].includes(tool.id || ''))
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
  const [selectedCategory, setSelectedCategory] = useState<GenerationCategory>(null)
  const [selectedTool, setSelectedTool] = useState<GenerationTool>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [shouldGenerateWorld, setShouldGenerateWorld] = useState(false)

  // Handle category selection - opens modal
  const handleCategorySelect = (categoryId: GenerationCategory) => {
    setSelectedCategory(categoryId)
  }

  // Handle tool selection from modal
  const handleToolSelect = (toolId: GenerationTool) => {
    setSelectedCategory(null) // Close modal
    setSelectedTool(toolId)
    setUserPrompt('')
    
    // If world generation tool selected, set flag
    if (toolId === 'world') {
      setShouldGenerateWorld(true)
      setSelectedTool('3d') // Route to GenerationPage which handles world generation
    }
  }

  // Handle going back to category selector
  const handleBack = () => {
    setSelectedTool(null)
    setSelectedCategory(null)
    setUserPrompt('')
    setShouldGenerateWorld(false)
  }

  // Get tools for selected category
  const getCategoryTools = (categoryId: GenerationCategory): GenerationToolOption[] => {
    const category = GENERATION_CATEGORIES.find(cat => cat.id === categoryId)
    return category?.tools || []
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
    <>
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
                What would you like to generate?
              </h1>
            </div>
            <p className="text-lg text-text-secondary">
              Select a category to explore available generation tools
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GENERATION_CATEGORIES.map((category) => {
              if (!category.id) return null
              const Icon = category.icon

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={cn(
                    'group relative p-8 rounded-2xl border-2 transition-all duration-300',
                    'bg-bg-secondary/50 backdrop-blur-sm',
                    'border-border-primary hover:border-primary/50',
                    'hover:scale-105 hover:shadow-xl',
                    'flex flex-col items-center text-center'
                  )}
                >
                  {/* Icon with gradient */}
                  <div className={cn(
                    'w-16 h-16 mb-4 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br shadow-md group-hover:shadow-lg transition-shadow',
                    category.gradient
                  )}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Label */}
                  <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                    {category.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {category.description}
                  </p>

                  {/* Tool count badge */}
                  <div className="mt-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <span className="text-xs text-primary font-medium">
                      {category.tools.length} {category.tools.length === 1 ? 'tool' : 'tools'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Info footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-text-tertiary">
              Powered by AI • Select a category to get started
            </p>
          </div>
        </div>
      </div>

      {/* Category Tools Modal */}
      {selectedCategory && (
        <Modal
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          size="lg"
        >
          <div className="p-6">
            {/* Modal Header */}
            <div className="mb-6">
              {(() => {
                const category = GENERATION_CATEGORIES.find(cat => cat.id === selectedCategory)
                if (!category) return null
                const Icon = category.icon
                return (
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br',
                      category.gradient
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary">
                        {category.label}
                      </h2>
                      <p className="text-sm text-text-secondary">
                        {category.description}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCategoryTools(selectedCategory).map((tool) => {
                if (!tool.id) return null
                const Icon = tool.icon

                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={cn(
                      'group relative p-6 rounded-xl border-2 transition-all duration-300',
                      'bg-bg-secondary/50 backdrop-blur-sm',
                      'border-border-primary hover:border-primary/50',
                      'hover:scale-105 hover:shadow-lg',
                      'text-left'
                    )}
                  >
                    {/* Icon with gradient */}
                    <div className={cn(
                      'w-12 h-12 mb-3 rounded-lg flex items-center justify-center',
                      'bg-gradient-to-br shadow-md group-hover:shadow-lg transition-shadow',
                      tool.gradient
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Label */}
                    <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
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
          </div>
        </Modal>
      )}
    </>
  )
}

export default ChatGenerationPage
