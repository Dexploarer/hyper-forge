/**
 * Core types for the AI Creation System
 */

import type { AssetMetadata } from "./AssetMetadata";
import type { Vector3, Quaternion } from "./math";
import {
  MaterialPreset,
  GenerationRequest,
  ImageGenerationResult,
  ModelGenerationResult,
  RemeshResult,
  HardpointResult,
  ArmorPlacementResult,
  RiggingResult,
  BuildingAnalysisResult,
  GenerationStage,
  GenerationResult,
} from "./models";

// Mathematical types (now classes)
export { Vector3, Quaternion, BoundingBox } from "./math";

// Data model classes (prefer these over interfaces where appropriate)
export {
  MaterialPreset,
  GenerationRequest,
  ImageGenerationResult,
  ModelGenerationResult,
  RemeshResult,
  HardpointResult,
  ArmorPlacementResult,
  RiggingResult,
  BuildingAnalysisResult,
  GenerationStage,
  GenerationResult,
} from "./models";

// Generation types
export type AssetType =
  | "weapon"
  | "armor"
  | "consumable"
  | "tool"
  | "decoration"
  | "character"
  | "building"
  | "resource"
  | "misc";
export type WeaponType =
  | "sword"
  | "axe"
  | "bow"
  | "staff"
  | "shield"
  | "dagger"
  | "mace"
  | "spear"
  | "crossbow"
  | "wand"
  | "scimitar"
  | "battleaxe"
  | "longsword";
export type ArmorSlot =
  | "helmet"
  | "chest"
  | "legs"
  | "boots"
  | "gloves"
  | "ring"
  | "amulet"
  | "cape"
  | "shield";
export type CreatureType =
  | "biped"
  | "quadruped"
  | "flying"
  | "aquatic"
  | "other";
export type BuildingType =
  | "bank"
  | "store"
  | "house"
  | "castle"
  | "temple"
  | "guild"
  | "inn"
  | "tower"
  | "dungeon";
export type ToolType =
  | "pickaxe"
  | "axe"
  | "fishing_rod"
  | "hammer"
  | "knife"
  | "tinderbox"
  | "chisel";
export type ResourceType =
  | "ore"
  | "bar"
  | "log"
  | "plank"
  | "fish"
  | "herb"
  | "gem";
export type ConsumableType = "food" | "potion" | "rune" | "scroll" | "teleport";

// GDD Asset specification
export interface GDDAsset {
  name: string;
  description: string;
  type: string;
  subtype?: string;
  style?: string;
  metadata?: {
    tier?: string;
    level?: number;
    gameId?: string;
    rarity?: string;
    attackLevel?: number;
    strengthLevel?: number;
    defenseLevel?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

// Simple generation result for CLI
export interface SimpleGenerationResult {
  success: boolean;
  assetId: string;
  fileSize?: string;
  modelUrl?: string;
  error?: string;
}

// Note: Generation pipeline types are now classes in models.ts
// ImageGenerationResult, ModelGenerationResult, RemeshResult,
// HardpointResult, ArmorPlacementResult, RiggingResult,
// BuildingAnalysisResult, GenerationStage, and GenerationResult
// are all exported as classes from models.ts

// Cache entry
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
}

// API configuration
export interface AICreationConfig {
  openai: {
    apiKey: string;
    model?: string;
    imageServerBaseUrl?: string;
  };
  meshy: {
    apiKey: string;
    baseUrl?: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  output: {
    directory: string;
    format: "glb" | "fbx" | "obj";
  };
}

// Note: Asset interface is now imported from AssetService.ts
// to avoid circular dependencies

// Navigation types
export * from "./navigation";

// Export other type modules
export * from "./AssetMetadata";
export * from "./RiggingMetadata";
export * from "./three";
export * from "./common";
export * from "./generation";
export * from "./hand-rigging";

// Explicitly re-export GLTFAnimation, GLTFNode, and GLTFSkin as types for isolatedModules compatibility
export type { GLTFAnimation, GLTFNode, GLTFSkin } from "./gltf";

// Re-export Asset from AssetService to maintain backward compatibility
export type { Asset } from "@/services/api/AssetService";
