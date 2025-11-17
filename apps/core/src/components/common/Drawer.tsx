import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn, focusManager } from "@/styles";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  side = "right",
  size = "md",
  title,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef<string>("");

  const sizes = {
    sm: side === "left" || side === "right" ? "w-80" : "h-80",
    md: side === "left" || side === "right" ? "w-96" : "h-96",
    lg: side === "left" || side === "right" ? "w-[32rem]" : "h-[32rem]",
    xl: side === "left" || side === "right" ? "w-[40rem]" : "h-[40rem]",
    full: side === "left" || side === "right" ? "w-full" : "h-full",
  };

  const sideClasses = {
    left: "left-0 top-0 bottom-0",
    right: "right-0 top-0 bottom-0",
    top: "top-0 left-0 right-0",
    bottom: "bottom-0 left-0 right-0",
  };

  const slideAnimations = {
    left: open ? "translate-x-0" : "-translate-x-full",
    right: open ? "translate-x-0" : "translate-x-full",
    top: open ? "translate-y-0" : "-translate-y-full",
    bottom: open ? "translate-y-0" : "translate-y-full",
  };

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      previousOverflow.current = document.body.style.overflow || "";
      const cleanup = drawerRef.current
        ? focusManager.trapFocus(drawerRef.current)
        : undefined;

      const handleEscape = (e: KeyboardEvent) => {
        if (closeOnEscape && e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      return () => {
        cleanup?.();
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = previousOverflow.current;
        previousActiveElement.current?.focus();
      };
    }
  }, [open, onClose, closeOnEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex"
      data-overlay="true"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/75 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "absolute z-modal bg-bg-secondary border-border-primary shadow-2xl",
          "transition-transform duration-300 ease-out",
          sideClasses[side],
          sizes[size],
          slideAnimations[side],
          side === "left" || side === "right" ? "border-r" : "border-b",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-text-primary"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export { Drawer };
