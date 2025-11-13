/**
 * CDN Publish Service
 * Publishes stable assets from asset-forge to the CDN
 * Uses API key authentication for secure uploads
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../db/db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

export interface PublishResult {
  success: boolean;
  assetId: string;
  filesPublished: string[];
  error?: string;
  cdnUrls?: string[];
  mainCdnUrl?: string; // Primary asset URL (e.g., the .glb file)
  thumbnailCdnUrl?: string;
  conceptArtCdnUrl?: string;
}

export interface CDNPublishConfig {
  cdnUrl: string;
  apiKey: string;
  assetsDir: string;
}

export class CDNPublishService {
  private cdnUrl: string;
  private apiKey: string;
  private assetsDir: string;

  constructor(config: CDNPublishConfig) {
    this.cdnUrl = config.cdnUrl;
    this.apiKey = config.apiKey;
    this.assetsDir = config.assetsDir;

    if (!this.apiKey) {
      console.warn(
        "[CDNPublishService] No API key provided - uploads may fail!",
      );
    }
  }

  /**
   * Create from environment variables
   */
  static fromEnv(assetsDir: string): CDNPublishService {
    const cdnUrl = process.env.CDN_URL || "http://localhost:3005";
    const apiKey = process.env.CDN_API_KEY || "";

    if (!apiKey) {
      console.warn(
        "[CDNPublishService] CDN_API_KEY not set in environment - uploads will fail!",
      );
    }

    return new CDNPublishService({
      cdnUrl,
      apiKey,
      assetsDir,
    });
  }

  /**
   * Publish an asset to the CDN
   */
  async publishAsset(assetId: string): Promise<PublishResult> {
    try {
      const assetPath = path.join(this.assetsDir, assetId);

      // Check if asset exists
      try {
        await fs.access(assetPath);
      } catch {
        return {
          success: false,
          assetId,
          filesPublished: [],
          error: `Asset ${assetId} not found`,
        };
      }

      // Get all files in asset directory
      const files = await fs.readdir(assetPath);
      const filesPublished: string[] = [];

      // Create form data
      const formData = new FormData();

      for (const file of files) {
        const filePath = path.join(assetPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          // Read file as blob
          const fileBuffer = await fs.readFile(filePath);
          const blob = new Blob([fileBuffer]);

          // Add to form data with directory structure
          formData.append("files", blob, `${assetId}/${file}`);
          filesPublished.push(file);
        }
      }

      formData.append("directory", "models");

      // Upload to CDN with API key authentication
      const response = await fetch(`${this.cdnUrl}/api/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          assetId,
          filesPublished: [],
          error: `CDN upload failed: ${error}`,
        };
      }

      const result = await response.json();

      // Generate CDN URLs for the published files
      const cdnUrls = filesPublished.map(
        (file) => `${this.cdnUrl}/models/${assetId}/${file}`,
      );

      // Identify specific file types
      const mainCdnUrl =
        cdnUrls.find((url) => url.endsWith(".glb")) || cdnUrls[0];
      const thumbnailCdnUrl = cdnUrls.find(
        (url) =>
          url.includes("thumbnail") ||
          url.endsWith(".png") ||
          url.endsWith(".jpg"),
      );
      const conceptArtCdnUrl = cdnUrls.find((url) => url.includes("concept"));

      console.log(
        `✅ Published ${assetId} to CDN: ${filesPublished.length} files`,
      );
      console.log(`   Main URL: ${mainCdnUrl}`);
      console.log(`   All URLs: ${cdnUrls.join(", ")}`);

      return {
        success: true,
        assetId,
        filesPublished,
        cdnUrls,
        mainCdnUrl,
        thumbnailCdnUrl,
        conceptArtCdnUrl,
      };
    } catch (error) {
      console.error(`Failed to publish ${assetId} to CDN:`, error);
      return {
        success: false,
        assetId,
        filesPublished: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Publish multiple assets to the CDN
   */
  async publishAssets(assetIds: string[]): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    for (const assetId of assetIds) {
      const result = await this.publishAsset(assetId);
      results.push(result);
    }

    return results;
  }

  /**
   * Check CDN health
   */
  async checkCDNHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.cdnUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get CDN URL for a specific asset file
   */
  getCDNUrl(assetId: string, fileName: string): string {
    return `${this.cdnUrl}/models/${assetId}/${fileName}`;
  }

  /**
   * Get all CDN URLs for an asset
   */
  async getAssetCDNUrls(assetId: string): Promise<string[]> {
    try {
      const assetPath = path.join(this.assetsDir, assetId);
      const files = await fs.readdir(assetPath);

      return files
        .filter(async (file) => {
          const filePath = path.join(assetPath, file);
          const stat = await fs.stat(filePath);
          return stat.isFile();
        })
        .map((file) => this.getCDNUrl(assetId, file));
    } catch {
      return [];
    }
  }

  /**
   * Update asset database record with CDN URLs
   * Call this after successfully publishing an asset
   */
  async updateAssetCDNUrls(
    assetId: string,
    publishResult: PublishResult,
  ): Promise<void> {
    if (!publishResult.success) {
      console.error(
        `[CDNPublishService] Cannot update database - publish failed for ${assetId}`,
      );
      return;
    }

    try {
      await db
        .update(assets)
        .set({
          cdnUrl: publishResult.mainCdnUrl,
          cdnThumbnailUrl: publishResult.thumbnailCdnUrl,
          cdnConceptArtUrl: publishResult.conceptArtCdnUrl,
          cdnFiles: publishResult.cdnUrls || [],
          publishedToCdn: true,
          cdnPublishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId));

      console.log(`✅ Updated database with CDN URLs for ${assetId}`);
    } catch (error) {
      console.error(`❌ Failed to update database for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Publish asset and update database in one operation
   * Recommended method for most use cases
   */
  async publishAndUpdateAsset(assetId: string): Promise<PublishResult> {
    const result = await this.publishAsset(assetId);

    if (result.success) {
      await this.updateAssetCDNUrls(assetId, result);
    }

    return result;
  }
}
