/**
 * Elysia Schema Models
 * TypeBox schemas for request/response validation and OpenAPI documentation
 */

import { t, Static } from "elysia";

// ==================== Common Models ====================

/**
 * User authentication context
 * Contains the authenticated user's identity information
 *
 * Provides user identity for ownership tracking and access control.
 */
export const UserContext = t.Object({
  userId: t.Optional(t.String()), // User identifier from authentication system
  walletAddress: t.Optional(t.String()), // User's Web3 wallet address (if linked to account)
  isAdmin: t.Optional(t.Boolean()), // Whether user is an admin (can modify any asset)
});

/**
 * Base authenticated request model
 * Extend this for endpoints requiring authentication
 *
 * This model provides a standard way to attach user context to requests.
 * Use with Elysia's t.Composite() to merge with your request schema:
 *
 * Example:
 * const MyAuthenticatedRequest = t.Composite([
 *   AuthenticatedRequest,
 *   t.Object({ myField: t.String() })
 * ])
 */
export const AuthenticatedRequest = t.Object({
  user: UserContext,
});

export const HealthResponse = t.Object({
  status: t.String(),
  timestamp: t.String(),
  services: t.Object({
    meshy: t.Boolean(),
    openai: t.Boolean(),
  }),
});

export const ErrorResponse = t.Object({
  error: t.String(),
});

export const SuccessResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

// ==================== Asset Models ====================

export const MaterialPresetInfo = t.Object({
  id: t.String(),
  displayName: t.String(),
  category: t.String(),
  tier: t.Number(),
  color: t.String(),
  stylePrompt: t.Optional(t.String()),
});

export const AssetDimensions = t.Object({
  width: t.Number(),
  height: t.Number(),
  depth: t.Number(),
});

export const AssetMetadata = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  type: t.Optional(t.String()),
  subtype: t.Optional(t.String()),
  tier: t.Optional(t.Union([t.String(), t.Number()])),
  category: t.Optional(t.String()),
  modelUrl: t.Optional(t.String()),
  thumbnailUrl: t.Optional(t.String()),
  hasSpriteSheet: t.Optional(t.Boolean()),
  spriteCount: t.Optional(t.Number()),
  // Generation metadata
  detailedPrompt: t.Optional(t.String()),
  workflow: t.Optional(t.String()),
  meshyTaskId: t.Optional(t.String()),
  generatedAt: t.Optional(t.String()),
  generationMethod: t.Optional(
    t.Union([
      t.Literal("gpt-image-meshy"),
      t.Literal("direct-meshy"),
      t.Literal("manual"),
      t.Literal("placeholder"),
    ]),
  ),
  quality: t.Optional(t.String()),
  // File paths
  modelPath: t.Optional(t.String()),
  conceptArtPath: t.Optional(t.String()),
  hasConceptArt: t.Optional(t.Boolean()),
  hasModel: t.Optional(t.Boolean()),
  riggedModelPath: t.Optional(t.String()),
  // Variant system
  isBaseModel: t.Optional(t.Boolean()),
  isVariant: t.Optional(t.Boolean()),
  parentBaseModel: t.Optional(t.String()),
  variants: t.Optional(t.Array(t.String())),
  variantCount: t.Optional(t.Number()),
  lastVariantGenerated: t.Optional(t.String()),
  // Material info for variants
  materialPreset: t.Optional(MaterialPresetInfo),
  baseMaterial: t.Optional(t.String()),
  retextureTaskId: t.Optional(t.String()),
  retextureMethod: t.Optional(
    t.Union([
      t.Literal("meshy-retexture"),
      t.Literal("manual-texture"),
      t.Literal("ai-generated"),
    ]),
  ),
  retextureStatus: t.Optional(
    t.Union([
      t.Literal("pending"),
      t.Literal("processing"),
      t.Literal("completed"),
      t.Literal("failed"),
    ]),
  ),
  retextureError: t.Optional(t.String()),
  baseModelTaskId: t.Optional(t.String()),
  // Other fields
  gameId: t.Optional(t.String()),
  gddCompliant: t.Optional(t.Boolean()),
  isPlaceholder: t.Optional(t.Boolean()),
  normalized: t.Optional(t.Boolean()),
  normalizationDate: t.Optional(t.String()),
  dimensions: t.Optional(AssetDimensions),
  format: t.Optional(t.String()),
  gripDetected: t.Optional(t.Boolean()),
  requiresAnimationStrip: t.Optional(t.Boolean()),
  // Ownership tracking (Phase 1)
  createdBy: t.Optional(t.String()), // User ID
  walletAddress: t.Optional(t.String()), // User's wallet address
  isPublic: t.Optional(t.Boolean()), // Default true
  createdAt: t.Optional(t.String()),
  updatedAt: t.Optional(t.String()),
  completedAt: t.Optional(t.String()),
  // User preferences and metadata
  isFavorite: t.Optional(t.Boolean()), // Bookmark/favorite flag
  notes: t.Optional(t.String()), // User notes for this asset
  lastViewedAt: t.Optional(t.String()), // Last time asset was viewed
  // Workflow status
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("processing"),
      t.Literal("completed"),
      t.Literal("failed"),
      t.Literal("approved"),
      t.Literal("published"),
      t.Literal("archived"),
    ]),
  ),
  // Project Management
  projectId: t.Optional(t.String()),
});

export const AssetList = t.Array(AssetMetadata);

/**
 * Asset API Response
 * Full asset structure returned by the /api/assets endpoint
 * Includes the complete metadata object from metadata.json files
 */
export const AssetResponse = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  type: t.String(),
  metadata: t.Any(), // Full metadata.json content (dynamic structure with many optional fields)
  hasModel: t.Boolean(),
  modelFile: t.Optional(t.String()),
  generatedAt: t.Optional(t.String()),
});

export const AssetListResponse = t.Array(AssetResponse);

export const AssetUpdate = t.Object({
  name: t.Optional(t.String()),
  type: t.Optional(t.String()),
  tier: t.Optional(t.Number()),
  category: t.Optional(t.String()),
  isFavorite: t.Optional(t.Boolean()),
  notes: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("processing"),
      t.Literal("completed"),
      t.Literal("failed"),
      t.Literal("approved"),
      t.Literal("published"),
      t.Literal("archived"),
    ]),
  ),
});

export const BulkUpdateRequest = t.Object({
  assetIds: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
  updates: t.Object({
    status: t.Optional(
      t.Union([
        t.Literal("draft"),
        t.Literal("processing"),
        t.Literal("completed"),
        t.Literal("failed"),
        t.Literal("approved"),
        t.Literal("published"),
        t.Literal("archived"),
      ]),
    ),
    isFavorite: t.Optional(t.Boolean()),
  }),
});

export const BulkUpdateResponse = t.Object({
  success: t.Boolean(),
  updated: t.Number(),
  failed: t.Number(),
  errors: t.Optional(
    t.Array(
      t.Object({
        assetId: t.String(),
        error: t.String(),
      }),
    ),
  ),
});

export const DeleteAssetQuery = t.Object({
  includeVariants: t.Optional(t.String()),
});

export const DeleteAssetResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

// ==================== Material Preset Models ====================

export const MaterialPreset = t.Object({
  id: t.String({ minLength: 1 }),
  name: t.Optional(t.String()),
  displayName: t.String({ minLength: 1 }),
  stylePrompt: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  category: t.Optional(t.String()),
  tier: t.Optional(t.Union([t.String(), t.Number()])),
  color: t.Optional(t.String()),
});

export const MaterialPresetList = t.Array(MaterialPreset);

export const MaterialPresetSaveResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

// ==================== Retexture Models ====================

export const RetextureRequest = t.Object({
  baseAssetId: t.String({ minLength: 1 }),
  // Support three modes: preset, custom prompt, or image reference
  materialPreset: t.Optional(MaterialPreset),
  customPrompt: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  artStyle: t.Optional(t.Union([t.Literal("realistic"), t.Literal("cartoon")])),
  outputName: t.Optional(t.String()),
  // User context for ownership tracking
  user: t.Optional(UserContext),
});

export const RetextureResponse = t.Object({
  success: t.Boolean(),
  assetId: t.String(),
  url: t.String(),
  message: t.String(),
});

export const RegenerateBaseResponse = t.Object({
  success: t.Boolean(),
  assetId: t.String(),
  url: t.String(),
  message: t.String(),
});

// ==================== Generation Pipeline Models ====================

export const PipelineConfig = t.Object({
  description: t.String({ minLength: 1 }),
  assetId: t.String({ minLength: 1 }),
  name: t.String({ minLength: 1 }),
  type: t.String({ minLength: 1 }),
  subtype: t.String({ minLength: 1 }),
  generationType: t.Optional(t.String()),
  tier: t.Optional(t.Number()),
  quality: t.Optional(t.String()),
  style: t.Optional(t.String()),
  enableRigging: t.Optional(t.Boolean()),
  enableRetexturing: t.Optional(t.Boolean()),
  enableSprites: t.Optional(t.Boolean()),
  materialPresets: t.Optional(t.Array(MaterialPreset)),
  customPrompts: t.Optional(
    t.Object({
      gameStyle: t.Optional(t.String()),
    }),
  ),
  metadata: t.Optional(
    t.Object({
      characterHeight: t.Optional(t.Number()),
      useGPT4Enhancement: t.Optional(t.Boolean()),
    }),
  ),
  // User context for ownership tracking (required - authentication mandatory)
  user: t.Object({
    userId: t.String({ minLength: 1 }), // Required for generation
    walletAddress: t.Optional(t.String()),
    isAdmin: t.Optional(t.Boolean()),
  }),
});

export const PipelineResponse = t.Object({
  pipelineId: t.String(),
  status: t.String(),
  message: t.String(),
});

export const PipelineStage = t.Object({
  name: t.String(),
  status: t.Union([
    t.Literal("pending"),
    t.Literal("processing"),
    t.Literal("completed"),
    t.Literal("failed"),
  ]),
  progress: t.Optional(t.Number()),
  startedAt: t.Optional(t.String()),
  completedAt: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

export const PipelineStatus = t.Object({
  id: t.String(),
  status: t.String(),
  progress: t.Number(),
  stages: t.Record(t.String(), PipelineStage),
  results: t.Record(t.String(), t.Unknown()),
  error: t.Optional(t.String()),
  createdAt: t.String(),
  completedAt: t.Optional(t.String()),
});

// ==================== Sprite Models ====================

export const SpriteData = t.Object({
  angle: t.Number(),
  imageData: t.String({ minLength: 1 }),
});

export const SpriteSaveRequest = t.Object({
  sprites: t.Array(SpriteData),
  config: t.Optional(
    t.Object({
      resolution: t.Optional(t.Number()),
      angles: t.Optional(t.Number()),
    }),
  ),
});

export const SpriteSaveResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
  spritesDir: t.String(),
  spriteFiles: t.Array(t.String()),
});

// ==================== VRM Upload Models ====================

export const VRMUploadResponse = t.Object({
  success: t.Boolean(),
  url: t.String(),
  message: t.String(),
});

// ==================== Weapon Detection Models ====================

export const GripBounds = t.Object({
  minX: t.Number(),
  minY: t.Number(),
  maxX: t.Number(),
  maxY: t.Number(),
});

export const DetectedParts = t.Object({
  blade: t.Optional(t.String()),
  handle: t.Optional(t.String()),
  guard: t.Optional(t.String()),
});

export const GripData = t.Object({
  gripBounds: GripBounds,
  confidence: t.Number(),
  weaponType: t.String(),
  gripDescription: t.String(),
  detectedParts: t.Optional(DetectedParts),
});

export const WeaponHandleDetectRequest = t.Object({
  image: t.String({ minLength: 1 }),
  angle: t.Optional(t.String()),
  promptHint: t.Optional(t.String()),
});

export const WeaponHandleDetectResponse = t.Object({
  success: t.Boolean(),
  gripData: t.Optional(GripData),
  error: t.Optional(t.String()),
  originalImage: t.Optional(t.String()),
});

export const OrientationData = t.Object({
  needsFlip: t.Boolean(),
  currentOrientation: t.String(),
  reason: t.String(),
});

export const WeaponOrientationDetectRequest = t.Object({
  image: t.String({ minLength: 1 }),
});

export const WeaponOrientationDetectResponse = t.Object({
  success: t.Boolean(),
  needsFlip: t.Optional(t.Boolean()),
  currentOrientation: t.Optional(t.String()),
  reason: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

// ==================== ElevenLabs Voice Generation Models ====================

export const VoiceSettings = t.Object({
  stability: t.Optional(t.Number()),
  similarity_boost: t.Optional(t.Number()),
  style: t.Optional(t.Number()),
  use_speaker_boost: t.Optional(t.Boolean()),
});

export const Voice = t.Object({
  voice_id: t.String(),
  name: t.String(),
  category: t.Optional(t.String()),
  description: t.Optional(t.String()),
  labels: t.Optional(t.Record(t.String(), t.String())),
  preview_url: t.Optional(t.String()),
});

export const GenerateVoiceRequest = t.Object({
  text: t.String({ minLength: 1 }),
  voiceId: t.String({ minLength: 1 }),
  npcId: t.Optional(t.String()),
  settings: t.Optional(VoiceSettings),
});

export const BatchVoiceRequest = t.Object({
  texts: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
  voiceId: t.String({ minLength: 1 }),
  npcId: t.Optional(t.String()),
  settings: t.Optional(VoiceSettings),
});

export const VoiceLibraryResponse = t.Object({
  voices: t.Array(Voice),
  count: t.Number(),
});

export const GenerateVoiceResponse = t.Object({
  success: t.Boolean(),
  audioData: t.Optional(t.String()),
  npcId: t.Optional(t.String()),
  error: t.Optional(t.String()),
});

export const BatchVoiceResponse = t.Object({
  successful: t.Number(),
  total: t.Number(),
  results: t.Array(
    t.Object({
      success: t.Boolean(),
      audioData: t.Optional(t.String()),
      text: t.String(),
      error: t.Optional(t.String()),
    }),
  ),
});

// Voice Design Models
export const DesignVoiceRequest = t.Object({
  voiceDescription: t.String({ minLength: 1 }),
  text: t.Optional(t.String()),
  autoGenerateText: t.Optional(t.Boolean()),
  modelId: t.Optional(t.String()),
  loudness: t.Optional(t.Number()),
  seed: t.Optional(t.Number()),
  guidanceScale: t.Optional(t.Number()),
  outputFormat: t.Optional(t.String()),
});

export const VoicePreview = t.Object({
  generated_voice_id: t.String(),
  audio_base_64: t.String(),
  duration_secs: t.Optional(t.Number()),
  media_type: t.Optional(t.String()),
});

export const DesignVoiceResponse = t.Object({
  previews: t.Array(VoicePreview),
  prompt: t.String(),
});

export const CreateVoiceRequest = t.Object({
  voiceName: t.String({ minLength: 1 }),
  voiceDescription: t.String({ minLength: 1 }),
  generatedVoiceId: t.String({ minLength: 1 }),
  labels: t.Optional(t.Record(t.String(), t.String())),
  playedNotSelectedVoiceIds: t.Optional(t.Array(t.String())),
});

export const CreateVoiceResponse = t.Object({
  voice_id: t.String(),
  name: t.String(),
  description: t.String(),
});

// ==================== ElevenLabs Music Generation Models ====================

export const CompositionSection = t.Object({
  name: t.String(),
  duration: t.Number(),
  description: t.String(),
});

export const CompositionPlan = t.Object({
  prompt: t.String(),
  musicLengthMs: t.Optional(t.Number()),
  sections: t.Optional(t.Array(CompositionSection)),
  modelId: t.Optional(t.String()),
});

export const GenerateMusicRequest = t.Object({
  prompt: t.Optional(t.String()),
  musicLengthMs: t.Optional(t.Number({ minimum: 1000, maximum: 300000 })),
  compositionPlan: t.Optional(CompositionPlan),
  forceInstrumental: t.Optional(t.Boolean()),
  respectSectionsDurations: t.Optional(t.Boolean()),
  storeForInpainting: t.Optional(t.Boolean()),
  modelId: t.Optional(t.String()),
  outputFormat: t.Optional(t.String()),
});

export const CreateCompositionPlanRequest = t.Object({
  prompt: t.String({ minLength: 1 }),
  musicLengthMs: t.Optional(t.Number()),
  sourceCompositionPlan: t.Optional(CompositionPlan),
  modelId: t.Optional(t.String()),
});

export const BatchMusicRequest = t.Object({
  tracks: t.Array(GenerateMusicRequest, { minItems: 1, maxItems: 10 }),
});

// ==================== ElevenLabs Sound Effects Models ====================

export const GenerateSfxRequest = t.Object({
  text: t.String({ minLength: 1 }),
  durationSeconds: t.Optional(t.Number({ minimum: 0.5, maximum: 22 })),
  promptInfluence: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
  loop: t.Optional(t.Boolean()),
});

export const BatchSfxRequest = t.Object({
  effects: t.Array(GenerateSfxRequest, { minItems: 1, maxItems: 20 }),
});

export const BatchSfxResponse = t.Object({
  effects: t.Array(
    t.Object({
      index: t.Number(),
      success: t.Boolean(),
      audioBuffer: t.Optional(t.String()),
      text: t.String(),
      size: t.Optional(t.Number()),
      error: t.Optional(t.String()),
    }),
  ),
  successful: t.Number(),
  total: t.Number(),
});

export const SfxEstimateResponse = t.Object({
  duration: t.Union([t.String(), t.Number()]),
  credits: t.Number(),
  estimatedCostUSD: t.String(),
});

// ==================== Content Generation Models ====================

const ModelQuality = t.Union([
  t.Literal("quality"),
  t.Literal("speed"),
  t.Literal("balanced"),
]);

// Dialogue Generation
export const DialogueNodeResponse = t.Object({
  id: t.String(),
  text: t.String(),
  responses: t.Optional(
    t.Array(
      t.Object({
        text: t.String(),
        nextNodeId: t.Optional(t.String()),
      }),
    ),
  ),
});

export const GenerateDialogueRequest = t.Object({
  npcName: t.Optional(t.String({ minLength: 1 })),
  npcPersonality: t.Optional(t.String({ minLength: 1 })),
  prompt: t.Optional(t.String()),
  context: t.Optional(t.String()),
  existingNodes: t.Optional(t.Array(DialogueNodeResponse)),
  quality: t.Optional(ModelQuality),
  worldConfigId: t.Optional(t.String()),
});

export const GenerateDialogueResponse = t.Object({
  nodes: t.Array(DialogueNodeResponse),
  rawResponse: t.String(),
});

// NPC Generation
export const NPCDataResponse = t.Object({
  id: t.String(),
  name: t.String(),
  archetype: t.String(),
  personality: t.Object({
    traits: t.Array(t.String()),
    background: t.String(),
    motivations: t.Array(t.String()),
  }),
  appearance: t.Object({
    description: t.String(),
    equipment: t.Array(t.String()),
  }),
  dialogue: t.Object({
    greeting: t.String(),
    farewell: t.String(),
    idle: t.Array(t.String()),
  }),
  behavior: t.Object({
    role: t.String(),
    schedule: t.String(),
    relationships: t.Array(t.String()),
  }),
  metadata: t.Record(t.String(), t.Unknown()),
});

export const GenerateNPCRequest = t.Object({
  prompt: t.String({ minLength: 1 }),
  archetype: t.Optional(t.String({ minLength: 1 })),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
  worldConfigId: t.Optional(t.String()),
});

export const GenerateNPCResponse = t.Object({
  npc: NPCDataResponse,
  rawResponse: t.String(),
});

// Quest Generation
export const QuestObjective = t.Object({
  description: t.String(),
  type: t.Union([
    t.Literal("kill"),
    t.Literal("collect"),
    t.Literal("talk"),
    t.Literal("explore"),
  ]),
  target: t.String(),
  count: t.Number(),
});

export const QuestDataResponse = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.String(),
  objectives: t.Array(QuestObjective),
  rewards: t.Object({
    experience: t.Number(),
    gold: t.Number(),
    items: t.Array(t.String()),
  }),
  requirements: t.Object({
    level: t.Number(),
    previousQuests: t.Array(t.String()),
  }),
  npcs: t.Array(t.String()),
  location: t.String(),
  story: t.String(),
  difficulty: t.String(),
  questType: t.String(),
  metadata: t.Record(t.String(), t.Unknown()),
});

export const GenerateQuestRequest = t.Object({
  prompt: t.Optional(t.String({ minLength: 1 })),
  questType: t.Optional(t.String({ minLength: 1 })),
  difficulty: t.Optional(t.String({ minLength: 1 })),
  theme: t.Optional(t.String()),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
  worldConfigId: t.Optional(t.String()),
});

export const GenerateQuestResponse = t.Object({
  quest: QuestDataResponse,
  rawResponse: t.String(),
});

// Lore Generation
export const LoreDataResponse = t.Object({
  id: t.String(),
  title: t.String(),
  category: t.String(),
  content: t.String(),
  summary: t.String(),
  relatedTopics: t.Array(t.String()),
  timeline: t.Optional(t.String()),
  characters: t.Optional(t.Array(t.String())),
  metadata: t.Record(t.String(), t.Unknown()),
});

export const GenerateLoreRequest = t.Object({
  prompt: t.Optional(t.String({ minLength: 1 })),
  category: t.Optional(t.String({ minLength: 1 })),
  topic: t.Optional(t.String({ minLength: 1 })),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
  worldConfigId: t.Optional(t.String()),
});

export const GenerateLoreResponse = t.Object({
  lore: LoreDataResponse,
  rawResponse: t.String(),
});

// World Generation
export const WorldSeedAsset = t.Object({
  name: t.String(),
  description: t.String(),
  category: t.String(),
});

export const WorldSeedNPC = t.Object({
  name: t.String(),
  role: t.String(),
  archetype: t.String(),
});

export const WorldSeedLocation = t.Object({
  name: t.String(),
  type: t.String(),
  description: t.String(),
});

export const WorldDataResponse = t.Object({
  id: t.String(),
  worldName: t.String(),
  theme: t.String(),
  complexity: t.String(),
  narrative: t.String(),
  keyFeatures: t.Array(t.String()),
  suggestedAssets: t.Object({
    items: t.Array(WorldSeedAsset),
    environments: t.Array(WorldSeedAsset),
    buildings: t.Array(WorldSeedAsset),
  }),
  suggestedNPCs: t.Array(WorldSeedNPC),
  suggestedLocations: t.Array(WorldSeedLocation),
  loreHooks: t.Array(t.String()),
  metadata: t.Record(t.String(), t.Unknown()),
});

export const GenerateWorldRequest = t.Object({
  theme: t.Optional(t.String()),
  complexity: t.Optional(
    t.Union([t.Literal("simple"), t.Literal("medium"), t.Literal("complex")]),
  ),
  customPrompt: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
});

export const GenerateWorldResponse = t.Object({
  world: WorldDataResponse,
  rawResponse: t.String(),
});

// ==================== Type Exports ====================
// Export TypeScript types for use in implementation

export type UserContextType = Static<typeof UserContext>;
export type AuthenticatedRequestType = Static<typeof AuthenticatedRequest>;
export type HealthResponseType = Static<typeof HealthResponse>;
export type AssetMetadataType = Static<typeof AssetMetadata>;
export type RetextureRequestType = Static<typeof RetextureRequest>;
export type PipelineConfigType = Static<typeof PipelineConfig>;
export type WeaponHandleDetectRequestType = Static<
  typeof WeaponHandleDetectRequest
>;
export type WeaponOrientationDetectRequestType = Static<
  typeof WeaponOrientationDetectRequest
>;
export type GenerateVoiceRequestType = Static<typeof GenerateVoiceRequest>;
export type GenerateMusicRequestType = Static<typeof GenerateMusicRequest>;
export type GenerateSfxRequestType = Static<typeof GenerateSfxRequest>;

// ==================== Vector Search Models ====================

/**
 * Vector search result with semantic similarity score
 */
export const VectorSearchResult = <T extends ReturnType<typeof t.Any>>(
  entitySchema: T,
) =>
  t.Object({
    score: t.Number({ minimum: 0, maximum: 1 }),
    ...entitySchema.properties,
  });

/**
 * Asset search request filters
 */
export const AssetSearchFilters = t.Object({
  type: t.Optional(t.String()),
  category: t.Optional(t.String()),
});

/**
 * Asset semantic search result
 */
export const AssetSearchResult = t.Object({
  score: t.Number({ minimum: 0, maximum: 1 }),
  asset: t.Union([AssetResponse, t.Null()]),
});

export const AssetSearchResponse = t.Object({
  results: t.Array(AssetSearchResult),
});

/**
 * NPC semantic search result
 */
export const NPCSearchResult = t.Object({
  score: t.Number({ minimum: 0, maximum: 1 }),
  npc: t.Union([NPCDataResponse, t.Null()]),
});

export const NPCSearchResponse = t.Object({
  results: t.Array(NPCSearchResult),
});

/**
 * Quest semantic search result
 */
export const QuestSearchResult = t.Object({
  score: t.Number({ minimum: 0, maximum: 1 }),
  quest: t.Union([QuestDataResponse, t.Null()]),
});

export const QuestSearchResponse = t.Object({
  results: t.Array(QuestSearchResult),
});

/**
 * Lore semantic search result
 */
export const LoreSearchResult = t.Object({
  score: t.Number({ minimum: 0, maximum: 1 }),
  lore: t.Union([LoreDataResponse, t.Null()]),
});

export const LoreSearchResponse = t.Object({
  results: t.Array(LoreSearchResult),
});

/**
 * Vector search health check response
 */
export const VectorSearchHealthResponse = t.Object({
  status: t.Union([
    t.Literal("healthy"),
    t.Literal("unhealthy"),
    t.Literal("unavailable"),
    t.Literal("error"),
  ]),
  message: t.Optional(t.String()),
  collections: t.Optional(
    t.Object({
      assets: t.Number(),
      npcs: t.Number(),
      quests: t.Number(),
      lore: t.Number(),
      dialogues: t.Number(),
    }),
  ),
  embeddingModel: t.Optional(
    t.Object({
      model: t.String(),
      dimensions: t.Number(),
      provider: t.String(),
    }),
  ),
});

/**
 * Vector search request query parameters
 */
export const VectorSearchQuery = t.Object({
  query: t.String({ minLength: 1 }),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  scoreThreshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
  filters: t.Optional(AssetSearchFilters),
});

/**
 * Vector search error response
 */
export const VectorSearchErrorResponse = t.Object({
  error: t.String(),
  message: t.Optional(t.String()),
});

// ==================== World Configuration Models ====================

export const WorldRace = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1 }),
  description: t.String(),
  traits: t.Array(t.String()),
  culturalBackground: t.String(),
  enabled: t.Boolean(),
  createdAt: t.String(),
});

export const WorldFaction = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1 }),
  description: t.String(),
  alignment: t.Union([
    t.Literal("good"),
    t.Literal("neutral"),
    t.Literal("evil"),
  ]),
  goals: t.Array(t.String()),
  rivals: t.Array(t.String()),
  allies: t.Array(t.String()),
  enabled: t.Boolean(),
  createdAt: t.String(),
});

export const WorldSkill = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1 }),
  category: t.Union([
    t.Literal("combat"),
    t.Literal("magic"),
    t.Literal("stealth"),
    t.Literal("social"),
    t.Literal("crafting"),
  ]),
  description: t.String(),
  prerequisites: t.Array(t.String()),
  tier: t.Number({ minimum: 1, maximum: 5 }),
  enabled: t.Boolean(),
  createdAt: t.String(),
});

export const NPCCategory = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1 }),
  archetypes: t.Array(t.String()),
  commonTraits: t.Array(t.String()),
  typicalRoles: t.Array(t.String()),
  enabled: t.Boolean(),
});

export const QuestType = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  enabled: t.Boolean(),
});

export const QuestDifficulty = t.Object({
  id: t.String(),
  name: t.String(),
  levelRange: t.Object({
    min: t.Number(),
    max: t.Number(),
  }),
  rewardMultiplier: t.Number(),
  enabled: t.Boolean(),
});

export const QuestConfiguration = t.Object({
  types: t.Array(QuestType),
  difficulties: t.Array(QuestDifficulty),
  objectiveTypes: t.Array(t.String()),
  defaultRewards: t.Object({
    experienceBase: t.Number(),
    goldBase: t.Number(),
  }),
});

export const ItemCategory = t.Object({
  id: t.String(),
  name: t.String(),
  subcategories: t.Array(t.String()),
  enabled: t.Boolean(),
});

export const ItemRarity = t.Object({
  id: t.String(),
  name: t.String(),
  dropChance: t.Number(),
  statMultiplier: t.Number(),
  enabled: t.Boolean(),
});

export const ItemEnchantment = t.Object({
  id: t.String(),
  name: t.String(),
  effect: t.String(),
  tier: t.Number(),
  enabled: t.Boolean(),
});

export const ItemsConfiguration = t.Object({
  categories: t.Array(ItemCategory),
  rarities: t.Array(ItemRarity),
  enchantments: t.Array(ItemEnchantment),
});

export const Biome = t.Object({
  id: t.String(),
  name: t.String(),
  climate: t.String(),
  terrain: t.Array(t.String()),
  dangerLevel: t.Number(),
  enabled: t.Boolean(),
});

export const SettlementType = t.Object({
  id: t.String(),
  name: t.String(),
  populationRange: t.Object({
    min: t.Number(),
    max: t.Number(),
  }),
  commonBuildings: t.Array(t.String()),
  enabled: t.Boolean(),
});

export const DungeonType = t.Object({
  id: t.String(),
  name: t.String(),
  themes: t.Array(t.String()),
  difficultyRange: t.Object({
    min: t.Number(),
    max: t.Number(),
  }),
  enabled: t.Boolean(),
});

export const LocationsConfiguration = t.Object({
  biomes: t.Array(Biome),
  settlementTypes: t.Array(SettlementType),
  dungeonTypes: t.Array(DungeonType),
});

export const EconomySettings = t.Object({
  currencyName: t.String(),
  priceRanges: t.Object({
    consumables: t.Object({ min: t.Number(), max: t.Number() }),
    equipment: t.Object({ min: t.Number(), max: t.Number() }),
    services: t.Object({ min: t.Number(), max: t.Number() }),
    housing: t.Object({ min: t.Number(), max: t.Number() }),
  }),
  tradingEnabled: t.Boolean(),
  barterEnabled: t.Boolean(),
  inflationRate: t.Number(),
});

export const AIGenerationPreferences = t.Object({
  defaultQuality: t.Union([
    t.Literal("quality"),
    t.Literal("speed"),
    t.Literal("balanced"),
  ]),
  toneAndStyle: t.Object({
    narrative: t.Union([
      t.Literal("dark"),
      t.Literal("lighthearted"),
      t.Literal("serious"),
      t.Literal("humorous"),
      t.Literal("epic"),
    ]),
    dialogueFormality: t.Union([
      t.Literal("formal"),
      t.Literal("casual"),
      t.Literal("mixed"),
    ]),
    detailLevel: t.Union([
      t.Literal("minimal"),
      t.Literal("moderate"),
      t.Literal("verbose"),
    ]),
  }),
  contentGuidelines: t.Object({
    violenceLevel: t.Union([
      t.Literal("none"),
      t.Literal("mild"),
      t.Literal("moderate"),
      t.Literal("high"),
    ]),
    magicPrevalence: t.Union([
      t.Literal("none"),
      t.Literal("rare"),
      t.Literal("common"),
      t.Literal("ubiquitous"),
    ]),
    technologyLevel: t.Union([
      t.Literal("primitive"),
      t.Literal("medieval"),
      t.Literal("renaissance"),
      t.Literal("industrial"),
      t.Literal("modern"),
      t.Literal("futuristic"),
    ]),
  }),
  generationConstraints: t.Object({
    maxNPCsPerLocation: t.Number(),
    maxQuestChainLength: t.Number(),
    minQuestObjectives: t.Number(),
    maxQuestObjectives: t.Number(),
  }),
});

export const WorldConfigurationData = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  genre: t.String(),
  isActive: t.Boolean(),
  createdBy: t.Optional(t.String()),
  races: t.Array(WorldRace),
  factions: t.Array(WorldFaction),
  skills: t.Array(WorldSkill),
  npcCategories: t.Array(NPCCategory),
  questConfig: QuestConfiguration,
  itemsConfig: ItemsConfiguration,
  locationsConfig: LocationsConfiguration,
  economySettings: EconomySettings,
  aiPreferences: AIGenerationPreferences,
  version: t.String(),
  tags: t.Array(t.String()),
  isTemplate: t.Boolean(),
  templateName: t.Optional(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

// Request/Response Models

export const CreateWorldConfigRequest = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.String(),
  genre: t.String(),
  races: t.Optional(t.Array(WorldRace)),
  factions: t.Optional(t.Array(WorldFaction)),
  skills: t.Optional(t.Array(WorldSkill)),
  npcCategories: t.Optional(t.Array(NPCCategory)),
  questConfig: t.Optional(QuestConfiguration),
  itemsConfig: t.Optional(ItemsConfiguration),
  locationsConfig: t.Optional(LocationsConfiguration),
  economySettings: t.Optional(EconomySettings),
  aiPreferences: t.Optional(AIGenerationPreferences),
  tags: t.Optional(t.Array(t.String())),
});

export const UpdateWorldConfigRequest = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  genre: t.Optional(t.String()),
  races: t.Optional(t.Array(WorldRace)),
  factions: t.Optional(t.Array(WorldFaction)),
  skills: t.Optional(t.Array(WorldSkill)),
  npcCategories: t.Optional(t.Array(NPCCategory)),
  questConfig: t.Optional(QuestConfiguration),
  itemsConfig: t.Optional(ItemsConfiguration),
  locationsConfig: t.Optional(LocationsConfiguration),
  economySettings: t.Optional(EconomySettings),
  aiPreferences: t.Optional(AIGenerationPreferences),
  tags: t.Optional(t.Array(t.String())),
});

export const PartialUpdateRequest = t.Object({
  section: t.Union([
    t.Literal("races"),
    t.Literal("factions"),
    t.Literal("skills"),
    t.Literal("npcCategories"),
    t.Literal("questConfig"),
    t.Literal("itemsConfig"),
    t.Literal("locationsConfig"),
    t.Literal("economySettings"),
    t.Literal("aiPreferences"),
  ]),
  data: t.Any(), // Dynamic based on section
});

export const CloneConfigRequest = t.Object({
  sourceConfigId: t.String(),
  newName: t.String({ minLength: 1 }),
  newDescription: t.Optional(t.String()),
});

export const ToggleItemRequest = t.Object({
  itemId: t.String(),
  enabled: t.Boolean(),
});

export const ValidateConfigResponse = t.Object({
  valid: t.Boolean(),
  errors: t.Array(
    t.Object({
      field: t.String(),
      message: t.String(),
      severity: t.Union([t.Literal("error"), t.Literal("warning")]),
    }),
  ),
});

export const AIContextResponse = t.Object({
  context: t.String(),
  configId: t.String(),
  configName: t.String(),
  sections: t.Object({
    races: t.String(),
    factions: t.String(),
    skills: t.String(),
    npcCategories: t.String(),
    questConfig: t.String(),
    itemsConfig: t.String(),
    locationsConfig: t.String(),
    economySettings: t.String(),
    aiPreferences: t.String(),
  }),
});
