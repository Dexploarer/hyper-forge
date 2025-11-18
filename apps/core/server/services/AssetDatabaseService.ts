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

      // Log asset creation (non-blocking, errors are not critical)
      try {
        await ActivityLogService.logAssetCreated({
          userId: ownerId,
          assetId: asset.id,
          assetName: metadata.name || assetId,
          assetType: metadata.type || "unknown",
        });
      } catch (error) {
        logger.warn(
          { err: error, assetId, ownerId },
          "[AssetDatabaseService] Failed to log asset creation",
        );
      }

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
        // Query variants using the dedicated parentBaseModel column with ownership validation
        // This is much more efficient than loading all assets into memory
        const variants = await db
          .select()
          .from(assets)
          .where(
            and(
              eq(assets.parentBaseModel, assetId),
              eq(assets.ownerId, userId), // Only delete variants owned by this user
            ),
          );

        // Batch delete all variants in a single query for better performance
        if (variants.length > 0) {
          const variantIds = variants.map((v) => v.id);

          // Delete all variants in one query
          await db
            .delete(assets)
            .where(
              and(
                eq(assets.parentBaseModel, assetId),
                eq(assets.ownerId, userId),
              ),
            );

          // Delete variant embeddings from Qdrant (async, don't block)
          if (process.env.QDRANT_URL) {
            for (const variantId of variantIds) {
              qdrantService.delete("assets", variantId).catch((error) => {
                logger.warn(
                  `[AssetDatabaseService] Failed to delete embedding for variant ${variantId}:`,
                  error,
                );
              });
            }
          }

          logger.info(
            `[AssetDatabaseService] Deleted ${variants.length} variants for base asset: ${assetId}`,
          );
        }
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
   * Fetch asset metadata from CDN
   * Attempts to fetch metadata.json from CDN for a given asset
   */
  private async fetchCDNMetadata(
    cdnAssetId: string,
  ): Promise<AssetMetadataType | null> {
    const CDN_URL = process.env.CDN_URL;
    if (!CDN_URL) {
      return null;
    }

    try {
      const metadataUrl = `${CDN_URL}/models/${cdnAssetId}/metadata.json`;
      const response = await fetch(metadataUrl);
      if (response.ok) {
        const metadata = (await response.json()) as AssetMetadataType;
        return metadata;
      }
    } catch (error) {
      // Silently fail - CDN metadata is optional
      logger.debug(
        { err: error, cdnAssetId },
        "[AssetDatabaseService] Failed to fetch CDN metadata",
      );
    }
    return null;
  }

  /**
   * Extract CDN asset ID from CDN URL
   * Example: "https://cdn.example.com/models/spiked-helmet/spiked-helmet.glb" -> "spiked-helmet"
   */
  private extractCDNAssetId(cdnUrl: string | null): string | null {
    if (!cdnUrl) return null;
    try {
      const url = new URL(cdnUrl);
      const pathParts = url.pathname.split("/");
      // Find "models" in path and get the next segment
      const modelsIndex = pathParts.indexOf("models");
      if (modelsIndex >= 0 && modelsIndex < pathParts.length - 1) {
        return pathParts[modelsIndex + 1];
      }
    } catch (error) {
      // Invalid URL, return null
    }
    return null;
  }

  /**
   * List all assets with CDN URLs
   * Returns all assets from database ordered by creation date
   * Fetches metadata from CDN when database metadata is empty or incomplete
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

      // Process assets in parallel, fetching CDN metadata when needed
      const assetsWithMetadata = await Promise.all(
        dbAssets.map(async (asset) => {
          let metadata = (asset.metadata as AssetMetadataType) || {};

          // Check if metadata is empty or missing required fields
          const isEmpty =
            !metadata || Object.keys(metadata).length === 0 || !metadata.id;

          // Try to fetch from CDN if metadata is empty or missing id
          if (isEmpty && asset.cdnUrl) {
            // Extract CDN asset ID from URL or use metadata.cdnAssetId
            const cdnAssetId =
              (metadata as any)?.cdnAssetId ||
              this.extractCDNAssetId(asset.cdnUrl);

            if (cdnAssetId) {
              const cdnMetadata = await this.fetchCDNMetadata(cdnAssetId);
              if (cdnMetadata) {
                // Merge CDN metadata with database metadata (CDN takes precedence)
                metadata = {
                  ...metadata,
                  ...cdnMetadata,
                };
              }
            }
          }

          // Clean up metadata: convert null to undefined for optional fields
          // TypeBox t.Optional() accepts undefined but not null
          // Recursively clean nested objects and arrays
          const cleanValue = (val: any): any => {
            if (val === null) {
              return undefined;
            }
            if (Array.isArray(val)) {
              return val.map(cleanValue);
            }
            if (typeof val === "object" && val !== null) {
              const cleaned: Record<string, any> = {};
              for (const [k, v] of Object.entries(val)) {
                const cleanedVal = cleanValue(v);
                // Only include if not undefined (to keep objects clean)
                if (cleanedVal !== undefined) {
                  cleaned[k] = cleanedVal;
                }
              }
              return cleaned;
            }
            return val;
          };

          const cleanMetadata = cleanValue(metadata) as Record<string, any>;

          // Ensure metadata.id is always set to the database asset ID
          metadata = {
            ...cleanMetadata,
            id: asset.id,
            name: cleanMetadata.name || asset.name,
            description: cleanMetadata.description || asset.description || "",
            type: cleanMetadata.type || asset.type,
          } as AssetMetadataType;

          return {
        id: asset.id,
        name: asset.name,
        description: asset.description || "",
        type: asset.type,
            metadata: metadata as AssetMetadataType,
        hasModel: !!asset.cdnUrl,
        modelFile: asset.cdnUrl ? path.basename(asset.cdnUrl) : undefined,
        generatedAt: asset.createdAt.toISOString(),
        cdnUrl: asset.cdnUrl || null,
        cdnThumbnailUrl: asset.cdnThumbnailUrl,
        cdnConceptArtUrl: asset.cdnConceptArtUrl,
        // Access control fields for route-level filtering
        visibility: asset.visibility,
        ownerId: asset.ownerId,
          };
        }),
      );

      return assetsWithMetadata;
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
