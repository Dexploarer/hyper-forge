/**
 * Variant Tree Viewer
 * Visual tree showing base model → variant relationships using React Flow
 */

import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, GitBranch } from "lucide-react";

import type { Asset } from "@/types";
import { VariantTreeNodeComponent } from "./VariantTreeNode.jsx";
import { type VariantTreeNodeData } from "./VariantTreeNode.jsx";
import { type VariantTreeNode as VariantTreeNodeType } from "./VariantTreeNode.jsx";
import { useAssetsStore } from "@/store";

interface VariantTreeViewerProps {
  assets: Asset[];
  onClose: () => void;
}

/**
 * Layout algorithm for variant tree
 * Positions base models in a column, variants spread below each base
 */
function layoutVariantTree(
  baseAssets: Asset[],
  variantMap: Map<string, Asset[]>,
): { nodes: VariantTreeNodeType[]; edges: Edge[] } {
  const nodes: VariantTreeNodeType[] = [];
  const edges: Edge[] = [];

  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING_BASE = 250;
  const VERTICAL_SPACING_VARIANT = 200;

  let currentY = 50;

  baseAssets.forEach((baseAsset, baseIndex) => {
    const variants = variantMap.get(baseAsset.id) || [];
    const variantCount = variants.length;

    // Position base model
    const baseX = 50;
    nodes.push({
      id: baseAsset.id,
      type: "variantTree",
      position: { x: baseX, y: currentY },
      data: {
        asset: baseAsset,
        isRoot: true,
        variantCount,
      },
    });

    // Position variants horizontally spread below the base
    if (variants.length > 0) {
      const totalWidth = Math.max(
        (variants.length - 1) * HORIZONTAL_SPACING,
        0,
      );
      const startX = baseX + 250 - totalWidth / 2;

      variants.forEach((variant, variantIndex) => {
        const variantX = startX + variantIndex * HORIZONTAL_SPACING;
        const variantY = currentY + VERTICAL_SPACING_VARIANT;

        nodes.push({
          id: variant.id,
          type: "variantTree",
          position: { x: variantX, y: variantY },
          data: {
            asset: variant,
            isRoot: false,
          },
        });

        // Create edge from base to variant
        edges.push({
          id: `${baseAsset.id}-${variant.id}`,
          source: baseAsset.id,
          target: variant.id,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#8b5cf6", strokeWidth: 2 },
        });
      });

      currentY += VERTICAL_SPACING_BASE + VERTICAL_SPACING_VARIANT;
    } else {
      currentY += VERTICAL_SPACING_BASE;
    }
  });

  return { nodes, edges };
}

export const VariantTreeViewer: React.FC<VariantTreeViewerProps> = ({
  assets,
  onClose,
}) => {
  const { handleAssetSelect } = useAssetsStore();

  // Build variant relationship map
  const { baseAssets, variantMap } = useMemo(() => {
    const bases = assets.filter((a) => a.metadata.isBaseModel);
    const map = new Map<string, Asset[]>();

    bases.forEach((base) => {
      const variants = assets.filter(
        (a) => a.metadata.isVariant && a.metadata.parentBaseModel === base.id,
      );
      map.set(base.id, variants);
    });

    return { baseAssets: bases, variantMap: map };
  }, [assets]);

  // Calculate layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = layoutVariantTree(baseAssets, variantMap);
    return { initialNodes: nodes, initialEdges: edges };
  }, [baseAssets, variantMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      variantTree: VariantTreeNodeComponent,
    }),
    [],
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as VariantTreeNodeData;
      if (nodeData.asset) {
        handleAssetSelect(nodeData.asset);
      }
    },
    [handleAssetSelect],
  );

  // Calculate stats
  const totalVariants = useMemo(() => {
    let count = 0;
    variantMap.forEach((variants) => {
      count += variants.length;
    });
    return count;
  }, [variantMap]);

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 lg:top-16 lg:bottom-0 solid-overlay z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-bg-primary border border-border-primary rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border-primary flex items-center justify-between bg-gradient-to-r from-bg-secondary to-bg-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Variant Relationship Tree
              </h2>
              <p className="text-sm text-text-tertiary">
                {baseAssets.length} base model
                {baseAssets.length !== 1 ? "s" : ""}, {totalVariants} variant
                {totalVariants !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-text-secondary hover:text-text-primary" />
          </button>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative bg-bg-secondary">
          {baseAssets.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              className="variant-tree-flow"
            >
              <Background color="#374151" gap={16} size={1} />
              <Controls className="bg-bg-primary border border-border-primary rounded-lg shadow-lg" />
              <MiniMap
                className="bg-bg-primary border border-border-primary rounded-lg"
                nodeColor={(node: Node) => {
                  const data = node.data as VariantTreeNodeData;
                  return data.asset?.metadata.isBaseModel
                    ? "#3b82f6"
                    : "#8b5cf6";
                }}
              />
            </ReactFlow>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-text-secondary mb-2">
                  No Base Models Found
                </p>
                <p className="text-sm text-text-tertiary max-w-md">
                  Create base models and generate variants to see the
                  relationship tree.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-border-primary bg-bg-secondary">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500/50 bg-blue-500/10" />
              <span className="text-text-secondary">Base Model</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-purple-500/50 bg-purple-500/10" />
              <span className="text-text-secondary">Variant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-purple-500" />
              <span className="text-text-secondary">Relationship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
