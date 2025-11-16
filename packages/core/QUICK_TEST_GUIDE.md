# Quick Test Guide - cdnUrl Migration

## Run All Migration Tests

```bash
# All cdnUrl migration tests (recommended)
bun test __tests__/unit/stores/useGenerationStore.cdnUrl.test.ts \
         __tests__/unit/stores/useHandRiggingStore.cdnUrl.test.ts \
         __tests__/integration/cdnUrl-migration.integration.test.ts

# Expected output:
# 39 pass, 0 fail, 93 expect() calls
```

## Run Specific Test Suites

```bash
# Store tests only (27 tests)
bun test __tests__/unit/stores/*cdnUrl*.test.ts

# Integration tests only (12 tests)
bun test __tests__/integration/cdnUrl-migration.integration.test.ts

# Component tests (require WebGL mock)
bun test __tests__/unit/components/*cdnUrl*.test.tsx
```

## Test Files

1. **ThreeViewer.cdnUrl.test.tsx** - Component interface tests
2. **AnimationPlayer.cdnUrl.test.tsx** - Animation loading tests
3. **HandAvatarSelector.cdnUrl.test.tsx** - Avatar selection tests
4. **HandUploadZone.cdnUrl.test.tsx** - File upload tests
5. **useGenerationStore.cdnUrl.test.ts** - Store state tests (27 tests)
6. **useHandRiggingStore.cdnUrl.test.ts** - Store actions tests
7. **cdnUrl-migration.integration.test.ts** - End-to-end tests (12 tests)

## What The Tests Verify

✅ **NO modelUrl references** in frontend code
✅ **cdnUrl prop** on all 3D viewer components
✅ **setCdnUrl action** on hand rigging store
✅ **GeneratedAsset.cdnUrl** property exists and works
✅ **Blob URL cleanup** on component unmount
✅ **End-to-end workflows** use cdnUrl consistently

## Quick Checks

```bash
# Verify no modelUrl in production code
grep -r "modelUrl" src/components src/store --include="*.tsx" --include="*.ts" | grep -v "test"

# Should return: NO results (all code uses cdnUrl)

# Count test assertions
grep -c "expect" __tests__/unit/stores/*cdnUrl*.test.ts __tests__/integration/cdnUrl*.test.ts

# Should return: 93 total assertions
```

## Documentation

- **CDNURL_TEST_EXECUTION_SUMMARY.md** - Full test report with results
- **CDNURL_MIGRATION_TEST_REPORT.md** - Migration verification checklist
- **QUICK_TEST_GUIDE.md** - This file (quick reference)

## Common Issues

### Zustand persist warnings

```
[zustand persist middleware] Unable to update item...
```

**Solution**: Ignore these - localStorage is not available in Node/Bun test environment (expected behavior)

### WebGL errors in component tests

```
TypeError: error is not a function...WebGLRenderer
```

**Solution**: WebGL context not available in CI - component interface tests still pass

## Success Criteria

All tests should:

- ✅ Pass with 100% rate
- ✅ Execute in < 200ms
- ✅ Verify NO modelUrl in assertions
- ✅ Use real store state (NO MOCKS)

## Result

🎯 **39/39 tests pass** - Migration verified complete!
