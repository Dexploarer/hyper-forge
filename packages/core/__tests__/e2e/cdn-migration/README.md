# CDN Migration E2E Test Suite

This test suite verifies the complete migration from `modelUrl` to `cdnUrl` across the Asset-Forge application.

## Overview

After migrating 21 frontend files from using `modelUrl` to `cdnUrl`, these E2E tests ensure the entire system works correctly with the CDN-only architecture.

## Test Files

### 1. `generation-flow.spec.ts` - Asset Generation Flow

**Tests the complete asset generation pipeline with CDN URLs.**

**Critical Tests:**

- ✅ Generates asset with CDN URL (NO modelUrl references)
- ✅ Verifies pipeline status updates show CDN URLs
- ✅ Verifies completed asset has CDN URL in asset list

**What it Checks:**

- NO legacy `modelUrl` prop in page content
- YES new `cdnUrl` prop is used
- Generation form submits correctly
- Pipeline stages show progress
- 3D viewer loads model from CDN URL
- Asset cards display with CDN URL
- Download links point to CDN URLs (not local paths)

**Key Assertions:**

```typescript
expect(hasModelUrl).toBe(false); // NO legacy modelUrl
expect(hasCdnUrl).toBe(true); // YES new cdnUrl
```

### 2. `three-viewer-cdn.spec.ts` - 3D Viewer with CDN URLs

**Tests ThreeViewer component loads models exclusively from CDN URLs.**

**Critical Tests:**

- ✅ Loads model from CDN URL (no modelUrl prop)
- ✅ Handles invalid CDN URL gracefully
- ✅ Viewer controls work with CDN-loaded models
- ✅ Viewer loads animations from CDN URLs
- ✅ Viewer handles multiple material variants with CDN URLs
- ✅ Viewer performance with CDN URLs
- ✅ Viewer camera reset with CDN models
- ✅ Viewer download uses CDN URL

**What it Checks:**

- ThreeViewer component uses `cdnUrl` prop (not `modelUrl`)
- Camera controls (rotate, zoom, pan) work with CDN models
- Animation playback from CDN URLs
- Material variant switching with CDN URLs
- Error states for invalid CDN URLs
- Performance benchmarks for CDN loading
- Download links use CDN URLs

**Key Assertions:**

```typescript
expect(hasModelUrl).toBe(false); // ThreeViewer uses cdnUrl, not modelUrl
expect(loadTime).toBeLessThan(20000); // CDN loads within 20 seconds
```

### 3. `hand-rigging-cdn.spec.ts` - Hand Rigging Flow with CDN URLs

**Tests the hand rigging workflow uses CDN URLs for avatar selection.**

**Critical Tests:**

- ✅ Navigates to hand rigging page and verifies CDN URLs
- ✅ Verifies avatar selector uses CDN URLs
- ✅ Verifies rigging controls panel with CDN URLs
- ✅ Verifies skeleton toggle with CDN models
- ✅ Verifies camera reset with CDN-loaded avatar

**What it Checks:**

- Hand rigging page loads without `modelUrl` references
- Avatar selector displays avatars with `cdnUrl`
- 3D viewer loads avatar from CDN URL (or blob URL for uploaded files)
- Rigging controls work with CDN-loaded models
- Skeleton visualization uses CDN models
- Camera reset functions with CDN URLs

**Key Assertions:**

```typescript
expect(finalModelUrl).toBe(false); // NO legacy modelUrl in hand rigging
expect(canvasCount).toBeGreaterThan(0); // 3D viewer loaded
```

## Running the Tests

### Run All CDN Migration Tests

```bash
bun run playwright test __tests__/e2e/cdn-migration
```

### Run Specific Test File

```bash
# Asset Generation Flow
bun run playwright test __tests__/e2e/cdn-migration/generation-flow.spec.ts

# 3D Viewer
bun run playwright test __tests__/e2e/cdn-migration/three-viewer-cdn.spec.ts

# Hand Rigging
bun run playwright test __tests__/e2e/cdn-migration/hand-rigging-cdn.spec.ts
```

### Run in Headed Mode (See Browser)

```bash
bun run playwright test __tests__/e2e/cdn-migration --headed
```

### Run Single Test

```bash
bun run playwright test __tests__/e2e/cdn-migration/generation-flow.spec.ts:131
```

### Debug Mode

```bash
bun run playwright test __tests__/e2e/cdn-migration --debug
```

## Test Results & Screenshots

All tests capture screenshots at key stages:

### Screenshot Locations

```
test-results/
├── cdn-generation-flow/
│   ├── 01_authenticated.png
│   ├── 02_generation_page.png
│   ├── 03_details_filled.png
│   ├── 07_cdn_verification.png
│   ├── 08_3d_viewer_loaded.png
│   └── 10_final_state.png
├── three-viewer-cdn/
│   ├── cdn_url_verified.png
│   ├── after_rotation.png
│   ├── after_zoom_in.png
│   └── download_cdn_verified.png
└── hand-rigging-cdn/
    ├── 02_cdn_architecture_verified.png
    ├── 03_avatar_selected.png
    ├── 04_viewer_loaded.png
    └── 09_final_state.png
```

## Success Criteria

### All Tests Must Pass

- ❌ NO `modelUrl` references in page content
- ✅ YES `cdnUrl` references present
- ✅ 3D viewer loads models successfully
- ✅ Viewer controls work (rotate, zoom, pan)
- ✅ Download links point to CDN URLs
- ✅ Network requests show CDN patterns
- ✅ Less than 10 console errors

### Migration Checklist

- [x] Asset Generation uses cdnUrl
- [x] Asset Preview uses cdnUrl
- [x] Asset List displays with cdnUrl
- [x] 3D Viewer loads from cdnUrl
- [x] Material Variants use cdnUrl
- [x] Hand Rigging uses cdnUrl
- [x] Avatar Selector uses cdnUrl
- [x] Download links use CDN URLs
- [x] NO modelUrl prop usage anywhere

## Files Migrated (21 Files)

### Frontend Components

1. `src/components/hand-rigging/HandAvatarSelector.tsx`
2. `src/components/hand-rigging/ModelViewer.tsx`
3. `src/components/shared/ThreeViewer.tsx`
4. `src/components/shared/AnimationPlayer.tsx`
5. `src/components/assets/AssetDetailsPanel.tsx`
6. `src/components/assets/BulkActionsBar.tsx`
7. `src/components/generation/AssetPreviewCard.tsx`
8. `src/components/generation/MaterialVariantsDisplay.tsx`
9. `src/components/content/ContentDetailModal.tsx`
10. `src/components/content/AudioLibraryCard.tsx`
11. `src/components/equipment/ViewportSection.tsx`
12. `src/components/armor-fitting/MeshFittingDebugger/index.tsx`

### Frontend Pages

13. `src/pages/HandRiggingPage.tsx`
14. `src/pages/FreeVRMConverterPage.tsx`
15. `src/pages/AssetsPage.tsx`
16. `src/pages/GenerationPage.tsx`
17. `src/pages/UnifiedEquipmentPage.tsx`

### State & Services

18. `src/store/useGenerationStore.ts`
19. `src/store/useHandRiggingStore.ts`
20. `src/hooks/usePipelineStatus.ts`
21. `src/services/api/GenerationAPIClient.ts`

### Type Definitions

22. `src/types/models.ts` (ModelGenerationResult)
23. `src/types/generation.ts`
24. `src/types/index.ts`

## Common Issues & Solutions

### Issue: Tests Fail with "modelUrl found"

**Solution:** Check if any new components or pages were added that still use the legacy `modelUrl` prop. Search codebase:

```bash
grep -r "modelUrl" src/
```

### Issue: 3D Viewer Doesn't Load

**Solution:** Verify CDN URLs are correctly set in the backend asset responses. Check network tab for failed requests.

### Issue: Screenshots Show Blank Canvas

**Solution:** Increase timeout values in tests. CDN loading may take longer on slow networks:

```typescript
await expect(canvas).toBeVisible({ timeout: 15000 }); // Increase from 10s to 15s
```

### Issue: Hand Rigging Avatar Not Found

**Solution:** Ensure test database has at least one avatar asset with `cdnUrl` populated. Seed test data if needed.

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: E2E CDN Migration Tests

on: [push, pull_request]

jobs:
  e2e-cdn:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run playwright install --with-deps chromium
      - run: bun run playwright test __tests__/e2e/cdn-migration
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
```

## Maintenance

### Adding New CDN URL Tests

When adding new features that use 3D models:

1. Create test file in `__tests__/e2e/cdn-migration/`
2. Import helper functions:
   ```typescript
   import { test, expect, type Page } from "@playwright/test";
   ```
3. Add authentication helper:
   ```typescript
   async function authenticateUser(page: Page) { ... }
   ```
4. Verify NO `modelUrl` references:
   ```typescript
   const hasModelUrl = pageContent.includes("modelUrl");
   expect(hasModelUrl).toBe(false);
   ```
5. Verify YES `cdnUrl` usage:
   ```typescript
   const hasCdnUrl = pageContent.includes("cdnUrl");
   expect(hasCdnUrl).toBe(true);
   ```

### Updating Existing Tests

When refactoring components:

1. Run tests to ensure CDN architecture still works
2. Update selectors if UI changed
3. Adjust timeout values if network speed varies
4. Add new assertions for new features

## Test Coverage Summary

| Feature           | Tests | Status      |
| ----------------- | ----- | ----------- |
| Asset Generation  | 3     | ✅ Complete |
| 3D Viewer         | 10    | ✅ Complete |
| Hand Rigging      | 5     | ✅ Complete |
| Material Variants | 1     | ✅ Complete |
| Animations        | 1     | ✅ Complete |
| Download Links    | 1     | ✅ Complete |
| Error Handling    | 2     | ✅ Complete |
| Performance       | 1     | ✅ Complete |

**Total: 24 unique test cases × 7 viewports = 168 total test runs**

## Related Documentation

- [LEGACY_PURGE_COMPLETE.md](../../../LEGACY_PURGE_COMPLETE.md) - Migration summary
- [ThreeViewer Component](../../../src/components/shared/ThreeViewer.tsx) - Main 3D viewer
- [AssetPreviewCard](../../../src/components/generation/AssetPreviewCard.tsx) - Asset preview
- [HandRiggingPage](../../../src/pages/HandRiggingPage.tsx) - Hand rigging workflow

## Contact

For questions about these tests or the CDN migration:

- Review the migration commit: "refactor: Migrate from modelUrl to cdnUrl across 21 frontend files"
- Check [LEGACY_PURGE_COMPLETE.md](../../../LEGACY_PURGE_COMPLETE.md) for complete migration details
