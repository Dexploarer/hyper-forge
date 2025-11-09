import { Download, FileJson, FileText, Copy, Check, Sparkles, Loader2, User, Volume2, Play, Pause } from 'lucide-react'
import React, { useState, useRef } from 'react'

import { Card, CardHeader, CardTitle, CardContent, Button } from '../common'
import { ContentAPIClient } from '@/services/api/ContentAPIClient'
import { AudioAPIClient } from '@/services/api/AudioAPIClient'
import { notify } from '@/utils/notify'
import type { GeneratedContent, NPCData, QuestData, DialogueNode, LoreData, DialogueData } from '@/types/content'
import { ViewModeToggle, type ViewMode } from './Workflow/ViewModeToggle'
import { DialogueWorkflowView } from './Workflow/DialogueWorkflowView'
import { QuestWorkflowView } from './Workflow/QuestWorkflowView'

interface ContentPreviewCardProps {
  content: GeneratedContent
}

export const ContentPreviewCard: React.FC<ContentPreviewCardProps> = ({ content }) => {
  const [apiClient] = useState(() => new ContentAPIClient())
  const [audioClient] = useState(() => new AudioAPIClient())
  const [copied, setCopied] = useState(false)
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false)
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleGeneratePortrait = async () => {
    if (content.type !== 'npc') return

    const npc = content.data as NPCData

    try {
      setIsGeneratingPortrait(true)
      const result = await apiClient.generateNPCPortrait({
        npcName: npc.name,
        archetype: npc.archetype,
        appearance: npc.appearance.description,
        personality: npc.personality.traits.join(', ')
      })

      setPortraitUrl(result.imageUrl)
      notify.success('Portrait generated successfully!')
    } catch (error) {
      console.error('Failed to generate portrait:', error)
      notify.error('Failed to generate portrait')
    } finally {
      setIsGeneratingPortrait(false)
    }
  }

  const handleGenerateVoice = async () => {
    if (content.type !== 'npc') return

    const npc = content.data as NPCData

    try {
      setIsGeneratingVoice(true)

      // Get voice library to select an appropriate voice
      const voices = await audioClient.getVoiceLibrary()

      // Simple voice selection based on archetype
      let selectedVoice = voices[0] // default

      // Try to match archetype to voice category
      const archetypeLower = npc.archetype.toLowerCase()
      if (archetypeLower.includes('warrior') || archetypeLower.includes('knight')) {
        selectedVoice = voices.find(v => v.category === 'strong' || v.name.toLowerCase().includes('male')) || voices[0]
      } else if (archetypeLower.includes('mage') || archetypeLower.includes('wizard')) {
        selectedVoice = voices.find(v => v.category === 'wise' || v.name.toLowerCase().includes('old')) || voices[0]
      } else if (archetypeLower.includes('merchant') || archetypeLower.includes('noble')) {
        selectedVoice = voices.find(v => v.category === 'smooth' || v.category === 'professional') || voices[0]
      }

      // Generate voice using greeting dialogue
      const audioData = await audioClient.generateVoice({
        text: npc.dialogue.greeting,
        voiceId: selectedVoice.voiceId,
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true
        }
      })

      // Convert base64 to blob URL
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      setVoiceAudioUrl(url)
      notify.success('Voice generated successfully!')
    } catch (error) {
      console.error('Failed to generate voice:', error)
      notify.error('Failed to generate voice')
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  const handlePlayVoice = () => {
    if (!voiceAudioUrl) return

    if (audioRef.current) {
      if (isPlayingVoice) {
        audioRef.current.pause()
        setIsPlayingVoice(false)
      } else {
        audioRef.current.play()
        setIsPlayingVoice(true)
      }
    } else {
      const audio = new Audio(voiceAudioUrl)
      audioRef.current = audio
      audio.onended = () => setIsPlayingVoice(false)
      audio.play()
      setIsPlayingVoice(true)
    }
  }

  const handleCopyJSON = () => {
    const jsonData = JSON.stringify(content.data, null, 2)
    navigator.clipboard.writeText(jsonData)
    setCopied(true)
    notify.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJSON = () => {
    const jsonData = JSON.stringify(content.data, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.name.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify.success('Downloaded JSON file!')
  }

  const handleDownloadTXT = () => {
    let textContent = ''

    if (content.type === 'npc') {
      const npc = content.data as NPCData
      textContent = `${npc.name} - ${npc.archetype}\n\n`
      textContent += `PERSONALITY\n${npc.personality.traits.join(', ')}\n${npc.personality.background}\n\n`
      textContent += `APPEARANCE\n${npc.appearance.description}\n\n`
      textContent += `DIALOGUE\nGreeting: ${npc.dialogue.greeting}\nFarewell: ${npc.dialogue.farewell}\n\n`
      textContent += `BEHAVIOR\n${npc.behavior.role}\n${npc.behavior.schedule}`
    } else if (content.type === 'quest') {
      const quest = content.data as QuestData
      textContent = `${quest.title}\n\n${quest.description}\n\n`
      textContent += `OBJECTIVES:\n${quest.objectives.map(o => `- ${o.description}`).join('\n')}\n\n`
      textContent += `STORY:\n${quest.story}`
    } else if (content.type === 'dialogue') {
      const nodes = content.data as DialogueNode[]
      textContent = `DIALOGUE TREE\n\n`
      nodes.forEach((node, i) => {
        textContent += `Node ${i + 1} (${node.id}):\n${node.text}\n`
        if (node.responses) {
          node.responses.forEach(r => {
            textContent += `  → ${r.text}${r.nextNodeId ? ` (goes to ${r.nextNodeId})` : ''}\n`
          })
        }
        textContent += '\n'
      })
    } else if (content.type === 'lore') {
      const lore = content.data as LoreData
      textContent = `${lore.title}\nCategory: ${lore.category}\n\n`
      textContent += `${lore.content}\n\n`
      textContent += `Summary: ${lore.summary}\n\n`
      if (lore.relatedTopics.length > 0) {
        textContent += `Related: ${lore.relatedTopics.join(', ')}`
      }
    }

    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.name.toLowerCase().replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify.success('Downloaded text file!')
  }

  const renderContent = () => {
    if (content.type === 'npc') {
      const npc = content.data as NPCData
      return (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            {/* Name and Archetype */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary mb-1">{npc.name}</h3>
              <p className="text-sm text-text-secondary capitalize">{npc.archetype}</p>
            </div>

            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-bg-tertiary/50 border-2 border-border-primary/50 flex items-center justify-center">
                {portraitUrl ? (
                  <img
                    src={portraitUrl}
                    alt={`${npc.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-text-tertiary/40" />
                )}
              </div>
              <Button
                onClick={handleGeneratePortrait}
                disabled={isGeneratingPortrait}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isGeneratingPortrait ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Generate Portrait
                  </>
                )}
              </Button>
            </div>

            {/* Voice Generation Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-bg-tertiary/50 border-2 border-border-primary/50 flex items-center justify-center">
                <Volume2 className={`w-12 h-12 ${voiceAudioUrl ? 'text-green-500' : 'text-text-tertiary/40'}`} />
              </div>
              <div className="w-full space-y-2">
                <Button
                  onClick={handleGenerateVoice}
                  disabled={isGeneratingVoice}
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isGeneratingVoice ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Generate Voice
                    </>
                  )}
                </Button>
                {voiceAudioUrl && (
                  <Button
                    onClick={handlePlayVoice}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {isPlayingVoice ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Play Sample
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Personality</h4>
            <p className="text-sm text-text-secondary mb-2">{npc.personality.background}</p>
            <div className="flex flex-wrap gap-2">
              {npc.personality.traits.map((trait, i) => (
                <span key={i} className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Appearance</h4>
            <p className="text-sm text-text-secondary">{npc.appearance.description}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Dialogue</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-text-tertiary">Greeting:</span> <span className="text-text-secondary">"{npc.dialogue.greeting}"</span></p>
              <p><span className="text-text-tertiary">Farewell:</span> <span className="text-text-secondary">"{npc.dialogue.farewell}"</span></p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Behavior</h4>
            <p className="text-sm text-text-secondary mb-1"><span className="text-text-tertiary">Role:</span> {npc.behavior.role}</p>
            <p className="text-sm text-text-secondary"><span className="text-text-tertiary">Schedule:</span> {npc.behavior.schedule}</p>
          </div>
        </div>
      )
    } else if (content.type === 'quest') {
      const quest = content.data as QuestData
      return (
        <div className="space-y-4 h-full flex flex-col">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          {viewMode === 'list' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{quest.title}</h3>
                <p className="text-sm text-text-secondary">{quest.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Objectives</h4>
                <div className="space-y-2">
                  {quest.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <div className="flex-1">
                        <p className="text-text-secondary">{obj.description}</p>
                        <p className="text-xs text-text-tertiary capitalize">{obj.type} - {obj.target} ({obj.count}x)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Rewards</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-text-secondary">Experience: <span className="text-primary">{quest.rewards.experience} XP</span></p>
                  <p className="text-text-secondary">Gold: <span className="text-primary">{quest.rewards.gold} gold</span></p>
                  {quest.rewards.items.length > 0 && (
                    <p className="text-text-secondary">Items: {quest.rewards.items.join(', ')}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Story</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{quest.story}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[500px]">
              <QuestWorkflowView quest={quest} />
            </div>
          )}
        </div>
      )
    } else if (content.type === 'dialogue') {
      const nodes = content.data as DialogueNode[]
      const dialogueData: DialogueData = {
        nodes,
        metadata: {
          characterName: content.name,
          description: `Dialogue tree with ${nodes.length} nodes`,
        },
      }

      return (
        <div className="space-y-4 h-full flex flex-col">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          {viewMode === 'list' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Dialogue Tree ({nodes.length} nodes)</h3>
              {nodes.map((node, i) => (
                <div key={node.id} className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-2">Node {i + 1} - {node.id}</div>
                  <p className="text-sm text-text-primary mb-3">"{node.text}"</p>
                  {node.responses && node.responses.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                      {node.responses.map((response, ri) => (
                        <div key={ri} className="text-sm">
                          <p className="text-text-secondary">→ "{response.text}"</p>
                          {response.nextNodeId && (
                            <p className="text-xs text-text-tertiary mt-1">Goes to: {response.nextNodeId}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-[500px]">
              <DialogueWorkflowView dialogue={dialogueData} />
            </div>
          )}
        </div>
      )
    } else if (content.type === 'lore') {
      const lore = content.data as LoreData
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-1">{lore.title}</h3>
            <p className="text-sm text-text-tertiary capitalize">{lore.category}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Summary</h4>
            <p className="text-sm text-text-secondary italic">{lore.summary}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Content</h4>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{lore.content}</p>
          </div>

          {lore.relatedTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {lore.relatedTopics.map((topic, i) => (
                  <span key={i} className="px-2 py-1 bg-bg-tertiary/50 border border-border-primary rounded text-xs text-text-secondary">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lore.timeline && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Timeline</h4>
              <p className="text-sm text-text-secondary">{lore.timeline}</p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize">{content.type} Preview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileJson className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTXT}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileText className="w-4 h-4 mr-1" />
              TXT
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </CardContent>
    </Card>
  )
}
