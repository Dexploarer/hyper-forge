/**
 * Contract Testing - Meshy AI 3D Conversion API
 *
 * Defines the contract for Meshy's image-to-3D conversion API.
 * Ensures compatibility with their API changes.
 *
 * Run with: bun test __tests__/advanced/contract-testing
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";

const { like, regex, eachLike } = MatchersV3;

describe("Meshy AI 3D Conversion API Contract", () => {
  let provider: PactV3;

  beforeAll(() => {
    provider = new PactV3({
      consumer: "asset-forge-core",
      provider: "meshy-ai-api",
      dir: path.resolve(__dirname, "../../../pacts"),
      logLevel: "error",
    });
  });

  afterAll(async () => {
    await provider.finalize();
  });

  it("should start an image-to-3D conversion task", async () => {
    await provider
      .given("Meshy API is available")
      .uponReceiving("a request to convert image to 3D")
      .withRequest({
        method: "POST",
        path: "/v2/image-to-3d",
        headers: {
          "Content-Type": "application/json",
          Authorization: regex(/^Bearer .+/, "Bearer test-meshy-key"),
        },
        body: {
          image_url: regex(
            /^https?:\/\/.+/,
            "https://example.com/concept-art.png",
          ),
          enable_pbr: like(true),
          ai_model: like("meshy-5"),
          topology: like("quad"),
          target_polycount: like(10000),
          texture_resolution: like(2048),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          result: like("task-uuid-123"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/v2/image-to-3d`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-meshy-key",
        },
        body: JSON.stringify({
          image_url: "https://example.com/concept-art.png",
          enable_pbr: true,
          ai_model: "meshy-5",
          topology: "quad",
          target_polycount: 10000,
          texture_resolution: 2048,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe("string");
    });
  });

  it("should check task status", async () => {
    await provider
      .given("A 3D conversion task exists")
      .uponReceiving("a request to check task status")
      .withRequest({
        method: "GET",
        path: regex(
          /^\/v2\/image-to-3d\/[a-z0-9-]+$/,
          "/v2/image-to-3d/task-uuid-123",
        ),
        headers: {
          Authorization: regex(/^Bearer .+/, "Bearer test-meshy-key"),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          result: {
            status: regex(
              /^(PENDING|IN_PROGRESS|SUCCEEDED|FAILED)$/,
              "SUCCEEDED",
            ),
            progress: like(100),
            model_urls: {
              glb: regex(
                /^https:\/\/.+\.glb$/,
                "https://example.com/model.glb",
              ),
              fbx: like("https://example.com/model.fbx"),
              usdz: like("https://example.com/model.usdz"),
            },
            thumbnail_url: like("https://example.com/thumbnail.png"),
            video_url: like("https://example.com/preview.mp4"),
            task_error: like(null),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/v2/image-to-3d/task-uuid-123`,
        {
          headers: {
            Authorization: "Bearer test-meshy-key",
          },
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.status).toMatch(
        /^(PENDING|IN_PROGRESS|SUCCEEDED|FAILED)$/,
      );
      expect(data.result.model_urls.glb).toMatch(/^https:\/\/.+\.glb$/);
    });
  });

  it("should handle failed conversion tasks", async () => {
    await provider
      .given("A conversion task has failed")
      .uponReceiving("a request to check failed task status")
      .withRequest({
        method: "GET",
        path: "/v2/image-to-3d/failed-task-123",
        headers: {
          Authorization: regex(/^Bearer .+/, "Bearer test-meshy-key"),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          result: {
            status: "FAILED",
            progress: like(50),
            task_error: {
              message: like("Invalid input image format"),
              code: like("INVALID_IMAGE"),
            },
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/v2/image-to-3d/failed-task-123`,
        {
          headers: {
            Authorization: "Bearer test-meshy-key",
          },
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.status).toBe("FAILED");
      expect(data.result.task_error).toBeDefined();
      expect(data.result.task_error.message).toBeDefined();
    });
  });

  it("should start a retexturing task", async () => {
    await provider
      .given("A base 3D model exists")
      .uponReceiving("a request to retexture a model")
      .withRequest({
        method: "POST",
        path: "/v2/text-to-texture",
        headers: {
          "Content-Type": "application/json",
          Authorization: regex(/^Bearer .+/, "Bearer test-meshy-key"),
        },
        body: {
          model_url: regex(
            /^https:\/\/.+\.glb$/,
            "https://example.com/base.glb",
          ),
          object_prompt: like("bronze sword"),
          style_prompt: like("bronze material, metallic finish"),
          enable_original_uv: like(true),
          enable_pbr: like(true),
          resolution: like("2048"),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          result: like("retexture-task-456"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/v2/text-to-texture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-meshy-key",
        },
        body: JSON.stringify({
          model_url: "https://example.com/base.glb",
          object_prompt: "bronze sword",
          style_prompt: "bronze material, metallic finish",
          enable_original_uv: true,
          enable_pbr: true,
          resolution: "2048",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe("string");
    });
  });
});
