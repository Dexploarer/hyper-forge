import React, { useEffect, useState } from 'react'
import { User, CheckCircle2, Circle, Loader2 } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent, Badge } from '../common'
import { PlaytesterAPIClient } from '@/services/api/PlaytesterAPIClient'
import type { TesterPersona } from '@/types/playtester'

interface TesterProfileListProps {
  selectedProfiles: string[]
  onProfilesChange: (profiles: string[]) => void
}

export const TesterProfileList: React.FC<TesterProfileListProps> = ({
  selectedProfiles,
  onProfilesChange
}) => {
  const [apiClient] = useState(() => new PlaytesterAPIClient())
  const [personas, setPersonas] = useState<Record<string, TesterPersona>>({})
  const [defaultSwarm, setDefaultSwarm] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getAvailablePersonas()
      setPersonas(response.personas)
      setDefaultSwarm(response.defaultSwarm)

      // Auto-select default swarm if no profiles selected
      if (selectedProfiles.length === 0) {
        onProfilesChange(response.defaultSwarm)
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProfile = (archetype: string) => {
    if (selectedProfiles.includes(archetype)) {
      onProfilesChange(selectedProfiles.filter(p => p !== archetype))
    } else {
      onProfilesChange([...selectedProfiles, archetype])
    }
  }

  const selectDefault = () => {
    onProfilesChange(defaultSwarm)
  }

  const selectAll = () => {
    onProfilesChange(Object.keys(personas))
  }

  const clearAll = () => {
    onProfilesChange([])
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-text-tertiary" />
          <CardTitle className="text-base">AI Playtesters</CardTitle>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={selectDefault}
            className="text-xs px-2 py-1 bg-primary/10 border border-primary/30 text-primary rounded hover:bg-primary/20 transition-colors"
          >
            Default ({defaultSwarm.length})
          </button>
          <button
            onClick={selectAll}
            className="text-xs px-2 py-1 bg-bg-tertiary border border-border-primary text-text-secondary rounded hover:bg-bg-hover transition-colors"
          >
            All ({Object.keys(personas).length})
          </button>
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 bg-bg-tertiary border border-border-primary text-text-secondary rounded hover:bg-bg-hover transition-colors"
          >
            Clear
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.entries(personas).map(([archetype, persona]) => {
          const isSelected = selectedProfiles.includes(archetype)
          const isDefault = defaultSwarm.includes(archetype)

          return (
            <button
              key={archetype}
              onClick={() => toggleProfile(archetype)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border-primary bg-bg-tertiary/30 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {persona.name}
                    </span>
                    {isDefault && (
                      <Badge className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-500">
                        default
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                    {persona.personality}
                  </p>

                  <div className="flex items-center gap-1">
                    <Badge className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-500 capitalize">
                      {persona.archetype}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>

      <div className="p-4 border-t border-border-primary bg-bg-tertiary/30">
        <div className="text-xs text-text-tertiary">
          {selectedProfiles.length} tester{selectedProfiles.length !== 1 ? 's' : ''} selected
        </div>
      </div>
    </Card>
  )
}
