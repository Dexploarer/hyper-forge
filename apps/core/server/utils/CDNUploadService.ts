/**
 * CDN Upload Service - Centralized CDN Upload Logic
 *
 * Eliminates code duplication across GenerationService, RetextureService, and MediaStorageService.
 * Handles all CDN uploads with proper error handling, logging, and type safety.
 */

import { env } from "../config/env";
import { logger } from "./logger";

// ==================== Type Definitions ====================

/**
 * Represents a single file to upload to CDN
 */
export interface CDNUploadFile {
  /** File contents as Buffer or ArrayBuffer */
  buffer: Buffer | ArrayBuffer;
  /** File name (will be prefixed with assetId directory) */
  fileName: string;
  /** MIME type (e.g., "model/gltf-binary", "image/png") */
  mimeType?: string;
  /** FormData field name (default: "files") */
  fieldName?: string;
}

/**
 * Options for CDN upload operation
 */
export interface CDNUploadOptions {
  /** Asset ID for directory structure (e.g., "arrows-base" -> "models/arrows-base/") */
  assetId: string;
  /** Base directory on CDN (e.g., "models", "media") - defaults to "models" */
  directory?: string;
  /** User ID for ownership tracking */
  userId?: string;
  /** Additional metadata to include with upload (sent as JSON string) */
  metadata?: Record<string, unknown>;
  /** Custom fetch function for testing */
  fetchFn?: typeof fetch;
}

/**
 * Result of a single file upload
 */
export interface CDNUploadFileResult {
  /** Full path on CDN */
  path: string;
  /** Publicly accessible URL */
  url: string;
  /** File size in bytes */
  size: number;
}

/**
 * CDN upload response
 */
export interface CDNUploadResult {
  /** Whether upload succeeded */
  success: boolean;
  /** Array of uploaded files with paths and URLs */
  files: CDNUploadFileResult[];
}

/**
 * CDN configuration validation result
 */
interface CDNConfig {
  url: string;
  apiKey: string;
}

// ==================== Service Class ====================

/**
 * Centralized CDN Upload Service
 *
 * Usage:
 * ```typescript
 * import { cdnUploadService } from "../utils/CDNUploadService";
 *
 * const result = await cdnUploadService.upload(
 *   [{ buffer: modelBuffer, fileName: "asset.glb", mimeType: "model/gltf-binary" }],
 *   { assetId: "my-asset", directory: "models" }
 * );
 * ```
 */
export class CDNUploadService {
  private fetchFn: typeof fetch;

  constructor(config?: { fetchFn?: typeof fetch }) {
    this.fetchFn = config?.fetchFn || fetch;
  }

  /**
   * Validate CDN configuration from environment
   * @throws {Error} If CDN_URL or CDN_API_KEY is not configured
   */
  private validateCDNConfig(): CDNConfig {
    const cdnUrl = env.CDN_URL;
    const cdnApiKey = env.CDN_API_KEY;

    if (!cdnUrl || !cdnApiKey) {
      throw new Error(
        "CDN_URL and CDN_API_KEY must be configured for CDN uploads. " +
          "Please set these environment variables in your .env file.",
      );
    }

    return { url: cdnUrl, apiKey: cdnApiKey };
  }

  /**
   * Upload multiple files to CDN
   *
   * @param files - Array of files to upload
   * @param options - Upload options (assetId, directory, metadata, etc.)
   * @returns Upload result with success status and file details
   * @throws {Error} If CDN config is invalid or upload fails
   */
  async upload(
    files: CDNUploadFile[],
    options: CDNUploadOptions,
  ): Promise<CDNUploadResult> {
    // Validate inputs
    if (!files || files.length === 0) {
      throw new Error("At least one file must be provided for CDN upload");
    }

    if (!options.assetId) {
      throw new Error("assetId is required for CDN upload");
    }

    // Validate CDN configuration
    const config = this.validateCDNConfig();
    const directory = options.directory || "models";

    logger.info(
      {
        assetId: options.assetId,
        fileCount: files.length,
        directory,
        userId: options.userId,
      },
      "CDN Upload: Starting upload",
    );

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add each file to FormData
    for (const file of files) {
      // Convert Buffer/ArrayBuffer to Uint8Array for Blob compatibility
      const buffer =
        file.buffer instanceof Buffer
          ? new Uint8Array(file.buffer)
          : new Uint8Array(file.buffer);

      // Create Blob with proper MIME type
      const mimeType = file.mimeType || "application/octet-stream";
      const blob = new Blob([buffer], { type: mimeType });

      // Append to FormData with directory structure: {directory}/{assetId}/{fileName}
      const fieldName = file.fieldName || "files";
      const fullPath = `${options.assetId}/${file.fileName}`;
      formData.append(fieldName, blob, fullPath);
    }

    // Add directory field (CDN uses this to route files)
    formData.append("directory", directory);

    // Add metadata if provided (CDN webhook can parse this)
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }

    // Perform upload with retry logic
    try {
      const response = await this.uploadWithRetry(
        `${config.url}/api/upload`,
        formData,
        config.apiKey,
        options.assetId,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CDN upload failed with status ${response.status}: ${errorText}`,
        );
      }

      // Parse response
      const result = (await response.json()) as CDNUploadResult;

      if (!result.success) {
        throw new Error("CDN upload reported failure in response");
      }

      if (!result.files || result.files.length === 0) {
        logger.warn(
          { assetId: options.assetId },
          "CDN upload succeeded but returned no files",
        );
      }

      logger.info(
        {
          assetId: options.assetId,
          uploadedFileCount: result.files?.length || 0,
          directory,
        },
        "CDN Upload: Successfully uploaded files",
      );

      return result;
    } catch (error) {
      logger.error(
        {
          err: error,
          assetId: options.assetId,
          fileCount: files.length,
          directory,
        },
        "CDN Upload: Failed to upload files",
      );
      throw error;
    }
  }

  /**
   * Upload with automatic retry on network errors
   * @private
   */
  private async uploadWithRetry(
    url: string,
    formData: FormData,
    apiKey: string,
    assetId: string,
    maxRetries = 3,
    retryDelayMs = 1000,
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchFn(url, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData as any,
        });

        // Return on success or client errors (4xx - don't retry)
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // Server errors (5xx) - retry
        lastError = new Error(
          `CDN upload attempt ${attempt}/${maxRetries} failed with status ${response.status}`,
        );
        logger.warn(
          {
            assetId,
            attempt,
            maxRetries,
            status: response.status,
          },
          "CDN upload attempt failed, retrying...",
        );
      } catch (error) {
        // Network errors - retry
        lastError = error as Error;
        logger.warn(
          {
            err: error,
            assetId,
            attempt,
            maxRetries,
          },
          "CDN upload network error, retrying...",
        );
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    throw new Error(
      `CDN upload failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
    );
  }

  /**
   * Upload a single file to CDN (convenience method)
   *
   * @param file - Single file to upload
   * @param options - Upload options
   * @returns Upload result
   */
  async uploadSingle(
    file: CDNUploadFile,
    options: CDNUploadOptions,
  ): Promise<CDNUploadResult> {
    return this.upload([file], options);
  }

  /**
   * Check if CDN is configured and accessible
   * @returns true if CDN is configured and reachable
   */
  async healthCheck(): Promise<{
    configured: boolean;
    reachable: boolean;
    message: string;
  }> {
    // Check configuration
    try {
      const config = this.validateCDNConfig();

      // Try to reach CDN health endpoint
      try {
        const response = await this.fetchFn(`${config.url}/api/health`, {
          method: "GET",
          headers: {
            "X-API-Key": config.apiKey,
          },
        });

        if (response.ok) {
          return {
            configured: true,
            reachable: true,
            message: "CDN is configured and reachable",
          };
        }

        return {
          configured: true,
          reachable: false,
          message: `CDN returned status ${response.status}`,
        };
      } catch (error) {
        return {
          configured: true,
          reachable: false,
          message: `CDN unreachable: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    } catch (error) {
      return {
        configured: false,
        reachable: false,
        message: error instanceof Error ? error.message : "CDN not configured",
      };
    }
  }
}

// ==================== Singleton Export ====================

/**
 * Singleton instance of CDN upload service
 * Use this throughout the application for CDN uploads
 */
export const cdnUploadService = new CDNUploadService();
