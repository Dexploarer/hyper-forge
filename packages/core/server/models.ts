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
  generationMethod: t.Optional(t.Union([
    t.Literal('gpt-image-meshy'),
    t.Literal('direct-meshy'),
    t.Literal('manual'),
    t.Literal('placeholder')
  ])),
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
  retextureMethod: t.Optional(t.Union([
    t.Literal('meshy-retexture'),
    t.Literal('manual-texture'),
    t.Literal('ai-generated')
  ])),
  retextureStatus: t.Optional(t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
  ])),
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
  status: t.Optional(t.Union([
    t.Literal('draft'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed'),
    t.Literal('approved'),
    t.Literal('published'),
    t.Literal('archived')
  ])),
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
  metadata: AssetMetadata, // Full metadata.json content with proper types
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
  status: t.Optional(t.Union([
    t.Literal('draft'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed'),
    t.Literal('approved'),
    t.Literal('published'),
    t.Literal('archived')
  ])),
});

export const BulkUpdateRequest = t.Object({
  assetIds: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
  updates: t.Object({
    status: t.Optional(t.Union([
      t.Literal('draft'),
      t.Literal('processing'),
      t.Literal('completed'),
      t.Literal('failed'),
      t.Literal('approved'),
      t.Literal('published'),
      t.Literal('archived')
    ])),
    isFavorite: t.Optional(t.Boolean()),
  })
});

export const BulkUpdateResponse = t.Object({
  success: t.Boolean(),
  updated: t.Number(),
  failed: t.Number(),
  errors: t.Optional(t.Array(t.Object({
    assetId: t.String(),
    error: t.String()
  })))
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
  artStyle: t.Optional(t.Union([t.Literal('realistic'), t.Literal('cartoon')])),
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
  // User context for ownership tracking
  user: t.Optional(UserContext),
});

export const PipelineResponse = t.Object({
  pipelineId: t.String(),
  status: t.String(),
  message: t.String(),
});

export const PipelineStage = t.Object({
  name: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
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
  npcName: t.String({ minLength: 1 }),
  npcPersonality: t.String({ minLength: 1 }),
  context: t.Optional(t.String()),
  existingNodes: t.Optional(t.Array(DialogueNodeResponse)),
  quality: t.Optional(ModelQuality),
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
  archetype: t.String({ minLength: 1 }),
  prompt: t.String({ minLength: 1 }),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
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
  questType: t.String({ minLength: 1 }),
  difficulty: t.String({ minLength: 1 }),
  theme: t.Optional(t.String()),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
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
  category: t.String({ minLength: 1 }),
  topic: t.String({ minLength: 1 }),
  context: t.Optional(t.String()),
  quality: t.Optional(ModelQuality),
});

export const GenerateLoreResponse = t.Object({
  lore: LoreDataResponse,
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
export const VectorSearchResult = <T extends ReturnType<typeof t.Any>>(entitySchema: T) =>
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
  collections: t.Optional(t.Object({
    assets: t.Number(),
    npcs: t.Number(),
    quests: t.Number(),
    lore: t.Number(),
    dialogues: t.Number(),
  })),
  embeddingModel: t.Optional(t.Object({
    model: t.String(),
    dimensions: t.Number(),
    provider: t.String(),
  })),
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
