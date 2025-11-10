/**
 * Retargeting Services
 * Centralized exports for all retargeting-related services and types
 */

// VRM Converter
export {
  VRMConverter,
  type VRMConversionOptions,
  type VRMConversionResult,
} from './VRMConverter'

// Animation Retargeting
export { retargetAnimation } from './AnimationRetargeting'

// Animation Retargeter
export {
  AnimationRetargeter,
  type RetargetedAnimation,
} from './AnimationRetargeter'

// Skeleton Retargeter
export {
  SkeletonRetargeter,
  type SolverType,
} from './SkeletonRetargeter'

// Bone Mappings
export {
  MESHY_TO_MIXAMO,
  MIXAMO_TO_MESHY,
  MESHY_VARIATIONS,
  MIXAMO_VARIATIONS,
  VRM_TO_MIXAMO,
  findMeshyBoneName,
  findMixamoBoneName,
  createBoneMapping,
} from './BoneMappings'

// Solvers
export { AutoSkinSolver } from './AutoSkinSolver'
export { DistanceSolver } from './DistanceSolver'
export { DistanceChildTargetingSolver } from './DistanceChildTargetingSolver'
export {
  WeightTransferSolver,
  type BoneMapping,
} from './WeightTransferSolver'

