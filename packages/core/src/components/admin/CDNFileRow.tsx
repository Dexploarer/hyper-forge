/**
 * CDN File Row
 * Table row component for individual CDN files
 */

import React from "react";
import { Download, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/common";
import { cdnAdminService } from "@/services/api/CDNAdminService";
import type { CDNFile } from "@/types/cdn";

interface CDNFileRowProps {
  file: CDNFile;
  isSelected: boolean;
  onToggleSelect: (filePath: string) => void;
  onPreview: (file: CDNFile) => void;
  onDelete: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFileTypeBadgeVariant = (type: string) => {
  switch (type) {
    case ".glb":
      return "secondary";
    case ".json":
      return "success";
    case ".mp3":
      return "warning";
    case ".png":
    case ".jpg":
    case ".jpeg":
      return "secondary";
    default:
      return "secondary";
  }
};

const canPreview = (type: string): boolean => {
  return [
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".glb",
    ".mp3",
    ".mp4",
  ].includes(type);
};

const getThumbnail = (file: CDNFile): React.JSX.Element => {
  const type = file.type.toLowerCase();

  // Image files - show actual thumbnail
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(type)) {
    return (
      <img
        src={`/${file.path}`}
        alt={file.name}
        className="w-12 h-12 object-cover rounded"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Other files - show icon placeholder
  return (
    <div className="w-12 h-12 bg-bg-tertiary rounded flex items-center justify-center">
      <span className="text-xs font-medium text-text-tertiary">
        {type.substring(1).toUpperCase()}
      </span>
    </div>
  );
};

export const CDNFileRow: React.FC<CDNFileRowProps> = ({
  file,
  isSelected,
  onToggleSelect,
  onPreview,
  onDelete,
}) => {
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      onDelete();
    }
  };

  return (
    <tr
      className={`hover:bg-bg-tertiary/10 transition-colors ${isSelected ? "bg-primary/10" : ""}`}
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(file.path)}
          className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
        />
      </td>
      <td className="px-4 py-4 whitespace-nowrap">{getThumbnail(file)}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Badge variant={getFileTypeBadgeVariant(file.type)}>
            {file.type}
          </Badge>
          <span className="font-medium text-text-primary">{file.name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-text-secondary">{file.path}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
        {formatBytes(file.size)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
        {formatDate(file.modified)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <button
            onClick={() => cdnAdminService.downloadFile(file.path)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors flex items-center gap-1"
            title="Download"
          >
            <Download size={12} />
            Download
          </button>
          {canPreview(file.type) && (
            <button
              onClick={() => onPreview(file)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-colors flex items-center gap-1"
              title="Preview"
            >
              <Eye size={12} />
              Preview
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors flex items-center gap-1"
            title="Delete"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};
