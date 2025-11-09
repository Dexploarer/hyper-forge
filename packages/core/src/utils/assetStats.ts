/**
 * Asset Statistics Utilities
 * Client-side aggregation and statistics for asset data
 */

import type { Asset } from '@/types'

export interface TypeCount {
  type: string
  count: number
  percentage: number
}

export interface StatusCount {
  status: string
  count: number
  percentage: number
  color: string
}

export interface DateRangeStats {
  today: number
  thisWeek: number
  thisMonth: number
  older: number
}

export interface AssetStatistics {
  total: number
  byType: TypeCount[]
  byStatus: StatusCount[]
  baseModels: number
  variants: number
  dateRange: DateRangeStats
  favorites: number
}

/**
 * Check if a date is within a specific number of days from now
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays <= days && diffDays >= 0
}

/**
 * Get the start of today
 */
export function getStartOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Get the start of this week (Monday)
 */
export function getStartOfWeek(): Date {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Get the start of this month
 */
export function getStartOfMonth(): Date {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

/**
 * Calculate comprehensive statistics from asset list
 */
export function calculateAssetStatistics(assets: Asset[]): AssetStatistics {
  const total = assets.length

  // Count by type
  const typeMap = new Map<string, number>()
  assets.forEach(asset => {
    const type = asset.type || 'unknown'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  const byType: TypeCount[] = Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)

  // Count by status (from metadata.status field added in recent updates)
  const statusMap = new Map<string, number>()
  const statusColors: Record<string, string> = {
    draft: '#94a3b8',
    processing: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    approved: '#8b5cf6',
    published: '#06b6d4',
    archived: '#64748b'
  }

  assets.forEach(asset => {
    const status = asset.metadata.status || 'completed'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })

  const byStatus: StatusCount[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: statusColors[status] || '#6b7280'
    }))
    .sort((a, b) => b.count - a.count)

  // Count base models vs variants
  const baseModels = assets.filter(a => a.metadata.isBaseModel).length
  const variants = assets.filter(a => a.metadata.isVariant).length

  // Date range statistics
  const now = new Date()
  const startOfToday = getStartOfToday()
  const startOfWeek = getStartOfWeek()
  const startOfMonth = getStartOfMonth()

  const dateRange: DateRangeStats = {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    older: 0
  }

  assets.forEach(asset => {
    const dateStr = asset.generatedAt || asset.metadata.createdAt
    if (!dateStr) {
      dateRange.older++
      return
    }

    const date = new Date(dateStr)
    if (date >= startOfToday) {
      dateRange.today++
    } else if (date >= startOfWeek) {
      dateRange.thisWeek++
    } else if (date >= startOfMonth) {
      dateRange.thisMonth++
    } else {
      dateRange.older++
    }
  })

  // Count favorites
  const favorites = assets.filter(a => a.metadata.isFavorite).length

  return {
    total,
    byType,
    byStatus,
    baseModels,
    variants,
    dateRange,
    favorites
  }
}

/**
 * Filter assets by date range
 */
export function filterByDateRange(
  assets: Asset[],
  range: 'today' | 'week' | 'month' | 'all'
): Asset[] {
  if (range === 'all') return assets

  const now = new Date()
  let startDate: Date

  switch (range) {
    case 'today':
      startDate = getStartOfToday()
      break
    case 'week':
      startDate = getStartOfWeek()
      break
    case 'month':
      startDate = getStartOfMonth()
      break
    default:
      return assets
  }

  return assets.filter(asset => {
    const dateStr = asset.generatedAt || asset.metadata.createdAt
    if (!dateStr) return false
    const date = new Date(dateStr)
    return date >= startDate
  })
}

/**
 * Group assets by date for timeline display
 */
export interface GroupedAssets {
  today: Asset[]
  yesterday: Asset[]
  thisWeek: Asset[]
  older: Asset[]
}

export function groupAssetsByDate(assets: Asset[]): GroupedAssets {
  const result: GroupedAssets = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  }

  const now = new Date()
  const startOfToday = getStartOfToday()
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = getStartOfWeek()

  assets.forEach(asset => {
    const dateStr = asset.generatedAt || asset.metadata.createdAt
    if (!dateStr) {
      result.older.push(asset)
      return
    }

    const date = new Date(dateStr)

    if (date >= startOfToday) {
      result.today.push(asset)
    } else if (date >= startOfYesterday) {
      result.yesterday.push(asset)
    } else if (date >= startOfWeek) {
      result.thisWeek.push(asset)
    } else {
      result.older.push(asset)
    }
  })

  return result
}

/**
 * Format relative time for display
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
