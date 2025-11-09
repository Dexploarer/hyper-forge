import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

import {
  ContentTypeSelector,
  TabNavigation,
  PlaytestConfigCard,
  PlaytestReportCard,
  TesterProfileList,
  GeneratedPlaytestList
} from '@/components/Playtester'
import { Button } from '@/components/common'
import type { PlaytestContentType, PlaytestView, GeneratedPlaytest, PlaytestResult } from '@/types/playtester'

export const PlaytesterSwarmPage: React.FC = () => {
  // Content type selection
  const [contentType, setContentType] = useState<PlaytestContentType | null>(null)

  // View management
  const [activeView, setActiveView] = useState<PlaytestView>('config')

  // Tester profile selection
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])

  // Generated playtests
  const [generatedPlaytests, setGeneratedPlaytests] = useState<GeneratedPlaytest[]>([])
  const [selectedPlaytest, setSelectedPlaytest] = useState<GeneratedPlaytest | null>(null)

  // Handle playtest completion
  const handleTestCompleted = (result: PlaytestResult) => {
    const id = result.sessionId
    const name = `${result.contentType.charAt(0).toUpperCase()}${result.contentType.slice(1)} Test`

    const newPlaytest: GeneratedPlaytest = {
      id,
      contentType: result.contentType as PlaytestContentType,
      name,
      result,
      createdAt: new Date().toISOString()
    }

    setGeneratedPlaytests(prev => [newPlaytest, ...prev])
    setSelectedPlaytest(newPlaytest)
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
      <div className="max-w-7xl mx-auto py-4 pb-6">
        {/* Header with tabs */}
        <div className="mb-4">
          <TabNavigation
            activeView={activeView}
            generatedTestsCount={generatedPlaytests.length}
            onTabChange={setActiveView}
          />
        </div>

        {/* Config View */}
        {activeView === 'config' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Configuration Card */}
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

                <PlaytestConfigCard
                  contentType={contentType}
                  selectedProfiles={selectedProfiles}
                  onTestCompleted={handleTestCompleted}
                />
              </div>

              {/* Sidebar - Tester Profiles */}
              <div className="space-y-4">
                <TesterProfileList
                  selectedProfiles={selectedProfiles}
                  onProfilesChange={setSelectedProfiles}
                />

                {generatedPlaytests.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveView('results')}
                    className="w-full"
                  >
                    View All Results ({generatedPlaytests.length})
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
            <p className="text-xs text-text-tertiary mt-2">
              Tests currently run in real-time. Check the Results tab after testing completes.
            </p>
          </div>
        )}

        {/* Results View */}
        {activeView === 'results' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Playtests List */}
              <GeneratedPlaytestList
                playtests={generatedPlaytests}
                selectedPlaytest={selectedPlaytest}
                onPlaytestSelect={setSelectedPlaytest}
              />

              {/* Playtest Report */}
              <div className="lg:col-span-3">
                {selectedPlaytest ? (
                  <PlaytestReportCard result={selectedPlaytest.result} />
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    <p>Select a playtest to view report</p>
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

export default PlaytesterSwarmPage
