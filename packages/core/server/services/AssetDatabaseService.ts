/**
 * Asset Database Service
 * Syncs file-based assets with PostgreSQL database
 * Automatically indexes to Qdrant vector database for semantic search
 */

import { db } from "../db/db";
import { logger } from '../utils/logger';
import { assets, type Asset, type NewAsset } from "../db/schema";
import { eq } from "drizzle-orm";
import type { AssetMetadataType } from "../models";
import { embeddingService } from "./EmbeddingService";
import { qdrantService } from "./QdrantService";

export class AssetDatabaseService {
  /**
   * Create asset record from file metadata
   * Uses transaction to ensure database record is created atomically
   */
  async createAssetRecord(
    assetId: string,
    metadata: AssetMetadataType,
    ownerId: string,
    filePath: string,
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
            filePath,
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

        console.log(
          `[AssetDatabaseService] Created database record for asset: ${assetId}`,
        );

        return newAsset;
      });

      // Generate and index embedding (async, don't block)
      this.indexAssetEmbedding(asset).catch((error) => {
        console.warn(
          `[AssetDatabaseService] Failed to index embedding for ${assetId}:`,
          error,
        );
      });

      return asset;
    } catch (error) {
      console.error(
        `[AssetDatabaseService] Failed to create asset record:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update asset record in database
   */
  async updateAssetRecord(
    assetId: string,
    updates: Partial<NewAsset>,
  ): Promise<Asset | null> {
    try {
      // Find asset by filePath pattern (contains assetId)
      const existingAssets = await db
        .select()
        .from(assets)
        .where(eq(assets.filePath, `${assetId}/${assetId}.glb`))
        .limit(1);

      if (existingAssets.length === 0) {
        console.warn(
          `[AssetDatabaseService] No database record found for asset: ${assetId}`,
        );
        return null;
      }

      const [updated] = await db
        .update(assets)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, existingAssets[0].id))
        .returning();

      console.log(
        `[AssetDatabaseService] Updated database record for asset: ${assetId}`,
      );

      // Regenerate and update embedding (async, don't block)
      this.indexAssetEmbedding(updated).catch((error) => {
        console.warn(
          `[AssetDatabaseService] Failed to re-index embedding for ${assetId}:`,
          error,
        );
      });

      return updated;
    } catch (error) {
      console.error(
        `[AssetDatabaseService] Failed to update asset record:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete asset from database
   */
  async deleteAssetRecord(assetId: string): Promise<void> {
    try {
      // Get the asset first to find its ID
      const existingAssets = await db
        .select()
        .from(assets)
        .where(eq(assets.filePath, `${assetId}/${assetId}.glb`))
        .limit(1);

      // Delete from database
      await db
        .delete(assets)
        .where(eq(assets.filePath, `${assetId}/${assetId}.glb`));

      console.log(
        `[AssetDatabaseService] Deleted database record for asset: ${assetId}`,
      );

      // Delete from Qdrant (async, don't block)
      if (existingAssets.length > 0 && process.env.QDRANT_URL) {
        qdrantService.delete("assets", existingAssets[0].id).catch((error) => {
          console.warn(
            `[AssetDatabaseService] Failed to delete embedding for ${assetId}:`,
            error,
          );
        });
      }
    } catch (error) {
      console.error(
        `[AssetDatabaseService] Failed to delete asset record:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get asset with owner info
   */
  async getAssetWithOwner(assetId: string): Promise<Asset | null> {
    try {
      const result = await db
        .select()
        .from(assets)
        .where(eq(assets.filePath, `${assetId}/${assetId}.glb`))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error({, error }, '[AssetDatabaseService] Failed to get asset:');
      return null;
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

      console.log(
        `[AssetDatabaseService] Indexed embedding for asset: ${asset.id}`,
      );
    } catch (error) {
      // Log but don't throw - embedding indexing is not critical
      logger.warn({, error }, '[AssetDatabaseService] Failed to index embedding:');
    }
  }
}

// Export singleton instance
export const assetDatabaseService = new AssetDatabaseService();
