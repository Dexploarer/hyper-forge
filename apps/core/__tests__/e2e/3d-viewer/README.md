# 3D Viewer E2E Tests

Comprehensive end-to-end testing for the Three.js 3D viewer component.

## Test Suites

### 1. Visual Regression Testing (`visual-regression.spec.ts`)

Tests visual consistency of the 3D viewer across different states and configurations.

**Coverage:**

- Empty viewer baseline
- Model loading and display
- Camera angles (front, left, right, top)
- Display modes (wireframe, grid)
- Lighting environments (studio, outdoor, night, neutral)
- Zoom levels
- Responsive layouts (desktop, tablet, mobile)
- Animation playback
- Material variations
- Error states

**Running tests:**

```bash
# Run all visual regression tests
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts

# Run specific test
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts --grep "camera angles"

# Update baselines
bun run test:e2e __tests__/e2e/3d-viewer/visual-regression.spec.ts --update-snapshots

# Debug mode
bun run test:e2e:ui __tests__/e2e/3d-viewer/visual-regression.spec.ts
```

### 2. Performance Testing (`performance.spec.ts`)

Tests 3D viewer performance metrics including FPS, memory usage, and load times.

**Coverage:**

- Initial load time
- Model loading time
- Idle rendering FPS (target: >30 FPS)
- FPS during interactions (target: >20 FPS)
- Memory usage per model
- Memory leak detection
- Frame time measurement
- Complex model performance
- Texture loading impact
- Baseline metrics establishment
- Stress tests (rapid camera movements, zoom)

**Running tests:**

```bash
# Run all performance tests
bun run test:e2e __tests__/e2e/3d-viewer/performance.spec.ts

# Run specific test
bun run test:e2e __tests__/e2e/3d-viewer/performance.spec.ts --grep "memory leak"

# View performance report
open playwright-report/index.html
```

**Performance Benchmarks:**

- Load time: < 10s
- Model load time: < 5s
- Idle FPS: > 30 FPS
- Interaction FPS: > 20 FPS
- Memory per model: < 200MB
- Memory leak threshold: < 50MB average increase

## Unit Tests

### 3. Three.js Core Tests (`__tests__/unit/three/ThreeViewer.test.ts`)

Unit tests for Three.js scene setup and core functionality.

**Coverage:**

- Scene creation and management
- Camera setup and aspect ratio
- Geometry management
- Material properties
- Lighting systems (ambient, directional, point, spot)
- Model statistics (vertices, faces, bounds)
- Memory management and cleanup
- Animation system
- Raycasting

**Running tests:**

```bash
bun test __tests__/unit/three/ThreeViewer.test.ts
```

### 4. Model Loading Tests (`__tests__/unit/three/ModelLoading.test.ts`)

Tests for GLB/GLTF model loading and parsing.

**Coverage:**

- GLTFLoader functionality
- Model structure analysis
- Material counting
- Animation detection
- Skinned mesh identification
- Model transformations (center, scale, rotate)
- Ground plane positioning
- Model validation

**Running tests:**

```bash
bun test __tests__/unit/three/ModelLoading.test.ts
```

### 5. Format Conversion Tests (`__tests__/unit/three/FormatConversion.test.ts`)

Tests for model format conversions and exports.

**Coverage:**

- GLB export
- GLTF (JSON) export
- Animation preservation
- Material preservation
- Multi-mesh handling
- Texture handling (single and multiple)
- Skeleton/rigging preservation
- Export validation

**Running tests:**

```bash
bun test __tests__/unit/three/FormatConversion.test.ts
```

## Test Structure

```
__tests__/
├── e2e/
│   ├── 3d-viewer/
│   │   ├── README.md (this file)
│   │   ├── visual-regression.spec.ts
│   │   └── performance.spec.ts
│   └── baselines/
│       ├── README.md
│       └── *.png (baseline screenshots)
└── unit/
    └── three/
        ├── ThreeViewer.test.ts
        ├── ModelLoading.test.ts
        └── FormatConversion.test.ts
```

## Best Practices

### Visual Regression

- Always review diffs before updating baselines
- Use consistent test environment (CI recommended)
- Wait for resources to fully load
- Document why baselines changed in commit messages

### Performance

- Run performance tests on consistent hardware
- Monitor trends over time
- Set alerts for regression (e.g., FPS drops below 30)
- Profile with Chrome DevTools for detailed analysis

### Unit Tests

- Test both success and error cases
- Clean up resources (dispose geometries/materials)
- Mock external dependencies
- Keep tests fast (<1s each)

## Debugging

### Visual Regression Failures

```bash
# Run in UI mode to see visual diffs
bun run test:e2e:ui __tests__/e2e/3d-viewer/visual-regression.spec.ts

# Check diff images
ls test-results/*/visual-regression-spec-*/
```

### Performance Issues

```bash
# Enable trace for performance debugging
bun run test:e2e __tests__/e2e/3d-viewer/performance.spec.ts --trace on

# View trace
bunx playwright show-trace trace.zip
```

### Unit Test Failures

```bash
# Run with verbose output
bun test __tests__/unit/three/ --verbose

# Run single test
bun test __tests__/unit/three/ThreeViewer.test.ts --grep "scene creation"
```

## CI/CD Integration

These tests run automatically on:

- Pull requests
- Commits to main branch
- Nightly builds (full suite)

**GitHub Actions workflow:**

```yaml
- name: Run Unit Tests
  run: bun test __tests__/unit/three/

- name: Run E2E Tests
  run: bun run test:e2e __tests__/e2e/3d-viewer/

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      playwright-report/
```

## Limitations

### Known Issues

1. **WebGL Context Limits**: Browser limits concurrent WebGL contexts
   - Workaround: Tests run sequentially for 3D viewer

2. **Font Rendering**: May differ across OS/browsers
   - Workaround: Increased pixel diff tolerance

3. **Animation Timing**: Can be flaky on slow systems
   - Workaround: Disable animations during screenshots

4. **Memory Profiling**: Limited in headless mode
   - Workaround: Run headed mode for detailed memory analysis

### Not Tested

- VR/AR functionality (requires specialized hardware)
- Mobile device-specific touch gestures
- Network throttling effects on model loading
- GPU-specific rendering differences

## Future Improvements

- [ ] Add VRM character-specific tests
- [ ] Test animation retargeting
- [ ] Add texture quality comparison
- [ ] Test LOD (Level of Detail) switching
- [ ] Add accessibility tests (keyboard navigation)
- [ ] Test multi-user collaborative viewing
- [ ] Add performance profiling with flamegraphs
- [ ] Test offline/PWA functionality

## Support

For issues with tests:

1. Check this README
2. Review baseline documentation
3. Check existing GitHub issues
4. Create new issue with:
   - Test name that failed
   - Screenshot/trace if applicable
   - Steps to reproduce
   - Environment details

## Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [Three.js Documentation](https://threejs.org/docs)
- [Visual Regression Testing Guide](../baselines/README.md)
- [Project Testing Standards](../../../dev-book/testing.md)
