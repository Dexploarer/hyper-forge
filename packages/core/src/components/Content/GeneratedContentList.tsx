import { BookOpen, Scroll, MessageSquare, Book, FileText } from 'lucide-react'
import React from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '../common'
import { cn } from '@/styles'
import type { GeneratedContent, ContentType } from '@/types/content'

interface GeneratedContentListProps {
  contents: GeneratedContent[]
  selectedContent: GeneratedContent | null
  onContentSelect: (content: GeneratedContent) => void
}

const getContentIcon = (type: ContentType) => {
  switch (type) {
    case 'npc': return BookOpen
    case 'quest': return Scroll
    case 'dialogue': return MessageSquare
    case 'lore': return Book
    default: return FileText
  }
}

const getContentColor = (type: ContentType) => {
  switch (type) {
    case 'npc': return 'text-blue-500'
    case 'quest': return 'text-purple-500'
    case 'dialogue': return 'text-green-500'
    case 'lore': return 'text-orange-500'
    default: return 'text-gray-500'
  }
}

export const GeneratedContentList: React.FC<GeneratedContentListProps> = ({
  contents,
  selectedContent,
  onContentSelect
}) => {
  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Generated Content
          {contents.length > 0 && (
            <span className="ml-auto text-xs text-text-tertiary bg-bg-tertiary/50 px-2 py-1 rounded">
              {contents.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2 p-4">
        {contents.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No content generated yet</p>
            <p className="text-xs mt-1">Start generating to see your content here</p>
          </div>
        ) : (
          contents.map((content) => {
            const Icon = getContentIcon(content.type)
            const isSelected = selectedContent?.id === content.id

            return (
              <button
                key={content.id}
                onClick={() => onContentSelect(content)}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border-primary bg-bg-tertiary/30 hover:border-primary/50 hover:bg-bg-tertiary/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('flex-shrink-0 mt-0.5', getContentColor(content.type))}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'text-sm font-medium truncate',
                        isSelected ? 'text-primary' : 'text-text-primary'
                      )}>
                        {content.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="capitalize">{content.type}</span>
                      <span>•</span>
                      <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
