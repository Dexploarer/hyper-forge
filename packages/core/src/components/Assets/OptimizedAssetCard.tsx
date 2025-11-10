/**
 * Optimized Asset Card Component
 * Uses React.memo and lazy image loading for performance
 */

import React from 'react'
import { Asset } from '@/types'
import { useLazyImage } from '@/hooks/useLazyImage'
import { getTierColor } from '@/constants'
import { Package } from 'lucide-react'

interface OptimizedAssetCardProps {
  asset: Asset
  isSelected?: boolean
  onSelect: (asset: Asset) => void
  onToggleFavorite?: (asset: Asset, e: React.MouseEvent) => void
  isFavoriteUpdating?: boolean
}

export const OptimizedAssetCard = React.memo<OptimizedAssetCardProps>(({
  asset,
  isSelected = false,
  onSelect,
  onToggleFavorite,
  isFavoriteUpdating = false,
}) => {
  // Lazy load concept art image
  const conceptArtUrl = asset.hasModel 
    ? `/api/assets/${asset.id}/concept-art.png`
    : undefined
  
  const { imgRef, imageSrc, isLoaded, error } = useLazyImage(conceptArtUrl || '', {
    placeholder: undefined,
    rootMargin: '100px', // Start loading earlier
  })

  const handleClick = () => {
    onSelect(asset)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.(asset, e)
  }

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 cursor-pointer micro-card-hover border ${
        isSelected
          ? 'bg-primary bg-opacity-10 border-primary shadow-lg'
          : 'bg-bg-secondary border-border-primary hover:border-primary hover:shadow-md'
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        {/* Thumbnail */}
        <div className="w-full h-48 bg-bg-tertiary rounded-lg mb-3 overflow-hidden flex items-center justify-center">
          {conceptArtUrl && !error ? (
            <>
              {!isLoaded && (
                <div className="w-full h-full bg-bg-tertiary animate-pulse flex items-center justify-center">
                  <Package className="w-8 h-8 text-text-tertiary" />
                </div>
              )}
              <img
                ref={imgRef}
                src={imageSrc}
                alt={asset.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                loading="lazy"
              />
            </>
          ) : (
            <Package className="w-12 h-12 text-text-tertiary" />
          )}
        </div>

        {/* Asset Name */}
        <h3 className="font-semibold text-base text-text-primary mb-2 line-clamp-2">
          {asset.name}
        </h3>

        {/* Badges */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="px-2 py-1 bg-bg-tertiary text-text-secondary rounded-md text-xs font-medium capitalize">
            {asset.type}
          </span>
          {asset.metadata?.tier && asset.metadata.tier !== 'base' && (
            <span
              className="px-2 py-1 rounded-md text-xs font-medium capitalize flex items-center gap-1"
              style={{
                backgroundColor: `${getTierColor(asset.metadata.tier)}20`,
                color: getTierColor(asset.metadata.tier)
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getTierColor(asset.metadata.tier) }}
              />
              {asset.metadata.tier}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.metadata?.isFavorite === nextProps.asset.metadata?.isFavorite &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavoriteUpdating === nextProps.isFavoriteUpdating
  )
})

OptimizedAssetCard.displayName = 'OptimizedAssetCard'

