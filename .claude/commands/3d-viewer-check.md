---
description: Analyze and verify 3D viewer components are properly configured
---

# 3D Viewer Component Check

You are analyzing the Asset-Forge 3D viewer components for proper configuration.

## Tasks

1. **Check ThreeViewer.tsx**
   - Read `packages/core/src/components/shared/ThreeViewer.tsx`
   - Verify proper Three.js cleanup in useEffect
   - Check for memory leaks (geometry/material disposal)
   - Verify loading states and error boundaries

2. **Check VRMTestViewer.tsx**
   - Read `packages/core/src/components/shared/VRMTestViewer.tsx`
   - Verify VRM character scaling (should be ~1.7m height)
   - Check ground positioning (Y=0)
   - Verify animation support

3. **Verify Dependencies**
   - Check Three.js version (should be 0.169.0)
   - Check React Three Fiber is installed
   - Check @react-three/drei is installed
   - Check @pixiv/three-vrm is installed for VRM support

4. **Check for Common Issues**
   - Verbose logging (should be removed in production)
   - Double-centering bugs
   - Character scaling issues
   - Missing cleanup in useEffect

5. **Report Findings**
   - List any issues found
   - Suggest fixes with code examples
   - Provide optimization recommendations

## Success Criteria

- No memory leaks (all geometries/materials disposed)
- Proper error boundaries
- Loading states implemented
- Character scaling correct (~1.7m)
- Ground positioning correct (Y=0)
- No verbose logging in production code
