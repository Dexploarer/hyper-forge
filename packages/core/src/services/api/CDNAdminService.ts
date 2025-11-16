/**
 * CDN Admin Service
 * API client for CDN file management operations using Eden Treaty
 */

import type {
  CDNFile,
  CDNFileResponse,
  CDNDirectoriesResponse,
  CDNUploadResponse,
  CDNDeleteResponse,
  CDNRenameResponse,
  CDNBulkDownloadResponse,
  CDNBulkDeleteResponse,
  CDNDirectoryType,
} from "@/types/cdn";
import { api } from "@/lib/api-client";

class CDNAdminService {
  /**
   * Fetch all CDN files
   */
  async getFiles(): Promise<CDNFile[]> {
    const { data, error } = await api.api.admin.cdn.files.get();

    if (error) {
      console.error("Failed to fetch CDN files:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "Failed to fetch CDN files",
      );
    }

    return (data as CDNFileResponse).files;
  }

  /**
   * Fetch directory statistics
   */
  async getDirectories(): Promise<CDNDirectoriesResponse> {
    const { data, error } = await api.api.admin.cdn.directories.get();

    if (error) {
      console.error("Failed to fetch CDN directories:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "Failed to fetch CDN directories",
      );
    }

    return data as CDNDirectoriesResponse;
  }

  /**
   * Upload files to a specific directory
   */
  async uploadFiles(
    files: File[],
    directory: CDNDirectoryType,
  ): Promise<CDNUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("directory", directory);

    const { data, error } = await api.api.admin.cdn.upload.post(
      formData as any,
    );

    if (error) {
      console.error("CDN upload failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "CDN upload failed",
      );
    }

    return data as CDNUploadResponse;
  }

  /**
   * Delete a single file
   */
  async deleteFile(filePath: string): Promise<CDNDeleteResponse> {
    const { data, error } = await api.api.admin.cdn
      .delete({
        path: filePath,
      })
      .delete();

    if (error) {
      console.error("CDN delete failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "CDN delete failed",
      );
    }

    return data as CDNDeleteResponse;
  }

  /**
   * Rename a file
   */
  async renameFile(
    oldPath: string,
    newName: string,
  ): Promise<CDNRenameResponse> {
    const { data, error } = await api.api.admin.cdn.rename.post({
      oldPath,
      newPath: newName,
    } as any);

    if (error) {
      console.error("CDN rename failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "CDN rename failed",
      );
    }

    return data as CDNRenameResponse;
  }

  /**
   * Download a single file
   */
  downloadFile(filePath: string): void {
    window.open(`/${filePath}`, "_blank");
  }

  /**
   * Bulk download multiple files as ZIP
   * Note: Returns raw Response for binary blob handling
   */
  async bulkDownload(filePaths: string[]): Promise<Blob> {
    // For binary responses, we need to use raw fetch since Eden Treaty
    // doesn't handle blobs well. Auth is handled by credentials: "include"
    const response = await fetch("/api/admin/cdn/bulk-download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ paths: filePaths }),
    });

    if (!response.ok) {
      throw new Error(`Bulk download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Bulk delete multiple files
   */
  async bulkDelete(filePaths: string[]): Promise<CDNBulkDeleteResponse> {
    const { data, error } = await api.api.admin.cdn["bulk-delete"].post({
      paths: filePaths,
    } as any);

    if (error) {
      console.error("CDN bulk delete failed:", error);
      throw new Error(
        typeof error === "object" && error !== null && "value" in error
          ? String((error as any).value)
          : "CDN bulk delete failed",
      );
    }

    return data as CDNBulkDeleteResponse;
  }

  /**
   * Trigger ZIP download from blob
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const cdnAdminService = new CDNAdminService();
