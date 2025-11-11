import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

import { cn } from "../../styles";

export interface HelpTooltipProps {
  content: string;
  title?: string;
  className?: string;
  iconSize?: number;
  position?: "top" | "bottom" | "left" | "right";
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  className,
  iconSize = 16,
  position = "top",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-bg-secondary",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-bg-secondary",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-bg-secondary",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-bg-secondary",
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
        aria-label={title || "Help"}
        aria-expanded={isOpen}
      >
        <HelpCircle size={iconSize} />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 w-64 p-3 bg-bg-secondary border border-border-primary rounded-lg shadow-lg animate-fade-in",
            positionClasses[position],
          )}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-0 h-0 border-[6px]",
              arrowClasses[position],
            )}
          />

          {/* Content */}
          <div className="space-y-2">
            {title && (
              <h4 className="text-sm font-semibold text-text-primary">
                {title}
              </h4>
            )}
            <p className="text-xs text-text-secondary leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
