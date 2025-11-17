import { Activity, Edit3, Layers, RefreshCw } from "lucide-react";
import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";

import { useAssetsStore } from "../store";
import { AssetService } from "@/services/api/AssetService";

import {
  AssetDetailsPanel,
  AssetEditModal,
  AssetFilters,
  AssetList,
  AssetStatisticsCard,
  BulkActionsBar,
  EmptyAssetState,
  RegenerateModal,
  RetextureModal,
  SpriteGenerationModal,
  TransitionOverlay,
  VariantTreeViewer,
  ViewerControls,
} from "@/components/assets";
import { Tray, SkeletonList } from "@/components/common";
import { AnimationPlayer } from "@/components/shared/AnimationPlayer";
import ThreeViewer, { ThreeViewerRef } from "@/components/shared/ThreeViewer";
import { useAssetActions } from "@/hooks";
import { useAssets } from "@/hooks";
import { useCommandRegistration } from "@/hooks/useCommandRegistration";

export const AssetsPage: React.FC = () => {
  const {
    data: assets = [],
    isLoading: loading,
    refetch: reloadAssets,
  } = useAssets();
  const { selectedAssetIds, clearSelection } = useAssetsStore();
  const [showBulkActionsTray, setShowBulkActionsTray] = useState(false);

  // Auto-open tray when assets are selected
  useEffect(() => {
    if (selectedAssetIds.size > 0) {
      setShowBulkActionsTray(true);
    }
  }, [selectedAssetIds.size]);

  // Memoize reloadAssets to prevent command re-registration
  const stableReloadAssets = useCallback(() => {
    reloadAssets();
  }, [reloadAssets]);

  // Register asset-specific commands with stable dependencies
  const commands = useMemo(
    () => [
      {
        id: "assets-reload",
        label: "Reload Assets",
        description: "Refresh the asset library",
        icon: RefreshCw,
        category: "Assets",
        keywords: ["reload", "refresh", "assets"],
        action: stableReloadAssets,
      },
      {
        id: "assets-toggle-selection",
        label: "Toggle Selection Mode",
        description: "Enter/exit bulk selection mode",
        icon: Edit3,
        category: "Assets",
        keywords: ["select", "selection", "bulk"],
        action: () => {
          useAssetsStore.getState().toggleSelectionMode();
        },
      },
    ],
    [stableReloadAssets],
  );

  useCommandRegistration(commands);

  // Local state for modals
  const [showVariantTree, setShowVariantTree] = useState(false);

  // Get state and actions from store
  const {
    selectedAsset,
    showGroundPlane,
    isWireframe,
    isLightBackground,
    showRetextureModal,
    showRegenerateModal,
    showDetailsPanel,
    showEditModal,
    showSpriteModal,
    isTransitioning,
    modelInfo,
    showAnimationView,
    setShowRetextureModal,
    setShowRegenerateModal,
    setShowDetailsPanel,
    setShowEditModal,
    setShowSpriteModal,
    setModelInfo,
    toggleDetailsPanel,
    toggleAnimationView,
    getFilteredAssets,
  } = useAssetsStore();

  const viewerRef = useRef<ThreeViewerRef>(null);

  // Use the asset actions hook
  const {
    handleViewerReset,
    handleDownload,
    handleDeleteAsset,
    handleSaveAsset,
  } = useAssetActions({
    viewerRef: viewerRef as React.RefObject<ThreeViewerRef>,
    reloadAssets,
    assets,
  });

  // Filter assets based on current filters
  const filteredAssets = getFilteredAssets(assets);

  const handleModelLoad = useCallback(
    (info: {
      vertices: number;
      faces: number;
      materials: number;
      fileSize?: number;
    }) => {
      setModelInfo(info);
    },
    [setModelInfo],
  );

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="card overflow-hidden flex flex-col h-full bg-gradient-to-br from-bg-primary to-bg-secondary">
          <div className="p-4 border-b border-border-primary bg-bg-primary bg-opacity-30">
            <div className="h-6 w-48 bg-bg-tertiary rounded skeleton-shimmer" />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <SkeletonList count={10} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Sidebar - SCROLLABLE */}
      <div className="card overflow-hidden w-64 flex flex-col bg-gradient-to-br from-bg-secondary to-bg-tertiary">
        {/* Header Section */}
        <div className="p-3 border-b border-border-primary bg-bg-primary bg-opacity-30">
          <h2 className="text-lg font-semibold text-text-primary">
            Asset Library
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Browse and manage your 3D assets
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="space-y-2">
            {/* Asset Statistics */}
            <AssetStatisticsCard assets={assets} />

            {/* Filters (Search Bar Only) */}
            <AssetFilters
              totalAssets={assets.length}
              filteredCount={filteredAssets.length}
            />

            {/* Asset List */}
            <AssetList assets={filteredAssets} />
          </div>
        </div>
      </div>

      {/* Center - 3D Viewport - FIXED */}
      <div className="flex-1 flex flex-col">
        <div className="overflow-hidden flex-1 relative bg-gradient-to-br from-bg-primary to-bg-secondary rounded-xl">
          {selectedAsset ? (
            <>
              <div className="absolute inset-0">
                {/* Keep both viewers mounted; fade inactive one to preserve layout and canvas size */}
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${showAnimationView && selectedAsset.type === "character" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  <ThreeViewer
                    ref={viewerRef}
                    cdnUrl={
                      selectedAsset.hasModel
                        ? AssetService.getModelUrl(selectedAsset)
                        : undefined
                    }
                    isWireframe={isWireframe}
                    showGroundPlane={showGroundPlane}
                    isLightBackground={isLightBackground}
                    lightMode={true}
                    onModelLoad={handleModelLoad}
                    assetInfo={{
                      name: selectedAsset.name,
                      type: selectedAsset.type,
                      tier: selectedAsset.metadata.tier,
                      format: selectedAsset.metadata.format || "GLB",
                      requiresAnimationStrip:
                        selectedAsset.metadata.requiresAnimationStrip,
                    }}
                  />
                </div>
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${showAnimationView && selectedAsset.type === "character" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <AnimationPlayer
                    cdnUrl={
                      selectedAsset.hasModel
                        ? AssetService.getModelUrl(selectedAsset)
                        : ""
                    }
                    animations={
                      selectedAsset.metadata?.animations || { basic: {} }
                    }
                    riggedModelPath={AssetService.getRiggedModelUrl(
                      selectedAsset,
                      selectedAsset.metadata?.riggedModelPath,
                    )}
                    characterHeight={selectedAsset.metadata?.characterHeight}
                    className="w-full h-full"
                  />
                </div>
              </div>
              {isTransitioning && <TransitionOverlay />}

              {showAnimationView ? (
                // Controls for animation view - positioned top-right to match asset browser layout
                <div className="absolute top-4 right-4 flex gap-2 animate-fade-in z-10">
                  {/* Animation Toggle - furthest left */}
                  {selectedAsset.type === "character" && (
                    <button
                      onClick={toggleAnimationView}
                      className={`group p-3 bg-bg-secondary bg-opacity-90  rounded-xl transition-all duration-200 hover:bg-bg-tertiary hover:scale-105 shadow-lg ${
                        showAnimationView ? "ring-2 ring-primary" : ""
                      }`}
                      title={
                        showAnimationView ? "View 3D Model" : "View Animations"
                      }
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

                  {/* Edit Button - middle */}
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="group p-3 bg-bg-secondary bg-opacity-90  rounded-xl transition-all duration-200 hover:bg-bg-tertiary hover:scale-105 shadow-lg"
                    title="Edit Asset"
                  >
                    <Edit3
                      size={20}
                      className="text-text-secondary group-hover:text-primary transition-colors"
                    />
                  </button>

                  {/* Details Button - furthest right with Layers icon */}
                  <button
                    onClick={toggleDetailsPanel}
                    className={`p-3 bg-bg-secondary bg-opacity-90  rounded-xl transition-all duration-200 hover:bg-bg-tertiary hover:scale-105 shadow-lg ${
                      showDetailsPanel ? "ring-2 ring-primary" : ""
                    }`}
                    title="Toggle Details (D)"
                  >
                    <Layers
                      size={20}
                      className={`transition-colors ${
                        showDetailsPanel
                          ? "text-primary"
                          : "text-text-secondary"
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <ViewerControls
                  onViewerReset={handleViewerReset}
                  onDownload={handleDownload}
                  onShowVariantTree={() => setShowVariantTree(true)}
                  assetType={selectedAsset.type}
                  canRetexture={
                    selectedAsset.type !== "character" &&
                    selectedAsset.type !== "environment"
                  }
                  hasRigging={
                    selectedAsset.type === "character" ||
                    !!selectedAsset.metadata?.animations
                  }
                />
              )}

              <AssetDetailsPanel
                asset={selectedAsset}
                isOpen={showDetailsPanel}
                onClose={() => setShowDetailsPanel(false)}
                modelInfo={modelInfo}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyAssetState />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRetextureModal && selectedAsset && (
        <RetextureModal
          asset={selectedAsset}
          onClose={() => setShowRetextureModal(false)}
          onComplete={() => {
            setShowRetextureModal(false);
            reloadAssets();
          }}
        />
      )}

      {showRegenerateModal && selectedAsset && (
        <RegenerateModal
          asset={selectedAsset}
          onClose={() => setShowRegenerateModal(false)}
          onComplete={() => {
            setShowRegenerateModal(false);
            reloadAssets();
          }}
        />
      )}

      {showEditModal && selectedAsset && (
        <AssetEditModal
          asset={selectedAsset}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveAsset}
          onDelete={handleDeleteAsset}
          hasVariants={assets.some(
            (a) =>
              a.metadata.isVariant &&
              a.metadata.parentBaseModel === selectedAsset.id,
          )}
        />
      )}

      {showSpriteModal && selectedAsset && (
        <SpriteGenerationModal
          asset={selectedAsset}
          onClose={() => setShowSpriteModal(false)}
          onComplete={() => {
            setShowSpriteModal(false);
            reloadAssets();
          }}
        />
      )}

      {/* Variant Tree Viewer */}
      {showVariantTree && (
        <VariantTreeViewer
          assets={assets}
          onClose={() => setShowVariantTree(false)}
        />
      )}

      {/* Bulk Actions Tray */}
      {selectedAssetIds.size > 0 && (
        <Tray
          open={showBulkActionsTray || selectedAssetIds.size > 0}
          onClose={() => {
            setShowBulkActionsTray(false);
            clearSelection();
          }}
          title={`${selectedAssetIds.size} Asset${selectedAssetIds.size > 1 ? "s" : ""} Selected`}
          defaultHeight="md"
          resizable={true}
        >
          <div className="p-4 space-y-3">
            <BulkActionsBar
              assets={assets}
              onActionComplete={() => {
                reloadAssets();
                setShowBulkActionsTray(false);
              }}
              variant="tray"
            />
          </div>
        </Tray>
      )}
    </div>
  );
};

export default AssetsPage;
