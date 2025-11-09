import React from 'react'
import { Sparkles, Package, Shield, MoreHorizontal } from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'
import { cn } from '@/styles'

interface BottomNavProps {
  currentView: NavigationView
  onViewChange: (view: NavigationView) => void
  onMoreClick: () => void
}

interface NavItem {
  view: NavigationView | 'more'
  icon: React.ElementType
  label: string
}

const NAV_ITEMS: NavItem[] = [
  {
    view: NAVIGATION_VIEWS.GENERATION,
    icon: Sparkles,
    label: 'Generate'
  },
  {
    view: NAVIGATION_VIEWS.ASSETS,
    icon: Package,
    label: 'Assets'
  },
  {
    view: NAVIGATION_VIEWS.EQUIPMENT,
    icon: Shield,
    label: 'Equipment'
  },
  {
    view: 'more',
    icon: MoreHorizontal,
    label: 'More'
  }
]

export function BottomNav({ currentView, onViewChange, onMoreClick }: BottomNavProps) {
  return (
    <nav className="h-16 bg-bg-secondary/98 backdrop-blur-sm border-t border-white/10 fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="h-full flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon as React.FC<{ className?: string }>
          const isActive = item.view !== 'more' && currentView === item.view
          const handleClick = item.view === 'more'
            ? onMoreClick
            : () => onViewChange(item.view as NavigationView)

          return (
            <button
              key={item.view}
              onClick={handleClick}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] h-12 px-3 rounded-xl transition-all duration-200 active:scale-95',
                isActive
                  ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span className={cn(
                'text-[10px] font-medium mt-0.5 leading-none',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
