/**
 * CDN Directory Stats
 * Display statistics for each CDN directory
 */

import React from "react";
import { Folder, File, HardDrive } from "lucide-react";
import type { CDNDirectory } from "@/types/cdn";

interface CDNDirectoryStatsProps {
  directories: CDNDirectory[];
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const getDirectoryColor = (name: string): string => {
  const colors: Record<string, string> = {
    models: "purple",
    manifests: "green",
    emotes: "orange",
    music: "blue",
    world: "pink",
    web: "yellow",
  };
  return colors[name] || "gray";
};

export const CDNDirectoryStats: React.FC<CDNDirectoryStatsProps> = ({
  directories,
}) => {
  const totalFiles = directories.reduce((sum, dir) => sum + dir.fileCount, 0);
  const totalSize = directories.reduce((sum, dir) => sum + dir.totalSize, 0);

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Files</p>
              <p className="text-2xl font-bold text-text-primary">
                {totalFiles}
              </p>
            </div>
            <File className="w-8 h-8 text-primary/60" />
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Size</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatBytes(totalSize)}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-green-500/60" />
          </div>
        </div>
      </div>

      {/* Directory Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {directories.map((dir) => {
          const color = getDirectoryColor(dir.name);
          return (
            <div
              key={dir.name}
              className={`card p-4 bg-gradient-to-br from-${color}-500/10 to-${color}-500/5 border border-${color}-500/20 hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Folder className={`w-5 h-5 text-${color}-400`} />
                <span className="text-sm font-medium text-text-secondary">
                  {dir.name}
                </span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {dir.fileCount}
              </div>
              <div className="text-xs text-text-tertiary">
                {formatBytes(dir.totalSize)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
