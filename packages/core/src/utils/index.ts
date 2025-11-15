/**
 * Utilities
 * Centralized exports for all utility functions and helpers
 */

// API utilities
export { apiFetch, type RequestOptions } from "./api";

// Asset statistics
export {
  calculateAssetStatistics,
  capitalize,
  isWithinDays,
  getStartOfToday,
  getStartOfWeek,
  getStartOfMonth,
  filterByDateRange,
  groupAssetsByDate,
  getRelativeTimeString as formatRelativeTime,
  type TypeCount,
  type StatusCount,
  type DateRangeStats,
  type AssetStatistics,
  type GroupedAssets,
} from "./assetStats";

// Format utilities
export { formatAssetName } from "./formatAssetName";

// Generation config builder
export { buildGenerationConfig } from "./generationConfigBuilder";

// General helpers
export {
  generateId,
  sleep,
  retry,
  formatBytes,
  createProgressBar,
  parseAssetType,
  parseBuildingType,
  parseWeaponType,
  getPolycountForType,
  generateMaterialDescription,
  generateTierBatch,
  MATERIAL_TIERS,
  DIFFICULTY_LEVELS,
  formatDate,
  formatDateTime,
  formatTime,
  formatDateWithTime,
} from "./helpers";

// Notification utilities
export { notify } from "./notify";

// Optimistic update utilities
export {
  createOptimisticUpdate,
  createListOptimisticUpdate,
  type OptimisticUpdateConfig,
  type OptimisticUpdateResult,
  type ListOptimisticConfig,
} from "./optimistic";

// Performance monitoring
export {
  performanceMonitor,
  usePerformanceMeasure,
  measureComponentRender,
} from "./performance";

// Retry utilities
export {
  retryWithBackoff,
  createRetryableFetch,
  type RetryOptions,
  type RetryResult,
} from "./retry";

// Sprite generator client
export {
  SpriteGeneratorClient,
  spriteGeneratorClient,
  type SpriteMetadata,
} from "./sprite-generator-client";

// Typed event emitter
export { TypedEventEmitter } from "./TypedEventEmitter";

// View transitions
export { startViewTransition, useViewTransition } from "./viewTransitions";

// Weapon utilities
export {
  BONE_MAPPING,
  WEAPON_OFFSETS,
  calculateAvatarHeight,
  calculateWeaponScale,
  createNormalizedWeapon,
  findBone,
  getWorldScale,
  getAttachedBone,
} from "./weaponUtils";
