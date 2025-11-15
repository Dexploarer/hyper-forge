import { Star, X, CheckCircle, Circle, Download } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import JSZip from "jszip";

import { AssetService } from "@/services/api/AssetService";
import { useAssetsStore } from "@/store";
import { useApp } from "@/contexts/AppContext";
import type { Asset } from "@/types";

interface BulkActionsBarProps {
  onActionComplete?: () => void;
  variant?: "floating" | "tray";
  assets: Asset[]; // For batch export
}

type AssetStatus =
  | "draft"
  | "processing"
  | "completed"
  | "failed"
  | "approved"
  | "published"
  | "archived";

interface StatusOption {
  value: AssetStatus;
  label: string;
  icon: LucideIcon;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  onActionComplete,
  variant = "floating",
  assets,
}) => {
  const { selectedAssetIds, clearSelection } = useAssetsStore();
  const { showNotification } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const selectedCount = selectedAssetIds.size;

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showStatusMenu]);

  // Keyboard navigation for status menu
  useEffect(() => {
    if (!showStatusMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowStatusMenu(false);
        menuRef.current?.querySelector("button")?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showStatusMenu]);

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkFavorite = async (isFavorite: boolean): Promise<void> => {
    setIsProcessing(true);
    try {
      await AssetService.bulkUpdateAssets(Array.from(selectedAssetIds), {
        isFavorite,
      });
      showNotification(
        isFavorite
          ? `Added ${selectedCount} asset${selectedCount > 1 ? "s" : ""} to favorites`
          : `Removed ${selectedCount} asset${selectedCount > 1 ? "s" : ""} from favorites`,
        "success",
      );
      onActionComplete?.();
      clearSelection();
    } catch (error) {
      console.error("Failed to update favorites:", error);
      showNotification(
        "Failed to update favorites. Please try again.",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusChange = async (status: AssetStatus): Promise<void> => {
    setIsProcessing(true);
    setShowStatusMenu(false);
    try {
      await AssetService.bulkUpdateAssets(Array.from(selectedAssetIds), {
        status,
      });
      showNotification(
        `Updated ${selectedCount} asset${selectedCount > 1 ? "s" : ""} status to ${status}`,
        "success",
      );
      onActionComplete?.();
      clearSelection();
    } catch (error) {
      console.error("Failed to update status:", error);
      showNotification("Failed to update status. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchExport = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const selectedAssets = assets.filter((asset) =>
        selectedAssetIds.has(asset.id),
      );

      if (selectedAssets.length === 0) {
        showNotification("No assets selected for export", "error");
        return;
      }

      showNotification(
        `Preparing ${selectedAssets.length} asset${selectedAssets.length > 1 ? "s" : ""} for export...`,
        "info",
      );

      // Fetch and add each asset to ZIP
      for (const asset of selectedAssets) {
        try {
          // Fetch GLB file
          const modelUrl = AssetService.getModelUrl(asset.id);
          const response = await fetch(modelUrl);

          if (!response.ok) {
            console.warn(`Failed to fetch model for ${asset.name}`);
            continue;
          }

          const blob = await response.blob();

          // Sanitize filename
          const sanitizedName = asset.name
            .replace(/[^a-z0-9_-]/gi, "_")
            .toLowerCase();
          zip.file(`${sanitizedName}.glb`, blob);

          // Add metadata JSON
          const metadata = {
            id: asset.id,
            name: asset.name,
            description: asset.description,
            type: asset.type,
            metadata: asset.metadata,
            generatedAt: asset.generatedAt,
          };
          zip.file(`${sanitizedName}.json`, JSON.stringify(metadata, null, 2));
        } catch (error) {
          console.error(`Failed to add ${asset.name} to ZIP:`, error);
        }
      }

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `asset-forge-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(
        `Exported ${selectedAssets.length} asset${selectedAssets.length > 1 ? "s" : ""} successfully`,
        "success",
      );
      clearSelection();
    } catch (error) {
      console.error("Failed to export assets:", error);
      showNotification("Failed to export assets. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusOptions: StatusOption[] = [
    { value: "draft", label: "Draft", icon: Circle },
    { value: "approved", label: "Approved", icon: CheckCircle },
    { value: "completed", label: "Completed", icon: CheckCircle },
    { value: "archived", label: "Archived", icon: Circle },
  ] as const;

  const containerClasses =
    variant === "tray"
      ? "w-full"
      : "fixed bottom-8 left-1/2 -translate-x-1/2 z-notification animate-scale-in";

  return (
    <div className={containerClasses}>
      <div className="solid-panel border border-border-primary rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Selection count */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary bg-opacity-10 rounded-lg border border-primary border-opacity-30">
            <span className="text-sm font-semibold text-primary">
              {selectedCount} selected
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border-primary" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Export as ZIP */}
            <button
              onClick={handleBatchExport}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-primary/10 text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed micro-bounce"
              title="Export as ZIP"
              aria-label="Export as ZIP"
            >
              <Download size={14} />
              <span>Export ZIP</span>
            </button>

            {/* Add to favorites */}
            <button
              onClick={() => handleBulkFavorite(true)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-yellow-500/10 text-text-secondary hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed micro-bounce"
              title="Add to favorites"
              aria-label="Add to favorites"
            >
              <Star size={14} />
              <span>Favorite</span>
            </button>

            {/* Remove from favorites */}
            <button
              onClick={() => handleBulkFavorite(false)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-bg-hover text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed micro-bounce"
              title="Remove from favorites"
              aria-label="Remove from favorites"
            >
              <Star size={14} />
              <span>Unfavorite</span>
            </button>

            {/* Status menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-bg-hover text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Change status"
                aria-label="Change status"
                aria-expanded={showStatusMenu}
                aria-haspopup="true"
              >
                <CheckCircle size={14} />
                <span>Status</span>
              </button>

              {showStatusMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-overlay"
                    onClick={() => setShowStatusMenu(false)}
                    aria-hidden="true"
                  />

                  {/* Status menu */}
                  <div
                    ref={statusMenuRef}
                    className="absolute bottom-full left-0 mb-2 solid-panel border border-border-primary rounded-lg shadow-xl overflow-hidden z-dropdown min-w-[140px] [&_*]:drop-shadow-sm"
                    role="menu"
                    aria-label="Status options"
                  >
                    {statusOptions.map((option, index) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleBulkStatusChange(option.value)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors focus:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                          role="menuitem"
                          aria-label={`Set status to ${option.label}`}
                          tabIndex={0}
                        >
                          <Icon size={12} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border-primary" />

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-bg-hover text-text-tertiary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed micro-bounce"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 solid-surface rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};
