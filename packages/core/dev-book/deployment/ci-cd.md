# CI/CD Pipeline Documentation

## Overview

Asset-Forge uses a comprehensive CI/CD pipeline to ensure code quality, test coverage, and reliable deployments. This document describes the automated testing, continuous integration, and deployment processes.

## Table of Contents

1. [GitHub Actions Workflow](#github-actions-workflow)
2. [Pre-commit Hooks](#pre-commit-hooks)
3. [Coverage Requirements](#coverage-requirements)
4. [Test Performance Monitoring](#test-performance-monitoring)
5. [Local Development](#local-development)
6. [Troubleshooting](#troubleshooting)

---

## GitHub Actions Workflow

### Overview

Our GitHub Actions workflow runs on every push and pull request to `main` and `develop` branches. It consists of four parallel jobs:

1. **Unit & Integration Tests** - Fast feedback on code changes
2. **E2E Tests (Playwright)** - Browser-based testing across multiple browsers
3. **Performance Tests** - Load testing and performance benchmarks
4. **Test Summary** - Aggregates results and comments on PRs

### Workflow Configuration

Location: `.github/workflows/test.yml`

### Jobs Breakdown

#### 1. Unit & Integration Tests

**Purpose**: Run fast unit and integration tests with coverage reporting

**Steps**:

- Checkout code
- Setup Bun runtime
- Cache dependencies
- Install dependencies
- Run database migrations (PostgreSQL test database)
- Type checking with TypeScript
- Linting with ESLint
- Run tests with coverage
- Upload coverage to Codecov
- Generate coverage badge

**Duration**: ~5-7 minutes

**Environment**:

- PostgreSQL 16 (Docker container)
- Bun 1.3.2
- Node.js 22.12.0

**Coverage Requirements**:

- Lines: 80%
- Functions: 80%
- Statements: 80%
- Branches: 75%

#### 2. E2E Tests (Playwright)

**Purpose**: Test full user flows in real browsers

**Steps**:

- Checkout code
- Setup Bun runtime
- Cache dependencies
- Install Playwright browsers (chromium, firefox, webkit)
- Run database migrations
- Start dev server (automatically via Playwright config)
- Run E2E tests for each browser
- Upload test reports and videos on failure

**Duration**: ~10-12 minutes

**Matrix Strategy**:

- Tests run in parallel for each browser
- Failures in one browser don't stop others

#### 3. Performance Tests

**Purpose**: Monitor test execution times and catch performance regressions

**Steps**:

- Run load tests
- Track test timing
- Generate performance reports
- Compare with baseline performance

**Duration**: ~3-5 minutes

#### 4. Test Summary

**Purpose**: Aggregate all test results and report status

**Steps**:

- Check results from all jobs
- Post summary comment to PR
- Fail CI if any job fails

### Caching Strategy

We cache the following to speed up builds:

```yaml
~/.bun/install/cache  # Bun package cache
**/node_modules       # Node modules
```

Cache keys are based on `bun.lock` file hash.

### Environment Variables

The following environment variables are available in CI:

```bash
BUN_VERSION=1.3.2
NODE_VERSION=22.12.0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/asset_forge_test
CI=true
```

### Secrets Required

Add these secrets in GitHub repository settings:

- `CODECOV_TOKEN` - For coverage reporting (optional but recommended)

### Status Checks

The following checks must pass before merging:

- ✅ Unit & Integration Tests
- ✅ E2E Tests (all browsers)
- ✅ Performance Tests
- ✅ Type Checking
- ✅ Linting
- ✅ Coverage Thresholds (80%+)

---

## Pre-commit Hooks

### Overview

Pre-commit hooks run locally before every commit to catch issues early. We use Husky to manage Git hooks.

### Installation

Husky is automatically installed when you run:

```bash
bun install
```

The `prepare` script in `package.json` configures Husky:

```json
"prepare": "husky"
```

### Pre-commit Hook

Location: `.husky/pre-commit`

**Runs**:

1. **Type Checking** - Ensures no TypeScript errors
2. **Linting** - Runs ESLint with auto-fix
3. **Code Formatting** - Formats staged files with Prettier
4. **Unit Tests** - Runs fast unit tests (integration tests skipped for speed)

**Duration**: ~30-60 seconds

**Example Output**:

```bash
🔍 Running pre-commit checks...

📝 Type checking...
✅ No type errors

🔧 Running linter...
✅ Linting passed

✨ Formatting code...
✅ Code formatted

🧪 Running unit tests...
✅ 24 tests passed

✅ All pre-commit checks passed!
```

### Commit Message Hook

Location: `.husky/commit-msg`

**Validates** commit messages follow Conventional Commits format:

```
<type>(<scope>): <subject>
```

**Valid Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert a previous commit

**Examples**:

```bash
feat(api): add new endpoint for user management
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
test(user): add unit tests for user service
```

### Bypassing Hooks (Not Recommended)

In rare cases, you can bypass hooks with:

```bash
git commit --no-verify
```

**⚠️ Warning**: Only use this for urgent fixes. CI will still run all checks.

---

## Coverage Requirements

### Configuration

Coverage is configured in `packages/core/bunfig.toml`:

```toml
[test]
coverage = true

# Thresholds - fail if below these percentages
coverageThreshold = { lines = 80, functions = 80, statements = 80, branches = 75 }

# Skip test files in coverage
coverageSkipTestFiles = true

# Multiple reporter formats
coverageReporter = ["text", "lcov", "json", "html"]

# Output directory
coverageDir = "coverage"

# Exclude patterns
coveragePathIgnorePatterns = [
  "**/node_modules/**",
  "**/__tests__/**",
  "**/dist/**",
  "**/*.config.*",
  "**/scripts/**",
  "**/dev-book/**"
]
```

### Running Coverage Locally

```bash
# Run tests with coverage
cd packages/core
bun run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Reports

Coverage reports are generated in multiple formats:

1. **Console** - Summary printed to terminal
2. **LCOV** - `coverage/lcov.info` (for Codecov)
3. **JSON** - `coverage/coverage-summary.json`
4. **HTML** - `coverage/index.html` (interactive report)

### Improving Coverage

If coverage is below threshold:

1. Check the HTML report to identify uncovered code
2. Add tests for uncovered lines/branches
3. Consider if uncovered code is actually testable
4. Update ignore patterns if code shouldn't be covered

### CI Coverage Enforcement

The CI pipeline will fail if:

- Overall coverage is below 80% (lines, functions, statements)
- Branch coverage is below 75%

---

## Test Performance Monitoring

### Overview

We track test execution times to catch performance regressions early.

### Performance Script

Location: `packages/core/scripts/test-performance.ts`

**Features**:

- Tracks test execution times
- Identifies slowest tests
- Compares against baseline
- Alerts on performance degradation (>10%)

### Running Performance Monitoring

```bash
# Set initial baseline
cd packages/core
bun run test:perf:baseline

# Run performance analysis
bun run test:perf
```

### Performance Thresholds

- **Slow Test**: > 5 seconds
- **Very Slow Test**: > 10 seconds
- **Performance Degradation Alert**: > 10% slower than baseline

### Performance Report

**Example Output**:

```
============================================================
📊 TEST PERFORMANCE REPORT
============================================================

📅 Generated: 2025-11-13T10:30:00.000Z
📝 Total Tests: 145
⏱️  Total Duration: 32.45s
⏱️  Average Duration: 0.22s

🚀 Performance vs Baseline:
   Total: -5.2%
   Average: -3.8%

🐌 Slowest Tests (Top 10):
   1. 🟡 Load test - 100 concurrent requests - 8.42s
      File: __tests__/integration/load.test.ts
   2. 🟢 E2E user flow - asset generation - 4.15s
      File: __tests__/e2e/asset-generation.spec.ts
   ...

============================================================
```

### Baseline Management

**Set Baseline**: After major performance improvements

```bash
bun run test:perf:baseline
```

**Files** (gitignored):

- `.test-performance/baseline.json` - Current baseline
- `.test-performance/reports/` - Historical reports

### CI Integration

Performance tests run in GitHub Actions on every push/PR. Results are saved as artifacts for 30 days.

---

## Local Development

### First Time Setup

```bash
# Clone repository
git clone <repo-url>
cd asset-forge

# Install dependencies
bun install

# Setup environment variables
cp packages/core/.env.example packages/core/.env
# Edit .env with your credentials

# Run database migrations
cd packages/core
bun run db:migrate

# Start development server
bun run dev
```

### Running Tests Locally

```bash
cd packages/core

# All tests
bun run test:all

# Unit tests only (fast)
bun run test:unit

# Integration tests only
bun run test:integration

# E2E tests only
bun run test:e2e

# With coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

### Type Checking

```bash
cd packages/core
bun run typecheck

# Watch mode
bun run typecheck -- --watch
```

### Linting

```bash
cd packages/core

# Check for issues
bun run lint

# Auto-fix issues (if possible)
bun run lint -- --fix
```

### Code Formatting

```bash
# Format all files
bunx prettier --write .

# Check formatting
bunx prettier --check .

# Format specific files
bunx prettier --write src/**/*.ts
```

---

## Troubleshooting

### Common Issues

#### 1. Pre-commit Hook Fails

**Symptom**: Commit is blocked by failing pre-commit hook

**Solutions**:

a. **Type Errors**:

```bash
cd packages/core
bun run typecheck
# Fix reported errors
```

b. **Linting Errors**:

```bash
cd packages/core
bun run lint
# Fix reported issues
```

c. **Test Failures**:

```bash
cd packages/core
bun run test:unit
# Fix failing tests
```

d. **Formatting Issues**:

```bash
bunx prettier --write .
git add .
```

#### 2. Coverage Below Threshold

**Symptom**: Tests pass but coverage check fails

**Solution**:

```bash
# Generate coverage report
bun run test:coverage

# View HTML report to see uncovered lines
open coverage/index.html

# Add tests for uncovered code
# Or update coveragePathIgnorePatterns in bunfig.toml
```

#### 3. GitHub Actions Failing

**Symptom**: CI fails but tests pass locally

**Common Causes**:

a. **Environment Variables**:

- CI uses test database `asset_forge_test`
- Check if tests rely on specific env vars

b. **Database Issues**:

- Ensure migrations run in CI
- Check PostgreSQL service is healthy

c. **Cache Issues**:

- Clear GitHub Actions cache
- Repository Settings → Actions → Caches → Delete

d. **Flaky Tests**:

- Check for race conditions
- Look for timing-dependent assertions
- Review test isolation

#### 4. Playwright Tests Failing

**Symptom**: E2E tests fail in CI but pass locally

**Solutions**:

a. **Viewport Issues**:

- CI uses different viewport sizes
- Test responsive behavior

b. **Timing Issues**:

- Use `waitFor` instead of `setTimeout`
- Increase timeouts if needed

c. **Browser-Specific**:

- Check which browser failed
- Test that browser locally:
  ```bash
  bunx playwright test --project=firefox
  ```

d. **Dev Server Not Ready**:

- Increase webServer.timeout in `playwright.config.ts`

#### 5. Performance Degradation Alert

**Symptom**: CI shows performance degradation warning

**Solutions**:

a. **Review Changes**:

- What code was added/modified?
- Any expensive operations?

b. **Profile Slow Tests**:

```bash
bun run test:perf
# Check "Slowest Tests" section
```

c. **Optimize**:

- Cache expensive operations
- Mock external services
- Split large tests

d. **Update Baseline** (if intentional):

```bash
bun run test:perf:baseline
```

#### 6. Husky Not Running

**Symptom**: No pre-commit hook running

**Solution**:

```bash
# Reinstall Husky
bunx husky install

# Verify hooks are executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Test hook manually
./.husky/pre-commit
```

#### 7. Codecov Upload Fails

**Symptom**: Coverage upload to Codecov fails

**Solution**:

- Check `CODECOV_TOKEN` secret is set
- Verify coverage files exist: `packages/core/coverage/lcov.info`
- This is non-blocking - CI will pass even if Codecov fails

---

## Best Practices

### 1. Keep Tests Fast

- Unit tests should run in < 1s each
- Use mocks sparingly (prefer real implementations)
- Split slow tests into separate files

### 2. Write Meaningful Commit Messages

Good:

```
feat(api): add user authentication endpoint
```

Bad:

```
updates
```

### 3. Run Tests Before Pushing

Even with pre-commit hooks, run full test suite:

```bash
bun run test:all
```

### 4. Monitor Coverage Trends

- Check coverage reports regularly
- Add tests for new features
- Don't write tests just to hit coverage targets

### 5. Fix Flaky Tests Immediately

Flaky tests erode confidence in CI. If a test is flaky:

1. Reproduce locally
2. Fix root cause (usually timing/isolation)
3. Don't increase retries without fixing

### 6. Update Performance Baseline

After major optimizations:

```bash
bun run test:perf:baseline
git add .test-performance/baseline.json
git commit -m "chore(ci): update test performance baseline"
```

---

## Status Badges

Add these badges to your README.md:

```markdown
![Tests](https://github.com/yourorg/asset-forge/workflows/Test%20Suite/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/yourorg/asset-forge)
```

---

## Related Documentation

- [Testing Strategy](../testing/strategy.md)
- [Deployment Guide](./deployment.md)
- [Development Setup](../README.md)

---

## Changelog

| Date       | Change                       | Author |
| ---------- | ---------------------------- | ------ |
| 2025-11-13 | Initial CI/CD pipeline setup | Claude |

---

**Questions?** See [Troubleshooting](#troubleshooting) or ask in the team chat.
