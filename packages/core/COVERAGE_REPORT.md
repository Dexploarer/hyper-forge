# Test Coverage Report

**Generated:** 2025-11-13
**Project:** Asset-Forge Core Package

## Executive Summary

- **Total Tests:** 218 tests
- **Passing:** 178 (81.7%)
- **Failing:** 25 (11.5%)
- **Skipped:** 15 (6.9%)
- **Overall Coverage:** 43.84% functions, 56.55% lines
- **Target Coverage:** 80% (as per bunfig.toml)
- **Gap to Target:** 36.16% functions, 23.45% lines

## Coverage by Category

### HIGH COVERAGE (>80%)

- Query hooks: `useAssets.ts`, `useContent.ts`, `useProjects.ts`, `usePrompts.ts` (100% functions, 82-100% lines)
- Query key generators: `query-keys.ts` (73.68% functions, 97.78% lines)
- Query definitions: `assets.queries.ts`, `projects.queries.ts` (100% both)

### MEDIUM COVERAGE (40-80%)

- Content queries: `content.queries.ts` (88.64% functions, 76.62% lines)
- Prompt queries: `prompts.queries.ts` (95.45% functions, 93.22% lines)
- App context: `AppContext.tsx` (25% functions, 63.33% lines)
- Asset store: `useAssetsStore.ts` (2.86% functions, 38.55% lines)

### LOW COVERAGE (<40%)

- API Clients: `AssetService.ts`, `ContentAPIClient.ts`, `ProjectService.ts`, `PromptService.ts` (0-10% functions, 0-9% lines)
- State Management: Most Zustand stores (1-4% functions, 16-46% lines)
  - `useArmorFittingStore.ts` (1.69% functions, 16.58% lines)
  - `useHandRiggingStore.ts` (3.85% functions, 37.91% lines)
  - `useRetargetingStore.ts` (3.13% functions, 46.41% lines)
  - `useDebuggerStore.ts` (2.13% functions, 38.69% lines)
  - `useGenerationStore.ts` (1.85% functions, 30.49% lines)
- Auth utilities: `auth-token-store.ts` (0% functions, 35.71% lines)
- API client: `api-client.ts` (0% functions, 26.09% lines)

## Critical Gaps

### 1. API Service Layer (0-10% coverage)

**Impact:** HIGH - These are core business logic

Files needing tests:

- `src/services/api/AssetService.ts` - 0% functions, 4.48% lines
- `src/services/api/ContentAPIClient.ts` - 0% functions, 0.52% lines
- `src/services/api/ProjectService.ts` - 0% functions, 5.56% lines
- `src/services/api/PromptService.ts` - 10% functions, 9.17% lines

**Recommended Tests:**

- Unit tests for API client methods
- Mock HTTP responses using fixtures
- Test error handling paths
- Test retry logic

### 2. State Management Stores (1-4% coverage)

**Impact:** MEDIUM - Complex state logic, but UI-focused

Files needing tests:

- `useArmorFittingStore.ts` - Only 1.69% functions covered
- `useHandRiggingStore.ts` - Only 3.85% functions covered
- `useRetargetingStore.ts` - Only 3.13% functions covered
- `useDebuggerStore.ts` - Only 2.13% functions covered
- `useGenerationStore.ts` - Only 1.85% functions covered

**Recommended Tests:**

- Zustand store action tests
- State transition tests
- Side effect tests (async actions)
- Selector tests

### 3. Authentication (0% coverage)

**Impact:** HIGH - Security critical

Files needing tests:

- `auth-token-store.ts` - 0% functions, 35.71% lines

**Recommended Tests:**

- Token storage/retrieval
- Token expiry handling
- Secure storage mechanisms

## Test Failures Analysis

### AssetService Unit Test Failures (25 failures)

**Root Cause:** Functions not implemented or incorrectly exported

Failing methods:

- `AssetService.getModelUrl()` - TypeError: not a function
- `AssetService.getConceptArtUrl()` - TypeError: not a function
- `AssetService.getPreviewImageUrl()` - TypeError: not a function

**Fix Required:**

1. Verify `AssetService` exports these methods
2. Check if implementation exists in `/Users/home/Forge Workspace/asset-forge/packages/core/src/services/api/AssetService.ts`
3. Update tests if API changed

### Integration Test Failures

**Root Cause:** Server not running + Missing DATABASE_URL

Affected test suites:

- `rate-limiting.test.ts` - All 13 tests failed (ConnectionRefused to localhost:3004)
- `load.test.ts` - All performance benchmarks failed (ConnectionRefused)
- `cdn-upload.test.ts` - DATABASE_URL missing

**Fix Required:**

1. These tests need a running test server
2. Consider mocking HTTP server for integration tests
3. Use test database with migrations

## Coverage Gaps by Feature

### Untested Features

1. **3D Model Loading** - Partial coverage in `__tests__/unit/three/`
2. **Asset Upload Pipeline** - No dedicated upload tests
3. **Authentication Flow** - No auth flow tests
4. **WebSocket/SSE** - No real-time update tests
5. **CDN Integration** - Tests exist but fail due to server dependency

### Partially Tested Features

1. **Generation Pipeline** - Good coverage in `GenerationService.test.ts`
2. **Asset Management** - Query hooks covered, but API layer not tested
3. **Content Generation** - Query layer tested, service layer not tested
4. **3D Viewer** - Basic tests exist but incomplete

## Recommendations

### Immediate Actions (Week 1)

1. **Fix AssetService test failures** - Implement missing methods or fix tests
2. **Add smart mocks for API clients** - Use fixtures created in `__tests__/fixtures/`
3. **Test database setup** - Add test database configuration
4. **Auth token tests** - Critical security feature

### Short-term Goals (Month 1)

1. **Increase API coverage to 60%+** - Focus on `AssetService`, `ContentAPIClient`, `ProjectService`
2. **Add store action tests** - Cover critical Zustand store actions
3. **Integration test mocking** - Mock server for integration tests
4. **CDN upload tests** - Real file upload tests with mocks

### Long-term Goals (Quarter 1)

1. **Achieve 80% overall coverage** - Meet target from bunfig.toml
2. **E2E test suite** - Full user flow tests with Playwright
3. **Visual regression tests** - 3D viewer screenshot comparison
4. **Performance benchmarks** - Automated performance regression detection

## Smart Mocking Strategy (Implemented)

### Fixtures Created ✅

1. **`__tests__/fixtures/openai.ts`** - OpenAI API mocks (chat, image generation)
2. **`__tests__/fixtures/meshy.ts`** - Meshy AI 3D generation mocks (image-to-3D, retexture, rigging)
3. **`__tests__/fixtures/privy.ts`** - Privy authentication mocks (user, token, verification)

### Mocking Philosophy

- **NO MOCKS** for internal code (database, HTTP handlers, business logic)
- **SMART MOCKS** for external APIs (OpenAI, Meshy, Privy) to avoid costs
- Use real PostgreSQL database with test data isolation
- Use real Elysia HTTP server with test client

### Mock Usage Examples

```typescript
import { createMeshyMock, createMockGLBBuffer } from "../fixtures/meshy";
import { mockOpenAIChatResponse } from "../fixtures/openai";
import { createMockAuthRequest } from "../fixtures/privy";

// Example: Mock Meshy API for generation pipeline test
const mockFetch = createMeshyMock({ imageToThreeStatus: "SUCCEEDED" });
const service = new GenerationService({ fetchFn: mockFetch });
```

## Files Below 80% Threshold

| File                    | % Functions | % Lines | Priority    |
| ----------------------- | ----------- | ------- | ----------- |
| AssetService.ts         | 0.00        | 4.48    | 🔴 CRITICAL |
| ContentAPIClient.ts     | 0.00        | 0.52    | 🔴 CRITICAL |
| ProjectService.ts       | 0.00        | 5.56    | 🔴 CRITICAL |
| PromptService.ts        | 10.00       | 9.17    | 🔴 CRITICAL |
| api-client.ts           | 0.00        | 26.09   | 🔴 CRITICAL |
| auth-token-store.ts     | 0.00        | 35.71   | 🔴 CRITICAL |
| useArmorFittingStore.ts | 1.69        | 16.58   | 🟡 HIGH     |
| useGenerationStore.ts   | 1.85        | 30.49   | 🟡 HIGH     |
| useDebuggerStore.ts     | 2.13        | 38.69   | 🟡 HIGH     |
| useAssetsStore.ts       | 2.86        | 38.55   | 🟡 HIGH     |
| useHandRiggingStore.ts  | 3.85        | 37.91   | 🟡 HIGH     |
| useRetargetingStore.ts  | 3.13        | 46.41   | 🟡 HIGH     |
| AppContext.tsx          | 25.00       | 63.33   | 🟢 MEDIUM   |
| content.queries.ts      | 88.64       | 76.62   | 🟢 MEDIUM   |

## Next Steps

1. **Implement AssetService methods** or fix tests
2. **Add unit tests for API clients** using smart mocks
3. **Set up test database** for integration tests
4. **Create store action tests** for Zustand stores
5. **Increase server/backend coverage** - Most server code untested
6. **Add E2E tests** for critical user flows

## Test Infrastructure Status

✅ **Completed:**

- Bun test runner configured
- 80% coverage threshold set
- Smart mock fixtures created
- Test preload for DOM setup
- Coverage reporters (text, lcov, html)

❌ **TODO:**

- Test database setup
- Integration test server mocking
- E2E test suite (Playwright configured but not used)
- Visual regression baseline images
- Performance benchmark baselines

---

**Report Generated by:** Testing Specialist (Claude Code)
**Tooling:** Bun Test v1.3.1
