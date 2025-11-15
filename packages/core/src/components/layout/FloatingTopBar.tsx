import { useState, useEffect, useCallback, useRef } from "react";
import { Command, Search } from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { UserProfileMenu, UserProfileModal } from "@/components/user";
import { ThemeSwitcher } from "@/components/common";
import { cn } from "@/styles";

interface FloatingTopBarProps {
  currentView: NavigationView;
}

const VIEW_TITLES: Record<NavigationView, string> = {
  // Core
  [NAVIGATION_VIEWS.DASHBOARD]: "Dashboard",
  [NAVIGATION_VIEWS.ASSETS]: "Asset Library",
  [NAVIGATION_VIEWS.PROJECTS]: "Projects",
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: "Content Library",
  // 3D Generation
  [NAVIGATION_VIEWS.GENERATION_CHARACTER]: "Character Generation",
  [NAVIGATION_VIEWS.GENERATION_PROP]: "Prop & Item Generation",
  [NAVIGATION_VIEWS.GENERATION_ENVIRONMENT]: "Environment Generation",
  [NAVIGATION_VIEWS.GENERATION_WORLD]: "World Builder",
  // Content Generation
  [NAVIGATION_VIEWS.CONTENT_NPC]: "NPC Generation",
  [NAVIGATION_VIEWS.CONTENT_QUEST]: "Quest Generation",
  [NAVIGATION_VIEWS.CONTENT_DIALOGUE]: "Dialogue Generation",
  [NAVIGATION_VIEWS.CONTENT_LORE]: "Lore Generation",
  // Audio Generation
  [NAVIGATION_VIEWS.AUDIO_VOICE]: "Voice Generation",
  [NAVIGATION_VIEWS.AUDIO_SFX]: "Sound Effects Generation",
  [NAVIGATION_VIEWS.AUDIO_MUSIC]: "Music Generation",
  // Tools
  [NAVIGATION_VIEWS.PLAYTESTER]: "AI Playtester Swarm",
  [NAVIGATION_VIEWS.EQUIPMENT]: "Equipment Fitting",
  [NAVIGATION_VIEWS.HAND_RIGGING]: "Hand Rigging",
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "Animation Retargeting",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Configuration",
  // System
  [NAVIGATION_VIEWS.SETTINGS]: "Settings & Configuration",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin Dashboard",
  // Public profiles
  [NAVIGATION_VIEWS.PUBLIC_PROFILE]: "Public Profile",
  // Legacy
  [NAVIGATION_VIEWS.GENERATION]: "Generation",
  [NAVIGATION_VIEWS.AUDIO]: "Audio Generation",
  [NAVIGATION_VIEWS.CONTENT]: "Content Generation",
  [NAVIGATION_VIEWS.ARMOR_FITTING]: "Armor Fitting",
};

export function FloatingTopBar({ currentView }: FloatingTopBarProps) {
  const { user, logout } = useAuth();
  const { openPalette } = useCommandPalette();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

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

  // Check for high z-index elements (overlays/modals/panels) and hide the bar
  // Memoize the check function to prevent recreation on every render
  const checkForOverlays = useCallback(() => {
    // Check if there are any elements with very high z-index (modals, panels, etc.)
    const highZIndexElements = document.querySelectorAll('[class*="z-[9"]');
    const hasOverlay = Array.from(highZIndexElements).some((el) => {
      const computed = window.getComputedStyle(el);
      const zIndex = parseInt(computed.zIndex);
      return !isNaN(zIndex) && zIndex >= 9000;
    });

    // Only update state if the value has changed
    setIsHidden((prev) => (prev === hasOverlay ? prev : hasOverlay));
  }, []);

  // Debounce ref to prevent excessive state updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounced check to reduce re-render frequency
    const debouncedCheck = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(checkForOverlays, 50);
    };

    // Check immediately
    checkForOverlays();

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(debouncedCheck);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [checkForOverlays]);

  return (
    <>
      {/* Floating Header - Only visible when no overlays are present */}
      <header
        className={cn(
          "absolute top-4 left-4 right-4 h-12 px-4 rounded-xl",
          "bg-bg-primary/80 backdrop-blur-md border border-border-primary shadow-lg",
          "flex items-center justify-between gap-4 z-50",
          "transition-all duration-300",
          isHidden ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Current page title */}
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">
            {VIEW_TITLES[currentView]}
          </h2>
          <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
            <span className="text-xs font-medium text-primary">ALPHA</span>
          </div>
        </div>

        {/* Right side - User info & actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            onClick={openPalette}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg",
              "bg-bg-tertiary/50 border border-border-primary",
              "hover:bg-bg-hover hover:border-primary/30",
              "text-text-secondary hover:text-text-primary",
              "transition-all duration-200",
              "text-xs font-medium",
            )}
            title="Open command palette (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="hidden md:inline-flex items-center gap-1 px-1 py-0.5 bg-bg-secondary rounded border border-border-primary text-xs">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </kbd>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher size="sm" />

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
