import { Eye, Target, Info, ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState } from 'react'

import type { HandleDetectionResult } from '@/services/processing/WeaponHandleDetector'
import { cn } from '@/styles'
import { Badge } from '@/components/common'

interface WeaponDetectionVisualizerProps {
  detectionResult: HandleDetectionResult | null
  isDetecting?: boolean
}

const weaponTypeIcons: Record<string, string> = {
  sword: '⚔️',
  axe: '🪓',
  mace: '🔨',
  staff: '🪄',
  bow: '🏹',
  dagger: '🗡️',
  spear: '🔱',
}

export const WeaponDetectionVisualizer: React.FC<WeaponDetectionVisualizerProps> = ({
  detectionResult,
  isDetecting = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFullImage, setShowFullImage] = useState(false)

  if (!detectionResult && !isDetecting) {
    return null
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (confidence >= 0.6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    return 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  const getWeaponIcon = (type: string): string => {
    return weaponTypeIcons[type.toLowerCase()] || '⚔️'
  }

  if (isDetecting) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4" />
            Grip Detection
          </h3>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Analyzing weapon...</p>
              <p className="text-xs text-text-secondary">Using GPT-4 Vision</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!detectionResult) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4 text-green-400" />
          Grip Detected
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <>
          {/* Weapon Type & Confidence */}
          <div className="flex items-center gap-2">
            {detectionResult.redBoxBounds && (
              <>
                <Badge variant="primary" className="bg-primary/20 text-primary border-primary/30">
                  <span className="mr-1">{getWeaponIcon('sword')}</span>
                  Weapon
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    'font-mono text-xs',
                    getConfidenceColor(detectionResult.confidence),
                  )}
                >
                  {(detectionResult.confidence * 100).toFixed(0)}%
                </Badge>
              </>
            )}
          </div>

          {/* Annotated Image Preview */}
          {detectionResult.annotatedImage && (
            <div className="relative group">
              <button
                onClick={() => setShowFullImage(!showFullImage)}
                className="w-full rounded-lg overflow-hidden border border-border-primary hover:border-primary/50 transition-colors relative"
                title="Click to enlarge"
              >
                <img
                  src={detectionResult.annotatedImage}
                  alt="Detected grip area"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/90 text-white text-xs font-medium rounded">
                Grip Region
              </div>
            </div>
          )}

          {/* Grip Bounds Coordinates */}
          {detectionResult.redBoxBounds && (
            <div className="p-2 rounded bg-bg-tertiary border border-border-primary">
              <div className="flex items-start gap-2 mb-1">
                <Info className="w-3 h-3 text-text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-secondary">
                  Grip detected at pixel coordinates:
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono text-text-secondary pl-5">
                <div>X: {detectionResult.redBoxBounds.minX}→{detectionResult.redBoxBounds.maxX}</div>
                <div>Y: {detectionResult.redBoxBounds.minY}→{detectionResult.redBoxBounds.maxY}</div>
              </div>
            </div>
          )}

          {/* 3D Grip Point */}
          <div className="p-2 rounded bg-bg-tertiary border border-border-primary">
            <div className="flex items-start gap-2">
              <Target className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-text-primary mb-1">3D Grip Center:</p>
                <div className="text-xs font-mono text-text-secondary">
                  ({detectionResult.gripPoint.x.toFixed(3)}, {detectionResult.gripPoint.y.toFixed(3)}, {detectionResult.gripPoint.z.toFixed(3)})
                </div>
              </div>
            </div>
          </div>

          {/* Full Image Modal */}
          {showFullImage && detectionResult.annotatedImage && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowFullImage(false)}
            >
              <div className="max-w-2xl max-h-[90vh] relative">
                <img
                  src={detectionResult.annotatedImage}
                  alt="Detected grip area (full)"
                  className="w-full h-auto rounded-lg"
                />
                <button
                  onClick={() => setShowFullImage(false)}
                  className="absolute top-2 right-2 px-3 py-1 bg-black/80 text-white text-sm rounded hover:bg-black/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
