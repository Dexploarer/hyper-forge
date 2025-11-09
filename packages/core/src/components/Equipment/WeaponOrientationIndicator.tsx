import { RotateCw, CheckCircle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import React from 'react'

import { cn } from '@/styles'

interface WeaponOrientationIndicatorProps {
  orientationFlipped?: boolean
  onRedetect?: () => void
  isDetecting?: boolean
}

export const WeaponOrientationIndicator: React.FC<WeaponOrientationIndicatorProps> = ({
  orientationFlipped,
  onRedetect,
  isDetecting = false,
}) => {
  if (orientationFlipped === undefined) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div
        className={cn(
          'p-3 rounded-lg border flex items-start gap-3',
          orientationFlipped
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-green-500/10 border-green-500/30',
        )}
      >
        <div className="flex-shrink-0">
          {orientationFlipped ? (
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium mb-1',
              orientationFlipped ? 'text-yellow-400' : 'text-green-400',
            )}
          >
            {orientationFlipped ? 'Orientation Corrected' : 'Correctly Oriented'}
          </p>
          <p className="text-xs text-text-secondary">
            {orientationFlipped
              ? 'Weapon was automatically rotated 180° to place handle at bottom'
              : 'Weapon blade is pointing up, handle at bottom'}
          </p>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="flex items-center gap-4 p-2 rounded bg-bg-tertiary border border-border-primary">
        <div className="flex flex-col items-center gap-1">
          <ArrowUp className="w-4 h-4 text-primary" />
          <span className="text-xs text-text-secondary">Blade</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
        <div className="text-xl">⚔️</div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary">Handle</span>
          <ArrowDown className="w-4 h-4 text-text-secondary" />
        </div>
      </div>

      {/* Re-detect Button */}
      {onRedetect && (
        <button
          onClick={onRedetect}
          disabled={isDetecting}
          className={cn(
            'w-full px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2 text-sm',
            'bg-bg-secondary text-text-primary hover:bg-bg-tertiary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isDetecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Re-detecting...</span>
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" />
              <span>Re-check Orientation</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
