/**
 * Contract Testing - OpenAI Image Generation API
 *
 * This test defines the contract between our application and the OpenAI
 * Image Generation API. It ensures that:
 * 1. We send requests in the expected format
 * 2. We can handle the responses correctly
 * 3. API changes will be detected immediately
 *
 * Run with: bun test __tests__/advanced/contract-testing
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";

const { like, regex, eachLike } = MatchersV3;

describe("OpenAI Image Generation API Contract", () => {
  let provider: PactV3;

  beforeAll(() => {
    // Initialize Pact provider
    provider = new PactV3({
      consumer: "asset-forge-core",
      provider: "openai-image-api",
      dir: path.resolve(__dirname, "../../../pacts"),
      logLevel: "error",
    });
  });

  afterAll(async () => {
    // Write pact file
    await provider.finalize();
  });

  it("should generate an image from a prompt", async () => {
    // Define the expected interaction
    await provider
      .given("OpenAI API is available")
      .uponReceiving("a request to generate an image")
      .withRequest({
        method: "POST",
        path: "/v1/images/generations",
        headers: {
          "Content-Type": "application/json",
          Authorization: regex(/^Bearer .+/, "Bearer test-api-key"),
        },
        body: {
          model: like("gpt-image-1"),
          prompt: like("a bronze sword in RuneScape style"),
          n: like(1),
          size: like("1024x1024"),
          quality: like("standard"),
          response_format: like("url"),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          created: like(1234567890),
          data: eachLike({
            url: regex(
              /^https:\/\/.+\.(png|jpg|jpeg)$/,
              "https://example.com/image.png",
            ),
            revised_prompt: like("Enhanced prompt for image generation"),
          }),
        },
      });

    // Execute the test
    await provider.executeTest(async (mockServer) => {
      // Make a real HTTP request to the mock server
      const response = await fetch(`${mockServer.url}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: "a bronze sword in RuneScape style",
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0].url).toMatch(/^https:\/\/.+\.(png|jpg|jpeg)$/);
    });
  });

  it("should handle invalid API key errors", async () => {
    await provider
      .given("OpenAI API requires authentication")
      .uponReceiving("a request with invalid API key")
      .withRequest({
        method: "POST",
        path: "/v1/images/generations",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-key",
        },
        body: {
          model: "gpt-image-1",
          prompt: "test prompt",
          n: 1,
        },
      })
      .willRespondWith({
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          error: {
            message: like("Incorrect API key provided"),
            type: like("invalid_request_error"),
            code: like("invalid_api_key"),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-key",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: "test prompt",
          n: 1,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("invalid_api_key");
    });
  });

  it("should handle rate limiting", async () => {
    await provider
      .given("OpenAI API has rate limits")
      .uponReceiving("too many requests")
      .withRequest({
        method: "POST",
        path: "/v1/images/generations",
        headers: {
          "Content-Type": "application/json",
          Authorization: regex(/^Bearer .+/, "Bearer test-api-key"),
        },
      })
      .willRespondWith({
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": like("60"),
        },
        body: {
          error: {
            message: like("Rate limit exceeded"),
            type: like("rate_limit_error"),
            code: like("rate_limit_exceeded"),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: "test",
          n: 1,
        }),
      });

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
      const data = await response.json();
      expect(data.error.code).toBe("rate_limit_exceeded");
    });
  });
});
