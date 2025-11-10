import {
  Target,
  Download,
  Save,
  Eye,
  EyeOff,
  Link,
  Play,
  Pause,
  Layers,
  Activity,
  RefreshCw,
} from "lucide-react";
import React from "react";

import { ArmorFittingViewerRef } from "../armor-fitting/ArmorFittingViewer";

import { FittingConfig } from "@/services/fitting/ArmorFittingService";
import { cn } from "@/styles";

interface ArmorFittingPanelProps {
  // Mode
  currentTab: "quick" | "advanced";
  equipmentSlot: string;

  // State
  fittingConfig: FittingConfig;
  enableWeightTransfer: boolean;
  visualizationMode: "none" | "regions" | "collisions" | "weights" | "hull";
  showWireframe: boolean;
  isFitting: boolean;
  canFit: boolean;
  isArmorFitted: boolean;
  isArmorBound: boolean;
  isExporting: boolean;

  // Helmet state (when equipmentSlot === 'Head')
  hasHelmet?: boolean;
  helmetFittingMethod?: "auto" | "manual";
  helmetSizeMultiplier?: number;
  helmetVerticalOffset?: number;
  helmetForwardOffset?: number;
  helmetRotation?: { x: number; y: number; z: number };
  isHelmetFitted?: boolean;
  isHelmetAttached?: boolean;

  // Animation
  currentAnimation: "tpose" | "walking" | "running";
  isAnimationPlaying: boolean;

  // Actions
  onFittingConfigChange: (updates: Partial<FittingConfig>) => void;
  onEnableWeightTransferChange: (enabled: boolean) => void;
  onVisualizationModeChange: (
    mode: "none" | "regions" | "collisions" | "weights" | "hull",
  ) => void;
  onShowWireframeChange: (show: boolean) => void;
  onPerformFitting: () => void;
  onBindArmorToSkeleton?: () => void;
  onExportArmor: () => void;
  onSaveConfiguration: () => void;

  // Helmet actions
  onHelmetFittingMethodChange?: (method: "auto" | "manual") => void;
  onHelmetSizeMultiplierChange?: (value: number) => void;
  onHelmetVerticalOffsetChange?: (value: number) => void;
  onHelmetForwardOffsetChange?: (value: number) => void;
  onHelmetRotationChange?: (axis: "x" | "y" | "z", value: number) => void;
  onPerformHelmetFitting?: () => void;
  onAttachHelmetToHead?: () => void;

  // Animation actions
  onCurrentAnimationChange: (
    animation: "tpose" | "walking" | "running",
  ) => void;
  onToggleAnimation: () => void;

  // Viewer ref (optional, for future use)
  viewerRef?: React.RefObject<ArmorFittingViewerRef | null>;
}

const RangeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props,
) => {
  return (
    <input
      type="range"
      className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
      {...props}
    />
  );
};

export const ArmorFittingPanel: React.FC<ArmorFittingPanelProps> = ({
  currentTab,
  equipmentSlot,
  fittingConfig,
  enableWeightTransfer,
  visualizationMode,
  showWireframe,
  isFitting,
  canFit,
  isArmorFitted,
  isArmorBound,
  isExporting,
  hasHelmet,
  helmetFittingMethod = "auto",
  helmetSizeMultiplier = 1.0,
  helmetVerticalOffset = 0,
  helmetForwardOffset = 0,
  helmetRotation = { x: 0, y: 0, z: 0 },
  isHelmetFitted,
  isHelmetAttached,
  currentAnimation,
  isAnimationPlaying,
  onFittingConfigChange,
  onEnableWeightTransferChange,
  onVisualizationModeChange,
  onShowWireframeChange,
  onPerformFitting,
  onBindArmorToSkeleton,
  onExportArmor,
  onSaveConfiguration,
  onHelmetFittingMethodChange,
  onHelmetSizeMultiplierChange,
  onHelmetVerticalOffsetChange,
  onHelmetForwardOffsetChange,
  onHelmetRotationChange,
  onPerformHelmetFitting,
  onAttachHelmetToHead,
  onCurrentAnimationChange,
  onToggleAnimation,
}) => {
  const isHelmetMode = equipmentSlot === "Head";

  // Quick Fit Mode - Simple, one-click operations
  if (currentTab === "quick") {
    return (
      <div className="space-y-4">
        {/* Auto-Fit Button */}
        <div className="space-y-3">
          <button
            onClick={isHelmetMode ? onPerformHelmetFitting : onPerformFitting}
            disabled={!canFit || isFitting}
            className={cn(
              "w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
              canFit && !isFitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-md"
                : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50",
            )}
          >
            {isFitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                <span>Fitting...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>
                  {isHelmetMode ? "Auto-Fit Helmet" : "Auto-Fit Armor"}
                </span>
              </>
            )}
          </button>

          {/* Weight Transfer Toggle (Armor only) */}
          {!isHelmetMode && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary border border-border-primary">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">
                  Weight Transfer
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableWeightTransfer}
                  onChange={(e) =>
                    onEnableWeightTransferChange(e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}

          {/* Bind to Skeleton Button (after fitting) */}
          {!isHelmetMode &&
            isArmorFitted &&
            !isArmorBound &&
            onBindArmorToSkeleton && (
              <button
                onClick={onBindArmorToSkeleton}
                className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-bg-secondary border border-primary/50 text-primary hover:bg-primary/10"
              >
                <Link className="w-4 h-4" />
                <span>Bind to Skeleton</span>
              </button>
            )}

          {/* Attach Helmet Button (after fitting) */}
          {isHelmetMode &&
            isHelmetFitted &&
            !isHelmetAttached &&
            onAttachHelmetToHead && (
              <button
                onClick={onAttachHelmetToHead}
                className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-bg-secondary border border-primary/50 text-primary hover:bg-primary/10"
              >
                <Link className="w-4 h-4" />
                <span>Attach to Head</span>
              </button>
            )}
        </div>

        {/* Visualization Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            Visualization
          </label>
          <select
            value={visualizationMode}
            onChange={(e) => onVisualizationModeChange(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="none">None</option>
            <option value="regions">Body Regions</option>
            <option value="collisions">Collisions</option>
            <option value="weights">Weights</option>
          </select>
        </div>

        {/* Animation Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            Animation
          </label>
          <div className="flex gap-2">
            {(["tpose", "walking", "running"] as const).map((type) => (
              <button
                key={type}
                onClick={() => onCurrentAnimationChange(type)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium",
                  currentAnimation === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
                )}
              >
                {type === "tpose"
                  ? "T-Pose"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onToggleAnimation}
            className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
          >
            {isAnimationPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isAnimationPlaying ? "Stop" : "Play"}</span>
          </button>
        </div>

        {/* Export */}
        <button
          onClick={onExportArmor}
          disabled={!isArmorFitted && !isHelmetFitted}
          className={cn(
            "w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            "bg-bg-secondary border border-white/10 text-text-primary",
            "hover:bg-bg-secondary/70 hover:border-white/20",
            !isArmorFitted &&
              !isHelmetFitted &&
              "opacity-50 cursor-not-allowed",
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
    );
  }

  // Advanced Mode - Full control
  return (
    <div className="space-y-4">
      {/* Fitting Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4" />
          Fitting Parameters
        </h3>

        {isHelmetMode ? (
          // Helmet-specific controls
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Size Multiplier
                </label>
                <span className="text-xs text-text-secondary">
                  {helmetSizeMultiplier.toFixed(2)}
                </span>
              </div>
              <RangeInput
                min="0.8"
                max="1.2"
                step="0.01"
                value={helmetSizeMultiplier}
                onChange={(e) =>
                  onHelmetSizeMultiplierChange?.(parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Vertical Offset
                </label>
                <span className="text-xs text-text-secondary">
                  {helmetVerticalOffset.toFixed(3)}m
                </span>
              </div>
              <RangeInput
                min="-0.2"
                max="0.2"
                step="0.01"
                value={helmetVerticalOffset}
                onChange={(e) =>
                  onHelmetVerticalOffsetChange?.(parseFloat(e.target.value))
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Forward Offset
                </label>
                <span className="text-xs text-text-secondary">
                  {helmetForwardOffset.toFixed(3)}m
                </span>
              </div>
              <RangeInput
                min="-0.2"
                max="0.2"
                step="0.01"
                value={helmetForwardOffset}
                onChange={(e) =>
                  onHelmetForwardOffsetChange?.(parseFloat(e.target.value))
                }
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">
                Rotation
              </label>
              {(["x", "y", "z"] as const).map((axis) => (
                <div key={axis}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary uppercase">
                      {axis}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {helmetRotation[axis].toFixed(0)}°
                    </span>
                  </div>
                  <RangeInput
                    min="-180"
                    max="180"
                    step="5"
                    value={helmetRotation[axis]}
                    onChange={(e) =>
                      onHelmetRotationChange?.(axis, parseFloat(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          // Armor-specific controls
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Iterations
                </label>
                <span className="text-xs text-text-secondary">
                  {fittingConfig.iterations}
                </span>
              </div>
              <RangeInput
                min="1"
                max="15"
                step="1"
                value={fittingConfig.iterations}
                onChange={(e) =>
                  onFittingConfigChange({
                    iterations: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Step Size
                </label>
                <span className="text-xs text-text-secondary">
                  {(fittingConfig.stepSize ?? 0.15).toFixed(2)}
                </span>
              </div>
              <RangeInput
                min="0.05"
                max="0.3"
                step="0.05"
                value={fittingConfig.stepSize ?? 0.15}
                onChange={(e) =>
                  onFittingConfigChange({
                    stepSize: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Target Offset
                </label>
                <span className="text-xs text-text-secondary">
                  {(fittingConfig.targetOffset ?? 0.05).toFixed(2)}
                </span>
              </div>
              <RangeInput
                min="0.01"
                max="0.15"
                step="0.01"
                value={fittingConfig.targetOffset ?? 0.05}
                onChange={(e) =>
                  onFittingConfigChange({
                    targetOffset: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </>
        )}

        {/* Fit Button */}
        <button
          onClick={isHelmetMode ? onPerformHelmetFitting : onPerformFitting}
          disabled={!canFit || isFitting}
          className={cn(
            "w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            canFit && !isFitting
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50",
          )}
        >
          {isFitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Fitting...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Perform Fitting</span>
            </>
          )}
        </button>
      </div>

      {/* Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Visualization
        </h3>
        <select
          value={visualizationMode}
          onChange={(e) => onVisualizationModeChange(e.target.value as any)}
          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary text-text-primary text-sm focus:border-primary focus:outline-none"
        >
          <option value="none">None</option>
          <option value="regions">Body Regions</option>
          <option value="collisions">Collisions</option>
          <option value="weights">Weights</option>
          <option value="hull">Hull</option>
        </select>

        <button
          onClick={() => onShowWireframeChange(!showWireframe)}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          {showWireframe ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span>{showWireframe ? "Hide" : "Show"} Wireframe</span>
        </button>
      </div>

      {/* Animation Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Animation
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(["tpose", "walking", "running"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onCurrentAnimationChange(type)}
              className={cn(
                "px-2 py-2 text-xs rounded-md transition-colors font-medium",
                currentAnimation === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
              )}
            >
              {type === "tpose"
                ? "T-Pose"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleAnimation}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          {isAnimationPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>
            {isAnimationPlaying ? "Stop Animation" : "Play Animation"}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Actions
        </h3>

        {!isHelmetMode &&
          isArmorFitted &&
          !isArmorBound &&
          onBindArmorToSkeleton && (
            <button
              onClick={onBindArmorToSkeleton}
              className="w-full px-3 py-2 rounded-md bg-bg-secondary border border-primary/50 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              <span>Bind to Skeleton</span>
            </button>
          )}

        {isHelmetMode &&
          isHelmetFitted &&
          !isHelmetAttached &&
          onAttachHelmetToHead && (
            <button
              onClick={onAttachHelmetToHead}
              className="w-full px-3 py-2 rounded-md bg-bg-secondary border border-primary/50 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              <span>Attach to Head</span>
            </button>
          )}

        <button
          onClick={onSaveConfiguration}
          className="w-full px-3 py-2 rounded-md bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>

        <button
          onClick={onExportArmor}
          disabled={!isArmorFitted && !isHelmetFitted}
          className={cn(
            "w-full px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2",
            isArmorFitted || isHelmetFitted
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-bg-secondary text-text-secondary cursor-not-allowed opacity-50",
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
  );
};
