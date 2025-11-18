/**
 * Media Storage Service - Local Volume Storage
 * Saves media files to /gdd-assets volume for generated content
 * Direct filesystem storage for persistence across deploys
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import {
  mediaAssets,
  type NewMediaAsset,
  type VoiceSettings,
  type ImageSettings,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { fileUploadsCounter, getFileExtension } from "../metrics/business";
import { cdnUploadService } from "../utils/CDNUploadService";
import * as fs from "fs";
import * as path from "path";

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  portrait: 10 * 1024 * 1024, // 10MB for images
  banner: 10 * 1024 * 1024, // 10MB for images
  voice: 50 * 1024 * 1024, // 50MB for audio
  music: 50 * 1024 * 1024, // 50MB for audio
  sound_effect: 20 * 1024 * 1024, // 20MB for audio
};

// Allowed file types
const ALLOWED_FILE_TYPES = {
  portrait: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  banner: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  voice: [".mp3", ".wav", ".ogg", ".m4a"],
  music: [".mp3", ".wav", ".ogg", ".m4a"],
  sound_effect: [".mp3", ".wav", ".ogg", ".m4a"],
};

export interface SaveMediaParams {
  type: "portrait" | "banner" | "voice" | "music" | "sound_effect";
  entityType?: "npc" | "quest" | "lore" | "location" | "world" | "dialogue";
  entityId?: string;
  fileName: string;
  data: Buffer | Uint8Array;
  metadata?: {
    prompt?: string;
    model?: string;
    voiceId?: string;
    voiceSettings?: VoiceSettings;
    imageSettings?: ImageSettings;
    duration?: number;
    mimeType?: string;
    fileSize?: number;
  };
  createdBy?: string;
}

export class MediaStorageService {
  private volumePath: string;
  private baseUrl: string;

  constructor() {
    // Use /gdd-assets volume in production, local path for development
    this.volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/gdd-assets";

    // Base URL for serving files
    this.baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3004";

    // Ensure volume directory exists
    if (!fs.existsSync(this.volumePath)) {
      logger.warn(
        `[MediaStorageService] Creating volume directory: ${this.volumePath}`,
      );
      fs.mkdirSync(this.volumePath, { recursive: true });
    }

    logger.info(
      { volumePath: this.volumePath },
      "[MediaStorageService] Initialized with volume storage",
    );
  }

  /**
   * Save media file to volume storage and create database record
   * Writes directly to /gdd-assets volume for persistence
   */
  async saveMedia(params: SaveMediaParams): Promise<{
    id: string;
    cdnUrl: string;
    fileName: string;
  }> {
    const {
      type,
      entityType,
      entityId,
      fileName,
      data,
      metadata = {},
      createdBy,
    } = params;

    try {
      // SECURITY: Validate file size
      const fileSize = data.byteLength || data.length;
      const maxSize = FILE_SIZE_LIMITS[type];
      if (fileSize > maxSize) {
        throw new Error(
          `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(0)}MB for ${type} files`,
        );
      }

      // SECURITY: Validate file type
      const fileExt = `.${fileName.split(".").pop()?.toLowerCase() || ""}`;
      const allowedTypes = ALLOWED_FILE_TYPES[type];
      if (!allowedTypes.includes(fileExt)) {
        throw new Error(
          `File type ${fileExt} not allowed for ${type}. Allowed types: ${allowedTypes.join(", ")}`,
        );
      }

      // SECURITY: Sanitize file name to prevent path traversal
      const sanitizedFileName = fileName
        .replace(/\.\./g, "") // Remove ..
        .replace(/\//g, "") // Remove /
        .replace(/\\/g, "") // Remove \
        .replace(/\0/g, "") // Remove null bytes
        .trim();

      if (!sanitizedFileName || sanitizedFileName.length === 0) {
        throw new Error("Invalid file name after sanitization");
      }

      // Build directory structure: {volumePath}/{type}/{entity_type}/{entity_id}/
      const directoryParts: string[] = [this.volumePath, type];
      if (entityType) directoryParts.push(entityType);
      if (entityId) directoryParts.push(entityId);

      const directory = path.join(...directoryParts);
      const filePath = path.join(directory, sanitizedFileName);

      // Create directory if it doesn't exist
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      logger.info(
        { context: "MediaStorage" },
        `Saving ${type} to volume: ${filePath}`,
      );

      // Convert Uint8Array to Buffer if needed
      const buffer = data instanceof Buffer ? data : Buffer.from(data);

      // Write file to volume
      fs.writeFileSync(filePath, buffer);

      // Build URL for accessing the file: /api/media/{type}/{entityType}/{entityId}/{fileName}
      const urlParts = ["/api/media", type];
      if (entityType) urlParts.push(entityType);
      if (entityId) urlParts.push(entityId);
      urlParts.push(sanitizedFileName);

      const fileUrl = `${this.baseUrl}${urlParts.join("/")}`;

      logger.info(
        { context: "MediaStorage" },
        `✅ Saved to volume: ${filePath}`,
      );

      fileUploadsCounter.inc({
        file_type: getFileExtension(fileName) || "unknown",
      });

      // Create database record
      const [dbRecord] = await db
        .insert(mediaAssets)
        .values({
          type,
          entityType: entityType || null,
          entityId: entityId || null,
          fileName: sanitizedFileName,
          cdnUrl: fileUrl,
          metadata: {
            ...metadata,
            fileSize,
            volumePath: filePath,
          },
          createdBy: createdBy || null,
        })
        .returning();

      if (!dbRecord) {
        throw new Error("Failed to create database record after file save");
      }

      logger.info(
        { context: "MediaStorage", id: dbRecord.id },
        `✅ Created database record for media asset`,
      );

      return {
        id: dbRecord.id,
        cdnUrl: fileUrl,
        fileName: sanitizedFileName,
      };
    } catch (error) {
      logger.error({ err: error }, "[MediaStorage] Failed to save media:");
      throw new Error(
        `Media save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      json: "application/json",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  /**
   * Get media assets for an entity
   */
  async getMediaForEntity(
    entityType: string,
    entityId: string,
  ): Promise<(typeof mediaAssets.$inferSelect)[]> {
    const assets = await db
      .select()
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.entityType, entityType),
          eq(mediaAssets.entityId, entityId),
        ),
      );

    logger.info(
      `[MediaStorage] Found ${assets.length} media assets for ${entityType}:${entityId}`,
    );

    return assets;
  }

  /**
   * Get media assets by type
   */
  async getMediaByType(
    type: string,
    options?: { limit?: number; createdBy?: string },
  ): Promise<(typeof mediaAssets.$inferSelect)[]> {
    // Build where conditions
    const conditions = [eq(mediaAssets.type, type)];
    if (options?.createdBy) {
      conditions.push(eq(mediaAssets.createdBy, options.createdBy));
    }

    const baseQuery = db
      .select()
      .from(mediaAssets)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    const assets = options?.limit
      ? await baseQuery.limit(options.limit)
      : await baseQuery;

    logger.info(
      { context: "MediaStorage" },
      `Found ${assets.length} ${type} assets`,
    );

    return assets;
  }

  /**
   * Delete media asset from CDN and database
   * Requires ownership validation - users can only delete their own media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    // SECURITY: Get the media asset record with ownership check
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(
        and(eq(mediaAssets.id, mediaId), eq(mediaAssets.createdBy, userId)),
      )
      .limit(1);

    if (!asset) {
      logger.warn(
        { mediaId, userId },
        "Media asset not found or access denied",
      );
      return false;
    }

    // Delete from CDN if CDN URL exists
    if (asset.cdnUrl) {
      try {
        // Extract file path from CDN URL
        const url = new URL(asset.cdnUrl);
        const filePath = url.pathname;

        const response = await fetch(`${this.cdnUrl}/api/delete`, {
          method: "DELETE",
          headers: {
            "X-API-Key": this.cdnApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: filePath }),
        });

        if (!response.ok) {
          logger.warn(
            `[MediaStorage] Failed to delete from CDN: ${response.statusText}`,
          );
        } else {
          logger.info(
            { context: "MediaStorage" },
            `Deleted from CDN: ${filePath}`,
          );
        }
      } catch (error) {
        logger.warn(
          { err: error },
          "[MediaStorage] Could not delete from CDN:",
        );
        // Continue to delete database record even if CDN deletion fails
      }
    }

    // Delete database record
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));

    logger.info({ context: "MediaStorage" }, `Deleted media asset: ${mediaId}`);

    return true;
  }

  /**
   * Get media asset by ID
   * Returns the media asset without authorization checks
   * (Authorization should be handled at route level if needed)
   */
  async getMediaById(
    mediaId: string,
  ): Promise<typeof mediaAssets.$inferSelect | null> {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, mediaId))
      .limit(1);

    return asset || null;
  }

  /**
   * Get media asset by ID with ownership validation
   * Users can only access their own media
   */
  async getMediaByIdSecure(
    mediaId: string,
    userId: string,
  ): Promise<typeof mediaAssets.$inferSelect | null> {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(
        and(eq(mediaAssets.id, mediaId), eq(mediaAssets.createdBy, userId)),
      )
      .limit(1);

    if (!asset) {
      logger.warn(
        { mediaId, userId },
        "Media asset not found or access denied",
      );
      return null;
    }

    return asset;
  }

  /**
   * Verify CDN health
   * Checks if CDN is reachable
   */
  async verifyCDNHealth(): Promise<{
    healthy: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.cdnUrl}/api/health`);
      if (response.ok) {
        return {
          healthy: true,
          message: "CDN is healthy",
        };
      }
      return {
        healthy: false,
        message: `CDN returned status ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `CDN unreachable: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get media storage statistics
   */
  async getStorageStats(): Promise<{
    totalRecords: number;
    withCdnUrl: number;
    withoutCdnUrl: number;
  }> {
    const allAssets = await db.select().from(mediaAssets);

    const withCdnUrl = allAssets.filter((a) => a.cdnUrl).length;

    return {
      totalRecords: allAssets.length,
      withCdnUrl,
      withoutCdnUrl: allAssets.length - withCdnUrl,
    };
  }
}
