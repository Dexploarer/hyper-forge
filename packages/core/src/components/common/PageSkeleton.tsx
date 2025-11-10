/**
 * Page Skeleton Loader
 * Shows while lazy-loaded routes are loading
 */

import React from 'react'
import { SkeletonLoader } from './SkeletonLoader'

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonLoader className="h-8 w-48" />
        <SkeletonLoader className="h-10 w-24 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <SkeletonLoader className="h-48 w-full rounded-lg" />
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

