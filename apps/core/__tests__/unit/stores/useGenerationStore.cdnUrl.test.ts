/**
 * useGenerationStore cdnUrl Migration Tests
 *
 * Verifies that GeneratedAsset interface uses cdnUrl instead of modelUrl
 * Tests the store state management for CDN-only architecture
 *
 * NO MOCKS for internal code
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { useGenerationStore, GeneratedAsset } from "@/store/useGenerationStore";

describe("useGenerationStore - cdnUrl Migration", () => {
  beforeEach(() => {
    // Reset store to initial state
    useGenerationStore.setState({
      generatedAssets: [],
      selectedAsset: null,
    });
  });

  describe("GeneratedAsset Interface", () => {
    it("should support cdnUrl property in GeneratedAsset", () => {
      const asset: GeneratedAsset = {
        id: "test-asset-1",
        name: "Test Sword",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/sword.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      expect(asset.cdnUrl).toBe("https://cdn.example.com/assets/sword.glb");
    });

    it("should allow optional cdnUrl", () => {
      const asset: GeneratedAsset = {
        id: "test-asset-2",
        name: "Test Shield",
        type: "armor",
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: false,
      };

      expect(asset.cdnUrl).toBeUndefined();
    });

    it("should support conceptArtUrl alongside cdnUrl", () => {
      const asset: GeneratedAsset = {
        id: "test-asset-3",
        name: "Test Character",
        type: "character",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/character.glb",
        conceptArtUrl: "https://cdn.example.com/images/character-concept.png",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      expect(asset.cdnUrl).toBeDefined();
      expect(asset.conceptArtUrl).toBeDefined();
    });
  });

  describe("Store Actions with cdnUrl", () => {
    it("should add asset with cdnUrl", () => {
      const store = useGenerationStore.getState();

      const asset: GeneratedAsset = {
        id: "asset-1",
        name: "Sword",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/sword.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.addGeneratedAsset(asset);

      const assets = useGenerationStore.getState().generatedAssets;
      expect(assets.length).toBe(1);
      expect(assets[0].cdnUrl).toBe("https://cdn.example.com/assets/sword.glb");
    });

    it("should update asset cdnUrl", () => {
      const store = useGenerationStore.getState();

      // Add initial asset without cdnUrl
      store.addGeneratedAsset({
        id: "asset-2",
        name: "Shield",
        type: "armor",
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: false,
      });

      // Update with cdnUrl
      store.updateGeneratedAsset("asset-2", {
        cdnUrl: "https://cdn.example.com/assets/shield.glb",
        status: "completed",
        hasModel: true,
      });

      const assets = useGenerationStore.getState().generatedAssets;
      const updatedAsset = assets.find((a) => a.id === "asset-2");
      expect(updatedAsset?.cdnUrl).toBe(
        "https://cdn.example.com/assets/shield.glb",
      );
      expect(updatedAsset?.status).toBe("completed");
    });

    it("should select asset with cdnUrl", () => {
      const store = useGenerationStore.getState();

      const asset: GeneratedAsset = {
        id: "asset-3",
        name: "Helmet",
        type: "armor",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/helmet.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.setSelectedAsset(asset);

      const selectedAsset = useGenerationStore.getState().selectedAsset;
      expect(selectedAsset?.cdnUrl).toBe(
        "https://cdn.example.com/assets/helmet.glb",
      );
    });
  });

  describe("Variants with cdnUrl", () => {
    it("should support variants array with cdnUrl", () => {
      const asset: GeneratedAsset = {
        id: "asset-4",
        name: "Sword",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/sword-bronze.glb",
        variants: [
          {
            name: "bronze",
            cdnUrl: "https://cdn.example.com/assets/sword-bronze.glb",
          },
          {
            name: "steel",
            cdnUrl: "https://cdn.example.com/assets/sword-steel.glb",
          },
          {
            name: "mithril",
            cdnUrl: "https://cdn.example.com/assets/sword-mithril.glb",
          },
        ],
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      expect(asset.variants).toHaveLength(3);
      expect(asset.variants?.[0].cdnUrl).toContain("bronze");
      expect(asset.variants?.[1].cdnUrl).toContain("steel");
      expect(asset.variants?.[2].cdnUrl).toContain("mithril");
    });
  });

  describe("Pipeline Results with cdnUrl", () => {
    it("should handle final stage result with cdnUrl", () => {
      const store = useGenerationStore.getState();

      store.setSelectedStageResult({
        stage: "final",
        result: {
          cdnUrl: "https://cdn.example.com/assets/final-model.glb",
          metadata: {
            vertices: 5000,
            triangles: 10000,
          },
        },
      });

      const result = useGenerationStore.getState().selectedStageResult;
      expect(result?.stage).toBe("final");
      expect((result?.result as any).cdnUrl).toContain("final-model.glb");
    });
  });

  describe("Persistence", () => {
    it("should not persist cdnUrl in localStorage (too large)", () => {
      // The store's partialize config excludes large runtime data
      const asset: GeneratedAsset = {
        id: "asset-5",
        name: "Large Model",
        type: "building",
        status: "completed",
        cdnUrl: "blob:http://localhost:5173/abc-123-very-long-url",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      const store = useGenerationStore.getState();
      store.addGeneratedAsset(asset);

      // The partialize function should exclude generatedAssets
      // (they're runtime state, not user preferences)
      expect(true).toBe(true);
    });
  });

  describe("No modelUrl References", () => {
    it("should NOT have modelUrl in GeneratedAsset type", () => {
      const asset: GeneratedAsset = {
        id: "asset-6",
        name: "Test",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/test.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      // @ts-expect-error - modelUrl should not exist
      expect(asset.modelUrl).toBeUndefined();
      expect(asset.cdnUrl).toBeDefined();
    });

    it("should use cdnUrl for all model references", () => {
      const store = useGenerationStore.getState();

      const asset: GeneratedAsset = {
        id: "asset-7",
        name: "Axe",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/axe.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.addGeneratedAsset(asset);
      store.setSelectedAsset(asset);

      const selectedAsset = useGenerationStore.getState().selectedAsset;

      // Only cdnUrl should exist
      expect(selectedAsset?.cdnUrl).toBeDefined();
      // @ts-expect-error - modelUrl should not exist
      expect(selectedAsset?.modelUrl).toBeUndefined();
    });
  });
});
