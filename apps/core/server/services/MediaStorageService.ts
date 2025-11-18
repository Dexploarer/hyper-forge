/**
 * Media Storage Service - CDN-First Architecture
 * Uploads media files directly to CDN (portraits, voices, music)
 * Webhook automatically creates database records after successful upload
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import {
  mediaAssets,
  type NewMediaAsset,
  type VoiceSettings,
  type ImageSettings,
} from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { fileUploadsCounter, getFileExtension } from "../metrics/business";
import { cdnUploadService } from "../utils/CDNUploadService";

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
      logger.warn(
        "[MediaStorageService] CDN_API_KEY not set - media uploads will fail!",
      );
    }
  }

  /**
   * Upload media file to CDN and create database record
   * Creates database record directly for data consistency
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

      // Build directory structure: media/{type}/{entity_type}/{entity_id}/
      const directoryParts: string[] = [type];
      if (entityType) directoryParts.push(entityType);
      if (entityId) directoryParts.push(entityId);

      const directory = directoryParts.join("/");
      const fullPath = `${directory}/${sanitizedFileName}`;

      // Prepare metadata for CDN upload
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

      logger.info(
        { context: "MediaStorage" },
        `Uploading ${type} to CDN: ${fullPath}`,
      );

      // Convert Uint8Array to Buffer if needed (CDNUploadService expects Buffer | ArrayBuffer)
      const buffer = data instanceof Buffer ? data : Buffer.from(data);

      // Upload to CDN using shared service
      const result = await cdnUploadService.uploadSingle(
        {
          buffer,
          fileName: sanitizedFileName,
          mimeType: metadata.mimeType || this.getMimeType(fileName),
        },
        {
          assetId: directory,
          directory: "media",
          userId: createdBy,
          metadata: uploadMetadata,
        },
      );

      if (!result.success || !result.files || result.files.length === 0) {
        throw new Error("CDN upload succeeded but no files were returned");
      }

      // CDN returns path, we need to construct full URL
      const cdnPath = result.files[0].path;
      const cdnUrl = `${this.cdnUrl}/${cdnPath}`;

      logger.info({ context: "MediaStorage" }, `✅ Uploaded to CDN: ${cdnUrl}`);

      fileUploadsCounter.inc({
        file_type: getFileExtension(fileName) || "unknown",
      });

      // Create database record directly for data consistency
      // This ensures we have a reliable record even if webhooks fail
      const [dbRecord] = await db
        .insert(mediaAssets)
        .values({
          type,
          entityType: entityType || null,
          entityId: entityId || null,
          fileName: sanitizedFileName,
          cdnUrl,
          metadata: {
            ...metadata,
            fileSize,
          },
          createdBy: createdBy || null,
        })
        .returning();

      if (!dbRecord) {
        throw new Error("Failed to create database record after CDN upload");
      }

      logger.info(
        { context: "MediaStorage", id: dbRecord.id },
        `✅ Created database record for media asset`,
      );

      return {
        id: dbRecord.id,
        cdnUrl,
        fileName: sanitizedFileName,
      };
    } catch (error) {
      logger.error({ err: error }, "[MediaStorage] Failed to upload media:");
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
    options?: {
      limit?: number;
      createdBy?: string;
      includeUnassigned?: boolean;
    },
  ): Promise<(typeof mediaAssets.$inferSelect)[]> {
    // Build where conditions
    const conditions = [eq(mediaAssets.type, type)];

    // If includeUnassigned is true, fetch all unassigned voices (for assignment to entities)
    // Otherwise, filter by creator (default behavior)
    if (options?.includeUnassigned) {
      // Only include unassigned voices (entityType and entityId are null)
      conditions.push(isNull(mediaAssets.entityType));
      conditions.push(isNull(mediaAssets.entityId));
    } else if (options?.createdBy) {
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
      `Found ${assets.length} ${type} assets${options?.includeUnassigned ? " (unassigned only)" : ""}`,
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
   * Assign voice file to an entity (NPC, quest, etc.)
   * Updates the entityType and entityId fields to link the voice to the entity
   */
  async assignVoiceToEntity(
    voiceId: string,
    entityType: string,
    entityId: string,
  ): Promise<typeof mediaAssets.$inferSelect> {
    // Verify the media asset exists and is a voice file
    const [existing] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, voiceId))
      .limit(1);

    if (!existing) {
      throw new Error(`Voice file not found: ${voiceId}`);
    }

    if (existing.type !== "voice") {
      throw new Error(
        `Media asset ${voiceId} is type '${existing.type}', not 'voice'`,
      );
    }

    // Update the entity assignment
    const [updated] = await db
      .update(mediaAssets)
      .set({
        entityType,
        entityId,
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, voiceId))
      .returning();

    logger.info(
      {
        context: "VoiceAssignment",
        voiceId,
        entityType,
        entityId,
      },
      `Assigned voice to ${entityType}:${entityId}`,
    );

    return updated;
  }

  /**
   * Unassign voice file from its current entity
   * Clears the entityType and entityId fields
   */
  async unassignVoice(
    voiceId: string,
  ): Promise<typeof mediaAssets.$inferSelect> {
    // Verify the media asset exists and is a voice file
    const [existing] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, voiceId))
      .limit(1);

    if (!existing) {
      throw new Error(`Voice file not found: ${voiceId}`);
    }

    if (existing.type !== "voice") {
      throw new Error(
        `Media asset ${voiceId} is type '${existing.type}', not 'voice'`,
      );
    }

    // Clear the entity assignment
    const [updated] = await db
      .update(mediaAssets)
      .set({
        entityType: null,
        entityId: null,
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, voiceId))
      .returning();

    logger.info(
      {
        context: "VoiceAssignment",
        voiceId,
      },
      `Unassigned voice from entity`,
    );

    return updated;
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
