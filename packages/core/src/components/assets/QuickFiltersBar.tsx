/**
 * Quick Filters Bar
 * Chips-based filtering for asset types, tiers, and status
 */

import React, { useState } from "react";
import {
  X,
  Filter,
  Package,
  Swords,
  Shield,
  Hammer,
  Building,
  User,
  Trees,
  Box,
  Target,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickFiltersBarProps {
  selectedTypes: string[];
  selectedTiers: string[];
  selectedStatuses: string[];
  onTypesChange: (types: string[]) => void;
  onTiersChange: (tiers: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onClearAll: () => void;
}

interface FilterChip {
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

const assetTypes: FilterChip[] = [
  { value: "character", label: "Characters", icon: User },
  { value: "weapon", label: "Weapons", icon: Swords },
  { value: "armor", label: "Armor", icon: Shield },
  { value: "tool", label: "Tools", icon: Hammer },
  { value: "building", label: "Buildings", icon: Building },
  { value: "environment", label: "Environments", icon: Trees },
  { value: "prop", label: "Props", icon: Box },
  { value: "ammunition", label: "Ammunition", icon: Target },
];

const assetTiers: FilterChip[] = [
  { value: "bronze", label: "Bronze", color: "#CD7F32" },
  { value: "iron", label: "Iron", color: "#C0C0C0" },
  { value: "steel", label: "Steel", color: "#B0C4DE" },
  { value: "mithril", label: "Mithril", color: "#87CEEB" },
  { value: "adamant", label: "Adamant", color: "#98FB98" },
  { value: "rune", label: "Rune", color: "#00CED1" },
  { value: "wood", label: "Wood", color: "#8B4513" },
  { value: "oak", label: "Oak", color: "#D2691E" },
  { value: "willow", label: "Willow", color: "#DAA520" },
  { value: "leather", label: "Leather", color: "#8B4513" },
];

const assetStatuses: FilterChip[] = [
  { value: "draft", label: "Draft", icon: Clock },
  { value: "processing", label: "Processing", icon: Clock },
  { value: "completed", label: "Completed", icon: CheckCircle },
  { value: "approved", label: "Approved", icon: CheckCircle },
  { value: "failed", label: "Failed", icon: AlertCircle },
];

export const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({
  selectedTypes,
  selectedTiers,
  selectedStatuses,
  onTypesChange,
  onTiersChange,
  onStatusesChange,
  onClearAll,
}) => {
  const [expandedSection, setExpandedSection] = useState<
    "types" | "tiers" | "statuses" | null
  >(null);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleTier = (tier: string) => {
    if (selectedTiers.includes(tier)) {
      onTiersChange(selectedTiers.filter((t) => t !== tier));
    } else {
      onTiersChange([...selectedTiers, tier]);
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedTiers.length > 0 ||
    selectedStatuses.length > 0;

  return (
    <div className="solid-panel border-b border-border-primary">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">
              Quick Filters
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-primary bg-opacity-10 text-primary rounded-full text-xs font-medium">
                {selectedTypes.length +
                  selectedTiers.length +
                  selectedStatuses.length}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>

        {/* Filter Sections */}
        <div className="space-y-3">
          {/* Types */}
          <div>
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "types" ? null : "types")
              }
              className="flex items-center gap-2 mb-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Package size={12} />
              <span>Asset Types</span>
              {selectedTypes.length > 0 && (
                <span className="text-primary">({selectedTypes.length})</span>
              )}
            </button>
            <div
              className={`flex flex-wrap gap-1.5 overflow-hidden transition-all duration-200 ${
                expandedSection === "types" ? "max-h-96" : "max-h-20"
              }`}
            >
              {assetTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-white shadow-sm scale-105"
                        : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-border-primary"
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
            {assetTypes.length > 6 && (
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "types" ? null : "types",
                  )
                }
                className="text-xs text-primary hover:text-accent transition-colors mt-2"
              >
                {expandedSection === "types" ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Tiers */}
          <div>
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "tiers" ? null : "tiers")
              }
              className="flex items-center gap-2 mb-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Layers size={12} />
              <span>Tiers</span>
              {selectedTiers.length > 0 && (
                <span className="text-primary">({selectedTiers.length})</span>
              )}
            </button>
            <div
              className={`flex flex-wrap gap-1.5 overflow-hidden transition-all duration-200 ${
                expandedSection === "tiers" ? "max-h-96" : "max-h-20"
              }`}
            >
              {assetTiers.map((tier) => {
                const isSelected = selectedTiers.includes(tier.value);
                return (
                  <button
                    key={tier.value}
                    onClick={() => toggleTier(tier.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "shadow-sm scale-105"
                        : "bg-bg-secondary hover:bg-bg-tertiary border border-border-primary"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${tier.color}20`,
                            color: tier.color,
                            borderColor: `${tier.color}40`,
                          }
                        : {}
                    }
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span
                      className={isSelected ? "" : "text-text-secondary"}
                      style={isSelected ? { color: tier.color } : {}}
                    >
                      {tier.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {assetTiers.length > 6 && (
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "tiers" ? null : "tiers",
                  )
                }
                className="text-xs text-primary hover:text-accent transition-colors mt-2"
              >
                {expandedSection === "tiers" ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Statuses */}
          <div>
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "statuses" ? null : "statuses",
                )
              }
              className="flex items-center gap-2 mb-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <CheckCircle size={12} />
              <span>Status</span>
              {selectedStatuses.length > 0 && (
                <span className="text-primary">
                  ({selectedStatuses.length})
                </span>
              )}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {assetStatuses.map((status) => {
                const Icon = status.icon;
                const isSelected = selectedStatuses.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-white shadow-sm scale-105"
                        : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-border-primary"
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    <span>{status.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
