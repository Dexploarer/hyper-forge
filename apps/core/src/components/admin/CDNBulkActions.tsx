/**
 * CDN Bulk Actions
 * Floating toolbar for bulk operations on selected files
 */

import React from "react";
import { Download, Trash2, CheckCircle, X } from "lucide-react";
import { LoadingSpinner } from "@/components/common";

interface CDNBulkActionsProps {
  selectedCount: number;
  selectedPaths: string[];
  onDownload: () => void;
  onDelete: () => void;
  onDeselectAll: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export const CDNBulkActions: React.FC<CDNBulkActionsProps> = ({
  selectedCount,
  selectedPaths,
  onDownload,
  onDelete,
  onDeselectAll,
  isDownloading = false,
  isDeleting = false,
}) => {
  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedCount} file(s)? This action cannot be undone.`,
      )
    ) {
      onDelete();
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="card px-6 py-4 border border-primary/30 bg-bg-secondary shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-white font-medium">
              {selectedCount} file(s) selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDownloading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download as ZIP
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              Delete Selected
            </button>
            <button
              onClick={onDeselectAll}
              className="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover text-text-primary font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
