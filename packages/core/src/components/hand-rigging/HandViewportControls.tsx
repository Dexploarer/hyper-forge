import { Eye, Camera, Download } from "lucide-react";
import React from "react";

import { cn } from "../../styles";

interface HandViewportControlsProps {
  showSkeleton: boolean;
  canExport: boolean;
  onToggleSkeleton: () => void;
  onResetCamera: () => void;
  onExport: () => void;
}

export const HandViewportControls: React.FC<HandViewportControlsProps> = ({
  showSkeleton,
  canExport,
  onToggleSkeleton,
  onResetCamera,
  onExport,
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={onToggleSkeleton}
        className={cn(
          "p-2 rounded-lg transition-all",
          showSkeleton
            ? "bg-primary/20 text-primary border border-primary/50"
            : "bg-bg-tertiary/50 text-text-secondary hover:text-text-primary border border-transparent",
        )}
        title={showSkeleton ? "Hide skeleton" : "Show skeleton"}
      >
        <Eye size={18} />
      </button>

      <button
        onClick={onResetCamera}
        className="p-2 rounded-lg bg-bg-tertiary/50 text-text-secondary hover:text-text-primary border border-transparent transition-all"
        title="Reset camera"
      >
        <Camera size={18} />
      </button>

      {canExport && (
        <button
          onClick={onExport}
          className="p-2 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-all animate-fade-in"
          title="Export rigged model"
        >
          <Download size={18} />
        </button>
      )}
    </div>
  );
};

export default HandViewportControls;
