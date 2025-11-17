/**
 * Variant Tree Node Component
 * Custom node for React Flow variant relationship visualization
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Package, Layers } from 'lucide-react'

import type { Asset } from '@/types'
import { capitalize } from '@/utils/assetStats'

export interface VariantTreeNodeData extends Record<string, unknown> {
  asset: Asset
  isRoot?: boolean
  variantCount?: number
}

export type VariantTreeNode = Node<VariantTreeNodeData, 'variantTree'>

export const VariantTreeNodeComponent = memo(({ data, selected }: NodeProps<VariantTreeNode>) => {
  const { asset, isRoot, variantCount } = data as VariantTreeNodeData
  const isBase = asset.metadata.isBaseModel
  const isVariant = asset.metadata.isVariant

  // Get material/tier info for variants
  const materialInfo = isVariant
    ? asset.metadata.materialPreset?.displayName || asset.metadata.tier || 'Unknown'
    : null

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 transition-all shadow-lg ${
        selected
          ? 'border-primary bg-primary/10 shadow-primary/20'
          : isBase
          ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5'
          : 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5'
      }`}
    >
      {/* Handles */}
      {isBase && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-primary !border-2 !border-white"
        />
      )}
      {isVariant && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-purple-500 !border-2 !border-white"
        />
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Header with icon */}
        <div className="flex items-center gap-2">
          {isBase ? (
            <div className="p-1.5 bg-blue-500/20 rounded">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
          ) : (
            <div className="p-1.5 bg-purple-500/20 rounded">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">{asset.name}</p>
          </div>
        </div>

        {/* Asset Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary border border-border-primary">
            {capitalize(asset.type)}
          </span>
          {isBase ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Base
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Variant
            </span>
          )}
        </div>

        {/* Material/Tier Info for Variants */}
        {isVariant && materialInfo && (
          <div className="pt-1 border-t border-border-primary">
            <p className="text-xs text-text-tertiary">Material:</p>
            <p className="text-xs font-medium text-primary">{materialInfo}</p>
          </div>
        )}

        {/* Variant Count for Base Models */}
        {isBase && variantCount !== undefined && variantCount > 0 && (
          <div className="pt-1 border-t border-border-primary">
            <p className="text-xs text-text-tertiary">
              {variantCount} variant{variantCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

VariantTreeNodeComponent.displayName = 'VariantTreeNode'
