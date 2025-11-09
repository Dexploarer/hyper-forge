/**
 * Asset Statistics Dashboard
 * Displays aggregate statistics and charts for all assets
 */

import { BarChart3, ChevronDown, ChevronUp, Package, Layers, Star, Clock } from 'lucide-react'
import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

import type { Asset } from '@/types'
import { calculateAssetStatistics, capitalize } from '@/utils/assetStats'

interface AssetStatisticsCardProps {
  assets: Asset[]
}

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b'  // slate
]

// Recharts tooltip payload types
interface TooltipPayloadItem {
  name?: string
  value: number
  payload: {
    name: string
    count?: number
    percentage?: string
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

// Pie chart label render props type (from recharts)
interface PieLabelRenderProps {
  name?: string
  percent?: number
  value?: number
  x: number
  y: number
  [key: string]: any
}

export const AssetStatisticsCard: React.FC<AssetStatisticsCardProps> = ({ assets }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedView, setSelectedView] = useState<'overview' | 'types' | 'status'>('overview')

  // Calculate statistics
  const stats = useMemo(() => calculateAssetStatistics(assets), [assets])

  // Prepare data for charts
  const typeChartData = stats.byType.map(item => ({
    name: capitalize(item.type),
    count: item.count,
    percentage: item.percentage.toFixed(1)
  }))

  const statusChartData = stats.byStatus.map(item => ({
    name: capitalize(item.status),
    value: item.count,
    color: item.color
  }))

  // Custom tooltip for charts
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0]
      return (
        <div className="bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-text-primary">
            {item.name || item.payload.name}
          </p>
          <p className="text-sm text-text-secondary">
            Count: <span className="text-primary font-semibold">{item.value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card bg-gradient-to-br from-bg-primary to-bg-secondary border-border-primary animate-scale-in">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary bg-opacity-10 rounded">
              <BarChart3 size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Asset Statistics</h2>
              {!isExpanded && (
                <p className="text-xs text-text-tertiary">{stats.total} total assets</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-bg-secondary rounded transition-all"
            title={isExpanded ? 'Collapse statistics' : 'Expand statistics'}
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
          {/* View Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('overview')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedView === 'overview'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('types')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedView === 'types'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              By Type
            </button>
            <button
              onClick={() => setSelectedView('status')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                selectedView === 'status'
                  ? 'bg-primary text-white'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              By Status
            </button>
          </div>

          {/* Overview View */}
          {selectedView === 'overview' && (
            <div className="space-y-3">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Assets */}
                <div className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-primary" />
                    <span className="text-xs text-text-secondary">Total Assets</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>

                {/* Base Models */}
                <div className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={14} className="text-blue-400" />
                    <span className="text-xs text-text-secondary">Base Models</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.baseModels}</p>
                </div>

                {/* Variants */}
                <div className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={14} className="text-purple-400" />
                    <span className="text-xs text-text-secondary">Variants</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.variants}</p>
                </div>

                {/* Favorites */}
                <div className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-xs text-text-secondary">Favorites</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">{stats.favorites}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-primary" />
                  <span className="text-xs font-medium text-text-secondary">Recent Activity</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-tertiary">Today</span>
                    <span className="text-sm font-semibold text-primary">{stats.dateRange.today}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-tertiary">This Week</span>
                    <span className="text-sm font-semibold text-text-primary">{stats.dateRange.thisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-tertiary">This Month</span>
                    <span className="text-sm font-semibold text-text-primary">{stats.dateRange.thisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Types View */}
          {selectedView === 'types' && (
            <div className="space-y-3">
              {/* Bar Chart */}
              <div className="bg-bg-primary rounded-lg border border-border-primary p-3">
                <h3 className="text-xs font-medium text-text-secondary mb-3">Assets by Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Type List */}
              <div className="bg-bg-primary rounded-lg border border-border-primary p-3">
                <h3 className="text-xs font-medium text-text-secondary mb-2">Breakdown</h3>
                <div className="space-y-2">
                  {stats.byType.map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-xs text-text-primary">{capitalize(item.type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-tertiary">{item.percentage.toFixed(1)}%</span>
                        <span className="text-sm font-semibold text-primary">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status View */}
          {selectedView === 'status' && (
            <div className="space-y-3">
              {/* Pie Chart */}
              <div className="bg-bg-primary rounded-lg border border-border-primary p-3">
                <h3 className="text-xs font-medium text-text-secondary mb-3">Assets by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: PieLabelRenderProps) => `${entry.name || ''} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status List */}
              <div className="bg-bg-primary rounded-lg border border-border-primary p-3">
                <h3 className="text-xs font-medium text-text-secondary mb-2">Breakdown</h3>
                <div className="space-y-2">
                  {stats.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-text-primary">{capitalize(item.status)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-tertiary">{item.percentage.toFixed(1)}%</span>
                        <span className="text-sm font-semibold text-primary">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
