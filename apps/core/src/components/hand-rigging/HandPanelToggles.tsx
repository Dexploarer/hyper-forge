import { Menu, Settings, Image as ImageIcon, HelpCircle } from "lucide-react";
import React from "react";

interface HandPanelTogglesProps {
  showAssetsPanel: boolean;
  showControlsPanel: boolean;
  showDebugPanel: boolean;
  showHelpPanel: boolean;
  hasDebugImages: boolean;
  hasSelectedAvatar: boolean;
  onToggleAssets: () => void;
  onToggleControls: () => void;
  onToggleDebug: () => void;
  onToggleHelp: () => void;
}

export const HandPanelToggles: React.FC<HandPanelTogglesProps> = ({
  showAssetsPanel,
  showControlsPanel,
  showDebugPanel,
  showHelpPanel,
  hasDebugImages,
  hasSelectedAvatar,
  onToggleAssets,
  onToggleControls,
  onToggleDebug,
  onToggleHelp,
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-30">
      {/* Assets Panel Toggle - always visible */}
      <button
        onClick={onToggleAssets}
        className={`p-2 rounded-md transition-all duration-200 ${
          showAssetsPanel
            ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
            : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
        } hover:scale-105 active:scale-95`}
        title="Toggle Avatar Selection"
        aria-label="Toggle Avatar Selection"
      >
        <Menu size={16} />
      </button>

      {/* Controls Panel Toggle - only show when avatar selected */}
      {hasSelectedAvatar && (
        <button
          onClick={onToggleControls}
          className={`p-2 rounded-md transition-all duration-200 ${
            showControlsPanel
              ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
              : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
          } hover:scale-105 active:scale-95 animate-fade-in`}
          title="Toggle Rigging Controls"
          aria-label="Toggle Rigging Controls"
        >
          <Settings size={16} />
        </button>
      )}

      {/* Debug Images Toggle - only show when debug images exist */}
      {hasDebugImages && (
        <button
          onClick={onToggleDebug}
          className={`p-2 rounded-md transition-all duration-200 ${
            showDebugPanel
              ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
              : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
          } hover:scale-105 active:scale-95 animate-fade-in`}
          title="Toggle Debug Images"
          aria-label="Toggle Debug Images"
        >
          <ImageIcon size={16} />
        </button>
      )}

      {/* Help Panel Toggle - always visible */}
      <button
        onClick={onToggleHelp}
        className={`p-2 rounded-md transition-all duration-200 ${
          showHelpPanel
            ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
            : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
        } hover:scale-105 active:scale-95`}
        title="Toggle Help"
        aria-label="Toggle Help"
      >
        <HelpCircle size={16} />
      </button>
    </div>
  );
};

export default HandPanelToggles;
