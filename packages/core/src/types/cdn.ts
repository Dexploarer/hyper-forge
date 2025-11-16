/**
 * CDN Types
 * Type definitions for CDN file management
 */

export interface CDNFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: string;
  directory: string;
  cdnUrl?: string;
}

export interface CDNDirectory {
  name: string;
  fileCount: number;
  totalSize: number;
}

export interface CDNFileMetadata {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: string;
  directory: string;
  mimeType?: string;
}

export interface CDNStats {
  totalFiles: number;
  totalSize: number;
  directories: CDNDirectory[];
}

export interface CDNFileResponse {
  files: CDNFile[];
  total: number;
  stats?: CDNStats;
}

export interface CDNDirectoriesResponse {
  directories: CDNDirectory[];
}

export interface CDNUploadResponse {
  success: boolean;
  files: Array<{
    name: string;
    path: string;
    cdnUrl: string;
  }>;
  error?: string;
}

export interface CDNDeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface CDNRenameResponse {
  success: boolean;
  message: string;
  newPath: string;
  error?: string;
}

export interface CDNBulkDownloadResponse {
  success: boolean;
  error?: string;
}

export interface CDNBulkDeleteResponse {
  success: boolean;
  deleted: number;
  failed: number;
  error?: string;
}

export type CDNDirectoryType =
  | "models"
  | "manifests"
  | "emotes"
  | "music"
  | "world"
  | "web";

export const CDN_DIRECTORY_TYPES: CDNDirectoryType[] = [
  "models",
  "manifests",
  "emotes",
  "music",
  "world",
  "web",
];

export const CDN_FILE_TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "3D Models (.glb)", value: ".glb" },
  { label: "JSON (.json)", value: ".json" },
  { label: "Audio (.mp3)", value: ".mp3" },
  { label: "Images (.png)", value: ".png" },
  { label: "Images (.jpg)", value: ".jpg" },
  { label: "Fonts (.woff2)", value: ".woff2" },
];
