import { useState } from 'react'
import { User, ChevronDown } from 'lucide-react'
import { NavigationView } from '@/types'
import { NAVIGATION_VIEWS } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSettingsModal } from '@/components/auth/ProfileSettingsModal'

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
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: 'Animation Retargeting',
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: 'Admin Dashboard'
}

export function TopBar({ currentView }: TopBarProps) {
  const { user, logout, completeProfile } = useAuth()
  const [showProfileSettings, setShowProfileSettings] = useState(false)

  return (
    <>
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
          {/* User profile button */}
          <button
            onClick={() => setShowProfileSettings(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-text-primary">
                {user?.displayName || 'Admin'}
              </div>
              <div className="text-xs text-text-tertiary">
                {user?.email || 'Administrator'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
          </button>
        </div>
      </header>

      {/* Profile Settings Modal */}
      {showProfileSettings && user && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setShowProfileSettings(false)}
          onSave={completeProfile}
          onLogout={logout}
        />
      )}
    </>
  )
}
