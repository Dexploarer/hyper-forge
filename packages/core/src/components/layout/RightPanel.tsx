import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { NavigationView } from '@/types'
import { cn } from '@/styles'

interface RightPanelProps {
  currentView: NavigationView
  children?: React.ReactNode
}

export function RightPanel({ currentView, children }: RightPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (isCollapsed) {
    return (
      <div className="w-12 bg-bg-secondary/95 backdrop-blur-sm border-l border-white/10 flex items-start justify-center pt-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title="Expand properties panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <aside className="w-80 bg-bg-secondary/95 backdrop-blur-sm border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Properties</h3>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title="Collapse properties panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {children || (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
            <p className="text-text-tertiary text-sm">
              Select an item to view properties
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
