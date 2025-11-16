/**
 * CDN Management Tab
 * Admin dashboard tab for managing CDN files
 */

import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Search,
  XCircle,
  Upload,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useCDNFiles, useCDNDirectories } from "@/hooks/useCDNFiles";
import { useCDNFileOperations } from "@/hooks/useCDNFileOperations";
import { LoadingSpinner, Badge } from "@/components/common";
import { CDNFileRow } from "./CDNFileRow";
import { CDNUploadZone } from "./CDNUploadZone";
import { CDNDirectoryStats } from "./CDNDirectoryStats";
import { CDNBulkActions } from "./CDNBulkActions";
import { CDNFilePreview } from "./CDNFilePreview";
import type { CDNFile } from "@/types/cdn";
import { CDN_FILE_TYPE_FILTERS } from "@/types/cdn";

type SortField = "name" | "path" | "size" | "modified";
type SortDirection = "asc" | "desc";

export const CDNManagementTab: React.FC = () => {
  // Data fetching
  const { data: files = [], isLoading, error, refetch } = useCDNFiles();
  const { data: directoriesData } = useCDNDirectories();

  // Operations
  const operations = useCDNFileOperations();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<CDNFile | null>(null);

  // Filtered and sorted files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter((file) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !file.name.toLowerCase().includes(query) &&
          !file.path.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Directory filter
      if (directoryFilter && !file.path.startsWith(directoryFilter)) {
        return false;
      }

      // Type filter
      if (typeFilter && file.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "path":
          aVal = a.path.toLowerCase();
          bVal = b.path.toLowerCase();
          break;
        case "size":
          aVal = a.size;
          bVal = b.size;
          break;
        case "modified":
          aVal = new Date(a.modified).getTime();
          bVal = new Date(b.modified).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    files,
    searchQuery,
    directoryFilter,
    typeFilter,
    sortField,
    sortDirection,
  ]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDirectoryFilter("");
    setTypeFilter("");
  };

  const handleToggleSelect = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredAndSortedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredAndSortedFiles.map((f) => f.path)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedFiles(new Set());
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const allSelected =
    filteredAndSortedFiles.length > 0 &&
    selectedFiles.size === filteredAndSortedFiles.length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <CDNUploadZone
        onUploadSuccess={() => {
          refetch();
        }}
      />

      {/* Directory Statistics */}
      {directoriesData && (
        <CDNDirectoryStats directories={directoriesData.directories} />
      )}

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Directory Filter */}
          <select
            value={directoryFilter}
            onChange={(e) => setDirectoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Directories</option>
            <option value="models">models</option>
            <option value="manifests">manifests</option>
            <option value="emotes">emotes</option>
            <option value="music">music</option>
            <option value="world">world</option>
            <option value="web">web</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CDN_FILE_TYPE_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || directoryFilter || typeFilter) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Clear
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Results count */}
        <p className="text-sm text-text-tertiary mt-3">
          Showing {filteredAndSortedFiles.length} of {files.length} files
        </p>
      </div>

      {/* File List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border-primary bg-bg-secondary/30">
          <h2 className="text-lg font-semibold text-text-primary">CDN Files</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" text="Loading files..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-text-primary mb-1">
                Failed to load files
              </p>
              <p className="text-xs text-text-tertiary">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No files yet</p>
              <p className="text-xs text-text-tertiary mt-1">
                Upload files to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary/20 border-b border-border-primary">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                    Preview
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("path")}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Path
                      <SortIcon field="path" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("size")}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Size
                      <SortIcon field="size" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("modified")}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Modified
                      <SortIcon field="modified" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredAndSortedFiles.map((file) => (
                  <CDNFileRow
                    key={file.path}
                    file={file}
                    isSelected={selectedFiles.has(file.path)}
                    onToggleSelect={handleToggleSelect}
                    onPreview={setPreviewFile}
                    onDelete={() => operations.delete.mutate(file.path)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedFiles.size > 0 && (
        <CDNBulkActions
          selectedCount={selectedFiles.size}
          selectedPaths={Array.from(selectedFiles)}
          onDownload={() =>
            operations.bulkDownload.mutate(Array.from(selectedFiles))
          }
          onDelete={() =>
            operations.bulkDelete.mutate(Array.from(selectedFiles))
          }
          onDeselectAll={handleDeselectAll}
        />
      )}

      {/* Preview Modal */}
      {previewFile && (
        <CDNFilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
