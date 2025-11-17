import { BookOpen, Scroll, MessageSquare, Book } from 'lucide-react'
import React from 'react'

import { Card, CardContent } from '../common'
import { cn } from '@/styles'
import type { ContentType } from '@/types/content'

interface ContentTypeSelectorProps {
  onSelectType: (type: ContentType) => void
}

interface ContentTypeOption {
  type: ContentType
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  gradient: string
}

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    type: 'npc',
    icon: BookOpen,
    label: 'NPC Character',
    description: 'Generate complete NPCs with personality, appearance, dialogue, and behavior',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'quest',
    icon: Scroll,
    label: 'Quest',
    description: 'Create quests with objectives, rewards, and story narrative',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    type: 'dialogue',
    icon: MessageSquare,
    label: 'Dialogue Tree',
    description: 'Generate branching dialogue trees for NPC conversations',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    type: 'lore',
    icon: Book,
    label: 'World Lore',
    description: 'Generate rich lore content for world-building and storytelling',
    gradient: 'from-orange-500 to-red-500'
  }
]

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Content Generation
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Create NPCs, quests, dialogue, and lore for your game using AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONTENT_TYPES.map((contentType) => {
          const Icon = contentType.icon

          return (
            <Card
              key={contentType.type}
              className="group cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary hover:border-primary/50 overflow-hidden"
              onClick={() => onSelectType(contentType.type)}
            >
              <CardContent className="p-8 text-center">
                {/* Icon with gradient background */}
                <div className={cn(
                  'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-shadow',
                  contentType.gradient
                )}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                  {contentType.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed">
                  {contentType.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-6 pt-6 border-t border-border-primary">
                  <span className="text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to start →
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info section */}
      <div className="mt-12 p-6 bg-bg-secondary/50 border border-border-primary rounded-lg">
        <div className="flex items-start gap-4">
          <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Powered by AI Gateway</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              Generate rich game content using AI. NPCs include personality, appearance, dialogue, and behavior.
              Quests feature objectives, rewards, and narrative. Dialogue trees support branching conversations.
              Lore content includes world-building with timeline and character references.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
