import React from 'react'
import { Menu, User, Settings, Sparkles } from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'

interface MobileTopBarProps {
  currentView: NavigationView
  onMenuClick: () => void
}

const VIEW_TITLES: Record<NavigationView, string> = {
  [NAVIGATION_VIEWS.GENERATION]: 'Generate',
  [NAVIGATION_VIEWS.ASSETS]: 'Assets',
  [NAVIGATION_VIEWS.AUDIO]: 'Audio',
  [NAVIGATION_VIEWS.CONTENT]: 'Content',
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: 'Library',
  [NAVIGATION_VIEWS.PLAYTESTER]: 'Playtester',
  [NAVIGATION_VIEWS.EQUIPMENT]: 'Equipment',
  [NAVIGATION_VIEWS.HAND_RIGGING]: 'Hand Rigging',
  [NAVIGATION_VIEWS.ARMOR_FITTING]: 'Armor Fitting',
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: 'Animation'
}

export function MobileTopBar({ currentView, onMenuClick }: MobileTopBarProps) {
  return (
    <header className="h-14 bg-bg-secondary/95 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-2.5 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-text-primary active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* App Logo & Current Page */}
      <div className="flex items-center gap-2 flex-1 justify-center -ml-10">
        <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary leading-none">
            {VIEW_TITLES[currentView]}
          </h1>
          <p className="text-[10px] text-text-tertiary leading-none mt-0.5">ALPHA</p>
        </div>
      </div>

      {/* User Avatar */}
      <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
    </header>
  )
}
