/**
 * API Services
 * Centralized exports for all API client services and types
 */

// Asset Service
export {
  AssetService,
  type Asset,
  type AssetStatus,
  type MaterialPreset,
  type BulkUpdateRequest,
  type RetextureRequest,
  type RetextureResponse,
} from "./AssetService";

// Generation API Client
export {
  GenerationAPIClient,
  type APIPipelineStage,
  type PipelineStages,
  type PipelineResults,
  type APIPipelineResult,
  type GenerationAPIEvents,
} from "./GenerationAPIClient";
// Note: PipelineStage and PipelineResult (UI types) are exported from @/types/generation

// Content API Client
export { ContentAPIClient } from "./ContentAPIClient";

// Audio API Client
export { AudioAPIClient } from "./AudioAPIClient";

// Users API Client
export {
  type User,
  type UserProfileUpdate,
  type GetCurrentUserResponse,
} from "./UsersAPIClient";

// Material Presets API Client
export {
  MaterialPresetsAPIClient,
  type MaterialPreset as MaterialPresetAPI,
  type MaterialPresetList,
  type MaterialPresetSaveResponse,
} from "./MaterialPresetsAPIClient";

// Prompts API Client
export { PromptsAPIClient, promptsClient } from "./PromptsAPIClient";

// Prompts types (from @/types/api/prompts)
export type {
  GameStylePrompts,
  AssetTypePrompts,
  MaterialPrompts,
  GenerationPrompts,
  GPT4EnhancementPrompts,
  WeaponDetectionPrompts,
  AllPromptsResponse,
} from "@/types/api/prompts";

// Prompt Service
export {
  PromptService,
  type GameStylePrompt,
  type AssetTypePrompt,
  type AssetTypePromptsByCategory,
  type PromptsResponse,
  type MaterialPromptTemplate,
} from "./PromptService";

// AI Vision API Client
export {
  type HandleDetectionParams,
  type HandleDetectionResponse,
  type OrientationDetectionParams,
} from "./AIVisionAPIClient";

// Voice Status API Client
export {
  type VoiceSubscriptionInfo,
  type VoiceRateLimitInfo,
} from "./VoiceStatusAPIClient";

// Playtester API Client
export { PlaytesterAPIClient } from "./PlaytesterAPIClient";
