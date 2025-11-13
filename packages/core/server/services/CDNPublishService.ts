/**
 * CDN Publish Service
 * Publishes stable assets from asset-forge to the CDN
 */

import fs from "fs/promises";
import path from "path";

export interface PublishResult {
  success: boolean;
  assetId: string;
  filesPublished: string[];
  error?: string;
}

export class CDNPublishService {
  private cdnUrl: string;
  private assetsDir: string;

  constructor(cdnUrl: string, assetsDir: string) {
    this.cdnUrl = cdnUrl;
    this.assetsDir = assetsDir;
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

      // Upload to CDN
      const response = await fetch(`${this.cdnUrl}/api/upload`, {
        method: "POST",
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

      console.log(
        `✅ Published ${assetId} to CDN: ${filesPublished.length} files`,
      );

      return {
        success: true,
        assetId,
        filesPublished,
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
}
