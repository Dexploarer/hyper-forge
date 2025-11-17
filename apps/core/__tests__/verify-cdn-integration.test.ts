/**
 * CDN Integration Verification Test
 * 
 * This test verifies that all UI pages correctly use CDN URLs
 * and handle the fallback to API endpoints when CDN URLs are missing.
 */

import { describe, it, expect } from "bun:test";
import { AssetService } from "../src/services/api/AssetService";
import type { Asset } from "../src/services/api/AssetService";

describe("CDN Integration Verification", () => {
  describe("AssetService.getModelUrl", () => {
    it("should return CDN URL when available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnUrl: "https://cdn.example.com/models/test.glb",
      };

      const url = AssetService.getModelUrl(asset);
      expect(url).toBe("https://cdn.example.com/models/test.glb");
    });

    it("should fall back to API endpoint when CDN URL is missing", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        // No cdnUrl
      };

      const url = AssetService.getModelUrl(asset);
      expect(url).toBe("/api/assets/test-id/model");
    });

    it("should handle asset ID string (legacy)", () => {
      const url = AssetService.getModelUrl("legacy-asset-id");
      expect(url).toBe("/api/assets/legacy-asset-id/model");
    });
  });

  describe("AssetService.getConceptArtUrl", () => {
    it("should return CDN concept art URL when available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnConceptArtUrl: "https://cdn.example.com/concept-art/test.png",
      };

      const url = AssetService.getConceptArtUrl(asset);
      expect(url).toBe("https://cdn.example.com/concept-art/test.png");
    });

    it("should return null when no CDN URL available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getConceptArtUrl(asset);
      expect(url).toBeNull();
    });
  });

  describe("AssetService.getPreviewImageUrl", () => {
    it("should prioritize thumbnail over concept art", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnThumbnailUrl: "https://cdn.example.com/thumbnails/test.png",
        cdnConceptArtUrl: "https://cdn.example.com/concept-art/test.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);
      expect(url).toBe("https://cdn.example.com/thumbnails/test.png");
    });

    it("should fall back to concept art when no thumbnail", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnConceptArtUrl: "https://cdn.example.com/concept-art/test.png",
      };

      const url = AssetService.getPreviewImageUrl(asset);
      expect(url).toBe("https://cdn.example.com/concept-art/test.png");
    });

    it("should return null when no preview available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Asset",
        description: "",
        type: "weapon",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getPreviewImageUrl(asset);
      expect(url).toBeNull();
    });
  });

  describe("AssetService.getRiggedModelUrl", () => {
    it("should return CDN rigged model URL when available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Character",
        description: "",
        type: "character",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnRiggedModelUrl: "https://cdn.example.com/rigged/test-rigged.glb",
      };

      const url = AssetService.getRiggedModelUrl(asset);
      expect(url).toBe("https://cdn.example.com/rigged/test-rigged.glb");
    });

    it("should search cdnFiles array for rigged model", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Character",
        description: "",
        type: "character",
        metadata: { riggedModelPath: "test-rigged.glb" },
        hasModel: true,
        generatedAt: new Date().toISOString(),
        cdnFiles: [
          "https://cdn.example.com/models/test.glb",
          "https://cdn.example.com/models/test-rigged.glb",
          "https://cdn.example.com/models/test-texture.png",
        ],
      };

      const url = AssetService.getRiggedModelUrl(
        asset,
        "test-rigged.glb",
      );
      expect(url).toBe("https://cdn.example.com/models/test-rigged.glb");
    });

    it("should return undefined when no rigged model available", () => {
      const asset: Asset = {
        id: "test-id",
        name: "Test Character",
        description: "",
        type: "character",
        metadata: {},
        hasModel: true,
        generatedAt: new Date().toISOString(),
      };

      const url = AssetService.getRiggedModelUrl(asset);
      expect(url).toBeUndefined();
    });
  });
});
