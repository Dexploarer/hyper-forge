/**
 * ThreeViewer Refactoring Plan
 *
 * Current State: 6,340 lines in a single component
 * Target: 5-10 smaller, focused components
 *
 * REFACTORING STRATEGY (Do incrementally, not all at once):
 *
 * Phase 1: Extract UI Components (Low Risk)
 * =========================================
 * 1. ViewerLoadingOverlay - Loading progress display
 * 2. ViewerErrorOverlay - Error display
 * 3. ViewerStatsPanel - Vertices/faces/materials info
 * 4. ViewerControlsPanel - Grid/bounds/stats/auto-rotate buttons
 * 5. ViewerCameraControls - Front/Side/Top camera buttons
 * 6. KeyboardShortcutsPanel - Shortcut help modal
 * 7. HandControlsPanel - Hand bone testing UI
 *
 * Phase 2: Extract Logic Hooks (Medium Risk)
 * ==========================================
 * 1. useThreeScene - Scene/camera/renderer/controls setup
 * 2. useModelLoader - GLTF loading with progress
 * 3. useAnimationController - Animation loading/playback
 * 4. useSkeletonViewer - Skeleton helper management
 *
 * Phase 3: Extract Complex Features (High Risk)
 * =============================================
 * 1. BoneEditor - TransformControls and bone editing
 * 2. SkeletonRetargeter - Retargeting workflow
 * 3. CaptureTools - Screenshot/export functionality
 *
 * SHARED STATE: Use ThreeViewerContext to share:
 * - scene, camera, renderer refs
 * - model, mixer refs
 * - loading state
 * - animation state
 *
 * IMPORTANT NOTES:
 * - Keep useImperativeHandle at top level
 * - Test thoroughly after each extraction
 * - Maintain backwards compatibility
 * - Don't change the public API (ThreeViewerRef)
 *
 * CURRENT STRUCTURE (for reference):
 * - 43 useRef declarations
 * - 25 useState declarations
 * - 13 useEffect hooks
 * - 6 useCallback functions
 *
 * Start with Phase 1 UI components - they're the lowest risk
 * and provide immediate code organization benefits.
 */

export {}; // Make this a module
