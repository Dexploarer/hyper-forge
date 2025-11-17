/**
 * Asset Metadata TypeBox Schemas
 * Comprehensive type-safe schemas for asset metadata validation
 *
 * This file defines the exact structure of asset metadata with full validation.
 * NO `any` or `Unknown()` types - every field is explicitly typed.
 */

import { t, Static } from "elysia";

// ==================== Common Enums and Shared Types ====================

/**
 * Asset Type Enum
 * All possible asset types in the system
 */
export const AssetTypeEnum = t.Union([
  t.Literal("weapon"),
  t.Literal("armor"),
  t.Literal("tool"),
  t.Literal("resource"),
  t.Literal("ammunition"),
  t.Literal("character"),
  t.Literal("building"),
  t.Literal("environment"),
  t.Literal("prop"),
  t.Literal("misc"),
]);

/**
 * Generation Method Enum
 * How the asset was created
 */
export const GenerationMethodEnum = t.Union([
  t.Literal("gpt-image-meshy"),
  t.Literal("direct-meshy"),
  t.Literal("manual"),
  t.Literal("placeholder"),
]);

/**
 * Retexture Method Enum
 * How the variant was retextured
 */
export const RetextureMethodEnum = t.Union([
  t.Literal("meshy-retexture"),
  t.Literal("manual-texture"),
  t.Literal("ai-generated"),
]);

/**
 * Retexture Status Enum
 */
export const RetextureStatusEnum = t.Union([
  t.Literal("pending"),
  t.Literal("processing"),
  t.Literal("completed"),
  t.Literal("failed"),
]);

/**
 * Workflow Status Enum
 */
export const WorkflowStatusEnum = t.Union([
  t.Literal("draft"),
  t.Literal("processing"),
  t.Literal("completed"),
  t.Literal("failed"),
  t.Literal("approved"),
  t.Literal("published"),
  t.Literal("archived"),
]);

/**
 * Rigging Status Enum
 */
export const RiggingStatusEnum = t.Union([
  t.Literal("pending"),
  t.Literal("processing"),
  t.Literal("completed"),
  t.Literal("failed"),
]);

/**
 * Rig Type Enum
 */
export const RigTypeEnum = t.Union([
  t.Literal("humanoid-standard"),
  t.Literal("creature"),
  t.Literal("custom"),
]);

// ==================== Nested Object Schemas ====================

/**
 * Dimensions Schema
 * Physical dimensions of the asset
 */
export const DimensionsSchema = t.Object({
  width: t.Number({ minimum: 0 }),
  height: t.Number({ minimum: 0 }),
  depth: t.Number({ minimum: 0 }),
});

/**
 * Material Preset Info Schema
 * Information about the material preset used for variants
 */
export const MaterialPresetInfoSchema = t.Object({
  id: t.String({ minLength: 1, maxLength: 100 }),
  displayName: t.String({ minLength: 1, maxLength: 200 }),
  category: t.String({ minLength: 1, maxLength: 100 }),
  tier: t.Number({ minimum: 1, maximum: 10 }),
  color: t.String({
    minLength: 4,
    maxLength: 9,
    pattern: "^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$", // Hex color (#RGB or #RRGGBB)
  }),
  stylePrompt: t.Optional(t.String({ maxLength: 1000 })),
});

/**
 * Animation Set Schema
 * Collection of animation file paths
 */
export const AnimationSetSchema = t.Object(
  {
    walking: t.Optional(t.String({ maxLength: 500 })),
    running: t.Optional(t.String({ maxLength: 500 })),
    tpose: t.Optional(t.String({ maxLength: 500 })),
    // Additional animations stored as key-value pairs
  },
  { additionalProperties: true },
);

/**
 * Animations Schema
 * Basic and advanced animation sets
 */
export const AnimationsSchema = t.Object({
  basic: t.Optional(AnimationSetSchema),
  advanced: t.Optional(AnimationSetSchema),
});

// ==================== Rigging Metadata Schema ====================

/**
 * Rigging Metadata Schema
 * Shared rigging information for all assets
 */
export const RiggingMetadataSchema = t.Object({
  // Rigging status
  isRigged: t.Optional(t.Boolean()),
  riggingTaskId: t.Optional(t.String({ maxLength: 255 })),
  riggingStatus: t.Optional(RiggingStatusEnum),
  riggingError: t.Optional(t.String({ maxLength: 2000 })),
  riggingAttempted: t.Optional(t.Boolean()),

  // Rig information
  rigType: t.Optional(RigTypeEnum),
  characterHeight: t.Optional(t.Number({ minimum: 0, maximum: 10000 })),
  supportsAnimation: t.Optional(t.Boolean()),
  animationCompatibility: t.Optional(t.Array(t.String({ maxLength: 100 }))),

  // Animation files
  animations: t.Optional(AnimationsSchema),

  // Model paths
  riggedModelPath: t.Optional(t.String({ maxLength: 500 })),
  tposeModelPath: t.Optional(t.String({ maxLength: 500 })),
});

// ==================== Base Asset Metadata Schema ====================

/**
 * Base Asset Metadata Schema
 * For original base models that can be retextured
 *
 * This is the complete schema with ALL fields explicitly typed.
 * No `Unknown()` or `any` types.
 */
export const BaseAssetMetadataSchema = t.Composite([
  RiggingMetadataSchema,
  t.Object({
    // ==================== Identity Fields ====================
    id: t.String({ minLength: 1, maxLength: 255 }),
    gameId: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional for legacy data
    name: t.String({ minLength: 1, maxLength: 500 }),
    description: t.Optional(t.String({ maxLength: 5000 })), // Optional for legacy data
    type: t.Optional(AssetTypeEnum), // Optional for legacy data
    subtype: t.Optional(t.String({ minLength: 1, maxLength: 200 })), // Optional for legacy data

    // ==================== Base Model Discriminators ====================
    isBaseModel: t.Literal(true),
    isVariant: t.Optional(t.Literal(false)),

    // ==================== Generation Info (Optional for legacy data) ====================
    meshyTaskId: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional but needed for retexturing
    generationMethod: t.Optional(GenerationMethodEnum), // Optional for legacy data

    // ==================== Variant Tracking ====================
    variants: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 255 }))), // Optional for legacy data
    variantCount: t.Optional(t.Number({ minimum: 0 })), // Optional for legacy data
    lastVariantGenerated: t.Optional(t.String({ format: "date-time" })),

    // ==================== File Paths ====================
    modelPath: t.Optional(t.String({ minLength: 1, maxLength: 500 })), // Optional for legacy data
    conceptArtPath: t.Optional(t.String({ maxLength: 500 })),
    hasModel: t.Optional(t.Boolean()), // Optional for legacy data
    hasConceptArt: t.Optional(t.Boolean()), // Optional for legacy data

    // ==================== Generation Details ====================
    workflow: t.Optional(t.String({ maxLength: 200 })),
    gddCompliant: t.Optional(t.Boolean()), // Optional for legacy data
    isPlaceholder: t.Optional(t.Boolean()), // Optional for legacy data

    // ==================== Normalization ====================
    normalized: t.Optional(t.Boolean()),
    normalizationDate: t.Optional(t.String({ format: "date-time" })),
    dimensions: t.Optional(DimensionsSchema),

    // ==================== Timestamps (ISO 8601) ====================
    createdAt: t.Optional(t.String({ format: "date-time" })), // Optional for legacy data
    updatedAt: t.Optional(t.String({ format: "date-time" })), // Optional for legacy data
    generatedAt: t.Optional(t.String({ format: "date-time" })),
    completedAt: t.Optional(t.String({ format: "date-time" })),

    // ==================== UI Properties ====================
    tier: t.Optional(t.String({ maxLength: 50 })),
    format: t.Optional(
      t.Union([
        t.Literal("GLB"),
        t.Literal("FBX"),
        t.Literal("OBJ"),
        t.Literal("GLTF"),
      ]),
    ),
    gripDetected: t.Optional(t.Boolean()),
    requiresAnimationStrip: t.Optional(t.Boolean()),

    // ==================== User Preferences ====================
    isFavorite: t.Optional(t.Boolean()),
    notes: t.Optional(t.String({ maxLength: 10000 })),
    lastViewedAt: t.Optional(t.String({ format: "date-time" })),

    // ==================== Workflow Status ====================
    status: t.Optional(WorkflowStatusEnum),

    // ==================== Project Management ====================
    projectId: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  }),
]);

// ==================== Variant Asset Metadata Schema ====================

/**
 * Variant Asset Metadata Schema
 * For retextured variants of base models
 */
export const VariantAssetMetadataSchema = t.Composite([
  RiggingMetadataSchema,
  t.Object({
    // ==================== Identity Fields ====================
    id: t.String({ minLength: 1, maxLength: 255 }),
    gameId: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional for legacy data
    name: t.String({ minLength: 1, maxLength: 500 }),
    description: t.Optional(t.String({ maxLength: 5000 })), // Optional for legacy data
    type: t.Optional(AssetTypeEnum), // Optional for legacy data
    subtype: t.Optional(t.String({ minLength: 1, maxLength: 200 })), // Optional for legacy data

    // ==================== Variant Discriminators ====================
    isBaseModel: t.Literal(false),
    isVariant: t.Literal(true),

    // ==================== Parent Reference ====================
    parentBaseModel: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional for legacy data

    // ==================== Material Information ====================
    materialPreset: t.Optional(MaterialPresetInfoSchema), // Optional for legacy data
    baseMaterial: t.Optional(t.String({ maxLength: 200 })), // Backwards compatibility

    // ==================== Retexture Info ====================
    retextureTaskId: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional for legacy data
    retextureMethod: t.Optional(RetextureMethodEnum), // Optional for legacy data
    retextureStatus: t.Optional(RetextureStatusEnum), // Optional for legacy data
    retextureError: t.Optional(t.String({ maxLength: 2000 })),

    // ==================== Base Model Reference ====================
    baseModelTaskId: t.Optional(t.String({ minLength: 1, maxLength: 255 })), // Optional for legacy data

    // ==================== File Paths ====================
    modelPath: t.Optional(t.String({ minLength: 1, maxLength: 500 })), // Optional for legacy data
    conceptArtPath: t.Optional(t.String({ maxLength: 500 })),
    hasModel: t.Optional(t.Boolean()), // Optional for legacy data
    hasConceptArt: t.Optional(t.Boolean()), // Optional for legacy data

    // ==================== Generation Details ====================
    workflow: t.Optional(t.String({ minLength: 1, maxLength: 200 })), // Optional for legacy data
    gddCompliant: t.Optional(t.Boolean()), // Optional for legacy data
    isPlaceholder: t.Optional(t.Boolean()), // Optional for legacy data

    // ==================== Normalization ====================
    normalized: t.Optional(t.Boolean()),
    normalizationDate: t.Optional(t.String({ format: "date-time" })),
    dimensions: t.Optional(DimensionsSchema),

    // ==================== Timestamps (ISO 8601) ====================
    generatedAt: t.Optional(t.String({ format: "date-time" })), // Optional for legacy data
    completedAt: t.Optional(t.String({ format: "date-time" })),
    createdAt: t.Optional(t.String({ format: "date-time" })),
    updatedAt: t.Optional(t.String({ format: "date-time" })),

    // ==================== UI Properties ====================
    tier: t.Optional(t.String({ maxLength: 50 })),
    format: t.Optional(
      t.Union([
        t.Literal("GLB"),
        t.Literal("FBX"),
        t.Literal("OBJ"),
        t.Literal("GLTF"),
      ]),
    ),
    gripDetected: t.Optional(t.Boolean()),
    requiresAnimationStrip: t.Optional(t.Boolean()),

    // ==================== User Preferences ====================
    isFavorite: t.Optional(t.Boolean()),
    notes: t.Optional(t.String({ maxLength: 10000 })),
    lastViewedAt: t.Optional(t.String({ format: "date-time" })),

    // ==================== Workflow Status ====================
    status: t.Optional(WorkflowStatusEnum),

    // ==================== Project Management ====================
    projectId: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  }),
]);

// ==================== Discriminated Union ====================

/**
 * Asset Metadata Schema
 * Discriminated union of Base and Variant metadata
 *
 * Use `isBaseModel` and `isVariant` fields to discriminate between types
 */
export const AssetMetadataSchema = t.Union([
  BaseAssetMetadataSchema,
  VariantAssetMetadataSchema,
]);

// ==================== TypeScript Type Exports ====================

/**
 * Export TypeScript types derived from schemas
 * These match the frontend types exactly
 */
export type BaseAssetMetadataType = Static<typeof BaseAssetMetadataSchema>;
export type VariantAssetMetadataType = Static<
  typeof VariantAssetMetadataSchema
>;
export type AssetMetadataType = Static<typeof AssetMetadataSchema>;

// Export shared types
export type MaterialPresetInfoType = Static<typeof MaterialPresetInfoSchema>;
export type DimensionsType = Static<typeof DimensionsSchema>;
export type AnimationsType = Static<typeof AnimationsSchema>;
export type RiggingMetadataType = Static<typeof RiggingMetadataSchema>;

// ==================== Type Guards ====================

/**
 * Runtime type guard to check if metadata is a base asset
 */
export function isBaseAssetMetadata(
  metadata: AssetMetadataType,
): metadata is BaseAssetMetadataType {
  return metadata.isBaseModel === true;
}

/**
 * Runtime type guard to check if metadata is a variant asset
 */
export function isVariantAssetMetadata(
  metadata: AssetMetadataType,
): metadata is VariantAssetMetadataType {
  return metadata.isVariant === true;
}

/**
 * Check if a base asset can be retextured
 */
export function canRetexture(metadata: AssetMetadataType): boolean {
  return (
    isBaseAssetMetadata(metadata) &&
    !!metadata.meshyTaskId &&
    metadata.meshyTaskId.length > 0 &&
    !metadata.isPlaceholder
  );
}
