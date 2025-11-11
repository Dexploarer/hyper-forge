import { useState } from "react";
import { Command, Search } from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { UserProfileMenu, UserProfileModal } from "@/components/user";
import { ThemeSwitcher } from "@/components/common";
import { cn } from "@/styles";

interface TopBarProps {
  currentView: NavigationView;
}

const VIEW_TITLES: Record<NavigationView, string> = {
  [NAVIGATION_VIEWS.GENERATION]: "AI Asset Generation",
  [NAVIGATION_VIEWS.ASSETS]: "Asset Library",
  [NAVIGATION_VIEWS.AUDIO]: "Audio Generation",
  [NAVIGATION_VIEWS.CONTENT]: "Content Generation",
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: "Content Library",
  [NAVIGATION_VIEWS.PLAYTESTER]: "AI Playtester Swarm",
  [NAVIGATION_VIEWS.EQUIPMENT]: "Equipment Fitting",
  [NAVIGATION_VIEWS.HAND_RIGGING]: "Hand Rigging",
  [NAVIGATION_VIEWS.ARMOR_FITTING]: "Armor Fitting",
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "Animation Retargeting",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Configuration",
  [NAVIGATION_VIEWS.SETTINGS]: "Settings & Configuration",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin Dashboard",
};

export function TopBar({ currentView }: TopBarProps) {
  const { user, logout } = useAuth();
  const { openPalette } = useCommandPalette();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get session ID from localStorage (same as AuthContext)
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem("asset_forge_session");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("asset_forge_session", sessionId);
    }
    return sessionId;
  };

  const handleProfileSuccess = async () => {
    // Reload the page to refresh user data from AuthContext
    window.location.reload();
  };

  return (
    <>
      <header className="h-16 solid-surface border-b border-border-primary flex items-center justify-between px-6 relative z-50">
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
          {/* Command Palette Trigger */}
          <button
            onClick={openPalette}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-bg-tertiary/50 border border-border-primary",
              "hover:bg-bg-hover hover:border-primary/30",
              "text-text-secondary hover:text-text-primary",
              "transition-all duration-200",
              "text-sm font-medium",
            )}
            title="Open command palette (⌘K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-secondary rounded border border-border-primary text-xs">
              <Command className="w-3 h-3" />
              <span>K</span>
            </kbd>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher size="md" />

          {/* User Profile Menu */}
          <UserProfileMenu
            user={user}
            onOpenProfile={() => setShowProfileModal(true)}
            onLogout={logout}
          />
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && user && (
        <UserProfileModal
          open={showProfileModal}
          user={user}
          sessionId={getSessionId()}
          onClose={() => setShowProfileModal(false)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </>
  );
}
