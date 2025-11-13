/**
 * Asset Service
 * Handles asset listing and retrieval
 */

import path from "path";
import type { UserContextType, AssetMetadataType } from "../models";
import { assetDatabaseService } from "./AssetDatabaseService";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { desc, eq } from "drizzle-orm";

interface AssetUpdate {
  name?: string;
  type?: string;
  tier?: number;
  category?: string;
  metadata?: Record<string, unknown>;
  isFavorite?: boolean;
  status?:
    | "draft"
    | "processing"
    | "completed"
    | "failed"
    | "approved"
    | "published"
    | "archived";
  notes?: string;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  type: string;
  metadata: AssetMetadataType;
  hasModel: boolean;
  modelFile?: string;
  generatedAt?: string;
}

export class AssetService {
  private assetsDir: string;

  constructor(assetsDir: string) {
    this.assetsDir = assetsDir;
  }

  async listAssets(): Promise<Asset[]> {
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
        cdnUrl: asset.cdnUrl,
        cdnThumbnailUrl: asset.cdnThumbnailUrl,
        cdnConceptArtUrl: asset.cdnConceptArtUrl,
      }));
    } catch (error) {
      console.error("Failed to list assets:", error);
      return [];
    }
  }

  async getAssetMetadata(assetId: string): Promise<AssetMetadataType> {
    // Get metadata from database
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
    });

    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    return asset.metadata as AssetMetadataType;
  }

  async deleteAsset(
    assetId: string,
    includeVariants = false,
    userId?: string,
  ): Promise<boolean> {
    // Get asset from database
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
    });

    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
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
      }
    }

    // Delete the main asset from database
    await db.delete(assets).where(eq(assets.id, assetId));

    console.log(
      `[AssetService] Deleted asset ${assetId} from database (CDN files persist)`,
    );
    return true;
  }

  async updateAsset(
    assetId: string,
    updates: AssetUpdate,
    userId?: string,
  ): Promise<Asset | null> {
    try {
      // Get asset from database
      const asset = await db.query.assets.findFirst({
        where: eq(assets.id, assetId),
      });

      if (!asset) {
        return null;
      }

      const currentMetadata = asset.metadata as AssetMetadataType;

      // Update metadata with new values
      const updatedMetadata: AssetMetadataType = {
        ...currentMetadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      };

      // Handle direct field updates
      if (updates.isFavorite !== undefined) {
        updatedMetadata.isFavorite = updates.isFavorite;
      }
      if (updates.notes !== undefined) {
        updatedMetadata.notes = updates.notes;
      }
      if (updates.status !== undefined) {
        updatedMetadata.status = updates.status;
      }

      // Default isPublic to true if not set
      if (updatedMetadata.isPublic === undefined) {
        updatedMetadata.isPublic = true;
      }

      // Handle type change if provided
      if (updates.type && updates.type !== currentMetadata.type) {
        updatedMetadata.type = updates.type;
      }

      // Handle name change if provided
      if (updates.name && updates.name !== assetId) {
        updatedMetadata.name = updates.name;
        updatedMetadata.gameId = updates.name;

        // Update database record with new name and ID
        await db
          .update(assets)
          .set({
            id: updates.name,
            name: updates.name,
            type: updates.type || asset.type,
            metadata: updatedMetadata,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, assetId));

        // Return updated asset
        const updatedAsset = await db.query.assets.findFirst({
          where: eq(assets.id, updates.name),
        });

        if (!updatedAsset) {
          return null;
        }

        return {
          id: updatedAsset.id,
          name: updatedAsset.name,
          description: updatedAsset.description || "",
          type: updatedAsset.type,
          metadata: updatedAsset.metadata as AssetMetadataType,
          hasModel: !!updatedAsset.cdnUrl,
          modelFile: updatedAsset.cdnUrl
            ? path.basename(updatedAsset.cdnUrl)
            : undefined,
          generatedAt: updatedAsset.createdAt.toISOString(),
        };
      } else {
        // Just update metadata in database
        await assetDatabaseService.updateAssetRecord(assetId, {
          name: updates.name || asset.name,
          description: asset.description,
          type: updates.type || asset.type,
          metadata: updatedMetadata,
        });

        // Return updated asset
        const updatedAsset = await db.query.assets.findFirst({
          where: eq(assets.id, assetId),
        });

        if (!updatedAsset) {
          return null;
        }

        return {
          id: updatedAsset.id,
          name: updatedAsset.name,
          description: updatedAsset.description || "",
          type: updatedAsset.type,
          metadata: updatedAsset.metadata as AssetMetadataType,
          hasModel: !!updatedAsset.cdnUrl,
          modelFile: updatedAsset.cdnUrl
            ? path.basename(updatedAsset.cdnUrl)
            : undefined,
          generatedAt: updatedAsset.createdAt.toISOString(),
        };
      }
    } catch (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      throw error;
    }
  }
}
