import { Package, RotateCcw, Settings, Menu, X } from "lucide-react";
import React, { useRef, useState } from "react";

import { useEquipmentFittingStore } from "../store/useEquipmentFittingStore";
import { cn } from "../styles";

import {
  ArmorFittingViewer,
  ArmorFittingViewerRef,
  ArmorAssetList,
  ViewportControls,
  UndoRedoControls,
  FittingProgress,
} from "@/components/armor-fitting";
import EquipmentViewer, {
  type EquipmentViewerRef,
} from "@/components/equipment/EquipmentViewer";
import {
  ErrorNotification,
  EmptyState,
  Drawer,
  CollapsibleSection,
} from "@/components/common";
import {
  TabSelector,
  ArmorFittingPanel,
  WeaponFittingPanel,
} from "@/components/equipment";
import { ThreeDPanel } from "@/components/3DPanel";
import { EQUIPMENT_SLOTS } from "@/constants/equipment";
import { useAssets } from "@/hooks";

export const UnifiedEquipmentPage: React.FC = () => {
  const { assets, loading } = useAssets();
  const armorViewerRef = useRef<ArmorFittingViewerRef>(null);
  const weaponViewerRef = useRef<EquipmentViewerRef>(null);
  const [showControlsDrawer, setShowControlsDrawer] = useState(true);
  const [showAssetDrawer, setShowAssetDrawer] = useState(true);

  // Get state and actions from unified store
  const {
    // UI State
    currentTab,
    setCurrentTab,

    // Equipment slot
    equipmentSlot,
    setEquipmentSlot,
    isArmorMode,
    isWeaponMode,

    // Selected items
    selectedAvatar,
    selectedArmor,
    selectedHelmet,
    selectedWeapon,
    assetTypeFilter,
    handleAssetSelect,
    setAssetTypeFilter,

    // Armor state
    fittingConfig,
    updateFittingConfig,
    enableWeightTransfer,
    setEnableWeightTransfer,
    visualizationMode,
    setVisualizationMode,
    showWireframe,
    setShowWireframe,
    isFitting,
    fittingProgress,
    isArmorFitted,
    isArmorBound,
    isExporting,

    // Helmet state
    helmetFittingMethod,
    setHelmetFittingMethod,
    helmetSizeMultiplier,
    setHelmetSizeMultiplier,
    helmetVerticalOffset,
    setHelmetVerticalOffset,
    helmetForwardOffset,
    setHelmetForwardOffset,
    helmetRotation,
    updateHelmetRotation,
    isHelmetFitted,
    isHelmetAttached,

    // Weapon state
    handleDetectionResult,
    isDetectingHandle,
    avatarHeight,
    creatureCategory,
    autoScaleWeapon,
    weaponScaleOverride,
    manualPosition,
    manualRotation,
    showSkeleton,
    setAvatarHeight,
    setCreatureCategory,
    setAutoScaleWeapon,
    setWeaponScaleOverride,
    setManualPosition,
    setManualRotation,
    setShowSkeleton,
    resetWeaponAdjustments,

    // Shared state
    currentAnimation,
    isAnimationPlaying,
    setCurrentAnimation,
    toggleAnimation,

    // Actions
    performFitting,
    bindArmorToSkeleton,
    performHelmetFitting,
    attachHelmetToHead,
    exportEquippedAvatar,
    saveConfiguration,
    resetScene,
    detectGripPoint,

    // Error handling
    lastError,
    clearError,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Selectors
    isReadyToFit,
    currentProgress,
  } = useEquipmentFittingStore();

  // Get the appropriate viewer ref based on mode
  const viewerRef = isWeaponMode() ? weaponViewerRef : armorViewerRef;

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      }
      // Redo: Ctrl+Shift+Z, Cmd+Shift+Z, or Ctrl+Y
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        if (canRedo()) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Determine which equipment is selected
  const selectedEquipment = isWeaponMode()
    ? selectedWeapon
    : equipmentSlot === "Head"
      ? selectedHelmet
      : selectedArmor;

  return (
    <>
      <div className="page-container">
        {/* Error Toast */}
        {lastError && (
          <ErrorNotification error={lastError} onClose={clearError} />
        )}

        {/* Center - 3D Viewport - FIXED */}
        <div className="flex-1 flex flex-col">
          <div className="overflow-hidden flex-1 relative bg-gradient-to-br from-bg-primary to-bg-secondary rounded-xl flex items-center justify-center">
            {selectedAvatar || selectedEquipment ? (
              <>
                {isWeaponMode() ? (
                  <EquipmentViewer
                    ref={weaponViewerRef}
                    avatarUrl={
                      selectedAvatar?.hasModel && selectedAvatar.cdnUrl
                        ? selectedAvatar.cdnUrl
                        : undefined
                    }
                    equipmentUrl={
                      selectedWeapon?.hasModel && selectedWeapon.cdnUrl
                        ? selectedWeapon.cdnUrl
                        : undefined
                    }
                    equipmentSlot={equipmentSlot}
                    showSkeleton={showSkeleton}
                    weaponType={selectedWeapon?.type || "sword"}
                    avatarHeight={avatarHeight}
                    autoScale={autoScaleWeapon}
                    scaleOverride={weaponScaleOverride}
                    gripOffset={
                      handleDetectionResult?.gripPoint
                        ? {
                            x: handleDetectionResult.gripPoint.x,
                            y: handleDetectionResult.gripPoint.y,
                            z: handleDetectionResult.gripPoint.z,
                          }
                        : undefined
                    }
                    orientationOffset={manualRotation}
                    positionOffset={manualPosition}
                    isAnimating={isAnimationPlaying}
                    animationType={currentAnimation}
                  />
                ) : (
                  <ArmorFittingViewer
                    ref={armorViewerRef}
                    avatarUrl={
                      selectedAvatar?.hasModel && selectedAvatar.cdnUrl
                        ? selectedAvatar.cdnUrl
                        : undefined
                    }
                    armorUrl={
                      selectedArmor?.hasModel && selectedArmor.cdnUrl
                        ? selectedArmor.cdnUrl
                        : undefined
                    }
                    helmetUrl={
                      selectedHelmet?.hasModel && selectedHelmet.cdnUrl
                        ? selectedHelmet.cdnUrl
                        : undefined
                    }
                    weaponUrl={
                      selectedWeapon?.hasModel && selectedWeapon.cdnUrl
                        ? selectedWeapon.cdnUrl
                        : undefined
                    }
                    showWireframe={showWireframe}
                    equipmentSlot={
                      equipmentSlot as
                        | "Head"
                        | "Spine2"
                        | "Pelvis"
                        | "Hand_R"
                        | "Hand_L"
                    }
                    selectedAvatar={selectedAvatar}
                    currentAnimation={currentAnimation}
                    isAnimationPlaying={isAnimationPlaying}
                    visualizationMode={
                      visualizationMode === "hull" ? "none" : visualizationMode
                    }
                    selectedBone={0}
                    onModelsLoaded={() => console.log("Models loaded")}
                    onBodyRegionsDetected={() => {}}
                    onCollisionsDetected={() => {}}
                  />
                )}

                {/* Reset Button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-10 max-w-[90%]">
                  <button
                    onClick={() => {
                      if (isWeaponMode()) {
                        resetWeaponAdjustments();
                      } else {
                        resetScene(armorViewerRef);
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 bg-bg-primary/80  border border-white/10 text-text-primary hover:bg-bg-secondary hover:border-white/20 hover:scale-105"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Viewport Controls */}
                <ViewportControls
                  showWireframe={showWireframe}
                  onToggleWireframe={() => setShowWireframe(!showWireframe)}
                  onResetCamera={() => {
                    /* Camera reset */
                  }}
                />

                {/* Undo/Redo Controls (armor mode only) */}
                {isArmorMode() && (
                  <UndoRedoControls
                    canUndo={canUndo()}
                    canRedo={canRedo()}
                    onUndo={undo}
                    onRedo={redo}
                  />
                )}

                {/* Fitting Progress */}
                {isFitting && (
                  <FittingProgress
                    progress={fittingProgress}
                    message={currentProgress()}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={Package}
                  title="No Preview Available"
                  description={`Select an avatar and ${isWeaponMode() ? "weapon" : "armor piece"} to begin fitting`}
                />
              </div>
            )}

            {/* Bottom-Right Utility Controls - Always visible */}
            <div className="absolute bottom-4 right-4 flex gap-2 z-30">
              {/* Assets button - always visible */}
              <button
                onClick={() => setShowAssetDrawer(!showAssetDrawer)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  showAssetDrawer
                    ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
                    : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
                } hover:scale-105 active:scale-95`}
                title="Toggle Assets Panel"
                aria-label="Toggle Assets Panel"
              >
                <Menu size={16} />
              </button>

              {/* Controls button - only show when content is selected */}
              {(selectedAvatar || selectedEquipment) && (
                <button
                  onClick={() => setShowControlsDrawer(!showControlsDrawer)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    showControlsDrawer
                      ? "bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50"
                      : "bg-bg-secondary bg-opacity-90 text-text-secondary hover:text-text-primary border border-transparent"
                  } hover:scale-105 active:scale-95`}
                  title="Toggle Controls Panel"
                  aria-label="Toggle Controls Panel"
                >
                  <Settings size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assets Side Panel - Always available to select assets */}
      <ThreeDPanel
        isOpen={showAssetDrawer}
        onClose={() => setShowAssetDrawer(false)}
        title="Asset Selection"
        side="left"
      >
        <ArmorAssetList
          assets={assets}
          loading={loading}
          assetType={assetTypeFilter}
          selectedAsset={selectedEquipment}
          selectedAvatar={selectedAvatar}
          selectedArmor={selectedArmor}
          selectedHelmet={selectedHelmet}
          selectedWeapon={selectedWeapon}
          onAssetSelect={handleAssetSelect}
          onAssetTypeChange={setAssetTypeFilter}
          hideTypeToggle={true}
          equipmentSlot={
            equipmentSlot as "Head" | "Spine2" | "Pelvis" | "Hand_R" | "Hand_L"
          }
        />
      </ThreeDPanel>

      {/* Controls Side Panel */}
      {(selectedAvatar || selectedEquipment) && (
        <ThreeDPanel
          isOpen={showControlsDrawer}
          onClose={() => setShowControlsDrawer(false)}
          title="Equipment Fitting Controls"
          side="right"
        >
          <div className="space-y-4">
            {/* Equipment Slot Selector */}
            <CollapsibleSection
              title="Equipment Slot"
              defaultOpen={true}
              icon={Package}
            >
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_SLOTS.filter(
                  (slot) =>
                    slot.id === "Head" ||
                    slot.id === "Spine2" ||
                    slot.id === "Hips" ||
                    slot.id === "Hand_R" ||
                    slot.id === "Hand_L",
                ).map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setEquipmentSlot(slot.id, armorViewerRef)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                      equipmentSlot === slot.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
                    )}
                    title={slot.description}
                  >
                    <slot.icon className="w-4 h-4" />
                    <span className="truncate">{slot.name}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* Tab Selector */}
            <div className="pb-4 border-b border-border-primary">
              <TabSelector activeTab={currentTab} onTabChange={setCurrentTab} />
            </div>

            {/* Scrollable Controls */}
            <div className="space-y-4">
              {isWeaponMode() ? (
                <WeaponFittingPanel
                  currentTab={currentTab}
                  equipmentSlot={equipmentSlot}
                  selectedWeapon={selectedWeapon}
                  handleDetectionResult={handleDetectionResult}
                  isDetectingHandle={isDetectingHandle}
                  avatarHeight={avatarHeight}
                  creatureCategory={creatureCategory}
                  autoScaleWeapon={autoScaleWeapon}
                  weaponScaleOverride={weaponScaleOverride}
                  manualPosition={manualPosition}
                  manualRotation={manualRotation}
                  showSkeleton={showSkeleton}
                  currentAnimation={currentAnimation}
                  isAnimationPlaying={isAnimationPlaying}
                  isExporting={isExporting}
                  onDetectGripPoint={() =>
                    selectedWeapon && detectGripPoint(selectedWeapon)
                  }
                  onAvatarHeightChange={setAvatarHeight}
                  onCreatureCategoryChange={setCreatureCategory}
                  onAutoScaleWeaponChange={setAutoScaleWeapon}
                  onWeaponScaleOverrideChange={setWeaponScaleOverride}
                  onManualPositionChange={setManualPosition}
                  onManualRotationChange={setManualRotation}
                  onShowSkeletonChange={setShowSkeleton}
                  onResetAdjustments={resetWeaponAdjustments}
                  onCurrentAnimationChange={setCurrentAnimation}
                  onToggleAnimation={toggleAnimation}
                  onExportEquipped={async () => {
                    if (weaponViewerRef.current) {
                      try {
                        const arrayBuffer =
                          await weaponViewerRef.current.exportEquippedModel();
                        const blob = new Blob([arrayBuffer], {
                          type: "model/gltf-binary",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `equipped_avatar_${Date.now()}.glb`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Export failed:", error);
                      }
                    }
                  }}
                  onSaveConfiguration={saveConfiguration}
                />
              ) : (
                <ArmorFittingPanel
                  currentTab={currentTab}
                  equipmentSlot={equipmentSlot}
                  fittingConfig={fittingConfig}
                  enableWeightTransfer={enableWeightTransfer}
                  visualizationMode={visualizationMode}
                  showWireframe={showWireframe}
                  isFitting={isFitting}
                  canFit={isReadyToFit()}
                  isArmorFitted={isArmorFitted}
                  isArmorBound={isArmorBound}
                  isExporting={isExporting}
                  hasHelmet={!!selectedHelmet}
                  helmetFittingMethod={helmetFittingMethod}
                  helmetSizeMultiplier={helmetSizeMultiplier}
                  helmetVerticalOffset={helmetVerticalOffset}
                  helmetForwardOffset={helmetForwardOffset}
                  helmetRotation={helmetRotation}
                  isHelmetFitted={isHelmetFitted}
                  isHelmetAttached={isHelmetAttached}
                  currentAnimation={currentAnimation}
                  isAnimationPlaying={isAnimationPlaying}
                  onFittingConfigChange={updateFittingConfig}
                  onEnableWeightTransferChange={setEnableWeightTransfer}
                  onVisualizationModeChange={setVisualizationMode}
                  onShowWireframeChange={setShowWireframe}
                  onPerformFitting={() => performFitting(armorViewerRef)}
                  onBindArmorToSkeleton={() =>
                    bindArmorToSkeleton(armorViewerRef)
                  }
                  onExportArmor={() => exportEquippedAvatar(armorViewerRef)}
                  onSaveConfiguration={saveConfiguration}
                  onHelmetFittingMethodChange={setHelmetFittingMethod}
                  onHelmetSizeMultiplierChange={setHelmetSizeMultiplier}
                  onHelmetVerticalOffsetChange={setHelmetVerticalOffset}
                  onHelmetForwardOffsetChange={setHelmetForwardOffset}
                  onHelmetRotationChange={updateHelmetRotation}
                  onPerformHelmetFitting={() =>
                    performHelmetFitting(armorViewerRef)
                  }
                  onAttachHelmetToHead={() =>
                    attachHelmetToHead(armorViewerRef)
                  }
                  onCurrentAnimationChange={setCurrentAnimation}
                  onToggleAnimation={toggleAnimation}
                  viewerRef={armorViewerRef}
                />
              )}
            </div>
          </div>
        </ThreeDPanel>
      )}
    </>
  );
};

export default UnifiedEquipmentPage;
