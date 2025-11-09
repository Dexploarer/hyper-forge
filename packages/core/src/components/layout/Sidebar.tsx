import React, { useState } from 'react'
import {
  Sparkles,
  Package,
  Hand,
  Shield,
  Play,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Music,
  ScrollText,
  Library,
  TestTube2,
  Users
} from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/styles'

interface SidebarProps {
  currentView: NavigationView
  onViewChange: (view: NavigationView) => void
}

interface NavItem {
  view: NavigationView
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    view: NAVIGATION_VIEWS.GENERATION,
    icon: Sparkles,
    label: 'Generate',
    description: 'AI-powered asset generation'
  },
  {
    view: NAVIGATION_VIEWS.ASSETS,
    icon: Package,
    label: 'Assets',
    description: 'Browse & manage assets'
  },
  {
    view: NAVIGATION_VIEWS.AUDIO,
    icon: Music,
    label: 'Audio',
    description: 'Voice, music & sound effects'
  },
  {
    view: NAVIGATION_VIEWS.CONTENT,
    icon: ScrollText,
    label: 'Content',
    description: 'NPCs, quests & lore'
  },
  {
    view: NAVIGATION_VIEWS.CONTENT_LIBRARY,
    icon: Library,
    label: 'Library',
    description: 'Saved content browser'
  },
  {
    view: NAVIGATION_VIEWS.PLAYTESTER,
    icon: TestTube2,
    label: 'Playtester',
    description: 'AI swarm testing'
  },
  {
    view: NAVIGATION_VIEWS.EQUIPMENT,
    icon: Shield,
    label: 'Equipment Fitting',
    description: 'Weapons, armor & helmets'
  },
  {
    view: NAVIGATION_VIEWS.HAND_RIGGING,
    icon: Hand,
    label: 'Hand Rigging',
    description: 'Auto-grip detection'
  },
  {
    view: NAVIGATION_VIEWS.RETARGET_ANIMATE,
    icon: Play,
    label: 'Animation',
    description: 'Retarget & animate'
  },
  {
    view: NAVIGATION_VIEWS.ADMIN_DASHBOARD,
    icon: Users,
    label: 'Admin Dashboard',
    description: 'Manage users & admins'
  }
]

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { logout } = useAuth()

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <aside
      className={cn(
        'h-full bg-bg-secondary/95 backdrop-blur-sm border-r border-white/10 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Asset Forge</h1>
              <p className="text-xs text-text-tertiary">Alpha</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.view

          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary shadow-lg shadow-primary/10'
                  : 'hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive && 'text-primary'
                )}
              />

              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className={cn(
                    'font-medium text-sm truncate',
                    isActive ? 'text-primary' : 'text-text-primary'
                  )}>
                    {item.label}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {item.description}
                  </div>
                </div>
              )}

              {!isCollapsed && isActive && (
                <div className="w-1.5 h-8 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors group border border-transparent hover:border-red-500/30"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </aside>
  )
}
