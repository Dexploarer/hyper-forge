/**
 * Asset Database Service
 *
 * Manages asset database operations with automatic vector indexing for semantic search.
 * This service syncs file-based assets with PostgreSQL and indexes them in Qdrant
 * for AI-powered search capabilities.
 *
 * @example
 * ```typescript
 * // Create a new asset record
 * const asset = await assetDatabaseService.createAssetRecord(
 *   'asset-123',
 *   { name: 'Bronze Sword', type: 'weapon', ... },
 *   'user-456',
 *   'models/asset-123/asset-123.glb'
 * );
 *
 * // Update existing asset
 * await assetDatabaseService.updateAssetRecord('asset-123', {
 *   description: 'Updated description'
 * });
 *
 * // Get asset with owner info
 * const assetWithOwner = await assetDatabaseService.getAssetWithOwner('asset-123');
 * ```
 */

import { db } from "../db/db";
import { logger } from "../utils/logger";
import { assets, type Asset, type NewAsset } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { AssetMetadataType } from "../models";
import { embeddingService } from "./EmbeddingService";
import { qdrantService } from "./QdrantService";
import { ActivityLogService } from "./ActivityLogService";
import path from "path";

export class AssetDatabaseService {
  /**
   * Create asset record from file metadata
   *
   * Creates a database record for a newly generated asset and automatically
   * indexes it to Qdrant for semantic search. Uses a transaction to ensure
   * atomic creation.
   *
   * @param assetId - Unique identifier for the asset
   * @param metadata - Asset metadata from generation pipeline
   * @param ownerId - User ID of the asset owner
   * @returns Created asset record
   * @throws Error if database transaction fails
   *
   * @example
   * ```typescript
   * const asset = await assetDatabaseService.createAssetRecord(
   *   'bronze-sword-001',
   *   { name: 'Bronze Sword', type: 'weapon', subtype: 'sword' },
   *   'user-123'
   * );
   * ```
   */
  async createAssetRecord(
    assetId: string,
    metadata: AssetMetadataType,
    ownerId: string,
  ): Promise<Asset> {
    try {
      const asset = await db.transaction(async (tx) => {
        const [newAsset] = await tx
          .insert(assets)
          .values({
            name: metadata.name || assetId,
            description: metadata.description || "",
            type: metadata.type || "unknown",
            category: metadata.subtype,
            ownerId,
            prompt: metadata.detailedPrompt || metadata.description,
            modelUsed: "meshy-5",
            generationParams: {
              workflow: metadata.workflow,
              meshyTaskId: metadata.meshyTaskId,
              quality: metadata.quality,
            },
            tags: [],
            metadata: metadata,
            status: "completed",
            visibility: metadata.isPublic ? "public" : "private",
          })
          .returning();

        logger.info(
          `[AssetDatabaseService] Created database record for asset: ${assetId}`,
        );

        return newAsset;
      });

      // Log asset creation
      await ActivityLogService.logAssetCreated({
        userId: ownerId,
        assetId: asset.id,
        assetName: metadata.name || assetId,
        assetType: metadata.type || "unknown",
      });

      // Generate and index embedding (async, don't block)
      this.indexAssetEmbedding(asset).catch((error) => {
        logger.warn(
          `[AssetDatabaseService] Failed to index embedding for ${assetId}:`,
          error,
        );
      });

      return asset;
    } catch (error) {
      logger.error(
        { err: error },
        "[AssetDatabaseService] Failed to create asset record",
      );
      throw error;
    }
  }

  /**
   * Update asset record in database
   *
   * Updates an existing asset and automatically regenerates its vector embedding
   * for updated semantic search results. Supports updating the asset ID itself.
   * Requires ownership validation - users can only update their own assets.
   *
   * @param assetId - Asset identifier (current ID)
   * @param updates - Partial asset updates to apply (can include new ID)
   * @param userId - User ID of the requester (for ownership validation)
   * @returns Updated asset record, or null if asset not found or access denied
   * @throws Error if database update fails
   *
   * @example
   * ```typescript
   * await assetDatabaseService.updateAssetRecord('bronze-sword-001', {
   *   description: 'A finely crafted bronze sword',
   *   tags: ['weapon', 'melee', 'bronze']
   * }, 'user-123');
   *
   * // Update with new ID
   * await assetDatabaseService.updateAssetRecord('old-id', {
   *   id: 'new-id',
   *   name: 'New Name'
   * }, 'user-123');
   * ```
   */
  async updateAssetRecord(
    assetId: string,
    updates: Partial<NewAsset>,
    userId: string,
  ): Promise<Asset | null> {
    try {
      // Update with ownership validation in WHERE clause
      const [updated] = await db
        .update(assets)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)))
        .returning();

      if (!updated) {
        logger.warn(
          { assetId, userId },
          "[AssetDatabaseService] Asset not found or access denied",
        );
        return null;
      }

      logger.info(
        { assetId, userId },
        "[AssetDatabaseService] Updated database record for asset",
      );

      // Regenerate and update embedding (async, don't block)
      this.indexAssetEmbedding(updated).catch((error) => {
        logger.warn(
          { err: error, assetId },
          "[AssetDatabaseService] Failed to re-index embedding",
        );
      });

      return updated;
    } catch (error) {
      logger.error(
        { err: error },
        "[AssetDatabaseService] Failed to update asset record",
      );
      throw error;
    }
  }

  /**
   * Delete asset from database
   *
   * Removes asset record from PostgreSQL and its vector embedding from Qdrant.
   * This does NOT delete the physical files from CDN - use CDN service for that.
   * Requires ownership validation - users can only delete their own assets.
   *
   * @param assetId - Asset identifier
   * @param userId - User ID of the requester (for ownership validation)
   * @param includeVariants - If true and asset is a base model, delete all variants too
   * @throws Error if database delete fails or access denied
   *
   * @example
   * ```typescript
   * await assetDatabaseService.deleteAssetRecord('bronze-sword-001', 'user-123');
   * await assetDatabaseService.deleteAssetRecord('bronze-sword-001', 'user-123', true); // Delete with variants
   * ```
   */
  async deleteAssetRecord(
    assetId: string,
    userId: string,
    includeVariants = false,
  ): Promise<void> {
    try {
      // Get asset from database with ownership check
      const asset = await db.query.assets.findFirst({
        where: and(eq(assets.id, assetId), eq(assets.ownerId, userId)),
      });

      if (!asset) {
        logger.warn(
          { assetId, userId },
          "[AssetDatabaseService] Asset not found or access denied",
        );
        throw new Error(`Asset ${assetId} not found or access denied`);
      }

      // If it's a base asset and includeVariants is true, delete all variants
      const metadata = asset.metadata as AssetMetadataType;
      if (includeVariants && metadata?.isBaseModel) {
        // Query all assets and filter variants in application code
        const allAssets = await db.select().from(assets);
        const variants = allAssets.filter((a) => {
          const assetMetadata = a.metadata as AssetMetadataType;
          return assetMetadata?.parentBaseModel === assetId;
        });

        for (const variant of variants) {
          await db.delete(assets).where(eq(assets.id, variant.id));

          // Delete variant embedding from Qdrant (async, don't block)
          if (process.env.QDRANT_URL) {
            qdrantService.delete("assets", variant.id).catch((error) => {
              logger.warn(
                `[AssetDatabaseService] Failed to delete embedding for variant ${variant.id}:`,
                error,
              );
            });
          }
        }

        logger.info(
          `[AssetDatabaseService] Deleted ${variants.length} variants for base asset: ${assetId}`,
        );
      }

      // Delete the main asset from database with ownership validation
      await db
        .delete(assets)
        .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)));

      logger.info(
        { assetId, userId },
        "[AssetDatabaseService] Deleted database record for asset",
      );

      // Delete from Qdrant (async, don't block)
      if (process.env.QDRANT_URL) {
        qdrantService.delete("assets", asset.id).catch((error) => {
          logger.warn(
            `[AssetDatabaseService] Failed to delete embedding for ${assetId}:`,
            error,
          );
        });
      }
    } catch (error) {
      logger.error(
        { err: error },
        "[AssetDatabaseService] Failed to delete asset record",
      );
      throw error;
    }
  }

  /**
   * Get asset with owner info
   *
   * Retrieves asset record from database by asset ID. Returns null if not found.
   *
   * @param assetId - Asset identifier
   * @returns Asset record with owner info, or null if not found
   *
   * @example
   * ```typescript
   * const asset = await assetDatabaseService.getAssetWithOwner('bronze-sword-001');
   * if (asset) {
   *   console.log(`Owner: ${asset.ownerId}`);
   * }
   * ```
   */
  async getAssetWithOwner(assetId: string): Promise<Asset | null> {
    try {
      const result = await db.query.assets.findFirst({
        where: eq(assets.id, assetId),
      });

      return result || null;
    } catch (error) {
      logger.error(
        { err: error },
        "[AssetDatabaseService] Failed to get asset:",
      );
      return null;
    }
  }

  /**
   * List all assets with CDN URLs
   * Returns all assets from database ordered by creation date
   *
   * @returns Array of assets with CDN URLs and metadata
   * @example
   * const assets = await assetDatabaseService.listAssets();
   */
  async listAssets() {
    try {
      // Query database for all assets
      const dbAssets = await db
        .select()
        .from(assets)
        .orderBy(desc(assets.createdAt));

      return dbAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        description: asset.description || "",
        type: asset.type,
        metadata: asset.metadata as AssetMetadataType,
        hasModel: !!asset.cdnUrl,
        modelFile: asset.cdnUrl ? path.basename(asset.cdnUrl) : undefined,
        generatedAt: asset.createdAt.toISOString(),
        cdnUrl: asset.cdnUrl || null,
        cdnThumbnailUrl: asset.cdnThumbnailUrl,
        cdnConceptArtUrl: asset.cdnConceptArtUrl,
        // Access control fields for route-level filtering
        visibility: asset.visibility,
        ownerId: asset.ownerId,
      }));
    } catch (error) {
      logger.error({ err: error }, "Failed to list assets");
      return [];
    }
  }

  /**
   * Index asset to Qdrant vector database
   * Generates embedding and upserts to vector search
   */
  private async indexAssetEmbedding(asset: Asset): Promise<void> {
    // Skip if Qdrant is not configured
    if (!process.env.QDRANT_URL) {
      return;
    }

    try {
      // Generate embedding
      const text = embeddingService.prepareAssetText(asset);
      const { embedding } = await embeddingService.generateEmbedding(text);

      // Upsert to Qdrant
      await qdrantService.upsert({
        collection: "assets",
        id: asset.id,
        vector: embedding,
        payload: {
          type: "asset",
          name: asset.name,
          assetType: asset.type,
          category: asset.category,
          tags: asset.tags,
          metadata: {
            description: asset.description,
            subtype: asset.subtype,
            status: asset.status,
            createdAt: asset.createdAt?.toISOString(),
          },
        },
      });

      logger.info(
        `[AssetDatabaseService] Indexed embedding for asset: ${asset.id}`,
      );
    } catch (error) {
      // Log but don't throw - embedding indexing is not critical
      logger.warn(
        { err: error },
        "[AssetDatabaseService] Failed to index embedding:",
      );
    }
  }
}

// Export singleton instance
export const assetDatabaseService = new AssetDatabaseService();
