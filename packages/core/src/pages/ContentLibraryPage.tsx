/**
 * Content Library Page
 * Browse and manage saved content (NPCs, quests, dialogues, lore)
 */

import React, { useState } from 'react'
import { Trash2, FileText, Users, Scroll, BookOpen, Calendar, Search, Filter } from 'lucide-react'
import { useContent, ContentItem, ContentType } from '@/hooks/useContent'

const CONTENT_TYPE_ICONS = {
  npc: Users,
  quest: Scroll,
  dialogue: FileText,
  lore: BookOpen,
} as const

const CONTENT_TYPE_LABELS = {
  npc: 'NPC',
  quest: 'Quest',
  dialogue: 'Dialogue',
  lore: 'Lore',
} as const

export const ContentLibraryPage: React.FC = () => {
  const { allContent, loading, deleteNPC, deleteQuest, deleteDialogue, deleteLore } = useContent()
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter content based on type and search
  const filteredContent = allContent.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  // Sort by creation date (newest first)
  const sortedContent = [...filteredContent].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  )

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return

    switch (item.type) {
      case 'npc':
        await deleteNPC(item.id)
        break
      case 'quest':
        await deleteQuest(item.id)
        break
      case 'dialogue':
        await deleteDialogue(item.id)
        break
      case 'lore':
        await deleteLore(item.id)
        break
    }

    if (selectedContent?.id === item.id) {
      setSelectedContent(null)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading content library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar - Content List */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search and Filters */}
            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-text-tertiary" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ContentType | 'all')}
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types ({allContent.length})</option>
                  <option value="npc">NPCs ({allContent.filter(i => i.type === 'npc').length})</option>
                  <option value="quest">Quests ({allContent.filter(i => i.type === 'quest').length})</option>
                  <option value="dialogue">Dialogues ({allContent.filter(i => i.type === 'dialogue').length})</option>
                  <option value="lore">Lore ({allContent.filter(i => i.type === 'lore').length})</option>
                </select>
              </div>

              <div className="text-xs text-text-tertiary">
                Showing {sortedContent.length} of {allContent.length} items
              </div>
            </div>

            {/* Content List */}
            <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
              {sortedContent.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary mb-1">No content found</p>
                  <p className="text-sm text-text-tertiary">
                    {searchQuery || filterType !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Generate some content to get started'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-primary max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {sortedContent.map((item) => {
                    const Icon = CONTENT_TYPE_ICONS[item.type]
                    const isSelected = selectedContent?.id === item.id

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedContent(item)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-bg-tertiary ${
                          isSelected ? 'bg-bg-tertiary border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-primary/20' : 'bg-bg-tertiary'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isSelected ? 'text-primary' : 'text-text-secondary'
                            }`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-text-primary truncate">
                                {item.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-tertiary">
                                {CONTENT_TYPE_LABELS[item.type]}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-text-tertiary">
                              <Calendar className="w-3 h-3" />
                              {item.createdAt.toLocaleDateString()}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(item)
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-text-tertiary group-hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - Detail View */}
          <div className="lg:col-span-8">
            <div className="bg-bg-secondary rounded-xl border border-border-primary p-6 min-h-[600px]">
              {selectedContent ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {React.createElement(CONTENT_TYPE_ICONS[selectedContent.type], {
                        className: "w-8 h-8 text-primary"
                      })}
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary">{selectedContent.name}</h2>
                        <p className="text-sm text-text-tertiary">
                          {CONTENT_TYPE_LABELS[selectedContent.type]} • Created {selectedContent.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-primary pt-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Data</h3>
                    <pre className="bg-bg-tertiary rounded-lg p-4 text-sm text-text-secondary overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(selectedContent.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
                    <p className="text-text-secondary mb-1">No content selected</p>
                    <p className="text-sm text-text-tertiary">
                      Select an item from the list to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentLibraryPage
