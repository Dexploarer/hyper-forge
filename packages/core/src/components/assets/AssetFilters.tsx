import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

import { useAssetsStore } from "../../store";

interface AssetFiltersProps {
  totalAssets: number;
  filteredCount: number;
}

const AssetFilters: React.FC<AssetFiltersProps> = ({
  totalAssets,
  filteredCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get search state from store
  const { searchTerm, setSearchTerm } = useAssetsStore();

  const hasActiveSearch = !!searchTerm;

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
                Search
              </h2>
              {!isExpanded && hasActiveSearch && (
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
              title={isExpanded ? "Collapse search" : "Expand search"}
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

      {/* Search Bar */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
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
      )}
    </div>
  );
};

export default AssetFilters;
