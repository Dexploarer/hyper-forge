import { Book, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

import { Modal, ModalHeader, ModalBody, ModalFooter, ModalSection, Button, Select, Input, Textarea } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { notify } from '@/utils/notify'
import type { NPCData, LoreData } from '@/types/content'

interface LoreGenerationModalProps {
  open: boolean
  onClose: () => void
  npc: NPCData
  npcId: string
  onSuccess: (lore: LoreData & { id: string }) => void
}

export const LoreGenerationModal: React.FC<LoreGenerationModalProps> = ({
  open,
  onClose,
  npc,
  npcId,
  onSuccess,
}) => {
  const [apiClient] = useState(() => new ContentAPIClient())
  const [category, setCategory] = useState('Character')
  const [topic, setTopic] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLore, setGeneratedLore] = useState<(LoreData & { id: string }) | null>(null)
  const [status, setStatus] = useState<'config' | 'generating' | 'success'>('config')

  const categories = [
    'History',
    'Legend',
    'Mythology',
    'Character',
    'Location',
    'Artifact',
    'Event',
    'Organization',
    'Culture',
  ]

  const handleGenerate = async () => {
    if (!npcId) {
      notify.error('NPC must be saved before generating lore')
      return
    }

    if (!topic.trim()) {
      notify.error('Please enter a topic for the lore')
      return
    }

    try {
      setIsGenerating(true)
      setStatus('generating')

      const result = await apiClient.generateLoreForNPC({
        npcId,
        npcName: npc.name,
        archetype: npc.archetype,
        category: category.toLowerCase(),
        topic,
        additionalContext: additionalContext || undefined,
        quality: 'balanced',
      })

      setGeneratedLore(result.lore)
      setStatus('success')
      notify.success('Lore generated and linked to NPC!')
    } catch (error) {
      console.error('Failed to generate lore:', error)
      notify.error('Failed to generate lore')
      setStatus('config')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleComplete = () => {
    if (generatedLore) {
      onSuccess(generatedLore)
    }
    onClose()
  }

  const handleReset = () => {
    setGeneratedLore(null)
    setStatus('config')
    setTopic('')
    setAdditionalContext('')
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Generate Lore" onClose={onClose} />

      <ModalBody>
        {status === 'config' && (
          <ModalSection
            title="Lore Configuration"
            description={`Create lore that features ${npc.name}`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`e.g., The origin story of ${npc.name}`}
                  className="w-full"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  What should this lore be about?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Additional Context (Optional)
                </label>
                <Textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any specific details, time periods, locations, or other characters that should be included..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg">
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Featured Character: {npc.name}
                </h4>
                <p className="text-xs text-text-secondary">
                  Archetype: {npc.archetype}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {npc.personality.background}
                </p>
              </div>
            </div>
          </ModalSection>
        )}

        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Generating Lore...
            </h3>
            <p className="text-sm text-text-secondary text-center max-w-md">
              Creating {category.toLowerCase()} lore featuring {npc.name}
            </p>
          </div>
        )}

        {status === 'success' && generatedLore && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-sm font-semibold text-green-500">Lore Generated!</h3>
                <p className="text-xs text-text-secondary">
                  Lore has been linked to {npc.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-1">
                  {generatedLore.title}
                </h3>
                <p className="text-sm text-text-tertiary capitalize">{generatedLore.category}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Summary</h4>
                <p className="text-sm text-text-secondary italic">{generatedLore.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Content</h4>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {generatedLore.content}
                </p>
              </div>

              {generatedLore.relatedTopics && generatedLore.relatedTopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Related Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedLore.relatedTopics.map((relTopic, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-bg-tertiary/50 border border-border-primary rounded text-xs text-text-secondary"
                      >
                        {relTopic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {status === 'config' && (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Lore
            </Button>
          </>
        )}

        {status === 'success' && (
          <>
            <Button variant="outline" onClick={handleReset}>
              Generate Another
            </Button>
            <Button onClick={handleComplete}>
              <Book className="w-4 h-4 mr-2" />
              Done
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
