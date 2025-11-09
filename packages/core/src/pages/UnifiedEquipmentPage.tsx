import { Package, RotateCcw } from 'lucide-react'
import React, { useRef } from 'react'

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
import { ErrorNotification, EmptyState } from '@/components/common'
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
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Error Toast */}
          {lastError && (
            <ErrorNotification error={lastError} onClose={clearError} />
          )}

          {/* Left Panel - Asset Selection */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden flex flex-col bg-gradient-to-br from-bg-secondary to-bg-tertiary p-6 border-r border-border-primary">
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
                equipmentSlot={equipmentSlot as 'Head' | 'Spine2' | 'Pelvis' | 'Hand_R' | 'Hand_L'}
              />
            </div>
          </div>

          {/* Center - 3D Viewport */}
          <div className="lg:col-span-6">
            <div className="flex flex-col h-[600px] lg:h-[700px] p-6">
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

          {/* Right Panel - Fitting Controls */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden flex flex-col bg-gradient-to-br from-bg-secondary to-bg-tertiary border-l border-border-primary">
              {/* Header with Equipment Slot Selector */}
              <div className="p-6 border-b border-border-primary bg-bg-primary bg-opacity-30 space-y-3">
                <h2 className="text-lg font-semibold text-text-primary">Equipment Fitting</h2>

                {/* Equipment Slot Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Equipment Slot</label>
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
                </div>

                {/* Tab Selector */}
                <TabSelector
                  activeTab={currentTab}
                  onTabChange={setCurrentTab}
                />
              </div>

              {/* Scrollable Controls */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
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
          </div>

        </div>
      </div>
    </div>
  )
}

export default UnifiedEquipmentPage
