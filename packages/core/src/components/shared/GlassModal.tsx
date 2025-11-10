import React from "react";
import { X } from "lucide-react";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="modal-overlay animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal with Solid Design */}
      <div className={`relative ${sizeClasses[size]} w-full`}>
        <div className="modal-content">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="icon-btn"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default GlassModal;
