# Advanced Testing Patterns

This directory contains advanced testing patterns and frameworks for the Asset-Forge project. These tests go beyond traditional unit and integration tests to provide deeper insights into code quality, API compatibility, and system resilience.

## Overview

We implement five advanced testing patterns:

1. **Contract Testing** - Verify API contracts with external services
2. **Property-Based Testing** - Test invariants with random inputs
3. **Mutation Testing** - Measure test suite effectiveness
4. **Performance Benchmarking** - Track performance regressions
5. **Chaos Engineering** - Test system resilience

## Directory Structure

```
__tests__/advanced/
├── contract-testing/    # Pact contracts for external APIs
├── property-based/      # Fast-check property tests
├── performance/         # Performance benchmarks
├── chaos/              # Chaos engineering tests
└── README.md           # This file
```

## 1. Contract Testing (Pact)

Contract testing ensures compatibility with external APIs by defining and verifying contracts between consumer (our app) and providers (external services).

### Why Contract Testing?

- **Early Detection**: Catch breaking API changes before production
- **Confidence**: Deploy without fear of API incompatibilities
- **Documentation**: Contracts serve as living documentation
- **No Mocks**: Tests use real contract definitions

### Setup

```bash
# Install dependencies (already installed)
bun add -d @pact-foundation/pact
```

### Running Contract Tests

```bash
# Run all contract tests
bun test __tests__/advanced/contract-testing

# Run specific contract
bun test __tests__/advanced/contract-testing/openai-image-api.pact.test.ts
```

### Contracts Covered

1. **OpenAI Image Generation API** (`openai-image-api.pact.test.ts`)
   - Image generation requests
   - Error handling (401, 429)
   - Response validation

2. **Meshy AI 3D Conversion API** (`meshy-api.pact.test.ts`)
   - Image-to-3D conversion
   - Task status polling
   - Retexturing operations

### Generated Pacts

Contract files are generated in `${HOME}/asset-forge/apps/core/pacts/`:

- `asset-forge-core-openai-image-api.json`
- `asset-forge-core-meshy-ai-api.json`

### Adding New Contracts

```typescript
import { PactV3, MatchersV3 } from "@pact-foundation/pact";

const { like, regex } = MatchersV3;

const provider = new PactV3({
  consumer: "asset-forge-core",
  provider: "new-api-name",
  dir: path.resolve(__dirname, "../../../pacts"),
});

// Define interactions
await provider
  .given("API is available")
  .uponReceiving("a request")
  .withRequest({ method: "GET", path: "/endpoint" })
  .willRespondWith({ status: 200, body: like({ data: "value" }) });
```

## 2. Property-Based Testing (fast-check)

Property-based testing generates hundreds of random inputs to test invariants - properties that should always hold true regardless of input.

### Why Property-Based Testing?

- **Edge Cases**: Finds corner cases manual tests miss
- **Comprehensive**: Tests with 1000+ random inputs per property
- **Invariants**: Focuses on what should always be true
- **Confidence**: Higher confidence than example-based tests

### Setup

```bash
# Install dependencies (already installed)
bun add -d fast-check
```

### Running Property Tests

```bash
# Run all property-based tests
bun test __tests__/advanced/property-based

# Run with verbose output
bun test __tests__/advanced/property-based --verbose
```

### Properties Tested

1. **Asset ID Generation** (`input-validation.property.test.ts`)
   - Always generates valid identifiers
   - Idempotent (same input → same output)
   - Handles unicode safely

2. **Prompt Sanitization**
   - Never contains SQL injection patterns
   - Always within length limits
   - Preserves alphanumeric content

3. **Material Preset Validation**
   - Structure always valid
   - Tier ranges enforced
   - Color formats validated

4. **File Path Construction**
   - No path traversal attacks
   - Always produces valid paths
   - No security vulnerabilities

5. **Numeric Validation**
   - Polycount ranges enforced
   - Texture resolutions are powers of 2
   - Bounds always respected

### Writing Property Tests

```typescript
import * as fc from "fast-check";

it("should always satisfy property X", () => {
  fc.assert(
    fc.property(
      fc.string(), // Generate random string
      (input) => {
        const result = myFunction(input);

        // Assert properties that must always hold
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      },
    ),
    { numRuns: 1000 }, // Run 1000 times
  );
});
```

## 3. Mutation Testing (Stryker)

Mutation testing measures test suite effectiveness by introducing small changes (mutations) to code and checking if tests catch them.

### Why Mutation Testing?

- **Test Quality**: Measures how well tests catch bugs
- **Coverage Gaps**: Finds untested code paths
- **Confidence**: Higher mutation score = better test suite
- **Actionable**: Shows exactly which mutations survived

### Setup

```bash
# Install dependencies (already installed)
bun add -d @stryker-mutator/core @stryker-mutator/typescript-checker
```

### Running Mutation Tests

```bash
# Run mutation testing on services
bun run test:mutation

# Run on specific file
bunx stryker run --mutate="server/services/AssetService.ts"

# View HTML report
open reports/mutation/index.html
```

### Configuration

See `${HOME}/asset-forge/apps/core/stryker.config.json`

Key settings:

- **mutate**: `server/services/*.ts` (all service files)
- **thresholds**:
  - High: 80% (excellent)
  - Low: 60% (acceptable)
  - Break: 50% (fails CI)
- **reporters**: HTML, JSON, progress

### Interpreting Results

Mutation Score = (Killed Mutations / Total Mutations) × 100

- **Killed**: Test caught the mutation ✅
- **Survived**: Mutation not caught ❌ (test gap!)
- **No Coverage**: Code not tested at all
- **Timeout**: Mutation caused infinite loop

Example output:

```
Mutation Score: 85.3%
✅ 128 Killed
❌ 22 Survived
⏱️  3 Timeout
```

### Improving Mutation Score

1. Review survived mutations in HTML report
2. Add tests that would catch those mutations
3. Re-run mutation testing
4. Aim for 80%+ mutation score

## 4. Performance Benchmarking

Performance benchmarking establishes baselines and detects regressions over time.

### Why Performance Benchmarking?

- **Baselines**: Know what "normal" performance looks like
- **Regression Detection**: Catch slowdowns before production
- **Trends**: Track performance over time
- **Optimization**: Identify bottlenecks

### Setup

No additional dependencies needed (uses built-in `performance.now()`).

### Running Benchmarks

```bash
# Run all performance benchmarks
bun test __tests__/advanced/performance

# Run with detailed output
bun test __tests__/advanced/performance --verbose
```

### Operations Benchmarked

1. **String Operations**
   - Asset ID generation
   - Prompt sanitization

2. **Validation Operations**
   - Material preset validation

3. **JSON Operations**
   - Small object serialization
   - Large dataset serialization

4. **File Path Operations**
   - Path construction

### Benchmark Results

Results are saved to:

- `${HOME}/asset-forge/apps/core/reports/performance/benchmarks.json` (historical)
- `${HOME}/asset-forge/apps/core/reports/performance/baselines.json` (current baselines)

Example output:

```
📊 asset-id-generation
   Average: 0.082ms
   Baseline: 0.100ms (max: 0.150ms)
   Range: 0.051ms - 0.143ms
   Std Dev: 0.021ms
   ✅ Within tolerance
```

### Setting Baselines

1. Run benchmarks on known-good code
2. Review baseline file
3. Adjust tolerance percentages as needed
4. Commit baseline file to repo

### Performance Regression

If a benchmark exceeds baseline + tolerance:

```
   ❌ REGRESSION DETECTED: 85.3% slower
```

Investigate:

1. What changed in recent commits?
2. Is the regression expected?
3. Can it be optimized?
4. Should baseline be updated?

## 5. Chaos Engineering

Chaos engineering tests system resilience under adverse conditions.

### Why Chaos Engineering?

- **Resilience**: Verify system handles failures gracefully
- **Production-Ready**: Catch issues before they hit users
- **Confidence**: Deploy knowing system can handle chaos
- **SRE Practice**: Industry standard for reliable systems

### Setup

No additional dependencies needed (uses mocks and simulations).

### Running Chaos Tests

```bash
# Run all chaos tests
bun test __tests__/advanced/chaos

# Run specific chaos scenario
bun test __tests__/advanced/chaos/resilience.chaos.test.ts
```

### Chaos Scenarios

1. **Network Failures**
   - Connection timeouts
   - Retry with exponential backoff
   - Circuit breaker pattern

2. **Database Issues**
   - Connection pool exhaustion
   - Transaction deadlocks
   - Query timeouts

3. **High Load**
   - Concurrent request spikes
   - Rate limiting
   - Memory pressure

4. **External API Failures**
   - OpenAI API failures
   - Meshy API failures
   - Fallback chains

5. **Resource Exhaustion**
   - File descriptor limits
   - Disk space exhaustion

### Example Output

```
✅ Handled 95/100 requests under load
✅ Rate limiter blocked 5/10 requests
⚠️  System degraded under memory pressure (expected)
```

### Writing Chaos Tests

```typescript
it("should handle network timeout gracefully", async () => {
  const mockFetch = mock(async () => {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    throw new Error("Timeout");
  });

  const result = await handleNetworkRequest(mockFetch, {
    timeout: 1000,
    maxRetries: 0,
  });

  expect(result.success).toBe(false);
  expect(result.error).toMatch(/timeout/i);
});
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Contract Tests
  run: bun test __tests__/advanced/contract-testing

- name: Property-Based Tests
  run: bun test __tests__/advanced/property-based

- name: Performance Benchmarks
  run: bun test __tests__/advanced/performance

- name: Chaos Tests
  run: bun test __tests__/advanced/chaos

- name: Mutation Testing
  run: bun run test:mutation
  # Only on main branch (slow)
  if: github.ref == 'refs/heads/main'
```

### Pre-Commit Hook

Add to `.husky/pre-commit`:

```bash
# Run fast tests only
bun test __tests__/advanced/contract-testing
bun test __tests__/advanced/property-based
```

## Best Practices

### Contract Testing

- ✅ Update contracts when API changes
- ✅ Version contracts with provider
- ✅ Run before deploying API changes
- ❌ Don't test implementation details
- ❌ Don't make actual API calls

### Property-Based Testing

- ✅ Test invariants, not examples
- ✅ Use 1000+ iterations
- ✅ Cover edge cases (empty, null, huge)
- ❌ Don't test random behavior
- ❌ Don't make tests non-deterministic

### Mutation Testing

- ✅ Aim for 80%+ mutation score
- ✅ Review survived mutations
- ✅ Run periodically (weekly)
- ❌ Don't chase 100% (diminishing returns)
- ❌ Don't run on every commit (slow)

### Performance Benchmarking

- ✅ Establish baselines early
- ✅ Run on consistent hardware
- ✅ Track trends over time
- ❌ Don't compare across machines
- ❌ Don't fail on minor variations

### Chaos Engineering

- ✅ Test realistic failure scenarios
- ✅ Verify graceful degradation
- ✅ Check error messages
- ❌ Don't test happy path
- ❌ Don't run in production (yet)

## Troubleshooting

### Contract Tests Failing

**Issue**: Pact mock server not starting

**Solution**:

```bash
# Check if port 1234 is in use
lsof -i :1234
kill -9 <PID>

# Run tests again
bun test __tests__/advanced/contract-testing
```

### Property Tests Failing

**Issue**: Tests fail intermittently

**Solution**:

```typescript
// Add seed for reproducibility
fc.assert(
  fc.property(...),
  { seed: 42 } // Fixed seed for debugging
);
```

### Mutation Tests Timeout

**Issue**: Stryker hangs on certain mutations

**Solution**:

```json
// In stryker.config.json
{
  "timeoutMS": 60000, // Increase timeout
  "maxConcurrentTestRunners": 2 // Reduce concurrency
}
```

### Performance Tests Inconsistent

**Issue**: Benchmarks vary wildly

**Solution**:

```bash
# Close other applications
# Disable CPU throttling
# Run multiple times and average
for i in {1..5}; do
  bun test __tests__/advanced/performance
done
```

### Chaos Tests Too Slow

**Issue**: Tests take too long

**Solution**:

```typescript
// Reduce iterations in chaos tests
const totalRequests = 50; // Instead of 100
const maxRetries = 2; // Instead of 5
```

## Maintenance

### Weekly Tasks

- [ ] Run mutation testing: `bun run test:mutation`
- [ ] Review survived mutations
- [ ] Check performance trends
- [ ] Update baselines if needed

### Monthly Tasks

- [ ] Review contract pacts with API providers
- [ ] Update property test generators
- [ ] Add new chaos scenarios
- [ ] Audit test coverage gaps

### When to Update

- **Contracts**: When external API changes
- **Properties**: When adding new validation logic
- **Mutations**: When improving test suite
- **Benchmarks**: When optimizing performance
- **Chaos**: When adding resilience features

## Resources

### Documentation

- [Pact](https://docs.pact.io/)
- [fast-check](https://fast-check.dev/)
- [Stryker](https://stryker-mutator.io/)
- [Chaos Engineering](https://principlesofchaos.org/)

### Articles

- [Introduction to Contract Testing](https://pactflow.io/blog/what-is-contract-testing/)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Mutation Testing Best Practices](https://stryker-mutator.io/docs/mutation-testing-elements/introduction)
- [Performance Testing Strategies](https://web.dev/performance/)
- [Chaos Engineering at Netflix](https://netflixtechblog.com/chaos-engineering-upgraded-878d341f15fa)

## Contributing

When adding new tests:

1. Choose the right testing pattern
2. Follow existing patterns and conventions
3. Add documentation to this README
4. Update package.json scripts if needed
5. Test locally before committing

## Support

Questions? Issues?

- Check troubleshooting section above
- Review test examples in test files
- Ask in team Slack #testing channel
- File issue with `testing` label
