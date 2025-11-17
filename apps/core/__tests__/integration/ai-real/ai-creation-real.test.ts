/**
 * Real AI Creation Service Integration Tests
 * 
 * ⚠️ WARNING: These tests make REAL API calls and COST MONEY
 * 
 * These tests use actual API keys from .env to validate:
 * - Real image generation (OpenAI DALL-E or AI Gateway)
 * - Real 3D model generation (Meshy)
 * 
 * Run with: bun test apps/core/__tests__/integration/ai-real
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { AICreationService } from "../../../server/services/AICreationService";

describe("AICreationService - Real AI Integration", () => {
  let service: AICreationService;

  beforeAll(() => {
    // Verify API keys are set
    const hasOpenAI = process.env.OPENAI_API_KEY;
    const hasAIGateway = process.env.AI_GATEWAY_API_KEY;
    const hasMeshy = process.env.MESHY_API_KEY;

    if (!hasOpenAI && !hasAIGateway) {
      throw new Error(
        "OPENAI_API_KEY or AI_GATEWAY_API_KEY must be set in .env to run real integration tests"
      );
    }

    if (!hasMeshy) {
      console.warn("⚠️  MESHY_API_KEY not set - 3D generation tests will be skipped");
    }

    service = new AICreationService({
      openai: {
        apiKey: hasOpenAI ? process.env.OPENAI_API_KEY! : "",
        aiGatewayApiKey: hasAIGateway ? process.env.AI_GATEWAY_API_KEY! : undefined,
      },
      meshy: {
        apiKey: hasMeshy ? process.env.MESHY_API_KEY! : "skip-tests",
      },
    });
  });

  describe("Real Image Generation", () => {
    it("should generate a real image with AI", async () => {
      const imageService = service.getImageService();
      
      const result = await imageService.generateImage(
        "A fantasy sword with intricate designs",
        "weapon",
        "medieval fantasy"
      );

      // Validate structure
      expect(result).toBeDefined();
      expect(result.imageUrl).toBeDefined();
      expect(result.prompt).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Validate image URL
      expect(typeof result.imageUrl).toBe("string");
      expect(result.imageUrl.length).toBeGreaterThan(0);
      
      // Should be either a URL or base64
      const isUrl = result.imageUrl.startsWith("http://") || result.imageUrl.startsWith("https://");
      const isBase64 = result.imageUrl.startsWith("data:image/");
      expect(isUrl || isBase64).toBe(true);

      // Validate metadata
      expect(result.metadata.model).toBeDefined();
      expect(result.metadata.resolution).toBeDefined();
      expect(result.metadata.quality).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();

      console.log("\n✅ Generated image successfully");
      console.log("   Model:", result.metadata.model);
      console.log("   Resolution:", result.metadata.resolution);
      console.log("   URL type:", isUrl ? "URL" : "Base64");
      console.log("   URL length:", result.imageUrl.length, "characters");
    }, 60000); // 60s timeout for image generation

    it("should generate image for different asset types", async () => {
      const imageService = service.getImageService();
      
      const result = await imageService.generateImage(
        "A magical healing potion",
        "prop",
        "fantasy RPG"
      );

      expect(result.imageUrl).toBeDefined();
      expect(result.prompt).toContain("potion");

      console.log("\n✅ Generated prop image");
    }, 60000);

    it("should generate character image", async () => {
      const imageService = service.getImageService();
      
      const result = await imageService.generateImage(
        "A brave knight in shining armor",
        "character",
        "medieval"
      );

      expect(result.imageUrl).toBeDefined();
      expect(result.prompt).toContain("knight");

      console.log("\n✅ Generated character image");
    }, 60000);
  });

  describe("Real 3D Model Generation", () => {
    it("should start image-to-3D conversion with Meshy", async () => {
      if (!process.env.MESHY_API_KEY) {
        console.log("⏭️  Skipping - MESHY_API_KEY not set");
        return;
      }

      const meshyService = service.getMeshyService();

      // First generate an image
      const imageService = service.getImageService();
      const imageResult = await imageService.generateImage(
        "A simple wooden barrel",
        "prop",
        "game asset"
      );

      console.log("\n✅ Generated image for 3D conversion");

      // Start 3D conversion
      const taskId = await meshyService.startImageTo3D(imageResult.imageUrl, {
        enable_pbr: false, // Faster and cheaper
        ai_model: "meshy-4", // Older model is cheaper
        topology: "quad",
        targetPolycount: 2000,
      });

      // Validate task started
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe("string");
      expect(taskId.length).toBeGreaterThan(0);

      console.log("✅ Started 3D conversion task:", taskId);

      // Check initial status
      const status = await meshyService.getTaskStatus(taskId);
      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
      expect(["PENDING", "IN_PROGRESS", "SUCCEEDED", "FAILED"]).toContain(status.status);

      console.log("   Initial status:", status.status);
      if (status.progress !== undefined) {
        console.log("   Progress:", status.progress + "%");
      }

      // Note: We don't wait for completion as it takes several minutes
      console.log("\n⏸️  Task started successfully. Not waiting for completion to save time/cost.");
    }, 120000); // 2 minutes timeout
  });

  describe("Integration Workflow", () => {
    it("should complete full image generation workflow", async () => {
      const imageService = service.getImageService();

      // Generate multiple images to test throughput
      const results = await Promise.all([
        imageService.generateImage("A red gem", "prop", "fantasy"),
        imageService.generateImage("A blue crystal", "prop", "fantasy"),
      ]);

      expect(results.length).toBe(2);
      results.forEach((result, index) => {
        expect(result.imageUrl).toBeDefined();
        console.log(`✅ Generated image ${index + 1}`);
      });

      console.log("\n✅ Parallel generation successful");
    }, 120000);
  });

  describe("Error Handling", () => {
    it("should handle empty prompts gracefully", async () => {
      const imageService = service.getImageService();

      try {
        await imageService.generateImage("", "prop");
        // If it succeeds, AI handled empty prompt
        console.log("✅ AI handled empty prompt");
      } catch (error) {
        // If it fails, error should be meaningful
        expect(error).toBeDefined();
        console.log("✅ Empty prompt rejected as expected");
      }
    }, 60000);

    it("should handle invalid asset type", async () => {
      const imageService = service.getImageService();

      // Asset type validation happens client-side, but test anyway
      const result = await imageService.generateImage(
        "A test item",
        "invalid_type" as any
      );

      // Should still generate something
      expect(result.imageUrl).toBeDefined();
      console.log("✅ Handled invalid asset type");
    }, 60000);
  });

  describe("API Key Configuration", () => {
    it("should use AI Gateway when available", async () => {
      if (!process.env.AI_GATEWAY_API_KEY) {
        console.log("⏭️  Skipping - AI_GATEWAY_API_KEY not set");
        return;
      }

      const gatewayService = new AICreationService({
        openai: {
          apiKey: "", // Empty OpenAI key
          aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
        },
        meshy: {
          apiKey: process.env.MESHY_API_KEY || "test",
        },
      });

      const imageService = gatewayService.getImageService();
      const result = await imageService.generateImage(
        "A test sword",
        "weapon"
      );

      expect(result.imageUrl).toBeDefined();
      expect(result.metadata.model).toContain("gemini"); // AI Gateway uses Gemini

      console.log("\n✅ AI Gateway works");
      console.log("   Model:", result.metadata.model);
    }, 60000);

    it("should use direct OpenAI when AI Gateway not available", async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log("⏭️  Skipping - OPENAI_API_KEY not set");
        return;
      }

      const openaiService = new AICreationService({
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          // No AI Gateway key
        },
        meshy: {
          apiKey: process.env.MESHY_API_KEY || "test",
        },
      });

      const imageService = openaiService.getImageService();
      const result = await imageService.generateImage(
        "A test shield",
        "weapon"
      );

      expect(result.imageUrl).toBeDefined();
      expect(result.metadata.model).toContain("gpt"); // Direct OpenAI uses GPT

      console.log("\n✅ Direct OpenAI works");
      console.log("   Model:", result.metadata.model);
    }, 60000);
  });
});
