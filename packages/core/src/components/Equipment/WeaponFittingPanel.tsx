import {
  Target, Download, Save, Eye, Move, RotateCw, Sliders,
  Play, Pause, CheckCircle, RefreshCw
} from 'lucide-react'
import React from 'react'

import { Asset } from '@/types'
import type { HandleDetectionResult } from '@/services/processing/WeaponHandleDetector'
import { cn } from '@/styles'

interface WeaponFittingPanelProps {
  // Mode
  currentTab: 'quick' | 'advanced'
  equipmentSlot: string

  // Selected items
  selectedWeapon: Asset | null

  // Grip detection
  handleDetectionResult: HandleDetectionResult | null
  isDetectingHandle: boolean

  // Creature sizing
  avatarHeight: number
  creatureCategory: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'colossal'
  autoScaleWeapon: boolean
  weaponScaleOverride: number

  // Manual adjustments
  manualPosition: { x: number; y: number; z: number }
  manualRotation: { x: number; y: number; z: number }

  // Visualization
  showSkeleton: boolean

  // Animation
  currentAnimation: 'tpose' | 'walking' | 'running'
  isAnimationPlaying: boolean

  // Export state
  isExporting: boolean

  // Actions
  onDetectGripPoint: () => void
  onAvatarHeightChange: (height: number) => void
  onCreatureCategoryChange: (category: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'colossal') => void
  onAutoScaleWeaponChange: (enabled: boolean) => void
  onWeaponScaleOverrideChange: (scale: number) => void
  onManualPositionChange: (position: { x: number; y: number; z: number }) => void
  onManualRotationChange: (rotation: { x: number; y: number; z: number }) => void
  onShowSkeletonChange: (show: boolean) => void
  onResetAdjustments: () => void
  onCurrentAnimationChange: (animation: 'tpose' | 'walking' | 'running') => void
  onToggleAnimation: () => void
  onExportEquipped: () => void
  onSaveConfiguration: () => void
}

const RangeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      type="range"
      className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
      {...props}
    />
  )
}

export const WeaponFittingPanel: React.FC<WeaponFittingPanelProps> = ({
  currentTab,
  selectedWeapon,
  handleDetectionResult,
  isDetectingHandle,
  avatarHeight,
  creatureCategory,
  autoScaleWeapon,
  weaponScaleOverride,
  manualPosition,
  manualRotation,
  showSkeleton,
  currentAnimation,
  isAnimationPlaying,
  isExporting,
  onDetectGripPoint,
  onAvatarHeightChange,
  onCreatureCategoryChange,
  onAutoScaleWeaponChange,
  onWeaponScaleOverrideChange,
  onManualPositionChange,
  onManualRotationChange,
  onShowSkeletonChange,
  onResetAdjustments,
  onCurrentAnimationChange,
  onToggleAnimation,
  onExportEquipped,
  onSaveConfiguration,
}) => {
  const creatureSizes = [
    { id: 'tiny', name: 'Tiny', height: 0.6 },
    { id: 'small', name: 'Small', height: 1.2 },
    { id: 'medium', name: 'Medium', height: 1.83 },
    { id: 'large', name: 'Large', height: 2.5 },
    { id: 'huge', name: 'Huge', height: 4.0 },
    { id: 'colossal', name: 'Colossal', height: 6.0 },
  ] as const

  // Quick Fit Mode - Simple, one-click operations
  if (currentTab === 'quick') {
    return (
      <div className="space-y-4">
        {/* Detect Grip Point Button */}
        <div className="space-y-3">
          <button
            onClick={onDetectGripPoint}
            disabled={!selectedWeapon || isDetectingHandle}
            className={cn(
              "w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
              selectedWeapon && !isDetectingHandle
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-md"
                : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50"
            )}
          >
            {isDetectingHandle ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Detect Grip Point</span>
                {handleDetectionResult && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </>
            )}
          </button>

          {handleDetectionResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-green-400 font-medium">
                ✓ Grip detected with {(handleDetectionResult.confidence * 100).toFixed(0)}% confidence
              </p>
            </div>
          )}
        </div>

        {/* Creature Size Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Creature Size</label>
          <div className="grid grid-cols-3 gap-2">
            {creatureSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => onCreatureCategoryChange(size.id as any)}
                className={cn(
                  "px-2 py-2 text-xs rounded-md transition-colors font-medium",
                  creatureCategory === size.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-secondary">
            Height: {avatarHeight.toFixed(2)}m
          </p>
        </div>

        {/* Auto-Scale Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary border border-border-primary">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Auto-Scale Weapon</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoScaleWeapon}
              onChange={(e) => onAutoScaleWeaponChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Animation Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Animation</label>
          <div className="flex gap-2">
            {(['tpose', 'walking', 'running'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onCurrentAnimationChange(type)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium",
                  currentAnimation === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                {type === 'tpose' ? 'T-Pose' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onToggleAnimation}
            className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
          >
            {isAnimationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAnimationPlaying ? 'Stop' : 'Play'}</span>
          </button>
        </div>

        {/* Export */}
        <button
          onClick={onExportEquipped}
          disabled={!selectedWeapon}
          className={cn(
            "w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            "bg-bg-secondary border border-white/10 text-text-primary",
            "hover:bg-bg-secondary/70 hover:border-white/20",
            !selectedWeapon && "opacity-50 cursor-not-allowed"
          )}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Equipped Avatar</span>
            </>
          )}
        </button>
      </div>
    )
  }

  // Advanced Mode - Full control
  return (
    <div className="space-y-4">
      {/* Grip Detection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4" />
          Grip Detection
        </h3>
        <button
          onClick={onDetectGripPoint}
          disabled={!selectedWeapon || isDetectingHandle}
          className={cn(
            "w-full px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2",
            selectedWeapon && !isDetectingHandle
              ? "bg-bg-secondary text-text-primary hover:bg-bg-tertiary"
              : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50"
          )}
        >
          {isDetectingHandle ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Detect Grip Point</span>
              {handleDetectionResult && (
                <CheckCircle className="w-3 h-3 text-green-400 ml-auto" />
              )}
            </>
          )}
        </button>

        {handleDetectionResult && (
          <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
            <p className="text-xs text-green-400">
              Confidence: {(handleDetectionResult.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {/* Creature Sizing */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Creature Size
        </h3>

        <div className="grid grid-cols-3 gap-1">
          {creatureSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => onCreatureCategoryChange(size.id as any)}
              className={cn(
                "px-2 py-1.5 text-xs rounded-md transition-colors",
                creatureCategory === size.id
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {size.name}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-text-secondary">Custom Height</label>
            <span className="text-xs text-text-secondary">{avatarHeight.toFixed(2)}m</span>
          </div>
          <RangeInput
            min="0.3"
            max="8"
            step="0.1"
            value={avatarHeight}
            onChange={(e) => onAvatarHeightChange(parseFloat(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-between p-2 rounded bg-bg-tertiary">
          <span className="text-xs text-text-secondary">Auto-Scale</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoScaleWeapon}
              onChange={(e) => onAutoScaleWeaponChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {!autoScaleWeapon && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-secondary">Manual Scale</label>
              <span className="text-xs text-text-secondary">{weaponScaleOverride.toFixed(2)}x</span>
            </div>
            <RangeInput
              min="0.1"
              max="3"
              step="0.1"
              value={weaponScaleOverride}
              onChange={(e) => onWeaponScaleOverrideChange(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Manual Position */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Move className="w-4 h-4" />
          Position Offset
        </h3>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-secondary uppercase">{axis}</label>
              <span className="text-xs text-text-secondary">{manualPosition[axis].toFixed(3)}m</span>
            </div>
            <RangeInput
              min="-0.5"
              max="0.5"
              step="0.01"
              value={manualPosition[axis]}
              onChange={(e) => onManualPositionChange({
                ...manualPosition,
                [axis]: parseFloat(e.target.value)
              })}
            />
          </div>
        ))}
      </div>

      {/* Manual Rotation */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <RotateCw className="w-4 h-4" />
          Rotation Offset
        </h3>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-secondary uppercase">{axis}</label>
              <span className="text-xs text-text-secondary">{manualRotation[axis].toFixed(0)}°</span>
            </div>
            <RangeInput
              min="-180"
              max="180"
              step="5"
              value={manualRotation[axis]}
              onChange={(e) => onManualRotationChange({
                ...manualRotation,
                [axis]: parseFloat(e.target.value)
              })}
            />
          </div>
        ))}
      </div>

      {/* Animation Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Play className="w-4 h-4" />
          Animation
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['tpose', 'walking', 'running'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onCurrentAnimationChange(type)}
              className={cn(
                "px-2 py-2 text-xs rounded-md transition-colors font-medium",
                currentAnimation === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {type === 'tpose' ? 'T-Pose' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleAnimation}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          {isAnimationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isAnimationPlaying ? 'Stop Animation' : 'Play Animation'}</span>
        </button>
      </div>

      {/* Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Visualization
        </h3>
        <button
          onClick={() => onShowSkeletonChange(!showSkeleton)}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>{showSkeleton ? 'Hide' : 'Show'} Skeleton</span>
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Actions
        </h3>

        <button
          onClick={onResetAdjustments}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset All</span>
        </button>

        <button
          onClick={onSaveConfiguration}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>

        <button
          onClick={onExportEquipped}
          disabled={!selectedWeapon}
          className={cn(
            "w-full px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2",
            selectedWeapon
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50"
          )}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Equipped Avatar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
