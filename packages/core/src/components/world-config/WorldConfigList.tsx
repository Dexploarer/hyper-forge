import { Search, Plus, Filter, Globe } from "lucide-react";
import React, { useState, useMemo } from "react";

import { Button, Input, EmptyState } from "@/components/common";
import type { WorldConfigurationData } from "@/services/api/WorldConfigAPIClient";

import { WorldConfigCard } from "./WorldConfigCard";

interface WorldConfigListProps {
  configurations: WorldConfigurationData[];
  selectedId?: string;
  onSelect?: (config: WorldConfigurationData) => void;
  onActivate?: (id: string) => void;
  onClone?: (id: string) => void;
  onEdit?: (id: string) => void;
  onExport?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPreview?: (id: string) => void;
  onCreate?: () => void;
  loading?: boolean;
}

export const WorldConfigList: React.FC<WorldConfigListProps> = ({
  configurations,
  selectedId,
  onSelect,
  onActivate,
  onClone,
  onEdit,
  onExport,
  onDelete,
  onPreview,
  onCreate,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");

  // Extract unique genres for filter
  const genres = useMemo(() => {
    if (!configurations || configurations.length === 0) return [];
    const uniqueGenres = new Set(configurations.map((c) => c.genre));
    return Array.from(uniqueGenres).sort();
  }, [configurations]);

  // Filter configurations
  const filteredConfigs = useMemo(() => {
    if (!configurations || configurations.length === 0) return [];
    return configurations.filter((config) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      // Genre filter
      const matchesGenre =
        genreFilter === "all" || config.genre === genreFilter;

      return matchesSearch && matchesGenre;
    });
  }, [configurations, searchQuery, genreFilter]);

  // Group by active status
  const activeConfig = filteredConfigs?.find((c) => c.isActive);
  const inactiveConfigs = filteredConfigs?.filter((c) => !c.isActive) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            Loading configurations...
          </p>
        </div>
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <EmptyState
          icon={Globe}
          title="No World Configurations"
          description="Create your first world configuration to define parameters for AI content generation"
          action={
            onCreate && (
              <Button onClick={onCreate} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create First Configuration
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search configurations..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() +
                  genre.slice(1).replace("-", " ")}
              </option>
            ))}
          </select>

          {onCreate && (
            <Button onClick={onCreate} size="sm" className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1" />
              New Config
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-tertiary">
          {filteredConfigs.length === configurations.length ? (
            <>
              <span className="font-medium text-text-secondary">
                {configurations.length}
              </span>{" "}
              configuration{configurations.length !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-text-secondary">
                {filteredConfigs.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-text-secondary">
                {configurations.length}
              </span>
            </>
          )}
        </p>
      </div>

      {filteredConfigs.length === 0 && searchQuery && (
        <EmptyState
          icon={Search}
          title="No Results Found"
          description={`No configurations match "${searchQuery}"`}
          action={
            <Button
              onClick={() => setSearchQuery("")}
              variant="secondary"
              className="mt-4"
            >
              Clear Search
            </Button>
          }
        />
      )}

      {/* Active Configuration */}
      {activeConfig && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active Configuration
          </h3>
          <WorldConfigCard
            config={activeConfig}
            selected={selectedId === activeConfig.id}
            onSelect={onSelect}
            onActivate={onActivate}
            onClone={onClone}
            onEdit={onEdit}
            onExport={onExport}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        </div>
      )}

      {/* Inactive Configurations */}
      {inactiveConfigs.length > 0 && (
        <div className="space-y-2">
          {activeConfig && (
            <h3 className="text-sm font-semibold text-text-primary">
              Other Configurations
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveConfigs.map((config) => (
              <WorldConfigCard
                key={config.id}
                config={config}
                selected={selectedId === config.id}
                onSelect={onSelect}
                onActivate={onActivate}
                onClone={onClone}
                onEdit={onEdit}
                onExport={onExport}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
