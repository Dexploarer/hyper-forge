/**
 * Fitting Services
 * Centralized exports for all fitting-related services and types
 */

// Armor Fitting Service
export {
  ArmorFittingService,
  type BodyRegion,
  type CollisionPoint,
  type FittingConfig,
} from './ArmorFittingService'

// Mesh Fitting Service
export { MeshFittingService } from './MeshFittingService'
// Note: MeshFittingParameters is exported from @/types/fitting

// Weight Transfer Service
export {
  WeightTransferService,
  type WeightTransferOptions,
  type WeightTransferResult,
} from './WeightTransferService'

// Armor Scale Fixer
export { ArmorScaleFixer } from './ArmorScaleFixer'

// Bone Diagnostics
export { BoneDiagnostics } from './BoneDiagnostics'

