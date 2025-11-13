/**
 * OpenAI API Mock Fixtures
 * Smart mocks for OpenAI API to avoid costs and ensure test reliability
 */

export const mockOpenAIChatResponse = {
  choices: [
    {
      message: {
        content:
          "Enhanced fantasy sword with intricate bronze detailing, ornate hilt, and sharp blade suitable for 3D rendering",
      },
      finish_reason: "stop",
      index: 0,
    },
  ],
  created: Date.now(),
  id: "mock-chat-completion-123",
  model: "gpt-4",
  object: "chat.completion",
  usage: {
    completion_tokens: 24,
    prompt_tokens: 50,
    total_tokens: 74,
  },
};

export const mockOpenAIImageResponse = {
  created: Date.now(),
  data: [
    {
      url: "https://mock-cdn.example.com/generated-image.png",
      revised_prompt:
        "A detailed fantasy sword with bronze material, ornate decorations, sharp edges, game-ready 3D asset style",
    },
  ],
};

export const mockOpenAIErrorResponse = {
  error: {
    message: "Invalid API key provided",
    type: "invalid_request_error",
    param: null,
    code: "invalid_api_key",
  },
};

export const mockOpenAIRateLimitResponse = {
  error: {
    message: "Rate limit exceeded. Please retry after 1 minute.",
    type: "rate_limit_error",
    param: null,
    code: "rate_limit_exceeded",
  },
};

/**
 * Create mock fetch for OpenAI chat completions
 */
export function createOpenAIChatMock(response = mockOpenAIChatResponse) {
  return async (url: string | URL, options?: any) => {
    if (typeof url === "string" && url.includes("chat/completions")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => response,
        text: async () => JSON.stringify(response),
      } as any;
    }
    return { ok: false, status: 404 } as any;
  };
}

/**
 * Create mock fetch for OpenAI image generation
 */
export function createOpenAIImageMock(response = mockOpenAIImageResponse) {
  return async (url: string | URL, options?: any) => {
    if (typeof url === "string" && url.includes("images/generations")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => response,
        text: async () => JSON.stringify(response),
      } as any;
    }
    return { ok: false, status: 404 } as any;
  };
}
