/**
 * NodeDetailsPanel - Workflow Node Details Inspector
 * Database-like table view of node data, types, and metadata
 */

import React, { useState } from "react";
import { X, Copy } from "lucide-react";

import type { DialogueNode, QuestData, QuestObjective } from "@/types/content";
import { Button } from "@/components/common";
import { notify } from "@/utils/notify";
import { cn } from "@/styles";
import {
  getDialogueNodeFields,
  getQuestDataFields,
  getQuestObjectiveFields,
  getTypeDefinition,
  type FieldDefinition,
} from "./nodeFieldDefinitions";

type TabType = "data" | "types" | "metadata";

export interface NodeDetailsPanelProps {
  selectedNode: {
    type: "dialogue" | "quest" | "quest-objective";
    data: DialogueNode | QuestData | QuestObjective;
    index?: number; // For quest objectives
  } | null;
  onClose: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  selectedNode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("data");

  if (!selectedNode) return null;

  // Get field definitions based on node type
  const getFields = (): FieldDefinition[] => {
    switch (selectedNode.type) {
      case "dialogue":
        return getDialogueNodeFields(selectedNode.data as DialogueNode);
      case "quest":
        return getQuestDataFields(selectedNode.data as QuestData);
      case "quest-objective":
        return getQuestObjectiveFields(
          selectedNode.data as QuestObjective,
          selectedNode.index ?? 0,
        );
      default:
        return [];
    }
  };

  const allFields = getFields();

  // Filter fields by category for each tab
  const getFilteredFields = (): FieldDefinition[] => {
    switch (activeTab) {
      case "data":
        return allFields.filter((f) => f.category === "basic");
      case "types":
        return allFields.filter((f) => f.category === "relationships");
      case "metadata":
        return allFields.filter((f) => f.category === "metadata");
      default:
        return allFields;
    }
  };

  const filteredFields = getFilteredFields();

  // Get type definition for Types tab
  const typeDefinition = getTypeDefinition(selectedNode.type);

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    const json = JSON.stringify(selectedNode.data, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      notify.success("JSON copied to clipboard");
    });
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Tab button component
  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm",
          isActive
            ? "border-primary text-primary bg-primary/5"
            : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/30",
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed right-0 top-0 h-full w-96 z-modal bg-[var(--bg-card)] border-l border-[var(--border-primary)] shadow-lg flex flex-col"
      data-overlay="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Node Inspector
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5 capitalize">
            {selectedNode.type.replace("-", " ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)]">
        <TabButton tab="data" label="Data" />
        <TabButton tab="types" label="Types" />
        <TabButton tab="metadata" label="Metadata" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "types" ? (
          // Types tab shows TypeScript interface
          <div className="space-y-3">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">
              TypeScript Interface
            </div>
            <pre className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded p-3 text-xs font-mono text-[var(--text-secondary)] overflow-x-auto">
              {typeDefinition}
            </pre>
          </div>
        ) : (
          // Data and Metadata tabs show table
          <div className="space-y-3">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-semibold">
              {activeTab === "data" ? "Fields" : "Computed Fields"}
            </div>
            <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)]">
                      Field
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)]">
                      Type
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)]">
                      Value
                    </th>
                    <th className="text-center px-3 py-2 font-semibold text-[var(--text-primary)]">
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFields.map((field, index) => (
                    <tr
                      key={field.key}
                      className={cn(
                        "border-b border-[var(--border-primary)]/50 last:border-b-0",
                        "hover:bg-[var(--bg-secondary)]/30 transition-colors",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-[var(--text-primary)]">
                          {field.label}
                        </div>
                        {field.description && (
                          <div className="text-[var(--text-secondary)] text-xs mt-0.5">
                            {field.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">
                        {field.type}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-[120px] truncate">
                        {formatValue(field.value)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded text-xs font-semibold",
                            field.nullable
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-green-500/10 text-green-600",
                          )}
                        >
                          {field.nullable ? "?" : "✓"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
