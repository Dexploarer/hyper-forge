# Testing Philosophy

**Last Updated:** 2025-11-13

## Overview

Asset-Forge uses a **smart mocking strategy** that balances test reliability, speed, and cost-effectiveness. This document clarifies our testing approach and corrects previous misconceptions about "zero mocks."

## The Truth About Our Mocking Strategy

### ❌ Previous False Claim

> "NO MOCKS OR SPIES - Use real implementations only"

This was **intellectually dishonest**. We DO use mocks extensively.

### ✅ Actual Strategy

We use a **pragmatic, smart mocking approach**:

- **ZERO MOCKS** for internal code (our business logic, database, HTTP handlers)
- **STRATEGIC MOCKS** for external APIs (OpenAI, Meshy, Privy, etc.)

## What We Mock (and Why)

### External APIs - ALWAYS MOCKED

| API            | Mock Implementation                  | Rationale                                                              |
| -------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| **OpenAI**     | `MockLanguageModelV3` from `ai/test` | Cost ($0.01-$0.50 per test), Speed (2-10s per call), Non-deterministic |
| **Meshy AI**   | Custom mock responses                | Cost ($2-$5 per model), Speed (30-60s per generation), Quota limits    |
| **Privy Auth** | JWT token parsing mock               | Speed (500ms-2s per verify), Rate limiting                             |
| **DALL-E**     | Mock image URLs                      | Cost ($0.02-$0.08 per image), Speed (10-20s)                           |
| **ElevenLabs** | Mock audio buffers                   | Cost ($0.30 per 1000 chars), Speed (5-15s)                             |
| **AI Gateway** | Vercel AI SDK mocks                  | Speed, Rate limiting, Cost variability                                 |

### Helper Files

Located in `__tests__/helpers/`:

- **`ai.ts`** - Mock language models, streaming, JSON responses, tool calls
- **`privy.ts`** - Mock authentication and user creation
- **`auth.ts`** - JWT token generation for tests
- **`db.ts`** - Real database operations with test isolation

## What We DON'T Mock (and Why)

### Internal Code - NEVER MOCKED

| Component              | Real Implementation   | Why                                                            |
| ---------------------- | --------------------- | -------------------------------------------------------------- |
| **PostgreSQL**         | Real test database    | Catches schema issues, constraint violations, transaction bugs |
| **Drizzle ORM**        | Real queries          | Validates query generation, type safety, relationships         |
| **Elysia Server**      | Real HTTP server      | Tests routing, middleware, validation, error handling          |
| **Business Logic**     | Real service classes  | Validates core functionality, edge cases, error flows          |
| **File System**        | Real temp directories | Tests file upload, storage, cleanup                            |
| **TypeBox Validation** | Real validation       | Ensures API contracts work as expected                         |

## Rationale: Why This Strategy?

### The Problem with External APIs in Tests

**Cost Example:**

```
1 test run with real APIs:
- 50 OpenAI calls × $0.01 = $0.50
- 5 Meshy generations × $3 = $15.00
- 100 Privy verifications × $0.001 = $0.10
= $15.60 per test run
= $468 per month (30 runs/day)
```

**Speed Example:**

```
1 test suite with real APIs:
- 50 OpenAI calls × 3s = 150s
- 5 Meshy generations × 45s = 225s
- 100 Privy verifications × 0.5s = 50s
= 425 seconds (7+ minutes)

With mocks:
= 5-10 seconds total
```

**Reliability Issues:**

- Rate limiting (429 errors)
- Network failures (ECONNRESET, timeouts)
- Non-deterministic responses
- Quota exhaustion
- API downtime

### The Value of Real Internal Code

**Real Database:**

```typescript
// This catches real bugs that mocks would hide:
await db.insert(users).values({ id: "test-1", email: null });
// ❌ Fails with constraint violation (good!)
// ✅ Mock would pass (bad!)
```

**Real HTTP Server:**

```typescript
// This tests actual request/response flow:
const response = await app.handle(new Request(url, { method: "POST" }));
// ✅ Tests routing, middleware, validation, serialization
// ❌ Mock would skip all of this
```

## Implementation Examples

### ✅ Correct: Mock External, Real Internal

```typescript
import { createMockModel } from "../helpers/ai";
import { db } from "../../server/db/db";

test("content generation with world context", async () => {
  // ✅ Mock external API (OpenAI)
  const mockModel = createMockModel("A mystical sword");

  // ✅ Real database operation
  const worldConfig = await db
    .insert(worldConfigs)
    .values({
      name: "Test Fantasy",
      races: ["Elf", "Dwarf"],
    })
    .returning();

  // ✅ Real business logic
  const result = await contentService.generate({
    prompt: "sword",
    worldConfigId: worldConfig.id,
    model: mockModel, // Inject mock
  });

  // ✅ Real database query
  const saved = await db.query.assets.findFirst({
    where: eq(assets.id, result.assetId),
  });

  expect(saved).toBeDefined();
});
```

### ❌ Wrong: Mock Internal Code

```typescript
// ❌ DON'T DO THIS - mocking internal code
const mockDb = {
  insert: jest.fn().mockResolvedValue({ id: "fake" }),
  query: jest.fn().mockResolvedValue({ name: "fake" }),
};

// This hides bugs! Use real database!
```

## Test Helper Usage

### AI Mocks (`__tests__/helpers/ai.ts`)

```typescript
import {
  createMockModel, // Simple text response
  createMockStreamingModel, // Streaming responses
  createMockJSONModel, // Structured output
  createMockModelWithError, // Error simulation
  createMockMeshyResponse, // 3D generation
  createMockImageResponse, // DALL-E style
} from "../helpers/ai";

// Example: Test prompt enhancement
const model = createMockModel("Enhanced prompt here");
const result = await promptService.enhance("user prompt", model);
expect(result).toContain("Enhanced");
```

### Privy Mocks (`__tests__/helpers/privy.ts`)

```typescript
import { createMockAuthUser, createMockAdminUser } from "../helpers/privy";

// Example: Test admin-only endpoint
const adminUser = createMockAdminUser();
const response = await app.handle(
  createAuthRequest("/api/admin/users", adminUser),
);
expect(response.status).toBe(200);
```

### Auth Helpers (`__tests__/helpers/auth.ts`)

```typescript
import { createMockJWT, createAuthRequest } from "../helpers/auth";

// Example: Test authenticated endpoint
const token = createMockJWT({ userId: "test-user" });
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
```

## Test Isolation Strategy

### Mini-World Pattern

Each test creates its own isolated "mini-world":

```typescript
describe("Asset Generation", () => {
  let testUser: User;
  let testProject: Project;
  let testWorldConfig: WorldConfig;

  beforeEach(async () => {
    // Create isolated test data
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);
    testWorldConfig = await createTestWorldConfig(testUser.id);
  });

  afterEach(async () => {
    // Clean up test data (cascade deletes)
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it("generates asset with world context", async () => {
    const mockModel = createMockModel("Fantasy sword");

    const result = await generationService.generate({
      userId: testUser.id,
      projectId: testProject.id,
      worldConfigId: testWorldConfig.id,
      prompt: "sword",
      model: mockModel,
    });

    expect(result.assetId).toBeDefined();
  });
});
```

### Why This Works

- **Isolated**: Each test has its own data (no shared state)
- **Deterministic**: Same inputs = same outputs
- **Fast Cleanup**: Foreign key cascades handle deletion
- **No Pollution**: Tests can run in parallel without conflicts

## Performance Benchmarks

### Current Performance (with mocks)

```
Integration Tests: 39.18 seconds
- 274 total tests
- 233 passing (85.1%)
- ~0.14s per test average

Load Tests: 18+ scenarios
- Health endpoint: 500-2000 req/s
- API endpoints: 200-1000 req/s
- p95 latency: <500ms
```

### If We Used Real APIs

```
Estimated Time: 425+ seconds (7+ minutes)
Estimated Cost: $15.60 per run
Failure Rate: 10-20% (rate limits, timeouts)
Developer Friction: High (CI failures, slow feedback)
```

## Best Practices

### DO ✅

- Mock external APIs (OpenAI, Meshy, Privy)
- Use real database with test isolation
- Use real HTTP server (Elysia test client)
- Clean up test data in `afterEach`
- Use descriptive test names
- Test edge cases and error conditions
- Inject mocks via dependency injection

### DON'T ❌

- Mock internal database operations
- Mock internal business logic
- Mock Elysia routing/middleware
- Share test data between tests
- Skip cleanup (database pollution)
- Use `any` or `unknown` types
- Hardcode mock data (use factories)

## Common Misconceptions

### "Mocks are always bad"

**FALSE.** Mocking external APIs is pragmatic and necessary. What's bad is mocking internal code that you control.

### "Real everything is better"

**FALSE.** Real external APIs in tests are slow, expensive, flaky, and create poor developer experience.

### "Tests with mocks aren't real tests"

**FALSE.** Tests with smart mocks for external dependencies are MORE reliable than tests that depend on external services.

### "We don't use mocks"

**FALSE.** We use mocks extensively for external APIs. We just don't mock our own code.

## Evolution of Our Strategy

### Phase 1: "No Mocks" (October 2025)

**Claim:** "NO MOCKS OR SPIES - Use real implementations only"

**Problem:** This was never actually true. We always mocked external APIs.

**Issue:** Intellectual dishonesty undermined credibility.

### Phase 2: "Smart Mocking" (November 2025) ← Current

**Claim:** "Zero mocks for internal code, strategic mocks for external APIs"

**Benefit:** Accurate, honest, pragmatic approach.

**Result:** Fast, reliable, cost-effective tests that actually work.

## Future Improvements

### Planned Enhancements

1. **Contract Testing** - Verify mocks match real API contracts
2. **E2E Smoke Tests** - Occasional real API calls in staging
3. **Mock Versioning** - Update mocks when APIs change
4. **Visual Regression** - Screenshot comparison for 3D viewer
5. **Chaos Engineering** - Simulate network failures, timeouts

### Monitoring Mock Accuracy

```typescript
// Optional: Validate mock responses match real API schema
test.skip("OpenAI mock matches real API", async () => {
  const mockResponse = createMockModel("test");
  const realResponse = await openai.chat.completions.create({...});

  expect(mockResponse).toMatchSchema(realResponse);
});
```

## Related Documentation

- [Test Coverage Report](../TEST_COVERAGE_REPORT.md) - Detailed test statistics
- [Production Checklist](../deployment/production-checklist.md) - Deployment testing
- [AI Helper Reference](__tests__/helpers/ai.ts) - Mock AI implementations
- [Privy Helper Reference](__tests__/helpers/privy.ts) - Mock authentication

## Questions?

**Q: Why not use VCR/record-replay for external APIs?**

A: Record-replay is brittle, creates large fixtures, and still costs money for initial recording. Mocks are simpler and more maintainable.

**Q: How do we know mocks match real APIs?**

A: We validate mocks during development and update them when APIs change. Future: contract testing.

**Q: What about integration tests with real APIs?**

A: We run occasional smoke tests in staging with real APIs, but not in CI/CD.

**Q: Won't mocks hide bugs?**

A: Only if you mock internal code. Mocking external APIs doesn't hide bugs in our code—it prevents external service issues from breaking our tests.

---

**Remember:** Be honest about your testing strategy. "Smart mocking" is better than claiming "no mocks" when you clearly use them.
