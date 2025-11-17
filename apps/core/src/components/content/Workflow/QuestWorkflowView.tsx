/**
 * QuestWorkflowView - Quest Flow Visualization
 * Converts QuestData into a linear workflow: Start → Objectives → Reward
 */

import React, { useMemo, useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'

import type { QuestData, QuestObjective } from '@/types/content'
import { ThemedCanvas } from './ThemedCanvas'
import { ThemedNode, type ThemedNodeData } from './ThemedNode'
import { edgeTypes } from './ThemedEdge'
import { NodeDetailsPanel } from './NodeDetailsPanel'

export interface QuestWorkflowViewProps {
  quest: QuestData
}

export const QuestWorkflowView: React.FC<QuestWorkflowViewProps> = ({ quest }) => {
  const [selectedNode, setSelectedNode] = useState<{
    type: 'quest' | 'quest-objective'
    data: QuestData | QuestObjective
    index?: number
  } | null>(null)

  // Transform QuestData to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    const spacing = 350
    const startY = 50

    // 1. Quest Start Node
    const questStartData: ThemedNodeData = {
      label: quest.title,
      description: 'Quest Start',
      content: quest.description,
      footer: `${quest.objectives.length} objectives • Level ${quest.requirements.level}`,
      handles: {
        target: false,
        source: true,
      },
      fullNodeData: quest,
      variant: 'quest-start',
    }

    flowNodes.push({
      id: 'quest-start',
      type: 'themed',
      position: { x: 50, y: startY },
      data: questStartData,
    })

    // 2. Objective Nodes
    quest.objectives.forEach((objective, index) => {
      const objectiveData: ThemedNodeData = {
        label: `Objective ${index + 1}`,
        description: objective.type.toUpperCase(),
        content: objective.description,
        footer: `${objective.type}: ${objective.target} (${objective.count}x)`,
        handles: {
          target: true,
          source: true,
        },
        fullNodeData: objective,
        variant: 'quest-objective',
      }

      const nodeId = `objective-${index}`
      flowNodes.push({
        id: nodeId,
        type: 'themed',
        position: { x: 50 + (index + 1) * spacing, y: startY },
        data: objectiveData,
      })

      // Connect previous node to this objective
      const sourceId = index === 0 ? 'quest-start' : `objective-${index - 1}`
      flowEdges.push({
        id: `${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
        type: 'animated',
      })
    })

    // 3. Reward Node
    const rewardData: ThemedNodeData = {
      label: 'Quest Rewards',
      description: 'Completion',
      content: `${quest.rewards.experience} XP • ${quest.rewards.gold} Gold`,
      footer: quest.rewards.items.length
        ? `Items: ${quest.rewards.items.join(', ')}`
        : 'No items',
      handles: {
        target: true,
        source: false,
      },
      fullNodeData: quest.rewards,
      variant: 'quest-reward',
    }

    const lastObjectiveId = quest.objectives.length > 0
      ? `objective-${quest.objectives.length - 1}`
      : 'quest-start'

    flowNodes.push({
      id: 'quest-reward',
      type: 'themed',
      position: {
        x: 50 + (quest.objectives.length + 1) * spacing,
        y: startY,
      },
      data: rewardData,
    })

    flowEdges.push({
      id: `${lastObjectiveId}-quest-reward`,
      source: lastObjectiveId,
      target: 'quest-reward',
      type: 'animated',
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [quest])

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === 'quest-start') {
        setSelectedNode({
          type: 'quest',
          data: quest,
        })
      } else if (node.id.startsWith('objective-')) {
        const index = parseInt(node.id.split('-')[1])
        const objective = quest.objectives[index]
        if (objective) {
          setSelectedNode({
            type: 'quest-objective',
            data: objective,
            index,
          })
        }
      } else if (node.id === 'quest-reward') {
        // Reward node shows quest data (could be customized)
        setSelectedNode({
          type: 'quest',
          data: quest,
        })
      }
    },
    [quest]
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
