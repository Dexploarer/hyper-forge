/**
 * ThemedEdge - Workflow Edge Types
 * Styled edges for dialogue and quest workflows
 */

import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  getBezierPath,
} from '@xyflow/react'

// Animated edge for connections
export const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: 'var(--color-primary)',
          strokeWidth: 2,
        }}
        className="animated"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-2 py-1 text-[var(--text-secondary)]"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// Temporary/dashed edge for incomplete connections
export const TemporaryEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: 'var(--border-secondary)',
        strokeWidth: 2,
        strokeDasharray: '5 5',
      }}
    />
  )
}

// Export edge types object for React Flow
export const edgeTypes = {
  animated: AnimatedEdge,
  temporary: TemporaryEdge,
}
