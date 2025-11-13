/**
 * AI Test Helper
 * November 2025 Best Practices (Vercel AI SDK):
 * - Use MockLanguageModelV3 from ai/test
 * - Use simulateReadableStream for streaming tests
 * - Deterministic, cost-free AI testing
 */

import { MockLanguageModelV3 } from "ai/test";
import { simulateReadableStream } from "ai";

/**
 * Create a mock language model for generateText
 */
export function createMockModel(
  text: string,
  usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
) {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      finishReason: "stop",
      usage,
      content: [{ type: "text", text }],
      warnings: [],
    }),
  });
}

/**
 * Create a mock language model with error
 */
export function createMockModelWithError(errorMessage: string) {
  return new MockLanguageModelV3({
    doGenerate: async () => {
      throw new Error(errorMessage);
    },
  });
}

/**
 * Create a mock streaming language model for streamText
 */
export function createMockStreamingModel(
  text: string,
  usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
) {
  // Split text into chunks for realistic streaming
  const chunks = text.split(" ");

  const streamChunks: any[] = [{ type: "text-start", id: "text-1" }];

  // Add delta chunks for each word
  chunks.forEach((chunk, index) => {
    streamChunks.push({
      type: "text-delta",
      id: "text-1",
      delta: index === chunks.length - 1 ? chunk : `${chunk} `,
    });
  });

  streamChunks.push(
    { type: "text-end", id: "text-1" },
    {
      type: "finish",
      finishReason: "stop",
      logprobs: undefined,
      usage,
    },
  );

  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: streamChunks,
      }),
    }),
  });
}

/**
 * Create a mock model that returns structured JSON
 */
export function createMockJSONModel(
  jsonObject: any,
  usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
) {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      finishReason: "stop",
      usage,
      content: [{ type: "text", text: JSON.stringify(jsonObject) }],
      warnings: [],
    }),
  });
}

/**
 * Create a mock model with tool calls
 */
export function createMockModelWithTools(
  toolCalls: Array<{ toolName: string; args: any }>,
  usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
) {
  return new MockLanguageModelV3({
    doGenerate: async () => ({
      finishReason: "tool-calls",
      usage,
      content: toolCalls.map((tc) => ({
        type: "tool-call",
        toolCallId: `call-${Math.random().toString(36).substring(7)}`,
        toolName: tc.toolName,
        args: tc.args,
      })),
      warnings: [],
    }),
  });
}

/**
 * Mock Meshy AI API response for 3D generation
 */
export function createMockMeshyResponse(
  status: "PENDING" | "SUCCEEDED" | "FAILED" = "SUCCEEDED",
) {
  return {
    id: `meshy-task-${Date.now()}`,
    status,
    model_urls:
      status === "SUCCEEDED"
        ? {
            glb: "https://example.com/model.glb",
            fbx: "https://example.com/model.fbx",
            usdz: "https://example.com/model.usdz",
          }
        : undefined,
    thumbnail_url:
      status === "SUCCEEDED" ? "https://example.com/thumbnail.png" : undefined,
    progress: status === "PENDING" ? 50 : 100,
    created_at: new Date().toISOString(),
  };
}

/**
 * Mock image generation response (DALL-E style)
 */
export function createMockImageResponse(
  url = "https://example.com/generated-image.png",
) {
  return {
    created: Math.floor(Date.now() / 1000),
    data: [
      {
        url,
        revised_prompt: "A highly detailed test image",
      },
    ],
  };
}

/**
 * Mock embedding response
 */
export function createMockEmbeddingResponse(dimensions = 1536) {
  return {
    object: "list",
    data: [
      {
        object: "embedding",
        embedding: Array(dimensions)
          .fill(0)
          .map(() => Math.random()),
        index: 0,
      },
    ],
    model: "text-embedding-3-small",
    usage: {
      prompt_tokens: 10,
      total_tokens: 10,
    },
  };
}

/**
 * Mock voice generation response (ElevenLabs style)
 */
export function createMockVoiceResponse() {
  // Return a mock audio buffer (silence)
  const sampleRate = 44100;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(numSamples * 2); // 16-bit audio
  return buffer;
}

/**
 * Create a mock model that simulates thinking/reasoning
 */
export function createMockReasoningModel(
  reasoning: string,
  finalAnswer: string,
) {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "thinking" },
          {
            type: "text-delta",
            id: "thinking",
            delta: `[Thinking: ${reasoning}]\n\n`,
          },
          { type: "text-end", id: "thinking" },
          { type: "text-start", id: "answer" },
          { type: "text-delta", id: "answer", delta: finalAnswer },
          { type: "text-end", id: "answer" },
          {
            type: "finish",
            finishReason: "stop",
            logprobs: undefined,
            usage: { inputTokens: 20, outputTokens: 40, totalTokens: 60 },
          },
        ],
      }),
    }),
  });
}
