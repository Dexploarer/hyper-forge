import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Sword,
  Shirt,
  Apple,
  Wrench,
  Home,
  TreePine,
  Box,
  MoreHorizontal,
} from "lucide-react";
import React, { useState } from "react";

import { useAssetsStore } from "../../store";
import { cn } from "../../styles";
import type { AssetType } from "../../types";

interface AssetFiltersProps {
  totalAssets: number;
  filteredCount: number;
}

const AssetFilters: React.FC<AssetFiltersProps> = ({
  totalAssets,
  filteredCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get filter state from store
  const { searchTerm, setSearchTerm, typeFilter, setTypeFilter } =
    useAssetsStore();

  const hasActiveSearch = !!searchTerm;
  const hasActiveFilters = !!typeFilter;

  // Asset type configuration
  const assetTypes: Array<{
    value: AssetType | "";
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { value: "", label: "All", icon: Box },
    { value: "character", label: "Characters", icon: User },
    { value: "weapon", label: "Weapons", icon: Sword },
    { value: "armor", label: "Armor", icon: Shirt },
    { value: "consumable", label: "Consumables", icon: Apple },
    { value: "tool", label: "Tools", icon: Wrench },
    { value: "building", label: "Buildings", icon: Home },
    { value: "decoration", label: "Decorations", icon: TreePine },
    { value: "resource", label: "Resources", icon: Box },
    { value: "misc", label: "Misc", icon: MoreHorizontal },
  ];

  return (
    <div className="card bg-gradient-to-br from-bg-primary to-bg-secondary border-border-primary animate-scale-in">
      {/* Compact Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary bg-opacity-10 rounded">
              <Filter size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Filters
              </h2>
              {!isExpanded && hasActiveFilters && (
                <p className="text-xs text-primary">Active</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-bg-primary bg-opacity-50 px-2 py-1 rounded-full">
              <span className="text-primary font-bold">{filteredCount}</span>
              <span className="text-text-tertiary">/ {totalAssets}</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-bg-secondary rounded transition-all"
              title={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              {isExpanded ? (
                <ChevronUp size={16} className="text-text-secondary" />
              ) : (
                <ChevronDown size={16} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Asset Type Filters */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Asset Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {assetTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value || "all"}
                  onClick={() => setTypeFilter(value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    typeFilter === value
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-bg-tertiary/20 text-text-secondary border border-white/10 hover:border-white/20 hover:bg-bg-tertiary/30",
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-lg
                         text-text-primary placeholder-text-tertiary
                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:border-primary
                         transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-bg-secondary rounded transition-colors"
                >
                  <X
                    size={14}
                    className="text-text-tertiary hover:text-text-primary"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetFilters;
