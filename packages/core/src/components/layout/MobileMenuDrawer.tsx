import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Package,
  Hand,
  Shield,
  Play,
  X,
  LogOut,
  Library,
  TestTube2,
  Users,
  User,
} from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSettingsModal } from "@/components/auth/ProfileSettingsModal";
import { cn } from "@/styles";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  currentView: NavigationView;
  onClose: () => void;
  onViewChange: (view: NavigationView) => void;
}

interface NavItem {
  view: NavigationView;
  icon: React.ElementType;
  label: string;
  description: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  {
    view: NAVIGATION_VIEWS.ASSETS,
    icon: Package,
    label: "Assets",
    description: "Browse & manage assets",
  },
  {
    view: NAVIGATION_VIEWS.CONTENT_LIBRARY,
    icon: Library,
    label: "Library",
    description: "Saved content browser",
  },
  {
    view: NAVIGATION_VIEWS.PLAYTESTER,
    icon: TestTube2,
    label: "Playtester",
    description: "AI swarm testing",
  },
  {
    view: NAVIGATION_VIEWS.EQUIPMENT,
    icon: Shield,
    label: "Equipment Fitting",
    description: "Weapons, armor & helmets",
  },
  {
    view: NAVIGATION_VIEWS.HAND_RIGGING,
    icon: Hand,
    label: "Hand Rigging",
    description: "Auto-grip detection",
  },
  {
    view: NAVIGATION_VIEWS.RETARGET_ANIMATE,
    icon: Play,
    label: "Animation",
    description: "Retarget & animate",
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    view: NAVIGATION_VIEWS.ADMIN_DASHBOARD,
    icon: Users,
    label: "Admin Dashboard",
    description: "Manage users & admins",
  },
];

export function MobileMenuDrawer({
  isOpen,
  currentView,
  onClose,
  onViewChange,
}: MobileMenuDrawerProps) {
  const { user, logout, completeProfile } = useAuth();
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Determine nav items based on role
  const isAdmin = user?.role === "admin";
  const NAV_ITEMS = isAdmin
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      onClose();
    }
  };

  const handleNavClick = (view: NavigationView) => {
    onViewChange(view);
    onClose();
  };

  const handleProfileClick = () => {
    setShowProfileSettings(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/75 transition-opacity duration-300 z-[60]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] solid-nav transform transition-transform duration-300 ease-out z-[70] flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Asset Forge
              </h2>
              <p className="text-xs text-text-secondary">Alpha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-bg-hover rounded-lg transition-colors text-text-tertiary active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon as React.FC<{ className?: string }>;
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 active:scale-98",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary shadow-lg shadow-primary/10"
                      : "hover:bg-bg-hover text-text-secondary border border-transparent",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-primary",
                    )}
                  />
                  <div className="flex-1 text-left">
                    <div
                      className={cn(
                        "font-medium text-sm",
                        isActive ? "text-primary" : "text-text-primary",
                      )}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer - Profile & Logout */}
        <div className="p-3 border-t border-border-primary space-y-2">
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover text-text-secondary transition-colors border border-transparent hover:border-border-hover active:scale-98"
            aria-label="Profile settings"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text-primary">
                {user?.displayName || "Admin"}
              </div>
              <div className="text-xs text-text-tertiary">View profile</div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30 active:scale-98"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

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
