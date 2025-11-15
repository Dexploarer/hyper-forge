/**
 * Optimized Asset Card Component
 * Rich card with preview images, badges, quick actions, and hover effects
 */

import React, { useState } from "react";
import {
  Star,
  MoreVertical,
  Sparkles,
  Eye,
  Download,
  Palette,
  Trash2,
  Edit,
  Copy,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { getTierColor } from "@/constants";
import { Asset } from "@/types";
import { AssetService } from "@/services/api/AssetService";
import { assetsQueries } from "@/queries/assets.queries";

interface OptimizedAssetCardProps {
  asset: Asset;
  isSelected?: boolean;
  onSelect: (asset: Asset) => void;
  onToggleFavorite?: (asset: Asset, e: React.MouseEvent) => void;
  onViewDetails?: (asset: Asset) => void;
  onCreateVariants?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  isFavoriteUpdating?: boolean;
}

export const OptimizedAssetCard: React.FC<OptimizedAssetCardProps> = ({
  asset,
  isSelected = false,
  onSelect,
  onToggleFavorite,
  onViewDetails,
  onCreateVariants,
  onDelete,
  isFavoriteUpdating = false,
}) => {
  const queryClient = useQueryClient();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const previewUrl = AssetService.getPreviewImageUrl(asset);
  const hasPreview = previewUrl && !imageError;

  // Prefetch asset details on hover for instant loading
  const prefetchAssetDetails = () => {
    queryClient.prefetchQuery(assetsQueries.detail(asset.id));
  };

  const handleCardClick = () => {
    onSelect(asset);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(asset, e);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionsMenu(!showActionsMenu);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
    setShowActionsMenu(false);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowActionsMenu(false);
    setShowContextMenu(false);
  };

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 cursor-pointer border ${
        isSelected
          ? "bg-primary bg-opacity-10 border-primary shadow-lg ring-2 ring-primary ring-opacity-20"
          : "bg-bg-secondary border-border-primary hover:border-primary hover:shadow-md hover:scale-[1.02]"
      }`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={prefetchAssetDetails}
    >
      {/* Preview Image */}
      <div className="relative w-full h-48 bg-bg-tertiary rounded-t-xl overflow-hidden">
        {hasPreview ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-bg-tertiary to-bg-secondary animate-pulse flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-text-tertiary opacity-30" />
              </div>
            )}
            {/* Actual image */}
            <img
              src={previewUrl}
              alt={asset.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          /* Fallback icon */
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
            <Package className="w-16 h-16 text-text-tertiary opacity-30" />
          </div>
        )}

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Quick view button (appears on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(asset);
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100"
        >
          <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Eye className="w-6 h-6 text-gray-900" />
          </div>
        </button>

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {asset.hasModel && (
            <div className="px-2 py-1 bg-success/90 backdrop-blur-sm text-white rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
              <Sparkles size={12} />
              <span>3D</span>
            </div>
          )}
          {asset.metadata?.isBaseModel && (
            <div className="px-2 py-1 bg-primary/90 backdrop-blur-sm text-white rounded-md text-xs font-medium shadow-sm">
              BASE
            </div>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isFavoriteUpdating}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-sm hover:scale-110 disabled:opacity-50"
        >
          {isFavoriteUpdating ? (
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Star
              size={16}
              className={`${
                asset.metadata?.isFavorite
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-600"
              } transition-colors`}
            />
          )}
        </button>
      </div>

      {/* Card content */}
      <div className="p-4">
        {/* Header with title and actions menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-2 flex-1 leading-tight">
            {asset.name}
          </h3>

          {/* Actions menu button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleMenuClick}
              className="p-1 rounded-md hover:bg-bg-hover transition-colors text-text-tertiary hover:text-text-primary"
            >
              <MoreVertical size={16} />
            </button>

            {/* Actions dropdown */}
            {showActionsMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionsMenu(false);
                  }}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-44 solid-panel border border-border-primary rounded-lg shadow-xl overflow-hidden z-dropdown animate-scale-in">
                  <button
                    onClick={(e) =>
                      handleAction(e, () => onViewDetails?.(asset))
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={(e) =>
                      handleAction(e, () => onCreateVariants?.(asset))
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    <Palette size={14} />
                    <span>Create Variants</span>
                  </button>
                  <button
                    onClick={(e) => handleAction(e, () => {})}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    <Download size={14} />
                    <span>Download Model</span>
                  </button>
                  <button
                    onClick={(e) => handleAction(e, () => {})}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    <Copy size={14} />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={(e) => handleAction(e, () => {})}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    <Edit size={14} />
                    <span>Edit Metadata</span>
                  </button>
                  <div className="border-t border-border-primary" />
                  <button
                    onClick={(e) => handleAction(e, () => onDelete?.(asset))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error hover:bg-opacity-10 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded text-xs font-medium capitalize">
            {asset.type}
          </span>
          {asset.metadata?.tier && asset.metadata.tier !== "base" && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium capitalize flex items-center gap-1"
              style={{
                backgroundColor: `${getTierColor(asset.metadata.tier)}20`,
                color: getTierColor(asset.metadata.tier),
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getTierColor(asset.metadata.tier) }}
              />
              {asset.metadata.tier}
            </span>
          )}
          {asset.metadata?.isPlaceholder && (
            <span className="px-2 py-0.5 bg-warning bg-opacity-20 text-warning rounded text-xs font-medium">
              PLACEHOLDER
            </span>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <span>
              {asset.metadata?.generatedAt
                ? new Date(asset.metadata.generatedAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )
                : "Unknown"}
            </span>
          </div>
          {asset.metadata?.isBaseModel &&
            asset.metadata?.variants?.length > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Palette size={12} />
                <span>{asset.metadata.variants.length} variants</span>
              </div>
            )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-primary animate-pulse" />
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-overlay"
            onClick={() => setShowContextMenu(false)}
          />

          {/* Menu */}
          <div
            className="fixed z-dropdown w-48 solid-panel border border-border-primary rounded-lg shadow-xl overflow-hidden animate-scale-in"
            style={{
              top: `${contextMenuPosition.y}px`,
              left: `${contextMenuPosition.x}px`,
            }}
          >
            <button
              onClick={(e) => handleAction(e, () => onViewDetails?.(asset))}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Eye size={14} />
              <span>View Details</span>
            </button>
            <button
              onClick={(e) => handleAction(e, () => onCreateVariants?.(asset))}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Palette size={14} />
              <span>Create Variants</span>
            </button>
            <button
              onClick={(e) => handleAction(e, () => {})}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Download size={14} />
              <span>Download Model</span>
            </button>
            <button
              onClick={(e) => handleAction(e, () => {})}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
            <button
              onClick={(e) => handleAction(e, () => {})}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Edit size={14} />
              <span>Edit Metadata</span>
            </button>
            <div className="border-t border-border-primary" />
            <button
              onClick={(e) =>
                handleAction(e, () => {
                  const fakeEvent = e as any;
                  onToggleFavorite?.(asset, fakeEvent);
                })
              }
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Star
                size={14}
                className={
                  asset.metadata?.isFavorite
                    ? "fill-yellow-400 text-yellow-400"
                    : ""
                }
              />
              <span>
                {asset.metadata?.isFavorite
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
              </span>
            </button>
            <div className="border-t border-border-primary" />
            <button
              onClick={(e) => handleAction(e, () => onDelete?.(asset))}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error hover:bg-opacity-10 transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
