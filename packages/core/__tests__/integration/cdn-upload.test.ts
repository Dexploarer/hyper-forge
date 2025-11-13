/**
 * CDN Upload Integration Test
 * Tests the complete CDN upload workflow: upload → webhook → database record
 * NO MOCKS - Real CDN service, real database, real webhook
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../server/db/db.js";
import { assets } from "../../server/db/schema/index.js";
import { eq } from "drizzle-orm";

describe("CDN Upload Integration", () => {
  const testAssetId = `test-cdn-upload-${Date.now()}`;
  let createdAssetId: string | null = null;

  afterAll(async () => {
    // Cleanup: delete test asset from database
    if (createdAssetId) {
      try {
        await db.delete(assets).where(eq(assets.id, createdAssetId));
        console.log(`[Cleanup] Deleted test asset: ${createdAssetId}`);
      } catch (error) {
        console.error(`[Cleanup] Failed to delete test asset:`, error);
      }
    }
  });

  it("should create database record via CDN webhook after upload", async () => {
    // Skip test if CDN is not configured
    if (!process.env.CDN_URL || !process.env.CDN_API_KEY) {
      console.log("[Test Skipped] CDN_URL or CDN_API_KEY not configured");
      return;
    }

    // Step 1: Upload file to CDN
    const formData = new FormData();
    const testGlb = new Blob([new ArrayBuffer(100)], {
      type: "model/gltf-binary",
    });
    formData.append(
      "files",
      testGlb,
      `${testAssetId}/${testAssetId}.glb`,
    );
    formData.append("directory", "models");

    console.log(`[Test] Uploading to CDN: ${process.env.CDN_URL}/api/upload`);

    const response = await fetch(`${process.env.CDN_URL}/api/upload`, {
      method: "POST",
      headers: {
        "X-API-Key": process.env.CDN_API_KEY!,
      },
      body: formData,
    });

    expect(response.ok).toBe(true);

    const uploadResult = await response.json();
    console.log(`[Test] CDN upload result:`, uploadResult);

    // Step 2: Wait for webhook to fire (max 5 seconds)
    let asset = null;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      asset = await db.query.assets.findFirst({
        where: eq(
          assets.filePath,
          `models/${testAssetId}/${testAssetId}.glb`,
        ),
      });

      if (asset) {
        createdAssetId = asset.id;
        break;
      }
    }

    // Step 3: Verify database record created
    expect(asset).toBeDefined();
    if (asset) {
      expect(asset.publishedToCdn).toBe(true);
      expect(asset.cdnUrl).toContain(testAssetId);
      expect(asset.name).toBeTruthy();
      expect(asset.type).toBeTruthy();

      console.log(`[Test] Database record created successfully:`, {
        id: asset.id,
        name: asset.name,
        cdnUrl: asset.cdnUrl,
        publishedToCdn: asset.publishedToCdn,
      });
    }
  }, 10000); // 10 second timeout for CDN upload + webhook

  it("should handle webhook with proper metadata extraction", async () => {
    // Skip test if CDN is not configured
    if (!process.env.CDN_URL || !process.env.CDN_API_KEY) {
      console.log("[Test Skipped] CDN_URL or CDN_API_KEY not configured");
      return;
    }

    // Verify the webhook created proper metadata
    if (!createdAssetId) {
      console.log("[Test Skipped] No asset created in previous test");
      return;
    }

    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, createdAssetId),
    });

    expect(asset).toBeDefined();
    if (asset) {
      // Verify required fields
      expect(asset.name).toBeTruthy();
      expect(asset.type).toBeTruthy();
      expect(asset.filePath).toBeTruthy();
      expect(asset.cdnUrl).toBeTruthy();

      // Verify CDN-specific fields
      expect(asset.publishedToCdn).toBe(true);
      expect(asset.cdnPublishedAt).toBeDefined();

      // Verify metadata structure
      expect(asset.metadata).toBeDefined();
      expect(typeof asset.metadata).toBe("object");

      console.log(`[Test] Metadata validation passed:`, {
        name: asset.name,
        type: asset.type,
        publishedToCdn: asset.publishedToCdn,
        hasMetadata: !!asset.metadata,
      });
    }
  });
});
