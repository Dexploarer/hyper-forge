/**
 * Skeleton Loader Component
 * Provides visual placeholders while content is loading
 * Uses shimmer animation for better perceived performance
 */

import React from 'react'
import { cn } from '@/styles'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'wave'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
  className,
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : '20px'),
    ...style,
  }

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    wave: 'skeleton-wave',
  }

  return (
    <div
      className={cn(
        'skeleton',
        variantClasses[variant],
        animationClasses[animation],
        'bg-[var(--bg-tertiary)]',
        className
      )}
      style={baseStyles}
      aria-label="Loading content"
      aria-live="polite"
      {...props}
    />
  )
}

interface SkeletonGroupProps {
  children: React.ReactNode
  className?: string
  count?: number
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  className,
  count = 1,
}) => {
  return (
    <div className={cn('skeleton-group flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{children}</React.Fragment>
      ))}
    </div>
  )
}

// Pre-built skeleton components for common patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('card p-4 space-y-3', className)}>
    <Skeleton variant="rectangular" height="24px" width="60%" />
    <Skeleton variant="rectangular" height="16px" width="100%" />
    <Skeleton variant="rectangular" height="16px" width="80%" />
  </div>
)

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height="16px" width="60%" />
          <Skeleton variant="text" height="12px" width="40%" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {/* Header */}
    <div className="flex gap-4 pb-2 border-b border-[var(--border-primary)]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" height="16px" width="100%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex gap-4 py-2">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton key={colIdx} variant="text" height="14px" width="100%" />
        ))}
      </div>
    ))}
  </div>
)

