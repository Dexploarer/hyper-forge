/**
 * Media Storage Service
 * Handles persistent storage of generated media (portraits, voices, music)
 */

import { db } from "../db";
import { mediaAssets, type NewMediaAsset } from "../db/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..", "..");

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
  private mediaRoot: string;

  constructor() {
    this.mediaRoot = path.join(ROOT_DIR, "gdd-assets", "media");
  }

  /**
   * Save media file to filesystem and create database record
   */
  async saveMedia(params: SaveMediaParams): Promise<{
    id: string;
    fileUrl: string;
    filePath: string;
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

    // Build file path: /gdd-assets/media/{type}/{entity_type}/{entity_id}/{fileName}
    let relativePath = path.join(type);

    if (entityType && entityId) {
      relativePath = path.join(relativePath, entityType, entityId);
    }

    const dirPath = path.join(this.mediaRoot, relativePath);
    const filePath = path.join(dirPath, fileName);

    // Ensure directory exists
    await fs.promises.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.promises.writeFile(filePath, data);

    console.log(`[MediaStorage] Saved ${type} file: ${filePath}`);

    // Generate public URL
    const fileUrl = `/gdd-assets/media/${path.join(relativePath, fileName)}`;

    // Get file size
    const stats = await fs.promises.stat(filePath);
    const fileSize = stats.size;

    // Create database record
    const [mediaAsset] = await db
      .insert(mediaAssets)
      .values({
        type,
        entityType,
        entityId,
        fileUrl,
        fileName,
        metadata: {
          ...metadata,
          fileSize,
        },
        createdBy,
      } as NewMediaAsset)
      .returning();

    console.log(`[MediaStorage] Created media asset record: ${mediaAsset.id}`);

    return {
      id: mediaAsset.id,
      fileUrl,
      filePath,
    };
  }

  /**
   * Get media assets for an entity
   */
  async getMediaForEntity(
    entityType: string,
    entityId: string,
  ): Promise<typeof mediaAssets.$inferSelect[]> {
    const assets = await db
      .select()
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.entityType, entityType),
          eq(mediaAssets.entityId, entityId)
        )
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
  ): Promise<typeof mediaAssets.$inferSelect[]> {
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

    console.log(`[MediaStorage] Found ${assets.length} ${type} assets`);

    return assets;
  }

  /**
   * Delete media asset (file and database record)
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    // Get the media asset record
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, mediaId))
      .limit(1);

    if (!asset) {
      console.warn(`[MediaStorage] Media asset not found: ${mediaId}`);
      return false;
    }

    // Delete file from filesystem
    const filePath = path.join(ROOT_DIR, asset.fileUrl);
    try {
      await fs.promises.unlink(filePath);
      console.log(`[MediaStorage] Deleted file: ${filePath}`);
    } catch (error) {
      console.warn(
        `[MediaStorage] Could not delete file: ${filePath}`,
        error,
      );
      // Continue to delete database record even if file deletion fails
    }

    // Delete database record
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));

    console.log(`[MediaStorage] Deleted media asset: ${mediaId}`);

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
}
