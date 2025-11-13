/**
 * Asset Variant Repository
 * Handles database operations for asset material/texture variants
 * Normalized storage replacing JSONB variants array
 */

import { BaseRepository } from "./BaseRepository";
import { db } from "../db/db";
import {
  assetVariants,
  variantStatistics,
  type AssetVariant,
  type NewAssetVariant,
  type VariantStatistics,
  type NewVariantStatistics,
} from "../db/schema/asset-variants.schema";
import { assets } from "../db/schema/assets.schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { logger } from "../utils/logger";

/**
 * Variant with asset info
 */
export interface VariantWithAsset extends AssetVariant {
  variantAsset: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    modelUrl: string;
  };
}

/**
 * Asset Variant Repository
 */
export class AssetVariantRepository extends BaseRepository<
  typeof assetVariants,
  AssetVariant,
  NewAssetVariant
> {
  constructor() {
    super(assetVariants);
  }

  /**
   * Find variants by base asset ID
   */
  async findByBaseAssetId(
    baseAssetId: string,
    options?: {
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<AssetVariant[]> {
    try {
      const conditions = [eq(assetVariants.baseAssetId, baseAssetId)];

      if (options?.activeOnly) {
        conditions.push(eq(assetVariants.isActive, true));
      }

      return this.findMany({
        where: and(...conditions),
        orderBy: desc(assetVariants.displayOrder),
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      });
    } catch (err) {
      logger.error(
        { err, baseAssetId },
        "Failed to find variants by base asset ID",
      );
      throw err;
    }
  }

  /**
   * Find variants by preset ID
   */
  async findByPresetId(presetId: string): Promise<AssetVariant[]> {
    try {
      return this.findMany({
        where: eq(assetVariants.presetId, presetId),
        orderBy: desc(assetVariants.createdAt),
      });
    } catch (err) {
      logger.error({ err, presetId }, "Failed to find variants by preset ID");
      throw err;
    }
  }

  /**
   * Find variant with asset details
   */
  async findWithAsset(
    variantId: string,
  ): Promise<VariantWithAsset | undefined> {
    try {
      const [result] = await db
        .select({
          variant: assetVariants,
          variantAsset: {
            id: assets.id,
            name: assets.name,
            thumbnailUrl: assets.thumbnailUrl,
            modelUrl: assets.modelUrl,
          },
        })
        .from(assetVariants)
        .innerJoin(assets, eq(assetVariants.variantAssetId, assets.id))
        .where(eq(assetVariants.id, variantId))
        .limit(1);

      if (!result) {
        return undefined;
      }

      return {
        ...result.variant,
        variantAsset: result.variantAsset,
      };
    } catch (err) {
      logger.error({ err, variantId }, "Failed to find variant with asset");
      throw err;
    }
  }

  /**
   * Find variants with asset details by base asset
   */
  async findWithAssetsByBaseAssetId(
    baseAssetId: string,
  ): Promise<VariantWithAsset[]> {
    try {
      const results = await db
        .select({
          variant: assetVariants,
          variantAsset: {
            id: assets.id,
            name: assets.name,
            thumbnailUrl: assets.thumbnailUrl,
            modelUrl: assets.modelUrl,
          },
        })
        .from(assetVariants)
        .innerJoin(assets, eq(assetVariants.variantAssetId, assets.id))
        .where(eq(assetVariants.baseAssetId, baseAssetId))
        .orderBy(desc(assetVariants.displayOrder));

      return results.map((result) => ({
        ...result.variant,
        variantAsset: result.variantAsset,
      }));
    } catch (err) {
      logger.error(
        { err, baseAssetId },
        "Failed to find variants with assets by base asset ID",
      );
      throw err;
    }
  }

  /**
   * Update variant status
   */
  async updateStatus(
    variantId: string,
    status: string,
    error?: string,
  ): Promise<AssetVariant | undefined> {
    try {
      const updates: Partial<NewAssetVariant> = {
        generationStatus: status,
        updatedAt: new Date(),
      };

      if (status === "completed") {
        updates.completedAt = new Date();
      }

      if (error) {
        updates.generationError = error;
      }

      return this.update(variantId, updates);
    } catch (err) {
      logger.error(
        { err, variantId, status },
        "Failed to update variant status",
      );
      throw err;
    }
  }

  /**
   * Get or create variant statistics
   */
  async getStatistics(baseAssetId: string): Promise<VariantStatistics> {
    try {
      const [stats] = await db
        .select()
        .from(variantStatistics)
        .where(eq(variantStatistics.baseAssetId, baseAssetId))
        .limit(1);

      if (stats) {
        return stats;
      }

      // Create initial statistics
      const [newStats] = await db
        .insert(variantStatistics)
        .values({
          baseAssetId,
          totalVariants: 0,
          completedVariants: 0,
          failedVariants: 0,
          activeVariants: 0,
        })
        .returning();

      return newStats;
    } catch (err) {
      logger.error({ err, baseAssetId }, "Failed to get variant statistics");
      throw err;
    }
  }

  /**
   * Update variant statistics for a base asset
   * Recalculates from variant records
   */
  async updateStatistics(baseAssetId: string): Promise<VariantStatistics> {
    try {
      return await this.transaction(async (tx) => {
        // Get all variants for this base asset
        const variants = await tx
          .select()
          .from(assetVariants)
          .where(eq(assetVariants.baseAssetId, baseAssetId));

        // Calculate statistics
        const total = variants.length;
        const completed = variants.filter(
          (v) => v.generationStatus === "completed",
        ).length;
        const failed = variants.filter(
          (v) => v.generationStatus === "failed",
        ).length;
        const active = variants.filter((v) => v.isActive).length;

        // Get latest timestamps
        const completedVariants = variants.filter(
          (v) => v.completedAt !== null,
        );
        const lastCompleted =
          completedVariants.length > 0
            ? new Date(
                Math.max(
                  ...completedVariants.map((v) => v.completedAt!.getTime()),
                ),
              )
            : null;

        const lastCreated =
          variants.length > 0
            ? new Date(Math.max(...variants.map((v) => v.createdAt.getTime())))
            : null;

        // Upsert statistics
        const [stats] = await tx
          .insert(variantStatistics)
          .values({
            baseAssetId,
            totalVariants: total,
            completedVariants: completed,
            failedVariants: failed,
            activeVariants: active,
            lastVariantCreated: lastCreated,
            lastVariantCompleted: lastCompleted,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: variantStatistics.baseAssetId,
            set: {
              totalVariants: total,
              completedVariants: completed,
              failedVariants: failed,
              activeVariants: active,
              lastVariantCreated: lastCreated,
              lastVariantCompleted: lastCompleted,
              updatedAt: new Date(),
            },
          })
          .returning();

        return stats;
      });
    } catch (err) {
      logger.error({ err, baseAssetId }, "Failed to update variant statistics");
      throw err;
    }
  }

  /**
   * Find variant by retexture task ID
   */
  async findByRetextureTaskId(
    taskId: string,
  ): Promise<AssetVariant | undefined> {
    try {
      return this.findOne(eq(assetVariants.retextureTaskId, taskId));
    } catch (err) {
      logger.error(
        { err, taskId },
        "Failed to find variant by retexture task ID",
      );
      throw err;
    }
  }

  /**
   * Create variant and update statistics
   */
  async createAndUpdateStats(
    variantData: NewAssetVariant,
  ): Promise<AssetVariant> {
    try {
      return await this.transaction(async (tx) => {
        // Create variant
        const [variant] = await tx
          .insert(assetVariants)
          .values(variantData)
          .returning();

        // Update statistics (can't call updateStatistics here as it uses db, not tx)
        // We'll increment counts instead
        await tx
          .insert(variantStatistics)
          .values({
            baseAssetId: variantData.baseAssetId,
            totalVariants: 1,
            completedVariants: 0,
            failedVariants: 0,
            activeVariants: variantData.isActive ? 1 : 0,
            lastVariantCreated: new Date(),
          })
          .onConflictDoUpdate({
            target: variantStatistics.baseAssetId,
            set: {
              totalVariants: sql`${variantStatistics.totalVariants} + 1`,
              activeVariants: variantData.isActive
                ? sql`${variantStatistics.activeVariants} + 1`
                : variantStatistics.activeVariants,
              lastVariantCreated: new Date(),
              updatedAt: new Date(),
            },
          });

        return variant;
      });
    } catch (err) {
      logger.error(
        { err, variantData },
        "Failed to create variant and update stats",
      );
      throw err;
    }
  }

  /**
   * Get variants by status
   */
  async findByStatus(
    status: string | string[],
    limit?: number,
  ): Promise<AssetVariant[]> {
    try {
      const statusArray = Array.isArray(status) ? status : [status];
      return this.findMany({
        where: inArray(assetVariants.generationStatus, statusArray),
        orderBy: desc(assetVariants.createdAt),
        limit: limit || 100,
      });
    } catch (err) {
      logger.error({ err, status }, "Failed to find variants by status");
      throw err;
    }
  }
}

// Export singleton instance
export const assetVariantRepository = new AssetVariantRepository();
