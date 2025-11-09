import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  /** Initial number of items to display */
  initialCount?: number
  /** Number of items to load on each scroll */
  loadIncrement?: number
  /** Threshold in pixels from bottom to trigger load */
  threshold?: number
  /** Total number of items available */
  totalItems: number
}

interface UseInfiniteScrollReturn {
  /** Number of items currently displayed */
  displayCount: number
  /** Whether currently loading more items */
  isLoadingMore: boolean
  /** Whether there are more items to load */
  hasMore: boolean
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement>
  /** Manually load more items */
  loadMore: () => void
  /** Reset to initial count */
  reset: () => void
}

/**
 * Hook for implementing infinite scroll functionality
 *
 * @example
 * ```tsx
 * const { displayCount, isLoadingMore, hasMore, containerRef } = useInfiniteScroll({
 *   totalItems: assets.length,
 *   initialCount: 20,
 *   loadIncrement: 10,
 *   threshold: 200
 * })
 *
 * const visibleAssets = assets.slice(0, displayCount)
 *
 * return (
 *   <div ref={containerRef} className="overflow-y-auto">
 *     {visibleAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
 *     {isLoadingMore && <LoadingSpinner />}
 *   </div>
 * )
 * ```
 */
export function useInfiniteScroll({
  initialCount = 20,
  loadIncrement = 10,
  threshold = 300,
  totalItems,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [displayCount, setDisplayCount] = useState(initialCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const hasMore = displayCount < totalItems

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)

    // Simulate a small delay for smooth UX
    loadingTimeoutRef.current = setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + loadIncrement, totalItems))
      setIsLoadingMore(false)
    }, 150)
  }, [hasMore, isLoadingMore, loadIncrement, totalItems])

  const reset = useCallback(() => {
    setDisplayCount(initialCount)
    setIsLoadingMore(false)
  }, [initialCount])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < threshold && hasMore && !isLoadingMore) {
        loadMore()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [hasMore, isLoadingMore, loadMore, threshold])

  // Reset when total items changes significantly (e.g., filter applied)
  useEffect(() => {
    if (displayCount > totalItems) {
      setDisplayCount(Math.min(initialCount, totalItems))
    }
  }, [totalItems, initialCount, displayCount])

  return {
    displayCount,
    isLoadingMore,
    hasMore,
    containerRef,
    loadMore,
    reset,
  }
}
