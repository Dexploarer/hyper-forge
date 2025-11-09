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
  Library,
  TestTube2,
  Users,
  Settings
} from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/styles'
import { RecentlyViewedWidget } from './RecentlyViewedWidget'
import { useAssetsStore } from '@/store'

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
    description: 'AI-powered content generation'
  },
  {
    view: NAVIGATION_VIEWS.ASSETS,
    icon: Package,
    label: 'Assets',
    description: 'Browse & manage assets'
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
    view: NAVIGATION_VIEWS.SETTINGS,
    icon: Settings,
    label: 'Settings',
    description: 'View prompts & config'
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
  const { recentlyViewed } = useAssetsStore()

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  const handleRecentAssetClick = (assetId: string) => {
    // Navigate to assets view when clicking a recently viewed asset
    onViewChange(NAVIGATION_VIEWS.ASSETS)
    // The asset selection will be handled by the assets page itself via URL or state
  }

  return (
    <aside
      className={cn(
        'h-full bg-bg-secondary/95 backdrop-blur-sm border-r border-border-primary flex flex-col transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-border-primary flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <img 
                src="/Untitled%20design%20(3)/1.png" 
                alt="Asset Forge Logo" 
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Asset Forge</h1>
              <p className="text-xs text-text-tertiary">Alpha</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <img 
                src="/Untitled%20design%20(3)/1.png" 
                alt="Asset Forge Logo" 
                className="w-5 h-5 object-contain"
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Recently Viewed Widget - only show when not collapsed and has items */}
      {!isCollapsed && recentlyViewed.length > 0 && (
        <div className="px-2 pt-2 pb-2">
          <RecentlyViewedWidget onAssetClick={handleRecentAssetClick} />
        </div>
      )}

      {/* Navigation */}
      <nav id="navigation" aria-label="Main navigation" className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.view

          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary shadow-lg shadow-primary/10'
                  : 'hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent'
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
      <div className="p-2 border-t border-border-primary">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors group border border-transparent hover:border-red-500/30"
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
