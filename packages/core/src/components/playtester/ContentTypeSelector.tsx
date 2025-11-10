import React from 'react'
import { ScrollText, MessageSquare, User, Swords, Puzzle } from 'lucide-react'

import type { PlaytestContentType } from '@/types/playtester'

interface ContentTypeSelectorProps {
  onSelectType: (type: PlaytestContentType) => void
}

interface ContentTypeOption {
  type: PlaytestContentType
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  color: string
}

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    type: 'quest',
    icon: ScrollText,
    label: 'Quest',
    description: 'Test quest flow, objectives & rewards',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'dialogue',
    icon: MessageSquare,
    label: 'Dialogue',
    description: 'Test conversation trees & branching',
    color: 'from-purple-500 to-pink-500'
  },
  {
    type: 'npc',
    icon: User,
    label: 'NPC',
    description: 'Test character behavior & interactions',
    color: 'from-green-500 to-emerald-500'
  },
  {
    type: 'combat',
    icon: Swords,
    label: 'Combat',
    description: 'Test combat mechanics & balance',
    color: 'from-red-500 to-orange-500'
  },
  {
    type: 'puzzle',
    icon: Puzzle,
    label: 'Puzzle',
    description: 'Test puzzle logic & difficulty',
    color: 'from-indigo-500 to-violet-500'
  }
]

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2">AI Playtester Swarm</h2>
        <p className="text-text-secondary">
          Deploy multiple AI agents to test your game content for bugs, balance, and engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {CONTENT_TYPES.map((contentType) => {
          const Icon = contentType.icon

          return (
            <button
              key={contentType.type}
              onClick={() => onSelectType(contentType.type)}
              className="group relative bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border border-border-primary rounded-xl p-6 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${contentType.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />

              <div className="relative z-10">
                <div className={`mb-4 p-3 bg-gradient-to-br ${contentType.color} rounded-xl inline-block`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                  {contentType.label}
                </h3>

                <p className="text-sm text-text-secondary">
                  {contentType.description}
                </p>
              </div>

              {/* Animated border on hover */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </button>
          )
        })}
      </div>

      <div className="mt-12 max-w-3xl mx-auto p-6 bg-bg-secondary/50 border border-border-primary rounded-xl">
        <h3 className="text-base font-semibold text-text-primary mb-3">How it works</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>• Select a content type to test</p>
          <p>• Provide your game content (JSON format)</p>
          <p>• Choose AI playtester personas (or use defaults)</p>
          <p>• AI agents test in parallel, finding bugs and rating engagement</p>
          <p>• Receive comprehensive quality report with actionable feedback</p>
        </div>
      </div>
    </div>
  )
}
