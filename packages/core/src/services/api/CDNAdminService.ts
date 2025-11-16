/**
 * CDN Admin Service
 * API client for CDN file management operations
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

class CDNAdminService {
  private baseUrl = "/api/admin/cdn";

  /**
   * Fetch all CDN files
   */
  async getFiles(): Promise<CDNFile[]> {
    const response = await fetch(`${this.baseUrl}/files`);
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    const data: CDNFileResponse = await response.json();
    return data.files;
  }

  /**
   * Fetch directory statistics
   */
  async getDirectories(): Promise<CDNDirectoriesResponse> {
    const response = await fetch(`${this.baseUrl}/directories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch directories: ${response.statusText}`);
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
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Upload failed: ${response.statusText}`);
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
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Delete failed: ${response.statusText}`);
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
      },
      body: JSON.stringify({ oldPath, newName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Rename failed: ${response.statusText}`);
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
      },
      body: JSON.stringify({ filePaths }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || `Bulk download failed: ${response.statusText}`,
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
      },
      body: JSON.stringify({ filePaths }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || `Bulk delete failed: ${response.statusText}`,
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
