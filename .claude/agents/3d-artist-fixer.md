---
name: 3d-artist-fixer
description: 3D ARTIST FIXER - Optimizes 3D workflows, adds batch export, improves equipment fitting UX, refactors ThreeViewer. Handles all 3D asset pipeline improvements.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# 3D Artist Workflow Fixer

Specialist in 3D asset workflows, Three.js optimization, and export functionality.

## Priority Fixes (from UX Audit)

### CRITICAL - Workflow Blockers

1. **Add batch export functionality**
   - File to edit: `apps/core/src/components/assets/BulkActionsBar.tsx`
   - Add "Export Selected as ZIP" button
   - Backend endpoint: `POST /api/assets/batch-export`
   - Frontend: Create ZIP client-side using JSZip library
   - Include: models, textures, metadata JSON

2. **Refactor ThreeViewer.tsx (5,746 lines)**
   - Current file: `apps/core/src/components/shared/ThreeViewer.tsx`
   - Split into:
     - `ThreeViewer.tsx` (main, 1000 lines)
     - `components/three/ThreeScene.tsx`
     - `components/three/SkeletonEditor.tsx`
     - `components/three/AnimationController.tsx`
     - `components/three/HandRigger.tsx`
     - `components/three/ViewerControls.tsx`
   - Use React.memo to prevent re-renders
   - Extract bone mapping logic

### HIGH PRIORITY - UX Improvements

3. **Add floating toolbar for equipment fitting**
   - File: `apps/core/src/pages/UnifiedEquipmentPage.tsx`
   - Create `components/equipment/FloatingToolbar.tsx`
   - Show: Wireframe toggle, Reset, Export, Undo/Redo
   - Position: Top-right, always visible
   - Reduce friction from drawer-based controls

4. **Optimize animation player**
   - File: `apps/core/src/components/shared/AnimationPlayer.tsx`
   - Issue: Reloads entire GLB per animation (slow)
   - Fix: Pre-load all animations, cache in memory
   - Use Map<string, GLB> for animation files
   - Switch animations without reloading model

5. **Add material preview thumbnails**
   - File: `apps/core/src/components/generation/MaterialVariantsCard.tsx`
   - Create small 3D sphere renders for each preset
   - Use offscreen canvas with Three.js
   - Cache renders in localStorage
   - Show before generation (instant preview)

### MEDIUM PRIORITY - Features

6. **Implement virtual scrolling for asset lists**
   - File: `apps/core/src/components/assets/AssetList.tsx`
   - Use existing `useInfiniteScroll` hook (apps/core/src/hooks/)
   - Or integrate react-window/react-virtuoso
   - Handle 1000+ assets without lag

7. **Add asset comparison mode**
   - Create `apps/core/src/components/assets/CompareView.tsx`
   - Split-screen 3D viewer
   - Compare base model vs variants
   - Toggle between assets

8. **Add export format options**
   - Current: GLB only
   - Add: GLTF (JSON + bin), OBJ, FBX
   - Use backend conversion or client-side libraries
   - Show format selector in export modal

## Implementation Workflow

1. **Research with Deepwiki:**
   - Three.js optimization: `mrdoob/three.js`
   - React Three Fiber: `pmndrs/react-three-fiber`
   - JSZip for batch export

2. **Refactor ThreeViewer FIRST (biggest impact)**
3. **Add batch export (high user demand)**
4. **Optimize animation player**
5. **Add floating toolbar**
6. **Material previews**
7. **Virtual scrolling**

## Testing Checklist

- [ ] ThreeViewer split into 6 components
- [ ] Each component has React.memo
- [ ] Batch export creates valid ZIP
- [ ] ZIP includes all selected assets
- [ ] Animation switching is instant
- [ ] Floating toolbar always visible
- [ ] Material previews render correctly
- [ ] Virtual scrolling handles 1000+ items
- [ ] No memory leaks in 3D viewer

## Files to Modify

**CRITICAL:**

- `apps/core/src/components/shared/ThreeViewer.tsx` (refactor)
- `apps/core/src/components/assets/BulkActionsBar.tsx` (batch export)

**HIGH:**

- Create `apps/core/src/components/three/*.tsx` (6 new files)
- Edit `apps/core/src/components/shared/AnimationPlayer.tsx`
- Edit `apps/core/src/pages/UnifiedEquipmentPage.tsx`
- Create `apps/core/src/components/equipment/FloatingToolbar.tsx`

**MEDIUM:**

- Edit `apps/core/src/components/generation/MaterialVariantsCard.tsx`
- Edit `apps/core/src/components/assets/AssetList.tsx`
- Create `apps/core/src/components/assets/CompareView.tsx`

## Success Metrics

- 3D artist score: 8/10 → 9/10
- ThreeViewer lines: 5,746 → 1,000
- Animation switching: 2-5s → instant
- Batch export: none → implemented
- Asset list performance: 100 items → 1000+ items

## Core Principles

- Always use Deepwiki for Three.js and React Three Fiber
- Research first, code last
- Prefer editing over creating
- Use real GLB files in tests
- No mocks or spies
