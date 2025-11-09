import React from 'react'
import { User, Settings } from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'

interface TopBarProps {
  currentView: NavigationView
}

const VIEW_TITLES: Record<NavigationView, string> = {
  [NAVIGATION_VIEWS.GENERATION]: 'AI Asset Generation',
  [NAVIGATION_VIEWS.ASSETS]: 'Asset Library',
  [NAVIGATION_VIEWS.AUDIO]: 'Audio Generation',
  [NAVIGATION_VIEWS.CONTENT]: 'Content Generation',
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: 'Content Library',
  [NAVIGATION_VIEWS.PLAYTESTER]: 'AI Playtester Swarm',
  [NAVIGATION_VIEWS.EQUIPMENT]: 'Equipment Fitting',
  [NAVIGATION_VIEWS.HAND_RIGGING]: 'Hand Rigging',
  [NAVIGATION_VIEWS.ARMOR_FITTING]: 'Armor Fitting',
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: 'Animation Retargeting'
}

export function TopBar({ currentView }: TopBarProps) {
  return (
    <header className="h-16 bg-bg-secondary/95 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6">
      {/* Current page title */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-text-primary">
          {VIEW_TITLES[currentView]}
        </h2>
        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <span className="text-xs font-medium text-primary">ALPHA</span>
        </div>
      </div>

      {/* Right side - User info & actions */}
      <div className="flex items-center gap-3">
        {/* Settings button */}
        <button
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-text-primary">Admin</div>
            <div className="text-xs text-text-tertiary">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  )
}
