/**
 * ThemedNode - Workflow Node Component
 * Matches Asset Forge Card component design system
 */

import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import { Badge } from '@/components/common'
import { cn } from '@/styles'

export type NodeVariant = 'dialogue' | 'quest-start' | 'quest-objective' | 'quest-reward'

export interface ThemedNodeData {
  label: string
  description?: string
  content: string
  footer?: string
  handles: { target: boolean; source: boolean }
  fullNodeData?: any
  variant?: NodeVariant
  [key: string]: any // Index signature for React Flow compatibility
}

export interface ThemedNodeProps extends NodeProps {
  data: ThemedNodeData
}

const getVariantStyles = (variant?: NodeVariant, selected?: boolean) => {
  const base = 'bg-[var(--bg-card)] border rounded-lg shadow-sm transition-all duration-200'

  if (selected) {
    return cn(base, 'border-primary ring-2 ring-primary ring-opacity-20 bg-primary bg-opacity-5')
  }

  switch (variant) {
    case 'quest-start':
      return cn(base, 'border-2 border-primary/50')
    case 'quest-reward':
      return cn(base, 'border-2 border-success/50')
    default:
      return cn(base, 'border-[var(--border-primary)] hover:border-[var(--border-hover)]')
  }
}

export const ThemedNode: React.FC<ThemedNodeProps> = ({ data, selected }) => {
  const { label, description, content, footer, handles, variant } = data

  return (
    <div className={cn('min-w-[250px] max-w-[350px]', getVariantStyles(variant, selected))}>
      {/* Target Handle */}
      {handles.target && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-[var(--color-primary)] border-2 border-[var(--bg-card)] hover:scale-110 transition-transform"
        />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {label}
          </h4>
          {variant && (
            <Badge variant="primary" size="sm" className="capitalize">
              {variant.replace('-', ' ')}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono truncate">
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
          {content}
        </p>
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-2 border-t border-[var(--border-primary)]/50 bg-[var(--bg-tertiary)]/20">
          <p className="text-xs text-[var(--text-tertiary)]">{footer}</p>
        </div>
      )}

      {/* Source Handle */}
      {handles.source && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-[var(--color-primary)] border-2 border-[var(--bg-card)] hover:scale-110 transition-transform"
        />
      )}
    </div>
  )
}
