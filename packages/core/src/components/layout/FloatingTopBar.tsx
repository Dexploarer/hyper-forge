import { useState, useEffect, useCallback, useRef } from "react";
import { Command, Search } from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS, VIEW_TITLES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { UserProfileMenu, UserProfileModal } from "@/components/user";
import { ThemeSwitcher } from "@/components/common";
import { useSessionId } from "@/hooks";
import { cn } from "@/styles";

interface FloatingTopBarProps {
  currentView: NavigationView;
}

export function FloatingTopBar({ currentView }: FloatingTopBarProps) {
  const { user, logout } = useAuth();
  const { openPalette } = useCommandPalette();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const sessionId = useSessionId();

  const handleProfileSuccess = async () => {
    // Reload the page to refresh user data from AuthContext
    window.location.reload();
  };

  // Check for overlays using data-overlay attribute
  const checkForOverlays = useCallback(() => {
    const hasOverlay = document.querySelector('[data-overlay="true"]') !== null;
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
          "flex items-center justify-between gap-4 z-header",
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
          sessionId={sessionId}
          onClose={() => setShowProfileModal(false)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </>
  );
}
