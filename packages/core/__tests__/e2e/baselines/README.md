# Visual Regression Testing Baselines

This directory contains baseline screenshots for visual regression testing of the 3D viewer.

## How Visual Regression Works

Playwright compares screenshots taken during tests against baseline images stored in this directory. If differences exceed the threshold (set in test files), the test fails.

## Baseline Images

### Viewer States

- `empty-viewer.png` - Empty 3D viewer with no model loaded
- `viewer-with-model.png` - 3D viewer with a model loaded

### Camera Angles

- `camera-front.png` - Front view of model
- `camera-left.png` - Left view of model (rotated)
- `camera-right.png` - Right view of model (rotated)
- `camera-top.png` - Top-down view of model

### Display Modes

- `wireframe-mode.png` - Model shown in wireframe
- `with-grid.png` - 3D viewer with grid enabled

### Lighting Environments

- `lighting-default.png` - Default lighting setup
- `lighting-studio.png` - Studio lighting environment
- `lighting-outdoor.png` - Outdoor lighting environment
- `lighting-night.png` - Night lighting environment
- `lighting-neutral.png` - Neutral lighting environment

### Zoom Levels

- `zoom-default.png` - Default zoom level
- `zoom-in.png` - Zoomed in view
- `zoom-out.png` - Zoomed out view

### Responsive Layouts

- `responsive-desktop.png` - 1920x1080 viewport
- `responsive-tablet.png` - 768x1024 viewport
- `responsive-mobile.png` - 375x667 viewport

### Animation States

- `animation-frame-1.png` - Animation at frame 1
- `animation-frame-2.png` - Animation at frame 2
- `animation-frame-3.png` - Animation at frame 3

### Materials

- `material-default.png` - Default material
- `material-standard.png` - Standard PBR material
- `material-physical.png` - Physical material
- `material-toon.png` - Toon/cel-shaded material
- `material-lambert.png` - Lambert material

### Error States

- `error-model-load.png` - Model failed to load
- `error-webgl.png` - WebGL not supported error

## Creating Baselines

### First Time Setup

Run the visual regression tests once to generate initial baselines:

```bash
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts
```

On first run, Playwright will create baseline images automatically.

### Updating Baselines

When intentional visual changes are made (UI updates, styling changes, etc.), update baselines:

```bash
# Update all baselines
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts --update-snapshots

# Update specific test baselines
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts --update-snapshots --grep "camera angles"
```

### Reviewing Changes

When tests fail due to visual differences:

1. Check the test output for diff images (stored in `test-results/`)
2. Review the differences carefully
3. If changes are intentional, update baselines
4. If changes are bugs, fix the code

## Best Practices

### When to Update Baselines

✅ **Update baselines when:**

- Intentional UI/styling changes
- 3D viewer improvements
- Lighting/material changes
- New features added

❌ **Don't update baselines for:**

- Random test failures
- Flaky rendering issues
- Environment-specific differences

### Baseline Quality

- Baselines should be taken on a consistent environment (CI/CD recommended)
- Use headless mode for consistency
- Wait for all resources to load before capturing
- Disable animations during capture for stability

### Tolerance Settings

Visual regression tests allow some variance to account for:

- Anti-aliasing differences
- Font rendering variations
- Minor GPU rendering differences

Current tolerance: `maxDiffPixels: 1000` (configurable per test)

## CI/CD Integration

Visual regression tests run in CI/CD:

```yaml
- name: Run E2E Tests
  run: bun run test:e2e

- name: Upload failed screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

- Ensure you're using the same browser version
- Check viewport size matches CI settings
- Verify no system-level UI scaling

### Flaky Visual Tests

- Increase wait times for animations to settle
- Use `page.waitForLoadState('networkidle')`
- Disable hardware acceleration if inconsistent

### Large Diffs on Minor Changes

- Adjust `maxDiffPixels` threshold
- Use `maxDiffPixelRatio` for percentage-based tolerance
- Consider using pixel-perfect comparison only for critical UI

## Maintenance

Baselines should be reviewed periodically:

- **Monthly**: Check for outdated baselines
- **After major UI changes**: Bulk update relevant baselines
- **Before releases**: Verify all baselines are current

## Directory Structure

```
__tests__/e2e/baselines/
├── README.md (this file)
├── empty-viewer.png
├── viewer-with-model.png
├── camera-*.png
├── lighting-*.png
├── material-*.png
└── error-*.png
```

## Related Files

- `__tests__/e2e/3d-viewer/visual-regression.spec.ts` - Visual regression tests
- `__tests__/e2e/3d-viewer/performance.spec.ts` - Performance tests
- `playwright.config.ts` - Playwright configuration
