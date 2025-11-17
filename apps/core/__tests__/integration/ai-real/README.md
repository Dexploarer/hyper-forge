# Real AI Integration Tests

These tests make **actual API calls** to AI services using your real API keys from `.env`.

## ⚠️ Important

- **Costs money** - Each test run consumes API credits
- **Requires internet** - Tests will fail without connectivity
- **Requires valid API keys** - Set in `apps/core/.env`:
  - `AI_GATEWAY_API_KEY` (recommended)
  - `OPENAI_API_KEY` (fallback)
  - `MESHY_API_KEY` (for 3D generation)

## Running Tests

```bash
# Run all real AI integration tests (WILL COST MONEY)
bun test apps/core/__tests__/integration/ai-real

# Run specific test file
bun test apps/core/__tests__/integration/ai-real/content-generation-real.test.ts

# Run with verbose output
bun test apps/core/__tests__/integration/ai-real --verbose
```

## What Gets Tested

1. **Content Generation** (`content-generation-real.test.ts`)
   - Real NPC generation
   - Real dialogue generation
   - Real quest generation
   - Real lore generation
   - Validates actual AI responses

2. **AI Creation** (`ai-creation-real.test.ts`)
   - Real image generation (OpenAI DALL-E or AI Gateway)
   - Real 3D model generation (Meshy)
   - Validates actual generation workflow

## Test Philosophy

Unlike mocked tests, these:
- ✅ Use actual API keys from environment
- ✅ Make real HTTP calls to AI services
- ✅ Validate real AI response quality
- ✅ Test end-to-end integration
- ❌ Cost money per run
- ❌ Depend on external service availability

## When to Run

- Before major releases
- When debugging AI integration issues
- After changing AI service configurations
- Periodically to ensure AI quality

## Cost Considerations

Approximate costs per test run:
- Content generation: ~$0.05-0.20 (depends on model)
- Image generation: ~$0.04 per image
- 3D generation: ~$0.50 per model (Meshy credit)

Total: ~$1-2 per full test run
