/**
 * Hand Rigging Services
 * Centralized exports for all hand rigging-related services and types
 */

// Hand Rigging Service
export {
  HandRiggingService,
  type HandBoneStructure,
  type HandRiggingResult,
  type HandRiggingOptions,
} from './HandRiggingService'

// Simple Hand Rigging Service
export {
  SimpleHandRiggingService,
  type SimpleHandRiggingOptions,
  type SimpleHandRiggingResult,
} from './SimpleHandRiggingService'

// Hand Pose Detection Service
export {
  HandPoseDetectionService,
  type Point2D,
  type Point3D,
  type HandLandmarks,
  type HandDetectionResult,
  type FingerJoints,
} from './HandPoseDetectionService'

// Hand Segmentation Service
export {
  HandSegmentationService,
  type PixelMask,
  type FingerSegmentation,
  type VertexSegmentation,
} from './HandSegmentationService'

// Orthographic Hand Renderer
export {
  OrthographicHandRenderer,
  type CaptureOptions,
  type HandCaptureResult,
  type WristBoneInfo,
} from './OrthographicHandRenderer'

