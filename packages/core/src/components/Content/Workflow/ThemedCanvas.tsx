/**
 * ThemedCanvas - Workflow Canvas Component
 * Wrapper around React Flow with Asset Forge design system theming
 */

import React from 'react'
import {
  ReactFlow,
  Background,
  type ReactFlowProps,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
// @ts-ignore - CSS imports don't have type declarations
import '@xyflow/react/dist/style.css'

import { cn } from '@/styles'

export interface ThemedCanvasProps extends Omit<ReactFlowProps, 'nodes' | 'edges'> {
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeTypes
  edgeTypes?: EdgeTypes
  onNodeClick?: (event: React.MouseEvent, node: Node) => void
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  fitView?: boolean
  className?: string
  children?: React.ReactNode
}

export const ThemedCanvas: React.FC<ThemedCanvasProps> = ({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodeClick,
  onEdgeClick,
  onNodesChange,
  onEdgesChange,
  fitView = true,
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('workflow-canvas h-full w-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView={fitView}
        {...props}
      >
        <Background
          color="rgba(99, 102, 241, 0.05)"
          gap={20}
          size={1}
        />
        {children}
      </ReactFlow>
    </div>
  )
}
