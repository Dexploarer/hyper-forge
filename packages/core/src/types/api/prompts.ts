/**
 * Prompts API Response Types
 * Type-safe definitions for PromptsAPIClient responses
 */

// ==================== Base Prompt Structures ====================

/**
 * Common fields in prompt objects
 */
export interface PromptStyle {
  name: string;
  base?: string;
  enhanced?: string;
  generation?: string;
  fallback?: string;
  prompt?: string;
  placeholder?: string;
  [key: string]: string | undefined; // Allow additional string fields
}

/**
 * Game style prompts structure
 */
export interface GameStylePrompts {
  __comment?: string;
  version?: string;
  default: Record<string, PromptStyle>;
  custom: Record<string, PromptStyle>;
}

/**
 * Asset type prompts structure (nested by avatar/item)
 */
export interface AssetTypePrompts {
  __comment?: string;
  version?: string;
  avatar: {
    default: Record<string, PromptStyle>;
    custom: Record<string, PromptStyle>;
  };
  item: {
    default: Record<string, PromptStyle>;
    custom: Record<string, PromptStyle>;
  };
}

/**
 * Material prompts structure
 */
export interface MaterialPrompts {
  __comment?: string;
  version?: string;
  default: Record<string, PromptStyle>;
  custom: Record<string, PromptStyle>;
}

/**
 * Generation prompts structure
 */
export interface GenerationPrompts {
  __comment?: string;
  version?: string;
  prompt_sections: {
    base: string;
    style: string;
    quality: string;
    technical: string;
    [key: string]: string | Record<string, unknown>; // Allow additional fields
  };
  enhancements: Record<string, string | Record<string, unknown>>;
  [key: string]: unknown; // Allow top-level additional fields
}

/**
 * GPT-4 enhancement prompts structure
 */
export interface GPT4EnhancementPrompts {
  __comment?: string;
  version?: string;
  system_prompt: string;
  templates: Record<string, string>;
  enhancement_types: Record<string, string | Record<string, unknown>>;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Weapon detection prompts structure
 */
export interface WeaponDetectionPrompts {
  __comment?: string;
  version?: string;
  detection_prompts: Record<string, string>;
  classification: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Response from getAllPrompts
 */
export interface AllPromptsResponse {
  gameStyles: GameStylePrompts;
  assetTypes: AssetTypePrompts;
  materials: MaterialPrompts;
  generation: GenerationPrompts;
  gpt4Enhancement: GPT4EnhancementPrompts;
  weaponDetection: WeaponDetectionPrompts;
}
