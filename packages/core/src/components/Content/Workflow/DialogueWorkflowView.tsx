/**
 * DialogueWorkflowView - Dialogue Tree Visualization
 * Converts DialogueData into a React Flow workflow graph
 */

import React, { useMemo, useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'

import type { DialogueData, DialogueNode } from '@/types/content'
import { ThemedCanvas } from './ThemedCanvas'
import { ThemedNode, type ThemedNodeData } from './ThemedNode'
import { edgeTypes } from './ThemedEdge'
import { NodeDetailsPanel } from './NodeDetailsPanel'

export interface DialogueWorkflowViewProps {
  dialogue: DialogueData
}

// Simple hierarchical layout algorithm
function layoutDialogueNodes(dialogueNodes: DialogueNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const visited = new Set<string>()

  // Build adjacency map
  const adjacency = new Map<string, string[]>()
  dialogueNodes.forEach(node => {
    const nextIds = node.responses?.map(r => r.nextNodeId).filter(Boolean) || []
    adjacency.set(node.id, nextIds as string[])
  })

  // Find root (node with no incoming edges)
  const hasIncoming = new Set<string>()
  adjacency.forEach(targets => {
    targets.forEach(id => hasIncoming.add(id))
  })

  const roots = dialogueNodes.filter(node => !hasIncoming.has(node.id))
  const rootNode = roots[0] || dialogueNodes[0]

  // Breadth-first layout
  const queue: Array<{ id: string; level: number; index: number }> = []
  const levelCounts = new Map<number, number>()

  queue.push({ id: rootNode.id, level: 0, index: 0 })
  visited.add(rootNode.id)

  while (queue.length > 0) {
    const { id, level } = queue.shift()!

    // Calculate position
    const x = level * 400 + 50
    const currentLevelCount = levelCounts.get(level) || 0
    const y = currentLevelCount * 200 + 50

    positions.set(id, { x, y })
    levelCounts.set(level, currentLevelCount + 1)

    // Add children
    const children = adjacency.get(id) || []
    children.forEach((childId: string, childIndex: number) => {
      if (!visited.has(childId)) {
        visited.add(childId)
        queue.push({ id: childId, level: level + 1, index: childIndex })
      }
    })
  }

  // Handle any unvisited nodes (disconnected)
  dialogueNodes.forEach((node, index) => {
    if (!visited.has(node.id)) {
      positions.set(node.id, { x: 50, y: (index + 1) * 200 + 500 })
    }
  })

  return positions
}

export const DialogueWorkflowView: React.FC<DialogueWorkflowViewProps> = ({ dialogue }) => {
  const [selectedNode, setSelectedNode] = useState<{
    type: 'dialogue'
    data: DialogueNode
  } | null>(null)

  // Transform DialogueNodes to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const dialogueNodes = dialogue.nodes || []
    const positions = layoutDialogueNodes(dialogueNodes)

    const flowNodes: Node[] = dialogueNodes.map(node => {
      const pos = positions.get(node.id) || { x: 0, y: 0 }
      const responseCount = node.responses?.length || 0

      const nodeData: ThemedNodeData = {
        label: `Node: ${node.id}`,
        description: `${responseCount} response${responseCount !== 1 ? 's' : ''}`,
        content: node.text,
        footer: node.responses?.length
          ? `Connects to ${node.responses.length} node${node.responses.length !== 1 ? 's' : ''}`
          : 'End node',
        handles: {
          target: true,
          source: (node.responses?.length ?? 0) > 0,
        },
        fullNodeData: node,
        variant: 'dialogue',
      }

      return {
        id: node.id,
        type: 'themed',
        position: pos,
        data: nodeData,
      }
    })

    const flowEdges: Edge[] = []
    dialogueNodes.forEach((node: DialogueNode) => {
      node.responses?.forEach((response: import('@/types/content').DialogueResponse, index: number) => {
        if (response.nextNodeId) {
          flowEdges.push({
            id: `${node.id}-${response.nextNodeId}-${index}`,
            source: node.id,
            target: response.nextNodeId,
            type: 'animated',
            label: response.text.substring(0, 30) + (response.text.length > 30 ? '...' : ''),
          })
        }
      })
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [dialogue])

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const dialogueNode = dialogue.nodes?.find((n: DialogueNode) => n.id === node.id)
      if (dialogueNode) {
        setSelectedNode({
          type: 'dialogue',
          data: dialogueNode,
        })
      }
    },
    [dialogue.nodes]
  )

  // Node types
  const nodeTypes = useMemo(
    () => ({
      themed: ThemedNode,
    }),
    []
  )

  return (
    <div className="relative h-full w-full">
      <ThemedCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        fitView
      />

      <NodeDetailsPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  )
}
