/**
 * Base Library Card Component
 * Provides consistent structure and styling for all content library cards
 * while allowing type-specific customization
 */

import React, { ReactNode } from "react";
import { Edit, Trash2, Calendar } from "lucide-react";
import { cn } from "@/styles";
import { formatDate } from "@/utils";

export interface LibraryCardBaseProps {
  // Visual
  className?: string;
  borderColor: string;
  backgroundGradient: string;
  hoverGlow?: string;

  // Header
  header: ReactNode;

  // Content
  title: ReactNode;
  children: ReactNode;

  // Footer
  createdAt: Date;
  footerExtra?: ReactNode;

  // Actions
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;

  // State
  showActions?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Standardized card structure:
 * - Header: 80px height (can contain images, gradients, badges)
 * - Content: Flexible area with consistent padding
 * - Footer: 40px height with date and extra info
 * - Actions: Top-left overlay on hover
 */
export const LibraryCardBase: React.FC<LibraryCardBaseProps> = ({
  className,
  borderColor,
  backgroundGradient,
  hoverGlow = "from-primary/5",
  header,
  title,
  children,
  createdAt,
  footerExtra,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
        "hover:shadow-2xl hover:-translate-y-1",
        borderColor,
        backgroundGradient,
        className,
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header Section - 80px height */}
      <div className="relative h-20 overflow-hidden">{header}</div>

      {/* Content Section - Flexible */}
      <div className="p-4 space-y-3 relative z-10">
        {/* Title */}
        {title}

        {/* Type-specific content */}
        {children}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(createdAt)}
          </div>
          {footerExtra}
        </div>
      </div>

      {/* Quick Actions Overlay */}
      {showActions && (
        <div
          className="absolute top-2 left-2 flex gap-1 animate-fade-in z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors group/btn"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors group/btn"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Hover Glow Effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-t to-transparent",
          hoverGlow,
        )}
      />
    </div>
  );
};

/**
 * Standard Header Badge Component
 */
interface HeaderBadgeProps {
  children: ReactNode;
  colors?: {
    bg?: string;
    border?: string;
    text?: string;
  };
  position?: "top-left" | "top-right";
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({
  children,
  colors = {},
  position = "top-right",
}) => {
  return (
    <div
      className={cn(
        "absolute z-10",
        position === "top-right" ? "top-2 right-2" : "top-2 left-2",
      )}
    >
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold capitalize",
          "bg-black/40 backdrop-blur-sm text-white",
          colors.bg,
          colors.border && `border ${colors.border}`,
          colors.text,
        )}
      >
        {children}
      </span>
    </div>
  );
};

/**
 * Standard Stat Badge Component
 */
interface StatBadgeProps {
  children: ReactNode;
  colors?: {
    from: string;
    to: string;
    accent: string;
    border: string;
  };
}

export const StatBadge: React.FC<StatBadgeProps> = ({ children, colors }) => {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium border",
        colors?.border || "border-primary/30",
        colors?.accent || "text-primary",
        "bg-primary/10",
      )}
    >
      {children}
    </span>
  );
};

/**
 * Standard Content Section Component
 */
interface ContentSectionProps {
  children: ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-bg-tertiary/50 rounded-lg p-2.5 border border-border-primary/50",
        className,
      )}
    >
      {children}
    </div>
  );
};
