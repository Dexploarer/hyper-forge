import { Clock, X } from 'lucide-react'
import React from 'react'

import { useAssetsStore } from '@/store'
import { cn } from '@/styles'

interface RecentlyViewedWidgetProps {
  onAssetClick?: (assetId: string) => void
}

export function RecentlyViewedWidget({ onAssetClick }: RecentlyViewedWidgetProps): React.ReactElement | null {
  const { recentlyViewed, clearRecentlyViewed } = useAssetsStore()

  if (recentlyViewed.length === 0) {
    return null
  }

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-text-primary">Recently Viewed</h3>
        </div>
        <button
          onClick={clearRecentlyViewed}
          className="p-1 hover:bg-white/5 rounded transition-colors"
          title="Clear history"
        >
          <X size={12} className="text-text-tertiary hover:text-text-primary" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {recentlyViewed.map((item) => (
          <button
            key={`${item.id}-${item.timestamp}`}
            onClick={() => onAssetClick?.(item.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-left',
              'hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                {item.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-text-secondary capitalize">
                  {item.type}
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-xs text-text-secondary">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
