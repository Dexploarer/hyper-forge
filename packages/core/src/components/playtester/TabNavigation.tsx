import React from 'react'
import { Settings, Clock, FileText } from 'lucide-react'

import type { PlaytestView } from '@/types/playtester'

interface TabNavigationProps {
  activeView: PlaytestView
  generatedTestsCount: number
  onTabChange: (view: PlaytestView) => void
}

interface Tab {
  view: PlaytestView
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
}

const TABS: Tab[] = [
  {
    view: 'config',
    icon: Settings,
    label: 'Config'
  },
  {
    view: 'progress',
    icon: Clock,
    label: 'Progress'
  },
  {
    view: 'results',
    icon: FileText,
    label: 'Results'
  }
]

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeView,
  generatedTestsCount,
  onTabChange
}) => {
  return (
    <div className="border-b border-border-primary">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeView === tab.view
          const showBadge = tab.view === 'results' && generatedTestsCount > 0

          return (
            <button
              key={tab.view}
              onClick={() => onTabChange(tab.view)}
              className={`
                relative flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all
                ${
                  isActive
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {showBadge && (
                <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-full">
                  {generatedTestsCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
