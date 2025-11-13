/**
 * Asset Service
 * Handles asset listing and retrieval
 */

import fs from "fs/promises";
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
  status?: 'draft' | 'processing' | 'completed' | 'failed' | 'approved' | 'published' | 'archived';
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

interface Dependencies {
  [key: string]: {
    variants?: string[];
  };
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
        publishedToCdn: asset.publishedToCdn,
      }));
    } catch (error) {
      console.error("Failed to list assets:", error);
      return [];
    }
  }


  async getAssetMetadata(assetId: string): Promise<AssetMetadataType> {
    const metadataPath = path.join(this.assetsDir, assetId, "metadata.json");
    return JSON.parse(
      await fs.readFile(metadataPath, "utf-8"),
    ) as AssetMetadataType;
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
    if (includeVariants && asset.metadata?.isBaseModel) {
      const variants = await db
        .select()
        .from(assets)
        .where(eq(assets.metadata.parentBaseModel, assetId));

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
      const assetPath = path.join(this.assetsDir, assetId);
      const metadataPath = path.join(assetPath, "metadata.json");

      // Check if asset exists
      try {
        await fs.access(assetPath);
      } catch {
        return null;
      }

      // Read current metadata
      const currentMetadata = JSON.parse(
        await fs.readFile(metadataPath, "utf-8"),
      ) as AssetMetadataType;

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
        // Update name in metadata
        updatedMetadata.name = updates.name;
        updatedMetadata.gameId = updates.name;

        // Create new directory with new name
        const newAssetPath = path.join(this.assetsDir, updates.name);

        // Check if new name already exists
        try {
          await fs.access(newAssetPath);
          throw new Error(`Asset with name ${updates.name} already exists`);
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          // If the error is NOT "file not found", re-throw it
          if (err.code !== "ENOENT") {
            throw error;
          }
          // Otherwise, the path doesn't exist, which is what we want
        }

        // Rename directory
        await fs.rename(assetPath, newAssetPath);

        // Update metadata in new location
        await fs.writeFile(
          path.join(newAssetPath, "metadata.json"),
          JSON.stringify(updatedMetadata, null, 2),
        );

        // Update dependencies if needed
        await this.updateDependenciesAfterRename(assetId, updates.name);

        return this.loadAsset(updates.name);
      } else {
        // Just update metadata
        await fs.writeFile(
          metadataPath,
          JSON.stringify(updatedMetadata, null, 2),
        );

        // Update database record
        try {
          await assetDatabaseService.updateAssetRecord(assetId, {
            name: updatedMetadata.name,
            description: updatedMetadata.description,
            type: updatedMetadata.type,
            metadata: updatedMetadata,
          });
        } catch (error) {
          console.error(
            "[AssetService] Failed to update asset in database:",
            error,
          );
          // Continue - file update succeeded
        }

        return this.loadAsset(assetId);
      }
    } catch (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      throw error;
    }
  }

  async updateDependenciesAfterRename(
    oldId: string,
    newId: string,
  ): Promise<void> {
    const dependenciesPath = path.join(this.assetsDir, "dependencies.json");

    try {
      const dependencies = JSON.parse(
        await fs.readFile(dependenciesPath, "utf-8"),
      ) as Dependencies;

      // Update the key if it exists
      if (dependencies[oldId]) {
        dependencies[newId] = dependencies[oldId];
        delete dependencies[oldId];
      }

      // Update references in other assets
      for (const [baseId, deps] of Object.entries(dependencies)) {
        if (deps.variants && deps.variants.includes(oldId)) {
          deps.variants = deps.variants.map((id) =>
            id === oldId ? newId : id,
          );
        }
      }

      await fs.writeFile(
        dependenciesPath,
        JSON.stringify(dependencies, null, 2),
      );
    } catch (error) {
      console.log("No dependencies file to update");
    }
  }
}
