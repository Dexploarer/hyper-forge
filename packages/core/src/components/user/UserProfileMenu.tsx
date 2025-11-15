import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import type { User } from "@/services/api/UsersAPIClient";
import { cn } from "@/styles";
import { Badge } from "@/components/common";
import { focusManager } from "@/styles/utils";

interface UserProfileMenuProps {
  user: User | null;
  onOpenProfile: () => void;
  onLogout?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  onOpenProfile,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    // Trap focus within menu
    const cleanupFocusTrap = menuContentRef.current
      ? focusManager.trapFocus(menuContentRef.current)
      : undefined;

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      cleanupFocusTrap?.();
    };
  }, [isOpen]);

  if (!user) return null;

  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isProfileComplete = Boolean(
    user.profileCompleted && user.displayName && user.email,
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
          "bg-bg-secondary hover:bg-bg-tertiary border border-border-primary",
          isOpen && "bg-bg-tertiary ring-2 ring-primary/50",
        )}
        title="User Profile"
        aria-label="User profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
            isProfileComplete
              ? "bg-primary/20 text-primary"
              : "bg-yellow-500/20 text-yellow-400",
          )}
        >
          {getInitials(user.displayName)}
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-text-primary hidden sm:inline">
          {user.displayName || "User"}
        </span>

        {/* Profile Status Indicator */}
        {!isProfileComplete && (
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
            title="Profile incomplete"
          />
        )}

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-secondary transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuContentRef}
          className="absolute right-0 mt-2 w-80 bg-bg-primary border border-border-primary rounded-lg shadow-2xl z-dropdown overflow-hidden animate-fade-in"
          role="menu"
          aria-label="User profile menu"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border-primary">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0",
                  isProfileComplete
                    ? "bg-primary/20 text-primary"
                    : "bg-yellow-500/20 text-yellow-400",
                )}
              >
                {getInitials(user.displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {user.displayName || "Unnamed User"}
                </h3>
                <p className="text-xs text-text-tertiary truncate">
                  {user.role}
                </p>
                {isProfileComplete ? (
                  <Badge
                    variant="success"
                    className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                  >
                    <CheckCircle size={10} className="mr-1" />
                    Profile Complete
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
                  >
                    Profile Incomplete
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 space-y-2 border-b border-border-primary">
            {user.email && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Mail size={14} className="flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.discordUsername && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="truncate">{user.discordUsername}</span>
              </div>
            )}
            {!user.email && !user.discordUsername && (
              <p className="text-xs text-text-tertiary italic">
                No contact info
              </p>
            )}
          </div>

          {/* Last Login */}
          <div className="px-4 py-2 bg-bg-secondary/50">
            <p className="text-xs text-text-tertiary">
              Last login: {formatDate(user.lastLoginAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="p-2" role="group" aria-label="Profile actions">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset micro-bounce"
              role="menuitem"
              aria-label="Edit profile"
            >
              <Settings size={16} />
              <span>Edit Profile</span>
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset micro-bounce"
                role="menuitem"
                aria-label="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
