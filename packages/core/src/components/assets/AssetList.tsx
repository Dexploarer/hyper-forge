import {
  Package,
  Shield,
  Swords,
  Diamond,
  Hammer,
  Building,
  User,
  Trees,
  Box,
  Target,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Layers,
  Star,
  CheckSquare,
  Square,
  Loader2,
  LayoutGrid,
  List,
  Keyboard,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

import { getTierColor } from "../../constants";
import { useAssetsStore } from "../../store";
import { Asset } from "../../types";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

import { apiFetch } from "@/utils/api";
import { useApp } from "@/contexts/AppContext";
import { AssetService } from "@/services/api/AssetService";
import { OptimizedAssetCard } from "./OptimizedAssetCard";
import { QuickFiltersBar } from "./QuickFiltersBar";
import { BulkActionsBar } from "./BulkActionsBar";
import AssetDetailsPanel from "./AssetDetailsPanel";

interface AssetListProps {
  assets: Asset[];
  onAssetDelete?: (asset: Asset) => void;
}

interface AssetGroup {
  base: Asset;
  variants: Asset[];
}

const AssetList: React.FC<AssetListProps> = ({ assets, onAssetDelete }) => {
  // Get state and actions from store
  const {
    selectedAsset,
    handleAssetSelect,
    selectionMode,
    selectedAssetIds,
    toggleSelectionMode,
    toggleAssetSelection,
    selectAllAssets,
    clearSelection,
  } = useAssetsStore();
  const { showNotification } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [displayMode, setDisplayMode] = useState<"list" | "cards">("list");
  const [updatingFavorites, setUpdatingFavorites] = useState<Set<string>>(
    new Set(),
  );

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Details panel state
  const [detailsAsset, setDetailsAsset] = useState<Asset | null>(null);

  // Keyboard shortcuts help modal
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Filter assets based on selected filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Type filter
      if (
        selectedTypes.length > 0 &&
        !selectedTypes.includes(asset.type || "")
      ) {
        return false;
      }

      // Tier filter
      if (
        selectedTiers.length > 0 &&
        !selectedTiers.includes(asset.metadata?.tier || "")
      ) {
        return false;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        const status = asset.metadata?.status || "draft";
        if (!selectedStatuses.includes(status)) {
          return false;
        }
      }

      return true;
    });
  }, [assets, selectedTypes, selectedTiers, selectedStatuses]);

  // Infinite scroll (use filtered assets)
  const { displayCount, isLoadingMore, containerRef } = useInfiniteScroll({
    totalItems: filteredAssets.length,
    initialCount: 20,
    loadIncrement: 10,
    threshold: 300,
  });

  // Slice filtered assets for infinite scroll
  const visibleAssets = useMemo(
    () => filteredAssets.slice(0, displayCount),
    [filteredAssets, displayCount],
  );

  // Handlers
  const handleViewDetails = (asset: Asset) => {
    setDetailsAsset(asset);
  };

  const handleCreateVariants = (asset: Asset) => {
    showNotification("Variant creation coming soon!", "info");
    console.log("Create variants for:", asset);
  };

  const handleDelete = (asset: Asset) => {
    if (onAssetDelete) {
      onAssetDelete(asset);
    }
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedTiers([]);
    setSelectedStatuses([]);
  };

  const toggleFavorite = async (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent asset selection
    setUpdatingFavorites((prev) => new Set(prev).add(asset.id));

    // Optimistic update - update UI immediately
    const previousFavoriteState = asset.metadata.isFavorite;
    asset.metadata.isFavorite = !asset.metadata.isFavorite;

    // Trigger re-render immediately for optimistic update
    if (onAssetDelete) {
      if (selectedAsset?.id === asset.id) {
        handleAssetSelect(asset);
      }
    }

    try {
      await apiFetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFavorite: asset.metadata.isFavorite,
        }),
        retry: {
          maxRetries: 3,
          initialDelay: 1000,
        },
      });

      // Show success notification
      showNotification(
        asset.metadata.isFavorite
          ? "Added to favorites"
          : "Removed from favorites",
        "success",
      );
    } catch (error) {
      console.error("Failed to toggle favorite:", error);

      // Rollback optimistic update on error
      asset.metadata.isFavorite = previousFavoriteState;

      // Trigger re-render to show rollback
      if (onAssetDelete) {
        if (selectedAsset?.id === asset.id) {
          handleAssetSelect(asset);
        }
      }

      showNotification("Failed to update favorite. Please try again.", "error");
    } finally {
      setUpdatingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      // Escape - Close panels or clear selection
      if (e.key === "Escape") {
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else if (detailsAsset) {
          setDetailsAsset(null);
        } else if (selectionMode && selectedAssetIds.size > 0) {
          clearSelection();
        } else if (selectionMode) {
          toggleSelectionMode();
        }
        return;
      }

      // No asset selected for the rest of the shortcuts
      if (!selectedAsset) return;

      // Delete - Delete selected asset
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (
          window.confirm(
            `Are you sure you want to delete "${selectedAsset.name}"?`,
          )
        ) {
          handleDelete(selectedAsset);
        }
        return;
      }

      // F - Toggle favorite
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        const fakeEvent = {
          stopPropagation: () => {},
        } as React.MouseEvent;
        toggleFavorite(selectedAsset, fakeEvent);
        return;
      }

      // Enter - View details
      if (e.key === "Enter") {
        e.preventDefault();
        handleViewDetails(selectedAsset);
        return;
      }

      // V - Create variants
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handleCreateVariants(selectedAsset);
        return;
      }

      // Arrow keys - Navigate between assets
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        const currentIndex = visibleAssets.findIndex(
          (a) => a.id === selectedAsset.id,
        );
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          nextIndex = Math.min(currentIndex + 1, visibleAssets.length - 1);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          nextIndex = Math.max(currentIndex - 1, 0);
        }

        if (nextIndex !== currentIndex) {
          handleAssetSelect(visibleAssets[nextIndex]);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedAsset,
    selectionMode,
    selectedAssetIds,
    detailsAsset,
    showKeyboardHelp,
    visibleAssets,
    clearSelection,
    toggleSelectionMode,
    handleAssetSelect,
  ]);

  // Group assets by base/variants (using visible assets for infinite scroll)
  const assetGroups = useMemo(() => {
    const groups: Record<string, AssetGroup> = {};
    const standaloneAssets: Asset[] = [];

    // First pass: identify base models
    visibleAssets.forEach((asset) => {
      if (asset.metadata?.isBaseModel) {
        groups[asset.id] = { base: asset, variants: [] };
      }
    });

    // Second pass: assign variants to their base models
    visibleAssets.forEach((asset) => {
      if (!asset.metadata) {
        standaloneAssets.push(asset);
        return;
      }

      if (asset.metadata.isVariant && asset.metadata.parentBaseModel) {
        const baseId = asset.metadata.parentBaseModel;
        if (groups[baseId]) {
          groups[baseId].variants.push(asset);
        } else {
          standaloneAssets.push(asset);
        }
      } else if (!asset.metadata.isBaseModel) {
        standaloneAssets.push(asset);
      }
    });

    // Sort variants by tier
    Object.values(groups).forEach((group) => {
      group.variants.sort((a, b) => {
        const tierOrder = [
          "bronze",
          "iron",
          "steel",
          "mithril",
          "adamant",
          "rune",
          "wood",
          "oak",
          "willow",
          "leather",
          "standard",
        ];
        const aIndex = tierOrder.indexOf(a.metadata?.tier || "");
        const bIndex = tierOrder.indexOf(b.metadata?.tier || "");
        return aIndex - bIndex;
      });
    });

    return { groups: Object.values(groups), standalone: standaloneAssets };
  }, [visibleAssets]);

  // Group assets by type for flat view (using visible assets for infinite scroll)
  const assetsByType = useMemo(() => {
    const typeGroups: Record<string, Asset[]> = {};

    visibleAssets.forEach((asset) => {
      const type = asset.type || "other";
      if (!typeGroups[type]) {
        typeGroups[type] = [];
      }
      typeGroups[type].push(asset);
    });

    // Sort assets within each type group by name
    Object.values(typeGroups).forEach((group) => {
      group.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Order types by priority
    const typeOrder = [
      "character",
      "weapon",
      "armor",
      "shield",
      "tool",
      "resource",
      "building",
      "environment",
      "prop",
      "ammunition",
      "other",
    ];
    const orderedTypes: Record<string, Asset[]> = {};

    typeOrder.forEach((type) => {
      if (typeGroups[type]) {
        orderedTypes[type] = typeGroups[type];
      }
    });

    // Add any remaining types not in the order
    Object.keys(typeGroups).forEach((type) => {
      if (!orderedTypes[type]) {
        orderedTypes[type] = typeGroups[type];
      }
    });

    return orderedTypes;
  }, [visibleAssets]);

  // Group the grouped view by type as well
  const groupedAssetsByType = useMemo(() => {
    const typeGroups: Record<
      string,
      { groups: typeof assetGroups.groups; standalone: Asset[] }
    > = {};

    // Group base/variant groups by type
    assetGroups.groups.forEach((group) => {
      const type = group.base.type || "other";
      if (!typeGroups[type]) {
        typeGroups[type] = { groups: [], standalone: [] };
      }
      typeGroups[type].groups.push(group);
    });

    // Group standalone assets by type
    assetGroups.standalone.forEach((asset) => {
      const type = asset.type || "other";
      if (!typeGroups[type]) {
        typeGroups[type] = { groups: [], standalone: [] };
      }
      typeGroups[type].standalone.push(asset);
    });

    // Apply the same type ordering
    const typeOrder = [
      "character",
      "weapon",
      "armor",
      "shield",
      "tool",
      "resource",
      "building",
      "environment",
      "prop",
      "ammunition",
      "other",
    ];
    const orderedTypes: typeof typeGroups = {};

    typeOrder.forEach((type) => {
      if (typeGroups[type]) {
        orderedTypes[type] = typeGroups[type];
      }
    });

    // Add any remaining types
    Object.keys(typeGroups).forEach((type) => {
      if (!orderedTypes[type]) {
        orderedTypes[type] = typeGroups[type];
      }
    });

    return orderedTypes;
  }, [assetGroups]);

  const toggleGroup = (baseId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(baseId)) {
      newExpanded.delete(baseId);
    } else {
      newExpanded.add(baseId);
    }
    setExpandedGroups(newExpanded);
  };

  const getAssetIcon = (type: string, _subtype?: string) => {
    switch (type) {
      case "weapon":
        return <Swords size={20} />;
      case "armor":
        return <Shield size={20} />;
      case "resource":
        return <Diamond size={20} />;
      case "tool":
        return <Hammer size={20} />;
      case "building":
        return <Building size={20} />;
      case "character":
        return <User size={20} />;
      case "environment":
        return <Trees size={20} />;
      case "prop":
        return <Box size={20} />;
      case "ammunition":
        return <Target size={20} />;
      default:
        return <HelpCircle size={20} />;
    }
  };

  // Render asset preview (image or icon)
  const AssetPreview: React.FC<{
    asset: Asset;
    size: number;
    iconSize: number;
    className?: string;
  }> = ({ asset, size, iconSize, className = "" }) => {
    const [imageError, setImageError] = useState(false);
    const previewUrl = AssetService.getPreviewImageUrl(asset);
    const hasImage = previewUrl && !imageError;

    return (
      <div
        className={`relative ${className}`}
        style={{ width: size, height: size }}
      >
        {hasImage ? (
          <>
            {/* Background icon (fallback) */}
            <div className="absolute inset-0 flex items-center justify-center">
              {React.cloneElement(
                getAssetIcon(asset.type, asset.metadata?.subtype),
                { size: iconSize, className: "text-text-tertiary" },
              )}
            </div>
            {/* Preview image (overlay) */}
            <img
              src={previewUrl}
              alt={asset.name}
              className="absolute inset-0 w-full h-full object-cover rounded"
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          // No image, just show icon
          <div className="flex items-center justify-center h-full">
            {React.cloneElement(
              getAssetIcon(asset.type, asset.metadata?.subtype),
              { size: iconSize },
            )}
          </div>
        )}
      </div>
    );
  };

  // Clean up asset names for display
  const cleanAssetName = (name: string, isBase: boolean = false): string => {
    // For base items, preserve the number but clean up the format
    if (isBase) {
      // Handle cases like "body-leather-base-01" or "legs-metal-base-02"
      const baseMatch = name.match(/^(.+?)-base-?(\d+)?$/i);
      if (baseMatch) {
        const [, itemName, _number] = baseMatch;
        const cleaned = itemName
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return _number ? `${cleaned} ${_number}` : cleaned;
      }
    }

    // For variants, check if it's a numbered variant with redundant material names
    const variantMatch = name.match(/^(.+?)[-\s](\d+)[-\s](.+)$/);
    if (variantMatch && !isBase) {
      const [, baseName, _number, material] = variantMatch;
      // If the base name and material are similar, just return the material
      const baseWords = baseName.toLowerCase().split(/[-\s]+/);
      const materialWords = material.toLowerCase().split(/[-\s]+/);

      // Check if material name contains base name parts (redundant)
      const isRedundant = materialWords.some((word) =>
        baseWords.includes(word),
      );

      if (
        isRedundant ||
        baseWords.some(
          (word) => word === "body" || word === "legs" || word === "helmet",
        )
      ) {
        // Just return the material name, capitalized
        return material
          .split(/[-\s]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    // Default cleaning
    let cleaned = name
      .replace(/-base$/i, "")
      .replace(/-standard$/i, "")
      .replace(/-/g, " ");

    // Capitalize words
    return cleaned
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (assets.length === 0) {
    return (
      <div className="card overflow-hidden flex flex-col h-full bg-gradient-to-br from-bg-primary to-bg-secondary animate-scale-in">
        <div className="p-4 border-b border-border-primary bg-bg-primary bg-opacity-30">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Package size={18} className="text-primary" />
            Assets{" "}
            <span className="text-text-tertiary font-normal text-sm">(0)</span>
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 solid-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-text-muted opacity-50" />
            </div>
            <p className="text-text-secondary text-sm font-medium">
              No assets found
            </p>
            <p className="text-text-tertiary text-xs mt-1.5">
              Try adjusting your search filters
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedTiers.length > 0 ||
    selectedStatuses.length > 0;

  return (
    <>
      <div className="card overflow-hidden flex flex-col h-full bg-gradient-to-br from-bg-primary to-bg-secondary animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-border-primary solid-panel sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2 flex-shrink-0">
              <Package size={18} className="text-primary" />
              Assets{" "}
              <span className="text-text-tertiary font-normal text-sm">
                ({filteredAssets.length}
                {hasActiveFilters && ` of ${assets.length}`})
              </span>
              {selectionMode && selectedAssetIds.size > 0 && (
                <span className="text-xs text-primary font-medium whitespace-nowrap">
                  ({selectedAssetIds.size} selected)
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Display mode toggle (Cards/List) */}
              <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                <button
                  onClick={() => setDisplayMode("cards")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    displayMode === "cards"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                  title="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setDisplayMode("list")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    displayMode === "list"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                  title="List view"
                >
                  <List size={14} />
                </button>
              </div>

              {/* Select All / Deselect All (only in selection mode) */}
              {selectionMode && (
                <>
                  <button
                    onClick={() =>
                      selectAllAssets(filteredAssets.map((a) => a.id))
                    }
                    disabled={selectedAssetIds.size === filteredAssets.length}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-bg-tertiary text-text-tertiary hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Select all assets"
                  >
                    <CheckSquare size={14} />
                    <span>All</span>
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={selectedAssetIds.size === 0}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-bg-tertiary text-text-tertiary hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Deselect all assets"
                  >
                    <Square size={14} />
                    <span>Clear</span>
                  </button>
                </>
              )}

              {/* Selection mode toggle */}
              <button
                onClick={toggleSelectionMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectionMode
                    ? "bg-primary text-white shadow-sm"
                    : "bg-bg-tertiary text-text-tertiary hover:text-text-secondary"
                }`}
                title={
                  selectionMode ? "Exit selection mode" : "Enter selection mode"
                }
              >
                {selectionMode ? (
                  <CheckSquare size={14} />
                ) : (
                  <Square size={14} />
                )}
                <span>Select</span>
              </button>

              {/* Keyboard shortcuts help */}
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 bg-bg-tertiary text-text-tertiary hover:text-text-secondary"
                title="Keyboard shortcuts"
              >
                <Keyboard size={14} />
              </button>

              {/* View mode toggle (only show in list mode) */}
              {displayMode === "list" && (
                <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "grouped"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                    title="Group by base models"
                  >
                    <Layers size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("flat")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "flat"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                    title="Show all items"
                  >
                    <Package size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <QuickFiltersBar
          selectedTypes={selectedTypes}
          selectedTiers={selectedTiers}
          selectedStatuses={selectedStatuses}
          onTypesChange={setSelectedTypes}
          onTiersChange={setSelectedTiers}
          onStatusesChange={setSelectedStatuses}
          onClearAll={handleClearFilters}
        />

        {/* Main Content Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto custom-scrollbar scroll-container"
        >
          {displayMode === "cards" ? (
            /* Card Grid View with OptimizedAssetCard */
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleAssets.map((asset) => (
                  <OptimizedAssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAsset?.id === asset.id}
                    onSelect={handleAssetSelect}
                    onToggleFavorite={toggleFavorite}
                    onViewDetails={handleViewDetails}
                    onCreateVariants={handleCreateVariants}
                    onDelete={handleDelete}
                    isFavoriteUpdating={updatingFavorites.has(asset.id)}
                  />
                ))}
              </div>

              {/* Empty state for filtered results */}
              {filteredAssets.length === 0 && (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <Package
                      size={48}
                      className="mx-auto mb-4 text-text-tertiary opacity-30"
                    />
                    <p className="text-text-secondary text-sm font-medium">
                      No assets match your filters
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-accent transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-4 mt-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="ml-2 text-sm text-text-secondary">
                    Loading more assets...
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="p-2 space-y-1">
              {viewMode === "grouped" ? (
                <>
                  {/* Render grouped view with type headers */}
                  {Object.entries(groupedAssetsByType).map(
                    ([type, typeData], typeIndex) => {
                      // Better pluralization
                      const typeLabel = (() => {
                        const capitalizedType =
                          type.charAt(0).toUpperCase() + type.slice(1);
                        switch (type) {
                          case "ammunition":
                            return "Ammunition";
                          case "armor":
                            return "Armor";
                          default:
                            return capitalizedType + "s";
                        }
                      })();

                      const totalCount =
                        typeData.groups.length + typeData.standalone.length;
                      if (totalCount === 0) return null;

                      return (
                        <div key={type} className="mb-4">
                          {/* Type Header */}
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                              {typeLabel} ({totalCount})
                            </h3>
                            <div className="flex-1 h-px bg-border-secondary opacity-30" />
                          </div>

                          {/* Base Items with Variants */}
                          {typeData.groups.map((group, groupIndex) => (
                            <div
                              key={group.base.id}
                              className="micro-list-item"
                              style={{
                                animationDelay: `${typeIndex * 50 + groupIndex * 30}ms`,
                              }}
                            >
                              {/* Base Item */}
                              <div
                                className={`group relative rounded-lg transition-all duration-200 micro-state-transition ${
                                  selectedAsset?.id === group.base.id
                                    ? "bg-primary bg-opacity-5"
                                    : "hover:bg-bg-primary hover:bg-opacity-50"
                                }`}
                              >
                                <div className="flex items-center p-3">
                                  {/* Checkbox for selection mode */}
                                  {selectionMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAssetSelection(group.base.id);
                                      }}
                                      className="p-1 -ml-1 mr-2 hover:bg-bg-secondary rounded transition-all"
                                    >
                                      {selectedAssetIds.has(group.base.id) ? (
                                        <CheckSquare
                                          size={16}
                                          className="text-primary"
                                        />
                                      ) : (
                                        <Square
                                          size={16}
                                          className="text-text-tertiary"
                                        />
                                      )}
                                    </button>
                                  )}

                                  {/* Chevron for expand/collapse */}
                                  {!selectionMode &&
                                  group.variants.length > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(group.base.id);
                                      }}
                                      className="p-1.5 -ml-1 mr-2 hover:bg-bg-secondary rounded-md transition-all duration-200 hover:scale-110"
                                    >
                                      <ChevronRight
                                        size={16}
                                        className={`text-text-tertiary transition-transform duration-200 ${
                                          expandedGroups.has(group.base.id)
                                            ? "rotate-90"
                                            : ""
                                        }`}
                                      />
                                    </button>
                                  ) : !selectionMode ? (
                                    <div className="w-7 h-7 -ml-1 mr-2" />
                                  ) : null}

                                  <div
                                    className="flex-1 flex items-center gap-3 cursor-pointer py-1"
                                    onClick={() =>
                                      handleAssetSelect(group.base)
                                    }
                                  >
                                    <div
                                      className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 group-hover:scale-105 ${
                                        selectedAsset?.id === group.base.id
                                          ? "bg-primary bg-opacity-10 text-text-primary shadow-sm ring-2 ring-primary"
                                          : "bg-bg-secondary bg-opacity-70 text-text-tertiary group-hover:bg-bg-tertiary group-hover:text-text-secondary"
                                      }`}
                                    >
                                      <AssetPreview
                                        asset={group.base}
                                        size={36}
                                        iconSize={18}
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm text-text-primary truncate">
                                          {cleanAssetName(
                                            group.base.name,
                                            true,
                                          )}
                                        </h3>
                                        {group.variants.length > 0 && (
                                          <span className="text-xs text-text-secondary">
                                            ({group.variants.length})
                                          </span>
                                        )}
                                        {group.base.hasModel && (
                                          <Sparkles
                                            size={12}
                                            className="text-success flex-shrink-0"
                                          />
                                        )}
                                        <button
                                          onClick={(e) =>
                                            toggleFavorite(group.base, e)
                                          }
                                          disabled={updatingFavorites.has(
                                            group.base.id,
                                          )}
                                          className="p-0.5 hover:scale-110 transition-transform flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                          title={
                                            group.base.metadata.isFavorite
                                              ? "Remove from favorites"
                                              : "Add to favorites"
                                          }
                                          aria-label={
                                            group.base.metadata.isFavorite
                                              ? "Remove from favorites"
                                              : "Add to favorites"
                                          }
                                        >
                                          {updatingFavorites.has(
                                            group.base.id,
                                          ) ? (
                                            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Star
                                              size={12}
                                              className={`${
                                                group.base.metadata.isFavorite
                                                  ? "text-yellow-400 fill-yellow-400"
                                                  : "text-text-tertiary hover:text-yellow-400"
                                              } transition-colors`}
                                            />
                                          )}
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-2 text-xs mt-0.5">
                                        <span className="px-1.5 py-0.5 bg-primary bg-opacity-20 text-primary rounded text-xs font-medium">
                                          BASE
                                        </span>
                                        <span className="text-text-secondary capitalize">
                                          {group.base.type}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {selectedAsset?.id === group.base.id && (
                                      <div className="w-1 h-8 bg-primary rounded-full" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Variants */}
                              {expandedGroups.has(group.base.id) && (
                                <div className="ml-10 mt-0.5 space-y-0.5">
                                  {group.variants.map(
                                    (variant, variantIndex) => (
                                      <div
                                        key={variant.id}
                                        className={`group relative rounded-md cursor-pointer transition-all duration-200 micro-state-transition ${
                                          selectedAsset?.id === variant.id
                                            ? "bg-primary bg-opacity-5"
                                            : "hover:bg-bg-primary hover:bg-opacity-30"
                                        }`}
                                        onClick={() =>
                                          handleAssetSelect(variant)
                                        }
                                        style={{
                                          animationDelay: `${typeIndex * 50 + groupIndex * 30 + variantIndex * 10}ms`,
                                        }}
                                      >
                                        <div className="flex items-center gap-3 p-2 pl-3">
                                          {/* Checkbox for selection mode */}
                                          {selectionMode && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleAssetSelection(
                                                  variant.id,
                                                );
                                              }}
                                              className="p-1 -ml-2 mr-1 hover:bg-bg-secondary rounded transition-all flex-shrink-0"
                                            >
                                              {selectedAssetIds.has(
                                                variant.id,
                                              ) ? (
                                                <CheckSquare
                                                  size={14}
                                                  className="text-primary"
                                                />
                                              ) : (
                                                <Square
                                                  size={14}
                                                  className="text-text-tertiary"
                                                />
                                              )}
                                            </button>
                                          )}
                                          <div
                                            className={`flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 group-hover:scale-105 ${
                                              selectedAsset?.id === variant.id
                                                ? "bg-primary bg-opacity-10 text-text-primary ring-2 ring-primary"
                                                : "bg-bg-secondary bg-opacity-50 text-text-tertiary group-hover:bg-bg-tertiary group-hover:text-text-secondary"
                                            }`}
                                          >
                                            <AssetPreview
                                              asset={variant}
                                              size={32}
                                              iconSize={16}
                                            />
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <h3 className="font-medium text-xs text-text-primary truncate">
                                                {cleanAssetName(variant.name)}
                                              </h3>
                                              <button
                                                onClick={(e) =>
                                                  toggleFavorite(variant, e)
                                                }
                                                disabled={updatingFavorites.has(
                                                  variant.id,
                                                )}
                                                className="p-0.5 hover:scale-110 transition-transform flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                                title={
                                                  variant.metadata.isFavorite
                                                    ? "Remove from favorites"
                                                    : "Add to favorites"
                                                }
                                                aria-label={
                                                  variant.metadata.isFavorite
                                                    ? "Remove from favorites"
                                                    : "Add to favorites"
                                                }
                                              >
                                                {updatingFavorites.has(
                                                  variant.id,
                                                ) ? (
                                                  <div className="w-2.5 h-2.5 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                  <Star
                                                    size={10}
                                                    className={`${
                                                      variant.metadata
                                                        .isFavorite
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-text-tertiary hover:text-yellow-400"
                                                    } transition-colors`}
                                                  />
                                                )}
                                              </button>
                                            </div>

                                            {variant.metadata?.tier && (
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                <div
                                                  className="w-2 h-2 rounded-full shadow-sm"
                                                  style={{
                                                    backgroundColor:
                                                      getTierColor(
                                                        variant.metadata.tier,
                                                      ),
                                                  }}
                                                />
                                                <span
                                                  className="text-xs font-medium capitalize"
                                                  style={{
                                                    color: getTierColor(
                                                      variant.metadata.tier,
                                                    ),
                                                  }}
                                                >
                                                  {variant.metadata.tier}
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {variant.hasModel && (
                                              <Sparkles
                                                size={10}
                                                className="text-success"
                                              />
                                            )}
                                            {selectedAsset?.id ===
                                              variant.id && (
                                              <div className="w-0.5 h-6 bg-primary rounded-full" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Standalone Items in this type */}
                          {typeData.standalone.map((asset, index) => (
                            <div
                              key={asset.id}
                              className={`group relative rounded-lg transition-all duration-200 micro-list-item micro-state-transition ${
                                selectedAsset?.id === asset.id
                                  ? "bg-primary bg-opacity-5"
                                  : "hover:bg-bg-primary hover:bg-opacity-50"
                              }`}
                              style={{
                                animationDelay: `${typeIndex * 50 + typeData.groups.length * 30 + index * 30}ms`,
                              }}
                              onClick={() => handleAssetSelect(asset)}
                            >
                              <div className="flex items-center gap-3 p-2 hover:bg-bg-primary hover:bg-opacity-40 rounded-lg transition-colors">
                                {/* Checkbox for selection mode */}
                                {selectionMode ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAssetSelection(asset.id);
                                    }}
                                    className="p-1 -ml-1 mr-1 hover:bg-bg-secondary rounded transition-all flex-shrink-0"
                                  >
                                    {selectedAssetIds.has(asset.id) ? (
                                      <CheckSquare
                                        size={16}
                                        className="text-primary"
                                      />
                                    ) : (
                                      <Square
                                        size={16}
                                        className="text-text-tertiary"
                                      />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-6" />
                                )}

                                <div
                                  className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                                    selectedAsset?.id === asset.id
                                      ? "bg-primary bg-opacity-10 text-text-primary shadow-sm ring-2 ring-primary"
                                      : "bg-bg-secondary bg-opacity-70 text-text-tertiary"
                                  }`}
                                >
                                  <AssetPreview
                                    asset={asset}
                                    size={36}
                                    iconSize={18}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-sm text-text-primary truncate">
                                      {cleanAssetName(
                                        asset.name,
                                        asset.metadata?.isBaseModel,
                                      )}
                                    </h3>
                                    {asset.hasModel && (
                                      <Sparkles
                                        size={12}
                                        className="text-success flex-shrink-0"
                                      />
                                    )}
                                    <button
                                      onClick={(e) => toggleFavorite(asset, e)}
                                      disabled={updatingFavorites.has(asset.id)}
                                      className="p-0.5 hover:scale-110 transition-transform flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                      title={
                                        asset.metadata.isFavorite
                                          ? "Remove from favorites"
                                          : "Add to favorites"
                                      }
                                      aria-label={
                                        asset.metadata.isFavorite
                                          ? "Remove from favorites"
                                          : "Add to favorites"
                                      }
                                    >
                                      {updatingFavorites.has(asset.id) ? (
                                        <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Star
                                          size={12}
                                          className={`${
                                            asset.metadata.isFavorite
                                              ? "text-yellow-400 fill-yellow-400"
                                              : "text-text-tertiary hover:text-yellow-400"
                                          } transition-colors`}
                                        />
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2 text-[0.6875rem] mt-0.5">
                                    {asset.metadata?.isBaseModel && (
                                      <>
                                        <span className="px-1.5 py-0.5 bg-primary bg-opacity-20 text-primary rounded text-xs font-medium">
                                          BASE
                                        </span>
                                        <span className="text-text-muted">
                                          •
                                        </span>
                                      </>
                                    )}
                                    <span className="text-text-tertiary capitalize">
                                      {asset.type}
                                    </span>

                                    {asset.metadata?.tier &&
                                      asset.metadata.tier !== "base" && (
                                        <>
                                          <span className="text-text-muted">
                                            •
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <div
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{
                                                backgroundColor: getTierColor(
                                                  asset.metadata.tier,
                                                ),
                                              }}
                                            />
                                            <span
                                              className="font-medium capitalize"
                                              style={{
                                                color: getTierColor(
                                                  asset.metadata.tier,
                                                ),
                                              }}
                                            >
                                              {asset.metadata.tier}
                                            </span>
                                          </div>
                                        </>
                                      )}

                                    {asset.metadata?.isPlaceholder && (
                                      <>
                                        <span className="text-text-muted">
                                          •
                                        </span>
                                        <span className="bg-warning bg-opacity-15 text-warning px-1.5 py-0.5 rounded text-xs font-medium">
                                          PLACEHOLDER
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {selectedAsset?.id === asset.id && (
                                    <div className="w-1 h-8 bg-primary rounded-full" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    },
                  )}
                </>
              ) : (
                /* Flat view - grouped by type */
                <>
                  {Object.entries(assetsByType).map(
                    ([type, typeAssets], typeIndex) => {
                      // Better pluralization
                      const typeLabel = (() => {
                        const capitalizedType =
                          type.charAt(0).toUpperCase() + type.slice(1);
                        switch (type) {
                          case "ammunition":
                            return "Ammunition";
                          case "armor":
                            return "Armor";
                          default:
                            return capitalizedType + "s";
                        }
                      })();

                      return (
                        <div key={type} className="mb-4">
                          {/* Type Header */}
                          <div className="flex items-center gap-2 mb-2 px-2">
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                              {typeLabel} ({typeAssets.length})
                            </h3>
                            <div className="flex-1 h-px bg-border-secondary opacity-30" />
                          </div>

                          {/* Assets in this type */}
                          {typeAssets.map((asset, index) => {
                            const isBase = asset.metadata?.isBaseModel;
                            const variantCount = isBase
                              ? assetGroups.groups.find(
                                  (g) => g.base.id === asset.id,
                                )?.variants.length || 0
                              : 0;

                            return (
                              <div
                                key={asset.id}
                                className={`group relative rounded-lg transition-all duration-200 micro-list-item micro-state-transition ${
                                  selectedAsset?.id === asset.id
                                    ? "bg-primary bg-opacity-5"
                                    : "hover:bg-bg-primary hover:bg-opacity-50"
                                }`}
                                style={{
                                  animationDelay: `${typeIndex * 50 + index * 10}ms`,
                                }}
                                onClick={() => handleAssetSelect(asset)}
                              >
                                <div className="flex items-center gap-3 p-2 hover:bg-bg-primary hover:bg-opacity-40 rounded-lg transition-colors">
                                  {/* Checkbox for selection mode */}
                                  {selectionMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAssetSelection(asset.id);
                                      }}
                                      className="p-1 -ml-1 mr-1 hover:bg-bg-secondary rounded transition-all flex-shrink-0"
                                    >
                                      {selectedAssetIds.has(asset.id) ? (
                                        <CheckSquare
                                          size={16}
                                          className="text-primary"
                                        />
                                      ) : (
                                        <Square
                                          size={16}
                                          className="text-text-tertiary"
                                        />
                                      )}
                                    </button>
                                  )}
                                  <div
                                    className={`flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                                      selectedAsset?.id === asset.id
                                        ? "bg-primary bg-opacity-10 text-text-primary shadow-sm ring-2 ring-primary"
                                        : "bg-bg-secondary bg-opacity-70 text-text-tertiary"
                                    }`}
                                  >
                                    <AssetPreview
                                      asset={asset}
                                      size={36}
                                      iconSize={18}
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-sm text-text-primary truncate">
                                        {cleanAssetName(
                                          asset.name,
                                          asset.metadata?.isBaseModel,
                                        )}
                                      </h3>
                                      {asset.hasModel && (
                                        <Sparkles
                                          size={12}
                                          className="text-success flex-shrink-0"
                                        />
                                      )}
                                      <button
                                        onClick={(e) =>
                                          toggleFavorite(asset, e)
                                        }
                                        disabled={updatingFavorites.has(
                                          asset.id,
                                        )}
                                        className="p-0.5 hover:scale-110 transition-transform flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                        title={
                                          asset.metadata.isFavorite
                                            ? "Remove from favorites"
                                            : "Add to favorites"
                                        }
                                        aria-label={
                                          asset.metadata.isFavorite
                                            ? "Remove from favorites"
                                            : "Add to favorites"
                                        }
                                      >
                                        {updatingFavorites.has(asset.id) ? (
                                          <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Star
                                            size={12}
                                            className={`${
                                              asset.metadata.isFavorite
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-text-tertiary hover:text-yellow-400"
                                            } transition-colors`}
                                          />
                                        )}
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-[0.6875rem] mt-0.5">
                                      {asset.metadata?.isBaseModel && (
                                        <>
                                          <span className="px-1.5 py-0.5 bg-primary bg-opacity-20 text-primary rounded text-xs font-medium">
                                            BASE
                                          </span>
                                          <span className="text-text-muted">
                                            •
                                          </span>
                                        </>
                                      )}
                                      <span className="text-text-tertiary capitalize">
                                        {asset.type}
                                      </span>

                                      {asset.metadata?.isBaseModel &&
                                        variantCount > 0 && (
                                          <>
                                            <span className="text-text-muted">
                                              •
                                            </span>
                                            <span className="text-text-secondary flex items-center gap-1">
                                              <Layers
                                                size={10}
                                                className="text-text-tertiary"
                                              />
                                              {variantCount} variant
                                              {variantCount !== 1 ? "s" : ""}
                                            </span>
                                          </>
                                        )}

                                      {asset.metadata?.tier &&
                                        asset.metadata.tier !== "base" && (
                                          <>
                                            <span className="text-text-muted">
                                              •
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <div
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                  backgroundColor: getTierColor(
                                                    asset.metadata.tier,
                                                  ),
                                                }}
                                              />
                                              <span
                                                className="font-medium capitalize"
                                                style={{
                                                  color: getTierColor(
                                                    asset.metadata.tier,
                                                  ),
                                                }}
                                              >
                                                {asset.metadata.tier}
                                              </span>
                                            </div>
                                          </>
                                        )}

                                      {asset.metadata?.isPlaceholder && (
                                        <>
                                          <span className="text-text-muted">
                                            •
                                          </span>
                                          <span className="bg-warning bg-opacity-15 text-warning px-1.5 py-0.5 rounded text-xs font-medium">
                                            PLACEHOLDER
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {selectedAsset?.id === asset.id && (
                                      <div className="w-1 h-8 bg-primary rounded-full" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    },
                  )}
                </>
              )}

              {/* Loading indicator for list view */}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="ml-2 text-sm text-text-secondary">
                    Loading more assets...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedAssetIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedAssetIds.size}
          onDelete={() => {
            showNotification(
              `Deleting ${selectedAssetIds.size} assets...`,
              "info",
            );
          }}
          onStatusChange={() => {
            showNotification("Bulk status change coming soon!", "info");
          }}
          onFavorite={() => {
            showNotification("Bulk favorite coming soon!", "info");
          }}
          onClearSelection={clearSelection}
        />
      )}

      {/* Asset Details Panel */}
      <AssetDetailsPanel
        asset={detailsAsset || ({} as Asset)}
        isOpen={!!detailsAsset}
        onClose={() => setDetailsAsset(null)}
        onDelete={(asset) => {
          setDetailsAsset(null);
          handleDelete(asset);
        }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
            onClick={() => setShowKeyboardHelp(false)}
          >
            {/* Modal */}
            <div
              className="solid-panel border border-border-primary rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border-primary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-text-primary">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-1 hover:bg-bg-hover rounded-lg transition-colors"
                >
                  <Package size={16} className="text-text-tertiary" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Navigation
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Navigate assets
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        ←↑↓→
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        View details
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        Enter
                      </kbd>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-secondary pt-3 space-y-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Toggle favorite
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        F
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Create variants
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        V
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Delete asset
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        Del
                      </kbd>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-secondary pt-3 space-y-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Selection
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Close panel / Clear selection
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        Esc
                      </kbd>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-secondary pt-3 space-y-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Help
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        Show keyboard shortcuts
                      </span>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary rounded text-xs font-mono border border-border-primary">
                        ?
                      </kbd>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-secondary pt-3">
                  <p className="text-xs text-text-tertiary">
                    Right-click on any asset card for more options
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AssetList;
