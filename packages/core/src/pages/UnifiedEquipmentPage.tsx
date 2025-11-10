import { Package, RotateCcw, Settings, Menu } from 'lucide-react'
import React, { useRef, useState } from 'react'

import { useEquipmentFittingStore } from '../store/useEquipmentFittingStore'
import { cn } from '../styles'

import {
  ArmorFittingViewer,
  ArmorFittingViewerRef,
  ArmorAssetList,
  ViewportControls,
  UndoRedoControls,
  FittingProgress,
} from '@/components/ArmorFitting'
import { ErrorNotification, EmptyState, Drawer, CollapsibleSection } from '@/components/common'
import {
  TabSelector,
  ArmorFittingPanel,
  WeaponFittingPanel,
} from '@/components/Equipment'
import { EQUIPMENT_SLOTS } from '@/constants/equipment'
import { useAssets } from '@/hooks'

export const UnifiedEquipmentPage: React.FC = () => {
  const { assets, loading } = useAssets()
  const viewerRef = useRef<ArmorFittingViewerRef>(null)
  const [showControlsDrawer, setShowControlsDrawer] = useState(false)
  const [showAssetDrawer, setShowAssetDrawer] = useState(false)

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
  } = useEquipmentFittingStore()

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }
      // Redo: Ctrl+Shift+Z, Cmd+Shift+Z, or Ctrl+Y
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        if (canRedo()) redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo])

  // Determine which equipment is selected
  const selectedEquipment = isWeaponMode()
    ? selectedWeapon
    : equipmentSlot === 'Head'
      ? selectedHelmet
      : selectedArmor

  return (
    <>
      <div className="page-container">
        {/* Error Toast */}
        {lastError && (
          <ErrorNotification error={lastError} onClose={clearError} />
        )}

        {/* Top Bar with Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssetDrawer(true)}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <Menu className="w-4 h-4" />
              <span>Assets</span>
            </button>
            <button
              onClick={() => setShowControlsDrawer(true)}
              className="px-4 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Controls</span>
            </button>
          </div>
        </div>

      {/* Center - 3D Viewport - FIXED */}
      <div className="flex-1 flex flex-col">
              <div className="overflow-hidden flex-1 relative bg-gradient-to-br from-bg-primary to-bg-secondary rounded-xl flex items-center justify-center">
                {selectedAvatar || selectedEquipment ? (
                  <>
                    <ArmorFittingViewer
                      ref={viewerRef}
                      avatarUrl={selectedAvatar?.hasModel ? `/api/assets/${selectedAvatar.id}/model` : undefined}
                      armorUrl={selectedArmor?.hasModel ? `/api/assets/${selectedArmor.id}/model` : undefined}
                      helmetUrl={selectedHelmet?.hasModel ? `/api/assets/${selectedHelmet.id}/model` : undefined}
                      weaponUrl={selectedWeapon?.hasModel ? `/api/assets/${selectedWeapon.id}/model` : undefined}
                      showWireframe={showWireframe}
                      equipmentSlot={equipmentSlot as 'Head' | 'Spine2' | 'Pelvis' | 'Hand_R' | 'Hand_L'}
                      selectedAvatar={selectedAvatar}
                      currentAnimation={currentAnimation}
                      isAnimationPlaying={isAnimationPlaying}
                      visualizationMode={visualizationMode === 'hull' ? 'none' : visualizationMode}
                      selectedBone={0}
                      onModelsLoaded={() => console.log('Models loaded')}
                      onBodyRegionsDetected={() => {}}
                      onCollisionsDetected={() => {}}
                    />

                    {/* Reset Button */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-10 max-w-[90%]">
                      <button
                        onClick={() => resetScene(viewerRef)}
                        className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 bg-bg-primary/80 backdrop-blur-sm border border-white/10 text-text-primary hover:bg-bg-secondary hover:border-white/20 hover:scale-105"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Viewport Controls */}
                    <ViewportControls
                      showWireframe={showWireframe}
                      onToggleWireframe={() => setShowWireframe(!showWireframe)}
                      onResetCamera={() => {/* Camera reset */}}
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
                      description={`Select an avatar and ${isWeaponMode() ? 'weapon' : 'armor piece'} to begin fitting`}
                    />
                  </div>
                )}
              </div>
      </div>
      </div>

      {/* Asset Selection Drawer */}
      <Drawer
        open={showAssetDrawer}
        onClose={() => setShowAssetDrawer(false)}
        side="left"
        size="lg"
        title="Asset Selection"
      >
        <div className="p-6">
          <ArmorAssetList
            assets={assets}
            loading={loading}
            assetType={assetTypeFilter}
            selectedAsset={selectedEquipment}
            selectedAvatar={selectedAvatar}
            selectedArmor={selectedArmor}
            selectedHelmet={selectedHelmet}
            selectedWeapon={selectedWeapon}
            onAssetSelect={(asset) => {
              handleAssetSelect(asset)
              setShowAssetDrawer(false)
            }}
            onAssetTypeChange={setAssetTypeFilter}
            hideTypeToggle={true}
            equipmentSlot={equipmentSlot as 'Head' | 'Spine2' | 'Pelvis' | 'Hand_R' | 'Hand_L'}
          />
        </div>
      </Drawer>

      {/* Controls Drawer */}
      <Drawer
        open={showControlsDrawer}
        onClose={() => setShowControlsDrawer(false)}
        side="right"
        size="lg"
        title="Equipment Fitting Controls"
      >
        <div className="p-6 space-y-4">
          {/* Equipment Slot Selector */}
          <CollapsibleSection
            title="Equipment Slot"
            defaultOpen={true}
            icon={Package}
          >
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_SLOTS.filter(slot =>
                slot.id === 'Head' || slot.id === 'Spine2' || slot.id === 'Hips' || slot.id === 'Hand_R' || slot.id === 'Hand_L'
              ).map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setEquipmentSlot(slot.id, viewerRef)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                    equipmentSlot === slot.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
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
            <TabSelector
              activeTab={currentTab}
              onTabChange={setCurrentTab}
            />
          </div>

          {/* Scrollable Controls */}
          <div className="space-y-4">
            {isWeaponMode() ? (
              // Weapon Fitting Panel
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
                onDetectGripPoint={() => selectedWeapon && detectGripPoint(selectedWeapon)}
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
                onExportEquipped={() => exportEquippedAvatar(viewerRef)}
                onSaveConfiguration={saveConfiguration}
              />
            ) : (
              // Armor Fitting Panel
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
                onPerformFitting={() => performFitting(viewerRef)}
                onBindArmorToSkeleton={() => bindArmorToSkeleton(viewerRef)}
                onExportArmor={() => exportEquippedAvatar(viewerRef)}
                onSaveConfiguration={saveConfiguration}
                onHelmetFittingMethodChange={setHelmetFittingMethod}
                onHelmetSizeMultiplierChange={setHelmetSizeMultiplier}
                onHelmetVerticalOffsetChange={setHelmetVerticalOffset}
                onHelmetForwardOffsetChange={setHelmetForwardOffset}
                onHelmetRotationChange={updateHelmetRotation}
                onPerformHelmetFitting={() => performHelmetFitting(viewerRef)}
                onAttachHelmetToHead={() => attachHelmetToHead(viewerRef)}
                onCurrentAnimationChange={setCurrentAnimation}
                onToggleAnimation={toggleAnimation}
                viewerRef={viewerRef}
              />
            )}
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default UnifiedEquipmentPage
