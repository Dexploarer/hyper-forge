import { Zap, Sliders } from 'lucide-react'
import React from 'react'

import { cn } from '@/styles'

interface TabSelectorProps {
  activeTab: 'quick' | 'advanced'
  onTabChange: (tab: 'quick' | 'advanced') => void
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex gap-2 p-1 bg-bg-tertiary rounded-lg">
      <button
        onClick={() => onTabChange('quick')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm",
          activeTab === 'quick'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
        )}
      >
        <Zap className="w-4 h-4" />
        <span>Quick Fit</span>
      </button>
      <button
        onClick={() => onTabChange('advanced')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm",
          activeTab === 'advanced'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
        )}
      >
        <Sliders className="w-4 h-4" />
        <span>Advanced</span>
      </button>
    </div>
  )
}
