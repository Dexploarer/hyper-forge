import { useState } from "react";
import { Menu, User, Sparkles } from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSettingsModal } from "@/components/auth/ProfileSettingsModal";

interface MobileTopBarProps {
  currentView: NavigationView;
  onMenuClick: () => void;
}

const VIEW_TITLES: Record<NavigationView, string> = {
  // Core
  [NAVIGATION_VIEWS.DASHBOARD]: "Dashboard",
  [NAVIGATION_VIEWS.ASSETS]: "Assets",
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: "Library",
  // 3D Generation
  [NAVIGATION_VIEWS.GENERATION_CHARACTER]: "Characters",
  [NAVIGATION_VIEWS.GENERATION_PROP]: "Props",
  [NAVIGATION_VIEWS.GENERATION_ENVIRONMENT]: "Environments",
  [NAVIGATION_VIEWS.GENERATION_WORLD]: "World Builder",
  // Content Generation
  [NAVIGATION_VIEWS.CONTENT_NPC]: "NPCs",
  [NAVIGATION_VIEWS.CONTENT_QUEST]: "Quests",
  [NAVIGATION_VIEWS.CONTENT_DIALOGUE]: "Dialogue",
  [NAVIGATION_VIEWS.CONTENT_LORE]: "Lore",
  // Audio Generation
  [NAVIGATION_VIEWS.AUDIO_VOICE]: "Voice",
  [NAVIGATION_VIEWS.AUDIO_SFX]: "SFX",
  [NAVIGATION_VIEWS.AUDIO_MUSIC]: "Music",
  // Tools
  [NAVIGATION_VIEWS.PLAYTESTER]: "Playtester",
  [NAVIGATION_VIEWS.EQUIPMENT]: "Equipment",
  [NAVIGATION_VIEWS.HAND_RIGGING]: "Hand Rigging",
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "Animation",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Config",
  // System
  [NAVIGATION_VIEWS.SETTINGS]: "Settings",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin",
  // Legacy
  [NAVIGATION_VIEWS.GENERATION]: "Generate",
  [NAVIGATION_VIEWS.AUDIO]: "Audio",
  [NAVIGATION_VIEWS.CONTENT]: "Content",
  [NAVIGATION_VIEWS.ARMOR_FITTING]: "Armor Fitting",
};

export function MobileTopBar({ currentView, onMenuClick }: MobileTopBarProps) {
  const { user, logout, completeProfile } = useAuth();
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  return (
    <>
      <header className="h-14 solid-surface border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
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
            <p className="text-xs text-text-secondary leading-none mt-0.5">
              ALPHA
            </p>
          </div>
        </div>

        {/* User Avatar - Clickable */}
        <button
          onClick={() => setShowProfileSettings(true)}
          className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Open profile settings"
        >
          <User className="w-4 h-4 text-white" />
        </button>
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
  );
}
