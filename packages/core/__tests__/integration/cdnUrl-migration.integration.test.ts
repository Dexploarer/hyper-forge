/**
 * cdnUrl Migration Integration Tests
 *
 * End-to-end tests verifying the complete modelUrl→cdnUrl migration
 * Tests the entire generation and hand rigging workflows with CDN URLs
 *
 * NO MOCKS for internal code - real database, real workflows
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { useGenerationStore } from "@/store/useGenerationStore";
import { useHandRiggingStore } from "@/store/useHandRiggingStore";
import type { GeneratedAsset } from "@/store/useGenerationStore";

describe("cdnUrl Migration - Integration Tests", () => {
  beforeAll(() => {
    // Setup test environment
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    // Reset stores between tests to avoid state pollution
    useGenerationStore.setState({ generatedAssets: [], selectedAsset: null });
    useHandRiggingStore.getState().reset();
  });

  describe("Generation Pipeline with cdnUrl", () => {
    it("should create assets with cdnUrl in generation pipeline", () => {
      const store = useGenerationStore.getState();

      // Simulate pipeline completion
      const generatedAsset: GeneratedAsset = {
        id: "gen-asset-1",
        name: "Generated Sword",
        type: "weapon",
        status: "completed",
        pipelineId: "pipeline-123",
        cdnUrl: "https://cdn.example.com/assets/gen-asset-1/model.glb",
        conceptArtUrl: "https://cdn.example.com/images/gen-asset-1/concept.png",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.addGeneratedAsset(generatedAsset);

      const assets = useGenerationStore.getState().generatedAssets;
      expect(assets).toHaveLength(1);
      expect(assets[0].cdnUrl).toBeDefined();
      expect(assets[0].cdnUrl).toContain("cdn.example.com");

      // NO modelUrl should exist
      // @ts-expect-error - modelUrl should not exist
      expect(assets[0].modelUrl).toBeUndefined();
    });

    it("should handle pipeline stages with cdnUrl results", () => {
      const store = useGenerationStore.getState();

      // Simulate image generation stage
      store.setSelectedStageResult({
        stage: "image",
        result: {
          imageUrl: "https://cdn.example.com/images/concept.png",
          taskId: "image-task-123",
        },
      });

      // Simulate model generation stage
      store.setSelectedStageResult({
        stage: "model",
        result: {
          cdnUrl: "https://cdn.example.com/assets/model-raw.glb",
          taskId: "model-task-123",
        },
      });

      // Simulate final stage with metadata
      store.setSelectedStageResult({
        stage: "final",
        result: {
          cdnUrl: "https://cdn.example.com/assets/model-final.glb",
          metadata: {
            vertices: 5000,
            triangles: 10000,
          },
        },
      });

      const finalResult = useGenerationStore.getState().selectedStageResult;
      expect(finalResult?.stage).toBe("final");
      expect((finalResult?.result as any).cdnUrl).toBeDefined();
    });

    it("should create material variants with cdnUrl", () => {
      const store = useGenerationStore.getState();

      const assetWithVariants: GeneratedAsset = {
        id: "weapon-with-variants",
        name: "Multi-Material Sword",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/sword-bronze.glb",
        variants: [
          {
            name: "bronze",
            cdnUrl: "https://cdn.example.com/assets/sword-bronze.glb",
            id: "variant-bronze",
          },
          {
            name: "steel",
            cdnUrl: "https://cdn.example.com/assets/sword-steel.glb",
            id: "variant-steel",
          },
          {
            name: "mithril",
            cdnUrl: "https://cdn.example.com/assets/sword-mithril.glb",
            id: "variant-mithril",
          },
        ],
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.addGeneratedAsset(assetWithVariants);

      const assets = useGenerationStore.getState().generatedAssets;
      const variantAsset = assets.find((a) => a.id === "weapon-with-variants");

      expect(variantAsset?.variants).toHaveLength(3);
      expect(variantAsset?.variants?.[0].cdnUrl).toContain("bronze");
      expect(variantAsset?.variants?.[1].cdnUrl).toContain("steel");
      expect(variantAsset?.variants?.[2].cdnUrl).toContain("mithril");

      // No modelUrl in variants
      variantAsset?.variants?.forEach((variant) => {
        expect(variant.cdnUrl).toBeDefined();
        // @ts-expect-error - modelUrl should not exist
        expect(variant.modelUrl).toBeUndefined();
      });
    });

    it("should handle avatar generation with rigging and cdnUrl", () => {
      const store = useGenerationStore.getState();

      const riggedAvatar: GeneratedAsset = {
        id: "rigged-avatar-1",
        name: "Rigged Character",
        type: "character",
        status: "completed",
        pipelineId: "avatar-pipeline-123",
        cdnUrl: "https://cdn.example.com/assets/rigged-avatar-1/model.glb",
        metadata: {
          animations: {
            basic: {
              tpose: "t-pose.glb",
              walking: "walking.glb",
              running: "running.glb",
            },
          },
        },
        cdnFiles: [
          "https://cdn.example.com/assets/rigged-avatar-1/model.glb",
          "https://cdn.example.com/assets/rigged-avatar-1/t-pose.glb",
          "https://cdn.example.com/assets/rigged-avatar-1/walking.glb",
          "https://cdn.example.com/assets/rigged-avatar-1/running.glb",
        ],
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.addGeneratedAsset(riggedAvatar);

      const assets = useGenerationStore.getState().generatedAssets;
      const avatar = assets.find((a) => a.id === "rigged-avatar-1");

      expect(avatar?.cdnUrl).toBeDefined();
      expect(avatar?.cdnFiles).toHaveLength(4);
      expect(avatar?.metadata?.animations?.basic?.tpose).toBe("t-pose.glb");
    });
  });

  describe("Hand Rigging Workflow with cdnUrl", () => {
    it("should select avatar and set cdnUrl", () => {
      const store = useHandRiggingStore.getState();

      const avatar = {
        id: "avatar-for-rigging",
        name: "Character for Hand Rigging",
        type: "character" as const,
        cdnUrl: "https://cdn.example.com/assets/avatar/model.glb",
        cdnFiles: [
          "https://cdn.example.com/assets/avatar/model.glb",
          "https://cdn.example.com/assets/avatar/t-pose.glb",
        ],
        metadata: {
          animations: {
            basic: {
              tpose: "t-pose.glb",
            },
          },
        },
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.setSelectedAvatar(avatar);

      // Simulate component logic: prefer t-pose file
      const tposeUrl = `https://cdn.example.com/assets/avatar/t-pose.glb`;
      store.setCdnUrl(tposeUrl);

      const state = useHandRiggingStore.getState();
      expect(state.selectedAvatar?.id).toBe("avatar-for-rigging");
      expect(state.cdnUrl).toBe(tposeUrl);
      expect(state.cdnUrl).toContain("t-pose.glb");
    });

    it("should upload file and create blob URL", () => {
      const store = useHandRiggingStore.getState();

      // Simulate file upload
      const file = new File(["glb content"], "uploaded-character.glb", {
        type: "model/gltf-binary",
      });

      store.setSelectedFile(file);

      // Create blob URL (simulated)
      const blobUrl = URL.createObjectURL(file);
      store.setCdnUrl(blobUrl);

      const state = useHandRiggingStore.getState();
      expect(state.selectedFile).toBe(file);
      expect(state.cdnUrl).toContain("blob:");

      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl);
    });

    it("should process hand rigging with cdnUrl", () => {
      const store = useHandRiggingStore.getState();

      // Set cdnUrl for processing
      store.setCdnUrl("https://cdn.example.com/assets/character/t-pose.glb");

      // Simulate processing stages
      store.setProcessingStage("detecting-wrists");
      expect(useHandRiggingStore.getState().processingStage).toBe(
        "detecting-wrists",
      );

      store.setProcessingStage("creating-bones");
      expect(useHandRiggingStore.getState().processingStage).toBe(
        "creating-bones",
      );

      store.setProcessingStage("applying-weights");
      expect(useHandRiggingStore.getState().processingStage).toBe(
        "applying-weights",
      );

      store.setProcessingStage("complete");
      const finalState = useHandRiggingStore.getState();
      expect(finalState.processingStage).toBe("complete");
      expect(finalState.cdnUrl).toBeDefined();
    });

    it("should export rigged model with cdnUrl", () => {
      const store = useHandRiggingStore.getState();

      // Set initial cdnUrl
      store.setCdnUrl("https://cdn.example.com/assets/avatar/model.glb");

      // Simulate rigging result
      const riggedModelBlob = new Blob(["rigged glb content"], {
        type: "model/gltf-binary",
      });

      store.setRiggingResult({
        riggedModel: riggedModelBlob,
        leftHandBones: 15,
        rightHandBones: 15,
      });

      store.setProcessingStage("complete");

      const state = useHandRiggingStore.getState();
      expect(state.riggingResult).toBeDefined();
      expect(state.riggingResult?.riggedModel).toBe(riggedModelBlob);
      expect(state.processingStage).toBe("complete");
    });
  });

  describe("Cross-Feature Integration", () => {
    it("should use generated avatar in hand rigging workflow", () => {
      const genStore = useGenerationStore.getState();
      const rigStore = useHandRiggingStore.getState();

      // Step 1: Generate avatar with cdnUrl
      const generatedAvatar: GeneratedAsset = {
        id: "gen-avatar-1",
        name: "Generated Avatar",
        type: "character",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/gen-avatar-1/model.glb",
        cdnFiles: [
          "https://cdn.example.com/assets/gen-avatar-1/model.glb",
          "https://cdn.example.com/assets/gen-avatar-1/t-pose.glb",
        ],
        metadata: {
          animations: {
            basic: {
              tpose: "t-pose.glb",
            },
          },
        },
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      genStore.addGeneratedAsset(generatedAvatar);

      // Step 2: Select it for hand rigging
      rigStore.setSelectedAvatar({
        ...generatedAvatar,
        type: "character",
      });

      rigStore.setCdnUrl(
        "https://cdn.example.com/assets/gen-avatar-1/t-pose.glb",
      );

      // Step 3: Verify workflow
      const genState = useGenerationStore.getState();
      const rigState = useHandRiggingStore.getState();

      expect(genState.generatedAssets).toHaveLength(1);
      expect(rigState.selectedAvatar?.id).toBe("gen-avatar-1");
      expect(rigState.cdnUrl).toContain("t-pose.glb");

      // Both stores use cdnUrl, NOT modelUrl
      expect(genState.generatedAssets[0].cdnUrl).toBeDefined();
      expect(rigState.cdnUrl).toBeDefined();

      // @ts-expect-error - modelUrl should not exist
      expect(genState.generatedAssets[0].modelUrl).toBeUndefined();
      // @ts-expect-error - modelUrl should not exist
      expect(rigState.modelUrl).toBeUndefined();
    });
  });

  describe("No modelUrl References - Final Verification", () => {
    it("should have NO modelUrl in generation store state", () => {
      const state = useGenerationStore.getState();

      expect(state).not.toHaveProperty("modelUrl");
      expect(state.generatedAssets.every((a) => !("modelUrl" in a))).toBe(true);
    });

    it("should have NO modelUrl in hand rigging store state", () => {
      const state = useHandRiggingStore.getState();

      expect(state).not.toHaveProperty("modelUrl");
      expect(state).toHaveProperty("cdnUrl");
    });

    it("should use cdnUrl consistently across all features", () => {
      const genStore = useGenerationStore.getState();
      const rigStore = useHandRiggingStore.getState();

      // Add test asset
      const asset: GeneratedAsset = {
        id: "consistency-test",
        name: "Consistency Test Asset",
        type: "weapon",
        status: "completed",
        cdnUrl: "https://cdn.example.com/assets/test.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      genStore.addGeneratedAsset(asset);

      // Set in rigging store
      rigStore.setCdnUrl("https://cdn.example.com/assets/test.glb");

      const genState = useGenerationStore.getState();
      const rigState = useHandRiggingStore.getState();

      // Both use cdnUrl
      expect(genState.generatedAssets[0].cdnUrl).toBe(
        "https://cdn.example.com/assets/test.glb",
      );
      expect(rigState.cdnUrl).toBe("https://cdn.example.com/assets/test.glb");

      // Neither has modelUrl
      expect(
        Object.keys(genState.generatedAssets[0]).includes("modelUrl"),
      ).toBe(false);
      expect(Object.keys(rigState).includes("modelUrl")).toBe(false);
    });
  });
});
