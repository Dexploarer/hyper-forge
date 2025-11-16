/**
 * CDN Admin Service
 * API client for CDN file management operations
 *
 * Note: Uses apiFetch instead of Eden Treaty due to nested /api/admin/cdn prefix
 * Eden Treaty has issues with deeply nested route prefixes
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
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/utils/auth-token-store";

class CDNAdminService {
  private baseUrl = "/api/admin/cdn";

  /**
   * Get auth headers for requests
   */
  private getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Fetch all CDN files
   */
  async getFiles(): Promise<CDNFile[]> {
    const response = await fetch(`${this.baseUrl}/files`, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch CDN files:", errorText);
      throw new Error(
        `Failed to fetch files: ${errorText || response.statusText}`,
      );
    }

    const data: CDNFileResponse = await response.json();
    return data.files;
  }

  /**
   * Fetch directory statistics
   */
  async getDirectories(): Promise<CDNDirectoriesResponse> {
    const response = await fetch(`${this.baseUrl}/directories`, {
      headers: this.getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch CDN directories:", errorText);
      throw new Error(
        `Failed to fetch directories: ${errorText || response.statusText}`,
      );
    }

    return response.json();
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

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CDN upload failed:", errorText);
      throw new Error(`Upload failed: ${errorText || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a single file
   */
  async deleteFile(filePath: string): Promise<CDNDeleteResponse> {
    const response = await fetch(
      `${this.baseUrl}/delete/${encodeURIComponent(filePath)}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CDN delete failed:", errorText);
      throw new Error(`Delete failed: ${errorText || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Rename a file
   */
  async renameFile(
    oldPath: string,
    newName: string,
  ): Promise<CDNRenameResponse> {
    const response = await fetch(`${this.baseUrl}/rename`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ oldPath, newPath: newName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CDN rename failed:", errorText);
      throw new Error(`Rename failed: ${errorText || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download a single file
   */
  downloadFile(filePath: string): void {
    window.open(`/${filePath}`, "_blank");
  }

  /**
   * Bulk download multiple files as ZIP
   */
  async bulkDownload(filePaths: string[]): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/bulk-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ paths: filePaths }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CDN bulk download failed:", errorText);
      throw new Error(
        `Bulk download failed: ${errorText || response.statusText}`,
      );
    }

    return response.blob();
  }

  /**
   * Bulk delete multiple files
   */
  async bulkDelete(filePaths: string[]): Promise<CDNBulkDeleteResponse> {
    const response = await fetch(`${this.baseUrl}/bulk-delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({ paths: filePaths }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CDN bulk delete failed:", errorText);
      throw new Error(
        `Bulk delete failed: ${errorText || response.statusText}`,
      );
    }

    return response.json();
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
