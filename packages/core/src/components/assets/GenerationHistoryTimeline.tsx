/**
 * Generation History Timeline
 * Displays chronological list of asset generations with filtering
 */

import { Clock, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import React, { useState, useMemo } from 'react'

import type { Asset } from '@/types'
import { groupAssetsByDate, getRelativeTimeString, capitalize } from '@/utils/assetStats'
import { useAssetsStore } from '@/store'

interface GenerationHistoryTimelineProps {
  assets: Asset[]
}

type DateRange = 'today' | 'week' | 'month' | 'all'

export const GenerationHistoryTimeline: React.FC<GenerationHistoryTimelineProps> = ({ assets }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const { handleAssetSelect, selectedAsset } = useAssetsStore()

  // Filter assets by selected date range first
  const filteredAssets = useMemo(() => {
    const now = new Date()

    return assets.filter(asset => {
      const dateStr = asset.generatedAt || asset.metadata.createdAt
      if (!dateStr) return false

      const date = new Date(dateStr)

      if (dateRange === 'all') return true

      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

      switch (dateRange) {
        case 'today':
          return diffDays < 1
        case 'week':
          return diffDays < 7
        case 'month':
          return diffDays < 30
        default:
          return true
      }
    }).sort((a, b) => {
      const dateA = new Date(a.generatedAt || a.metadata.createdAt || 0)
      const dateB = new Date(b.generatedAt || b.metadata.createdAt || 0)
      return dateB.getTime() - dateA.getTime() // Newest first
    })
  }, [assets, dateRange])

  // Group filtered assets by date
  const groupedAssets = useMemo(() => groupAssetsByDate(filteredAssets), [filteredAssets])

  // Get type badge color
  const getTypeBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      weapon: 'bg-red-500/20 text-red-400 border-red-500/30',
      armor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      character: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      tool: 'bg-green-500/20 text-green-400 border-green-500/30',
      consumable: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      environment: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  // Render timeline entry
  const TimelineEntry: React.FC<{ asset: Asset; showDate?: boolean }> = ({ asset, showDate = false }) => {
    const dateStr = asset.generatedAt || asset.metadata.createdAt
    const date = dateStr ? new Date(dateStr) : null
    const isSelected = selectedAsset?.id === asset.id

    return (
      <button
        onClick={() => handleAssetSelect(asset)}
        className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-bg-secondary/50 ${
          isSelected
            ? 'bg-primary/10 border-primary/30'
            : 'bg-bg-primary border-border-primary hover:border-border-secondary'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Time indicator */}
          <div className="flex-shrink-0 pt-0.5">
            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-text-tertiary'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-medium text-text-primary truncate">{asset.name}</h4>
              {date && (
                <span className="text-xs text-text-tertiary whitespace-nowrap">
                  {getRelativeTimeString(date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeBadgeColor(asset.type)}`}>
                {capitalize(asset.type)}
              </span>
              {asset.metadata.isVariant && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Variant
                </span>
              )}
              {asset.metadata.isBaseModel && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Base
                </span>
              )}
            </div>

            {showDate && date && (
              <p className="text-xs text-text-tertiary">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </button>
    )
  }

  // Render section
  const TimelineSection: React.FC<{ title: string; assets: Asset[]; showDates?: boolean }> = ({
    title,
    assets,
    showDates = false
  }) => {
    if (assets.length === 0) return null

    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">
          {title} ({assets.length})
        </h3>
        <div className="space-y-2">
          {assets.map(asset => (
            <TimelineEntry key={asset.id} asset={asset} showDate={showDates} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-br from-bg-primary to-bg-secondary border-border-primary animate-scale-in">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary bg-opacity-10 rounded">
              <Clock size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Generation History</h2>
              {!isExpanded && (
                <p className="text-xs text-text-tertiary">{filteredAssets.length} recent</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-bg-secondary rounded transition-all"
            title={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-text-secondary" />
            ) : (
              <ChevronDown size={16} className="text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('today')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                dateRange === 'today'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                dateRange === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                dateRange === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                dateRange === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              All
            </button>
          </div>

          {/* Timeline */}
          {filteredAssets.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <TimelineSection title="Today" assets={groupedAssets.today} />
              <TimelineSection title="Yesterday" assets={groupedAssets.yesterday} />
              <TimelineSection title="This Week" assets={groupedAssets.thisWeek} />
              <TimelineSection title="Older" assets={groupedAssets.older} showDates />
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-sm text-text-tertiary">No assets generated in this time period</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
