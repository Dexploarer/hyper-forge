import { Settings, Loader2, ListMusic } from 'lucide-react'
import React from 'react'

import { cn } from '@/styles'
import type { AudioView } from '@/types/audio'

interface TabNavigationProps {
  activeView: AudioView
  generatedAudiosCount: number
  onTabChange: (view: AudioView) => void
}

interface Tab {
  view: AudioView
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  badge?: number
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeView,
  generatedAudiosCount,
  onTabChange
}) => {
  const tabs: Tab[] = [
    { view: 'config', icon: Settings, label: 'Configure' },
    { view: 'progress', icon: Loader2, label: 'Progress' },
    { view: 'results', icon: ListMusic, label: 'Results', badge: generatedAudiosCount }
  ]

  return (
    <div className="flex gap-2 p-1 bg-bg-secondary/50 rounded-lg border border-border-primary">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeView === tab.view

        return (
          <button
            key={tab.view}
            onClick={() => onTabChange(tab.view)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200',
              'text-sm font-medium',
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            )}
          >
            <Icon className={cn(
              'w-4 h-4',
              isActive && tab.view === 'progress' && 'animate-spin'
            )} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                isActive
                  ? 'bg-white text-primary'
                  : 'bg-primary/20 text-primary'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
