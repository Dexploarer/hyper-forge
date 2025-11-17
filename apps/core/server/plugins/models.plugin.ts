/**
 * Models Plugin for Elysia
 * Registers all TypeBox schemas from server/models.ts
 *
 * This allows routes to reference models using t.Ref('model.name') instead of
 * importing and duplicating schemas everywhere.
 *
 * Usage in routes:
 * ```typescript
 * app.post('/api/assets', {
 *   body: t.Ref('asset.metadata'),
 *   response: t.Ref('asset.response')
 * }, handler)
 * ```
 *
 * Benefits:
 * - Centralized schema management
 * - Automatic OpenAPI documentation generation
 * - Type inference for Eden Treaty
 * - Reduced import overhead
 *
 * Note: Using .model() with an object instead of chaining to avoid
 * TypeScript "Type instantiation is excessively deep" errors
 */

import { Elysia } from "elysia";
import * as Models from "../models";

/**
 * Models Plugin
 * Registers all TypeBox schemas for use with t.Ref()
 */
export const modelsPlugin = new Elysia({ name: "models" }).model({
  // ==================== Common Models ====================
  "user.context": Models.UserContext,
  "auth.request": Models.AuthenticatedRequest,
  "health.response": Models.HealthResponse,
  "error.response": Models.ErrorResponse,
  "success.response": Models.SuccessResponse,

  // ==================== Asset Models ====================
  "material.preset.info": Models.MaterialPresetInfo,
  "asset.dimensions": Models.AssetDimensions,
  "asset.metadata": Models.AssetMetadata,
  "asset.list": Models.AssetList,
  "asset.response": Models.AssetResponse,
  "asset.list.response": Models.AssetListResponse,
  "asset.update": Models.AssetUpdate,
  "asset.bulk.update.request": Models.BulkUpdateRequest,
  "asset.bulk.update.response": Models.BulkUpdateResponse,
  "asset.delete.query": Models.DeleteAssetQuery,
  "asset.delete.response": Models.DeleteAssetResponse,

  // ==================== Material Preset Models ====================
  "material.preset": Models.MaterialPreset,
  "material.preset.list": Models.MaterialPresetList,
  "material.preset.save.response": Models.MaterialPresetSaveResponse,

  // ==================== Retexture Models ====================
  "retexture.request": Models.RetextureRequest,
  "retexture.response": Models.RetextureResponse,
  "retexture.regenerate.response": Models.RegenerateBaseResponse,

  // ==================== Generation Pipeline Models ====================
  "pipeline.config": Models.PipelineConfig,
  "pipeline.response": Models.PipelineResponse,
  "pipeline.stage": Models.PipelineStage,
  "pipeline.status": Models.PipelineStatus,

  // ==================== Sprite Models ====================
  "sprite.data": Models.SpriteData,
  "sprite.save.request": Models.SpriteSaveRequest,
  "sprite.save.response": Models.SpriteSaveResponse,

  // ==================== VRM Upload Models ====================
  "vrm.upload.response": Models.VRMUploadResponse,

  // ==================== Weapon Detection Models ====================
  "weapon.grip.bounds": Models.GripBounds,
  "weapon.detected.parts": Models.DetectedParts,
  "weapon.grip.data": Models.GripData,
  "weapon.handle.detect.request": Models.WeaponHandleDetectRequest,
  "weapon.handle.detect.response": Models.WeaponHandleDetectResponse,
  "weapon.orientation.data": Models.OrientationData,
  "weapon.orientation.detect.request": Models.WeaponOrientationDetectRequest,
  "weapon.orientation.detect.response": Models.WeaponOrientationDetectResponse,

  // ==================== ElevenLabs Voice Generation Models ====================
  "voice.settings": Models.VoiceSettings,
  voice: Models.Voice,
  "voice.generate.request": Models.GenerateVoiceRequest,
  "voice.batch.request": Models.BatchVoiceRequest,
  "voice.library.response": Models.VoiceLibraryResponse,
  "voice.generate.response": Models.GenerateVoiceResponse,
  "voice.batch.response": Models.BatchVoiceResponse,
  "voice.design.request": Models.DesignVoiceRequest,
  "voice.preview": Models.VoicePreview,
  "voice.design.response": Models.DesignVoiceResponse,
  "voice.create.request": Models.CreateVoiceRequest,
  "voice.create.response": Models.CreateVoiceResponse,

  // ==================== ElevenLabs Music Generation Models ====================
  "music.composition.section": Models.CompositionSection,
  "music.composition.plan": Models.CompositionPlan,
  "music.generate.request": Models.GenerateMusicRequest,
  "music.composition.plan.request": Models.CreateCompositionPlanRequest,
  "music.batch.request": Models.BatchMusicRequest,

  // ==================== ElevenLabs Sound Effects Models ====================
  "sfx.generate.request": Models.GenerateSfxRequest,
  "sfx.batch.request": Models.BatchSfxRequest,
  "sfx.batch.response": Models.BatchSfxResponse,
  "sfx.estimate.response": Models.SfxEstimateResponse,

  // ==================== Content Generation Models ====================
  "dialogue.node.response": Models.DialogueNodeResponse,
  "dialogue.generate.request": Models.GenerateDialogueRequest,
  "dialogue.generate.response": Models.GenerateDialogueResponse,
  "npc.data.response": Models.NPCDataResponse,
  "npc.generate.request": Models.GenerateNPCRequest,
  "npc.generate.response": Models.GenerateNPCResponse,
  "quest.objective": Models.QuestObjective,
  "quest.data.response": Models.QuestDataResponse,
  "quest.generate.request": Models.GenerateQuestRequest,
  "quest.generate.response": Models.GenerateQuestResponse,
  "lore.data.response": Models.LoreDataResponse,
  "lore.generate.request": Models.GenerateLoreRequest,
  "lore.generate.response": Models.GenerateLoreResponse,
  "world.seed.asset": Models.WorldSeedAsset,
  "world.seed.npc": Models.WorldSeedNPC,
  "world.seed.location": Models.WorldSeedLocation,
  "world.data.response": Models.WorldDataResponse,
  "world.generate.request": Models.GenerateWorldRequest,
  "world.generate.response": Models.GenerateWorldResponse,

  // ==================== Vector Search Models ====================
  "asset.search.filters": Models.AssetSearchFilters,
  "asset.search.result": Models.AssetSearchResult,
  "asset.search.response": Models.AssetSearchResponse,
  "npc.search.result": Models.NPCSearchResult,
  "npc.search.response": Models.NPCSearchResponse,
  "quest.search.result": Models.QuestSearchResult,
  "quest.search.response": Models.QuestSearchResponse,
  "lore.search.result": Models.LoreSearchResult,
  "lore.search.response": Models.LoreSearchResponse,
  "vector.search.health.response": Models.VectorSearchHealthResponse,
  "vector.search.query": Models.VectorSearchQuery,
  "vector.search.error.response": Models.VectorSearchErrorResponse,

  // ==================== World Configuration Models ====================
  "world.race": Models.WorldRace,
  "world.faction": Models.WorldFaction,
  "world.skill": Models.WorldSkill,
  "npc.category": Models.NPCCategory,
  "quest.type": Models.QuestType,
  "quest.difficulty": Models.QuestDifficulty,
  "quest.configuration": Models.QuestConfiguration,
  "item.category": Models.ItemCategory,
  "item.rarity": Models.ItemRarity,
  "item.enchantment": Models.ItemEnchantment,
  "items.configuration": Models.ItemsConfiguration,
  biome: Models.Biome,
  "settlement.type": Models.SettlementType,
  "dungeon.type": Models.DungeonType,
  "locations.configuration": Models.LocationsConfiguration,
  "economy.settings": Models.EconomySettings,
  "ai.generation.preferences": Models.AIGenerationPreferences,
  "world.configuration.data": Models.WorldConfigurationData,
  "world.config.create.request": Models.CreateWorldConfigRequest,
  "world.config.update.request": Models.UpdateWorldConfigRequest,
  "world.config.partial.update.request": Models.PartialUpdateRequest,
  "world.config.clone.request": Models.CloneConfigRequest,
  "world.config.toggle.item.request": Models.ToggleItemRequest,
  "world.config.validate.response": Models.ValidateConfigResponse,
  "world.config.ai.context.response": Models.AIContextResponse,
});
