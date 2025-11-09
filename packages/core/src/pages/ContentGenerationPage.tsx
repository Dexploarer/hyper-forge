import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

import {
  ContentTypeSelector,
  TabNavigation,
  NPCGenerationCard,
  QuestGenerationCard,
  DialogueGenerationCard,
  LoreGenerationCard,
  GeneratedContentList,
  ContentPreviewCard
} from '@/components/Content'
import { Button } from '@/components/common'
import type { ContentType, ContentView, GeneratedContent, NPCData, QuestData, DialogueNode, LoreData } from '@/types/content'

export const ContentGenerationPage: React.FC = () => {
  // Content type selection
  const [contentType, setContentType] = useState<ContentType | null>(null)

  // View management
  const [activeView, setActiveView] = useState<ContentView>('config')

  // Generated content
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null)

  // Handle content generation completion
  const handleContentGenerated = (data: any, rawResponse: string, type: ContentType) => {
    const id = `${type}-${Date.now()}`
    let name = ''
    let contentData: NPCData | QuestData | DialogueNode[] | LoreData

    // Extract name and data based on type
    if (type === 'npc') {
      contentData = data as NPCData & { id: string; metadata: any }
      name = (data as any).name || 'Unnamed NPC'
    } else if (type === 'quest') {
      contentData = data as QuestData & { id: string; difficulty: string; questType: string; metadata: any }
      name = (data as any).title || 'Unnamed Quest'
    } else if (type === 'dialogue') {
      contentData = data as DialogueNode[]
      name = `Dialogue Tree (${(data as DialogueNode[]).length} nodes)`
    } else if (type === 'lore') {
      contentData = data as LoreData & { id: string; metadata: any }
      name = (data as any).title || 'Unnamed Lore'
    } else {
      return
    }

    const newContent: GeneratedContent = {
      id,
      type,
      name,
      data: contentData,
      metadata: {
        type,
        rawResponse,
        ...(data.metadata || {})
      },
      createdAt: new Date().toISOString()
    }

    setGeneratedContents(prev => [newContent, ...prev])
    setSelectedContent(newContent)
    setActiveView('results')
  }

  // Reset to type selection
  const handleBack = () => {
    setContentType(null)
    setActiveView('config')
  }

  // Show type selector if no type selected
  if (!contentType) {
    return (
      <div className="h-full overflow-y-auto">
        <ContentTypeSelector onSelectType={setContentType} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {/* Header with tabs */}
        <div className="mb-6">
          <TabNavigation
            activeView={activeView}
            generatedContentsCount={generatedContents.length}
            onTabChange={setActiveView}
          />
        </div>

        {/* Config View */}
        {activeView === 'config' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Generation Card */}
              <div className="lg:col-span-2">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-4 text-text-secondary hover:text-text-primary"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to content types
                </Button>

                {contentType === 'npc' && (
                  <NPCGenerationCard onGenerated={(npc, raw) => handleContentGenerated(npc, raw, 'npc')} />
                )}
                {contentType === 'quest' && (
                  <QuestGenerationCard onGenerated={(quest, raw) => handleContentGenerated(quest, raw, 'quest')} />
                )}
                {contentType === 'dialogue' && (
                  <DialogueGenerationCard onGenerated={(nodes, raw) => handleContentGenerated(nodes, raw, 'dialogue')} />
                )}
                {contentType === 'lore' && (
                  <LoreGenerationCard onGenerated={(lore, raw) => handleContentGenerated(lore, raw, 'lore')} />
                )}
              </div>

              {/* Sidebar - Recent Content */}
              <div className="space-y-4">
                <GeneratedContentList
                  contents={generatedContents.slice(0, 5)}
                  selectedContent={selectedContent}
                  onContentSelect={(content) => {
                    setSelectedContent(content)
                    setActiveView('results')
                  }}
                />

                {generatedContents.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveView('results')}
                    className="w-full"
                  >
                    View All ({generatedContents.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress View */}
        {activeView === 'progress' && (
          <div className="animate-fade-in text-center py-12">
            <p className="text-text-secondary">Progress tracking coming soon...</p>
          </div>
        )}

        {/* Results View */}
        {activeView === 'results' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Content List */}
              <GeneratedContentList
                contents={generatedContents}
                selectedContent={selectedContent}
                onContentSelect={setSelectedContent}
              />

              {/* Content Preview */}
              <div className="lg:col-span-3">
                {selectedContent ? (
                  <ContentPreviewCard content={selectedContent} />
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    <p>Select content to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentGenerationPage
