/**
 * Frontend AssetService Tests
 * Tests for CDN URL prioritization and fallback logic
 */

import { describe, it, expect } from "bun:test";
import { AssetService } from "../../../src/services/api/AssetService";
import type { Asset } from "../../../src/services/api/AssetService";

describe("AssetService", () => {
  describe("getModelUrl", () => {
    it("should return CDN URL when available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnUrl: "https://cdn.example.com/models/test-asset/test-asset.glb",
      };

      const url = AssetService.getModelUrl(asset);

      expect(url).toBe(
        "https://cdn.example.com/models/test-asset/test-asset.glb",
      );
    });

    it("should fallback to local path when CDN URL not available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getModelUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/test-asset.glb");
    });

    it("should fallback to local path when cdnUrl is missing", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnUrl: undefined,
      };

      const url = AssetService.getModelUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/test-asset.glb");
    });

    it("should support backward compatibility with string assetId", () => {
      const url = AssetService.getModelUrl("test-asset");

      expect(url).toBe("/gdd-assets/test-asset/test-asset.glb");
    });
  });

  describe("getConceptArtUrl", () => {
    it("should return CDN concept art URL when available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnConceptArtUrl:
          "https://cdn.example.com/models/test-asset/concept-art.png",
      };

      const url = AssetService.getConceptArtUrl(asset);

      expect(url).toBe(
        "https://cdn.example.com/models/test-asset/concept-art.png",
      );
    });

    it("should fallback to local path when CDN URL not available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getConceptArtUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/concept-art.png");
    });

    it("should support backward compatibility with string assetId", () => {
      const url = AssetService.getConceptArtUrl("test-asset");

      expect(url).toBe("/gdd-assets/test-asset/concept-art.png");
    });
  });

  describe("getPreviewImageUrl", () => {
    it("should prioritize CDN thumbnail URL", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {
          hasConceptArt: true,
          conceptArtPath: "concept-art.png",
        } as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnThumbnailUrl:
          "https://cdn.example.com/models/test-asset/thumbnail.png",
        cdnConceptArtUrl:
          "https://cdn.example.com/models/test-asset/concept-art.png",
        thumbnailPath: "local-thumbnail.png",
        conceptArtPath: "local-concept.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);

      // Should prioritize CDN thumbnail over everything else
      expect(url).toBe(
        "https://cdn.example.com/models/test-asset/thumbnail.png",
      );
    });

    it("should use CDN concept art if thumbnail not available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnConceptArtUrl:
          "https://cdn.example.com/models/test-asset/concept-art.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);

      expect(url).toBe(
        "https://cdn.example.com/models/test-asset/concept-art.png",
      );
    });

    it("should fallback to local thumbnail when CDN URLs not available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        thumbnailPath: "sprites/0deg.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/sprites/0deg.png");
    });

    it("should fallback to local concept art from metadata", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {
          hasConceptArt: true,
          conceptArtPath: "concept-art.png",
        } as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getPreviewImageUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/concept-art.png");
    });

    it("should fallback to conceptArtPath field", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        conceptArtPath: "concept.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);

      expect(url).toBe("/gdd-assets/test-asset/concept.png");
    });

    it("should return null when no preview available", () => {
      const asset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {} as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getPreviewImageUrl(asset);

      expect(url).toBeNull();
    });
  });

  describe("CDN URL Priority Chain", () => {
    it("should demonstrate complete priority chain for preview images", () => {
      // Test all priority levels by removing higher priority options
      const baseAsset: Asset = {
        id: "test-asset",
        name: "Test Asset",
        description: "Test",
        type: "weapon",
        metadata: {
          hasConceptArt: true,
          conceptArtPath: "meta-concept.png",
        } as any,
        hasModel: true,
        generatedAt: new Date().toISOString(),
        thumbnailPath: "local-thumb.png",
        conceptArtPath: "local-concept.png",
      };

      // Priority 1: CDN thumbnail (when available)
      let asset = {
        ...baseAsset,
        cdnThumbnailUrl: "https://cdn.example.com/thumb.png",
        cdnConceptArtUrl: "https://cdn.example.com/concept.png",
      };
      expect(AssetService.getPreviewImageUrl(asset)).toBe(
        "https://cdn.example.com/thumb.png",
      );

      // Priority 2: CDN concept art (no CDN thumbnail)
      asset = {
        ...baseAsset,
        cdnConceptArtUrl: "https://cdn.example.com/concept.png",
      };
      expect(AssetService.getPreviewImageUrl(asset)).toBe(
        "https://cdn.example.com/concept.png",
      );

      // Priority 3: Local thumbnail (no CDN URLs)
      asset = { ...baseAsset };
      expect(AssetService.getPreviewImageUrl(asset)).toBe(
        "/gdd-assets/test-asset/local-thumb.png",
      );

      // Priority 4: Metadata concept art (no local thumbnail)
      asset = {
        ...baseAsset,
        thumbnailPath: undefined,
      };
      expect(AssetService.getPreviewImageUrl(asset)).toBe(
        "/gdd-assets/test-asset/meta-concept.png",
      );

      // Priority 5: conceptArtPath field (no metadata concept art)
      asset = {
        ...baseAsset,
        thumbnailPath: undefined,
        metadata: {} as any,
      };
      expect(AssetService.getPreviewImageUrl(asset)).toBe(
        "/gdd-assets/test-asset/local-concept.png",
      );

      // No preview available
      asset = {
        ...baseAsset,
        thumbnailPath: undefined,
        conceptArtPath: undefined,
        metadata: {} as any,
      };
      expect(AssetService.getPreviewImageUrl(asset)).toBeNull();
    });
  });
});
