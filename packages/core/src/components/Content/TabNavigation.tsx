import { Settings, Activity, CheckCircle } from 'lucide-react'
import React from 'react'

import { cn } from '@/styles'
import type { ContentView } from '@/types/content'

interface TabNavigationProps {
  activeView: ContentView
  generatedContentsCount: number
  onTabChange: (view: ContentView) => void
}

interface Tab {
  view: ContentView
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: number
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeView,
  generatedContentsCount,
  onTabChange
}) => {
  const tabs: Tab[] = [
    {
      view: 'config',
      label: 'Configuration',
      icon: Settings
    },
    {
      view: 'progress',
      label: 'Progress',
      icon: Activity
    },
    {
      view: 'results',
      label: 'Results',
      icon: CheckCircle,
      badge: generatedContentsCount
    }
  ]

  return (
    <div className="flex gap-2 border-b border-border-primary">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeView === tab.view

        return (
          <button
            key={tab.view}
            onClick={() => onTabChange(tab.view)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm',
              isActive
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/30'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-bg-tertiary text-text-tertiary'
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
