/**
 * Media Storage Service - CDN-First Architecture
 * Uploads media files directly to CDN (portraits, voices, music)
 * Webhook automatically creates database records after successful upload
 */

import { db } from "../db";
import { logger } from '../utils/logger';
import { mediaAssets, type NewMediaAsset } from "../db/schema";
import { eq, and } from "drizzle-orm";

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
    voiceSettings?: Record<string, any>;
    imageSettings?: Record<string, any>;
    duration?: number;
    mimeType?: string;
    [key: string]: any;
  };
  createdBy?: string;
}

export class MediaStorageService {
  private cdnUrl: string;
  private cdnApiKey: string;

  constructor() {
    this.cdnUrl =
      process.env.CDN_URL ||
      (() => {
        if (process.env.NODE_ENV === "production") {
          throw new Error("CDN_URL must be set in production environment");
        }
        return "http://localhost:3005";
      })();

    this.cdnApiKey = process.env.CDN_API_KEY || "";

    if (!this.cdnApiKey) {
      console.warn(
        "[MediaStorageService] CDN_API_KEY not set - media uploads will fail!",
      );
    }
  }

  /**
   * Upload media file to CDN
   * CDN webhook will automatically create database record with CDN URLs
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
      // Build directory structure: media/{type}/{entity_type}/{entity_id}/
      const directoryParts: string[] = [type];
      if (entityType) directoryParts.push(entityType);
      if (entityId) directoryParts.push(entityId);

      const directory = directoryParts.join("/");
      const fullPath = `${directory}/${fileName}`;

      // Get file size for metadata
      const fileSize = data.byteLength || data.length;

      // Create FormData for CDN upload
      const formData = new FormData();

      // Convert Buffer/Uint8Array to Blob
      const buffer =
        data instanceof Buffer ? new Uint8Array(data) : new Uint8Array(data);
      const blob = new Blob([buffer], {
        type: metadata.mimeType || this.getMimeType(fileName),
      });

      formData.append("files", blob, fullPath);
      formData.append("directory", "media");

      // Add metadata as JSON (CDN webhook will parse this)
      const uploadMetadata = {
        type,
        entityType,
        entityId,
        fileName,
        metadata: {
          ...metadata,
          fileSize,
        },
        createdBy,
      };
      formData.append("metadata", JSON.stringify(uploadMetadata));

      logger.info({ context: 'MediaStorage' }, 'Uploading ${type} to CDN: ${fullPath}');

      // Upload to CDN
      const response = await fetch(`${this.cdnUrl}/api/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": this.cdnApiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CDN upload failed (${response.status}): ${errorText}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        files: Array<{ path: string; url: string; size: number }>;
      };

      if (!result.success || !result.files || result.files.length === 0) {
        throw new Error("CDN upload succeeded but no files were returned");
      }

      const uploadedFile = result.files[0];
      const cdnUrl = `${this.cdnUrl}/media/${fullPath}`;

      logger.info({ }, '✅ [MediaStorage] Uploaded to CDN: ${cdnUrl}');
      logger.info({ }, '   CDN webhook will create database record automatically');

      // Note: We generate a temporary ID here since the webhook will create the actual record
      // In a real implementation, you might want to poll the database or use a different approach
      const tempId = `temp-${Date.now()}`;

      return {
        id: tempId,
        cdnUrl,
        fileName,
      };
    } catch (error) {
      logger.error({, error }, '[MediaStorage] Failed to upload media:');
      throw new Error(
        `Media upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    console.log(
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

    logger.info({ context: 'MediaStorage' }, 'Found ${assets.length} ${type} assets');

    return assets;
  }

  /**
   * Delete media asset from CDN and database
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    // Get the media asset record
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, mediaId))
      .limit(1);

    if (!asset) {
      logger.warn({ }, '[MediaStorage] Media asset not found: ${mediaId}');
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
          console.warn(
            `[MediaStorage] Failed to delete from CDN: ${response.statusText}`,
          );
        } else {
          logger.info({ context: 'MediaStorage' }, 'Deleted from CDN: ${filePath}');
        }
      } catch (error) {
        logger.warn({, error }, '[MediaStorage] Could not delete from CDN:');
        // Continue to delete database record even if CDN deletion fails
      }
    }

    // Delete database record
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));

    logger.info({ context: 'MediaStorage' }, 'Deleted media asset: ${mediaId}');

    return true;
  }

  /**
   * Get media asset by ID
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
