import {
  RotateCw,
  Eye,
  EyeOff,
  Grid,
  Sun,
  Moon,
  Palette,
  RefreshCw,
  X,
  Layers,
  Camera,
  Edit3,
  Activity,
  Grid3x3,
  GitBranch,
} from "lucide-react";
import React from "react";

import { useAssetsStore } from "../../store";

interface ViewerControlsProps {
  onViewerReset: () => void;
  onDownload: () => void;
  onShowVariantTree?: () => void;
  assetType?: string;
  canRetexture?: boolean;
  hasRigging?: boolean;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  onViewerReset,
  onDownload,
  onShowVariantTree,
  assetType,
  canRetexture = true,
  hasRigging = false,
}) => {
  // Get state and actions from store
  const {
    isWireframe,
    showGroundPlane,
    isLightBackground,
    showDetailsPanel,
    showAnimationView,
    toggleWireframe,
    toggleGroundPlane,
    toggleBackground,
    toggleDetailsPanel,
    toggleAnimationView,
    setShowRetextureModal,
    setShowRegenerateModal,
    setShowEditModal,
    setShowSpriteModal,
  } = useAssetsStore();

  return (
    <>
      {/* Top-left controls - Model Actions */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-8rem)] animate-fade-in">
        {canRetexture && (
          <button
            onClick={() => setShowRetextureModal(true)}
            className="px-3 sm:px-4 py-2 bg-primary hover:bg-[var(--color-primary-dark)] text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            title="Create texture variants"
          >
            <Palette size={16} className="flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">Retexture</span>
          </button>
        )}

        <button
          onClick={() => setShowRegenerateModal(true)}
          className="px-3 sm:px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 border border-border-primary flex-shrink-0"
          title="Regenerate model"
        >
          <RefreshCw size={16} className="flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">Regenerate</span>
        </button>

        <button
          onClick={() => setShowSpriteModal(true)}
          className="px-3 sm:px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 border border-border-primary flex-shrink-0"
          title="Generate sprite sheet"
        >
          <Grid3x3 size={16} className="flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">Sprites</span>
        </button>

        {onShowVariantTree && (
          <button
            onClick={onShowVariantTree}
            className="px-3 sm:px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 border border-border-primary flex-shrink-0"
            title="View variant relationship tree"
          >
            <GitBranch size={16} className="flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">Variant Tree</span>
          </button>
        )}
      </div>

      {/* Top-right controls - View Options */}
      <div className="absolute top-4 right-4 flex gap-2 animate-fade-in">
        {/* Animation Toggle - Only for character assets with rigging */}
        {assetType === "character" && hasRigging && (
          <button
            onClick={toggleAnimationView}
            className={`group p-3 bg-bg-secondary rounded-xl transition-all duration-200 hover:bg-bg-tertiary hover:scale-105 shadow-lg ${
              showAnimationView ? "ring-2 ring-primary" : ""
            }`}
            title={showAnimationView ? "View 3D Model" : "View Animations"}
          >
            <Activity
              size={20}
              className={`transition-colors ${
                showAnimationView
                  ? "text-primary"
                  : "text-text-secondary group-hover:text-primary"
              }`}
            />
          </button>
        )}

        {/* Edit Button */}
        <button
          onClick={() => setShowEditModal(true)}
          className="group p-3 bg-bg-secondary rounded-xl transition-all duration-200 hover:bg-bg-tertiary hover:scale-105 shadow-lg"
          title="Edit Asset"
        >
          <Edit3
            size={20}
            className="text-text-secondary group-hover:text-primary transition-colors"
          />
        </button>

        <div className="flex bg-bg-secondary rounded-lg shadow-lg p-1 border border-border-primary">
          <button
            onClick={toggleWireframe}
            className={`p-2 rounded transition-all duration-200 ${
              isWireframe
                ? "bg-primary bg-opacity-20 text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            title="Toggle Wireframe (W)"
            aria-label="Toggle wireframe mode"
            aria-pressed={isWireframe}
          >
            {isWireframe ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <button
            onClick={toggleGroundPlane}
            className={`p-2 rounded transition-all duration-200 ${
              showGroundPlane
                ? "bg-primary bg-opacity-20 text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            title="Toggle Ground Plane (G)"
            aria-label="Toggle ground plane"
            aria-pressed={showGroundPlane}
          >
            <Grid size={18} />
          </button>

          <button
            onClick={toggleBackground}
            className={`p-2 rounded transition-all duration-200 ${
              isLightBackground
                ? "bg-warning bg-opacity-20 text-warning"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            title="Toggle Background (B)"
            aria-label="Toggle background color"
            aria-pressed={isLightBackground}
          >
            {isLightBackground ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex bg-bg-secondary rounded-lg shadow-lg p-1 border border-border-primary">
          <button
            onClick={onViewerReset}
            className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-200"
            title="Reset Camera (R)"
            aria-label="Reset camera"
          >
            <RotateCw size={18} />
          </button>

          <button
            onClick={onDownload}
            className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-200"
            title="Screenshot (S)"
            aria-label="Take screenshot"
          >
            <Camera size={18} />
          </button>

          <button
            onClick={toggleDetailsPanel}
            className={`p-2 rounded transition-all duration-200 ${
              showDetailsPanel
                ? "bg-primary bg-opacity-20 text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            title="Toggle Details (D)"
            aria-label="Toggle details panel"
            aria-pressed={showDetailsPanel}
          >
            {showDetailsPanel ? <X size={18} /> : <Layers size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewerControls;
