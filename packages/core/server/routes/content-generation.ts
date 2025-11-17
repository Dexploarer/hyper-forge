/**
 * Content Generation API Routes
 * AI-powered content generation for NPCs, quests, dialogue, and lore
 */

import { Elysia, t } from "elysia";
import { ContentGenerationService } from "../services/ContentGenerationService";
import { AICreationService } from "../services/AICreationService";
import { contentDatabaseService } from "../services/ContentDatabaseService";
import { MediaStorageService } from "../services/MediaStorageService";
import { RelationshipService } from "../services/RelationshipService";
import * as Models from "../models";
import { optionalAuth } from "../plugins/auth.plugin";
import { requireAuthGuard } from "../plugins/auth.plugin";
import { NotFoundError, InternalServerError, ForbiddenError } from "../errors";
import { createChildLogger } from "../utils/logger";
import { getUserApiKeysWithFallback } from "../utils/getUserApiKeys";
import { ActivityLogService } from "../services/ActivityLogService";

const logger = createChildLogger("ContentGenerationRoutes");

const contentGenService = new ContentGenerationService();
const mediaStorageService = new MediaStorageService();
const relationshipService = new RelationshipService();

export const contentGenerationRoutes = new Elysia({
  prefix: "/api/content",
  name: "content-generation",
})
  .derive(async (context) => {
    // Extract user from auth token if present (optional)
    const authResult = await optionalAuth({
      request: context.request,
      headers: context.headers,
    });
    return { user: authResult.user };
  })
  .onBeforeHandle(({ request }) => {
    const url = new URL(request.url);
    logger.debug(
      { method: request.method, path: url.pathname },
      "Content generation request",
    );
  })

  // GET /api/content/test - Simple test endpoint
  .get("/test", () => {
    return { message: "Content generation routes are working!" };
  })

  // POST /api/content/generate-dialogue
  .post(
    "/generate-dialogue",
    async ({ body, user }) => {
      logger.info(
        {
          npcName: body.npcName,
          userId: user?.id,
          quality: body.quality,
        },
        "Generating dialogue",
      );

      const result = await contentGenService.generateDialogue({
        npcName: body.npcName,
        npcPersonality: body.npcPersonality,
        prompt: body.prompt,
        context: body.context,
        existingNodes: body.existingNodes,
        quality: body.quality,
        worldConfigId: body.worldConfigId,
        useActiveWorldConfig: body.useActiveWorldConfig,
      });

      // Save to database
      const dialogue = await contentDatabaseService.createDialogue({
        npcName: body.npcName || "Unknown",
        context: body.context,
        nodes: result.nodes,
        generationParams: {
          npcPersonality: body.npcPersonality,
          prompt: body.prompt,
          quality: body.quality,
          worldConfigId: body.worldConfigId,
        },
        createdBy: user?.id,
        walletAddress: user?.walletAddress || undefined,
      });

      logger.info(
        { dialogueId: dialogue.id, npcName: body.npcName },
        "Dialogue generated successfully",
      );
      return { ...result, id: dialogue.id };
    },
    {
      body: Models.GenerateDialogueRequest,
      response: Models.GenerateDialogueResponse,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate NPC dialogue",
        description:
          "Generate dialogue tree nodes for an NPC using AI. Supports existing dialogue context.",
      },
    },
  )

  // POST /api/content/generate-npc
  .post(
    "/generate-npc",
    async ({ body, user }) => {
      try {
        logger.info(
          {
            archetype: body.archetype,
            userId: user?.id,
            quality: body.quality,
            method: "POST",
            endpoint: "/api/content/generate-npc",
          },
          "Generating NPC",
        );

        const result = await contentGenService.generateNPC({
          prompt: body.prompt,
          archetype: body.archetype,
          context: body.context,
          quality: body.quality,
          worldConfigId: body.worldConfigId,
          useActiveWorldConfig: body.useActiveWorldConfig,
        });

        // Save to database
        const npc = await contentDatabaseService.createNPC({
          name: result.npc.name,
          archetype: result.npc.archetype,
          data: result.npc,
          generationParams: {
            prompt: body.prompt,
            archetype: body.archetype,
            context: body.context,
            quality: body.quality,
            worldConfigId: body.worldConfigId,
          },
          tags: [], // Could extract from archetype or personality
          createdBy: user?.id,
          walletAddress: user?.walletAddress || undefined,
        });

        logger.info(
          { npcId: npc.id, npcName: result.npc.name },
          "NPC generated successfully",
        );
        return result;
      } catch (error) {
        logger.error(
          {
            context: "NPCGeneration",
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            archetype: body.archetype,
            userId: user?.id,
          },
          "Failed to generate NPC",
        );
        throw error; // Re-throw to be handled by error handler plugin
      }
    },
    {
      body: Models.GenerateNPCRequest,
      response: Models.GenerateNPCResponse,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate complete NPC",
        description:
          "Generate a complete NPC character with personality, dialogue, and behavior using AI.",
      },
    },
  )

  // POST /api/content/generate-quest
  .post(
    "/generate-quest",
    async ({ body, user }) => {
      logger.info(
        {
          questType: body.questType,
          difficulty: body.difficulty,
          userId: user?.id,
          quality: body.quality,
        },
        "Generating quest",
      );

      const result = await contentGenService.generateQuest({
        prompt: body.prompt,
        questType: body.questType,
        difficulty: body.difficulty,
        theme: body.theme,
        context: body.context,
        quality: body.quality,
        worldConfigId: body.worldConfigId,
        useActiveWorldConfig: body.useActiveWorldConfig,
      });

      // Save to database
      const quest = await contentDatabaseService.createQuest({
        title: result.quest.title,
        questType: result.quest.questType,
        difficulty: result.quest.difficulty,
        data: result.quest,
        generationParams: {
          prompt: body.prompt,
          theme: body.theme,
          context: body.context,
          quality: body.quality,
          worldConfigId: body.worldConfigId,
        },
        tags: [], // Could extract from quest objectives or theme
        createdBy: user?.id,
        walletAddress: user?.walletAddress || undefined,
      });

      logger.info(
        { questId: quest.id, title: result.quest.title },
        "Quest generated successfully",
      );

      // Log content creation
      if (user?.id) {
        await ActivityLogService.logContentCreated({
          userId: user.id,
          contentType: "quest",
          contentId: quest.id,
          title: result.quest.title,
        });
      }

      return { ...result, id: quest.id };
    },
    {
      body: Models.GenerateQuestRequest,
      response: Models.GenerateQuestResponse,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate game quest",
        description:
          "Generate a complete quest with objectives, rewards, and narrative using AI.",
      },
    },
  )

  // POST /api/content/generate-lore
  .post(
    "/generate-lore",
    async ({ body, user }) => {
      logger.info(
        {
          category: body.category,
          topic: body.topic,
          userId: user?.id,
          quality: body.quality,
        },
        "Generating lore",
      );

      const result = await contentGenService.generateLore({
        prompt: body.prompt,
        category: body.category,
        topic: body.topic,
        context: body.context,
        quality: body.quality,
        worldConfigId: body.worldConfigId,
        useActiveWorldConfig: body.useActiveWorldConfig,
      });

      // Save to database
      const lore = await contentDatabaseService.createLore({
        title: result.lore.title,
        category: result.lore.category,
        summary: result.lore.summary,
        data: result.lore,
        generationParams: {
          prompt: body.prompt,
          topic: body.topic,
          context: body.context,
          quality: body.quality,
          worldConfigId: body.worldConfigId,
        },
        tags: result.lore.relatedTopics || [],
        createdBy: user?.id,
        walletAddress: user?.walletAddress || undefined,
      });

      logger.info(
        { loreId: lore.id, title: result.lore.title },
        "Lore generated successfully",
      );

      // Log content creation
      if (user?.id) {
        await ActivityLogService.logContentCreated({
          userId: user.id,
          contentType: "lore",
          contentId: lore.id,
          title: result.lore.title,
        });
      }

      return { ...result, id: lore.id };
    },
    {
      body: Models.GenerateLoreRequest,
      response: Models.GenerateLoreResponse,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate game lore",
        description: "Generate rich lore content for world-building using AI.",
      },
    },
  )

  // POST /api/content/generate-npc-portrait
  .post(
    "/generate-npc-portrait",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Generating portrait for NPC",
      );

      // Fetch user's API keys with env fallback
      const userApiKeys = user?.id
        ? await getUserApiKeysWithFallback(user.id)
        : {
            aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
            meshyApiKey: process.env.MESHY_API_KEY,
          };

      // Check if AI Gateway key is configured
      if (!userApiKeys.aiGatewayApiKey && !process.env.OPENAI_API_KEY) {
        throw new InternalServerError(
          "AI Gateway API key not configured. Please add your API key in Settings → API Keys.",
        );
      }

      // Initialize AI service with user's API keys
      const imageServerBaseUrl =
        process.env.IMAGE_SERVER_URL ||
        (() => {
          if (process.env.NODE_ENV === "production") {
            throw new Error(
              "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
            );
          }
          return "http://localhost:8080";
        })();

      const aiService = new AICreationService({
        openai: {
          apiKey: process.env.OPENAI_API_KEY || "",
          aiGatewayApiKey: userApiKeys.aiGatewayApiKey,
          model: "gpt-image-1",
          imageServerBaseUrl,
        },
        meshy: {
          apiKey: userApiKeys.meshyApiKey || process.env.MESHY_API_KEY || "",
          baseUrl: "https://api.meshy.ai",
        },
      });

      // Build image prompt from NPC data
      const promptParts = [
        `Portrait of ${body.npcName}, a ${body.archetype}`,
        body.appearance,
        `Personality: ${body.personality}`,
        "Professional character portrait, detailed facial features, game character art style, head and shoulders view, square aspect ratio 1:1, centered composition optimized for circular display at 96x96 pixels",
      ];

      const imagePrompt = promptParts.join(". ");

      logger.info(
        { context: "ContentGeneration", imagePrompt },
        "Image prompt created",
      );

      // Generate image
      const imageResult = await aiService
        .getImageService()
        .generateImage(imagePrompt, "portrait", "realistic");

      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Portrait generated successfully",
      );

      return {
        success: true,
        imageUrl: imageResult.imageUrl,
        prompt: imageResult.prompt,
      };
    },
    {
      body: t.Object({
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        appearance: t.String({ minLength: 10, maxLength: 500 }),
        personality: t.String({ minLength: 10, maxLength: 500 }),
      }),
      response: t.Object({
        success: t.Boolean(),
        imageUrl: t.String(),
        prompt: t.String(),
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate NPC portrait",
        description:
          "Generate an AI portrait image for an NPC character based on their description",
      },
    },
  )

  // POST /api/content/generate-quest-banner
  .post(
    "/generate-quest-banner",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", questTitle: body.questTitle },
        "Generating banner for quest",
      );

      // Fetch user's API keys with env fallback
      const userApiKeys = user?.id
        ? await getUserApiKeysWithFallback(user.id)
        : {
            aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
            meshyApiKey: process.env.MESHY_API_KEY,
          };

      // Check if AI Gateway key is configured
      if (!userApiKeys.aiGatewayApiKey && !process.env.OPENAI_API_KEY) {
        throw new InternalServerError(
          "AI Gateway API key not configured. Please add your API key in Settings → API Keys.",
        );
      }

      // Initialize AI service with user's API keys
      const imageServerBaseUrl =
        process.env.IMAGE_SERVER_URL ||
        (() => {
          if (process.env.NODE_ENV === "production") {
            throw new Error(
              "IMAGE_SERVER_URL must be set in production for Meshy AI callbacks",
            );
          }
          return "http://localhost:8080";
        })();

      const aiService = new AICreationService({
        openai: {
          apiKey: process.env.OPENAI_API_KEY || "",
          aiGatewayApiKey: userApiKeys.aiGatewayApiKey,
          model: "gpt-image-1",
          imageServerBaseUrl,
        },
        meshy: {
          apiKey: userApiKeys.meshyApiKey || process.env.MESHY_API_KEY || "",
          baseUrl: "https://api.meshy.ai",
        },
      });

      // Build image prompt from quest data
      // Focus on visual requirements only - no game metadata like difficulty or questType
      const promptParts = [
        `Quest banner artwork for "${body.questTitle}"`,
        body.description,
        "Epic fantasy game quest banner, wide horizontal format, dramatic composition, game UI art style, cinematic lighting, important elements centered vertically",
      ];

      const imagePrompt = promptParts.join(". ");

      logger.info(
        { context: "ContentGeneration", imagePrompt },
        "Banner prompt created",
      );

      // Generate image
      const imageResult = await aiService
        .getImageService()
        .generateImage(imagePrompt, "banner", "fantasy");

      logger.info(
        { context: "ContentGeneration", questTitle: body.questTitle },
        "Banner generated successfully",
      );

      return {
        success: true,
        imageUrl: imageResult.imageUrl,
        prompt: imageResult.prompt,
      };
    },
    {
      body: t.Object({
        questTitle: t.String({ minLength: 1, maxLength: 200 }),
        description: t.String({ minLength: 10, maxLength: 1000 }),
        // questType and difficulty are optional - not used for image generation
        questType: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        difficulty: t.Optional(
          t.Union([
            t.Literal("easy"),
            t.Literal("medium"),
            t.Literal("hard"),
            t.Literal("expert"),
          ]),
        ),
      }),
      response: t.Object({
        success: t.Boolean(),
        imageUrl: t.String(),
        prompt: t.String(),
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate quest banner",
        description:
          "Generate an AI banner image for a quest based on visual requirements only",
      },
    },
  )

  // ========================
  // NPC Retrieval Endpoints
  // ========================

  // GET /api/content/npcs - List all NPCs
  .get(
    "/npcs",
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const offset = query.offset ? parseInt(query.offset) : 0;

      const npcs = await contentDatabaseService.listNPCs(limit, offset);
      return { success: true, npcs };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "List NPCs",
        description: "Retrieve list of generated NPCs from database",
      },
    },
  )

  // GET /api/content/npcs/:id - Get single NPC
  .get(
    "/npcs/:id",
    async ({ params }) => {
      const npc = await contentDatabaseService.getNPC(params.id);
      if (!npc) {
        throw new NotFoundError("NPC", params.id);
      }
      return { success: true, npc };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get NPC by ID",
        description: "Retrieve a single NPC by its database ID",
      },
    },
  )

  // PUT /api/content/npcs/:id
  .put(
    "/npcs/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getNPC(params.id);
      if (!existing) {
        throw new NotFoundError("NPC", params.id);
      }

      // Update the NPC
      const updated = await contentDatabaseService.updateNPC(params.id, {
        name: body.name,
        archetype: body.archetype,
        data: body.data,
        generationParams: body.generationParams,
        tags: body.tags,
        version: (existing.version || 1) + 1,
        parentId: body.createVersion ? existing.id : existing.parentId,
      });

      return { success: true, npc: updated };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        data: t.Record(t.String(), t.Unknown()), // NPC data structure - validated at runtime
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())), // NPC data structure - validated at runtime
        tags: t.Optional(
          t.Array(t.String({ minLength: 1, maxLength: 50 }), {
            maxItems: 20,
          }),
        ),
        createVersion: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Content Management"],
        summary: "Update NPC",
        description: "Update an NPC in the database with optional versioning",
      },
    },
  )

  // DELETE /api/content/npcs/:id (requires auth)
  .group("", (deleteApp) =>
    deleteApp.use(requireAuthGuard).delete(
      "/npcs/:id",
      async ({ params }) => {
        await contentDatabaseService.deleteNPC(params.id);
        return { success: true, message: "NPC deleted" };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["Content Management"],
          summary: "Delete NPC",
          description: "Delete an NPC from the database (requires auth)",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  )

  // ========================
  // Quest Retrieval Endpoints
  // ========================

  // GET /api/content/quests
  .get(
    "/quests",
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const offset = query.offset ? parseInt(query.offset) : 0;

      const quests = await contentDatabaseService.listQuests(limit, offset);
      return { success: true, quests };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "List Quests",
        description: "Retrieve list of generated quests",
      },
    },
  )

  // GET /api/content/quests/:id
  .get(
    "/quests/:id",
    async ({ params }) => {
      const quest = await contentDatabaseService.getQuest(params.id);
      if (!quest) {
        throw new NotFoundError("Quest", params.id);
      }
      return { success: true, quest };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Quest by ID",
        description: "Retrieve a single quest by its database ID",
      },
    },
  )

  // PUT /api/content/quests/:id - Update Quest
  .put(
    "/quests/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getQuest(params.id);
      if (!existing) {
        throw new NotFoundError("Quest", params.id);
      }

      // Permission check
      if (existing.createdBy !== user?.id && user?.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this quest",
        );
      }

      // Update the Quest
      const updated = await contentDatabaseService.updateQuest(params.id, {
        title: body.title,
        questType: body.questType,
        difficulty: body.difficulty,
        data: body.data,
        generationParams: body.generationParams,
        tags: body.tags,
        version: (existing.version || 1) + 1,
        parentId: body.createVersion ? existing.id : existing.parentId,
      });

      return { success: true, quest: updated };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        questType: t.Union([
          t.Literal("combat"),
          t.Literal("exploration"),
          t.Literal("fetch"),
          t.Literal("escort"),
          t.Literal("puzzle"),
          t.Literal("stealth"),
          t.Literal("diplomatic"),
          t.Literal("crafting"),
          t.Literal("mystery"),
          t.Literal("custom"),
        ]),
        difficulty: t.Union([
          t.Literal("easy"),
          t.Literal("medium"),
          t.Literal("hard"),
          t.Literal("expert"),
        ]),
        data: t.Record(t.String(), t.Unknown()), // Quest data structure - validated at runtime
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())), // Quest data structure - validated at runtime
        tags: t.Optional(
          t.Array(t.String({ minLength: 1, maxLength: 50 }), {
            maxItems: 20,
          }),
        ),
        createVersion: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Content Management"],
        summary: "Update Quest",
        description:
          "Update a quest with optional versioning. Set createVersion=true to create a new version linked to the original.",
      },
    },
  )

  // DELETE /api/content/quests/:id (requires auth)
  .group("", (deleteApp) =>
    deleteApp.use(requireAuthGuard).delete(
      "/quests/:id",
      async ({ user, params, request }) => {
        // Get quest details before deleting for logging
        const quest = await contentDatabaseService.getQuest(params.id);

        await contentDatabaseService.deleteQuest(params.id);

        // Log content deletion
        if (quest) {
          await ActivityLogService.logContentDeleted({
            userId: user!.id,
            contentType: "quest",
            contentId: params.id,
            title: quest.title,
            request,
          });
        }

        return { success: true, message: "Quest deleted" };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["Content Management"],
          summary: "Delete Quest",
          description: "Delete a quest from the database (requires auth)",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  )

  // ========================
  // Dialogue Retrieval Endpoints
  // ========================

  // GET /api/content/dialogues
  .get(
    "/dialogues",
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const offset = query.offset ? parseInt(query.offset) : 0;

      const dialogues = await contentDatabaseService.listDialogues(
        limit,
        offset,
      );
      return { success: true, dialogues };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "List Dialogues",
        description: "Retrieve list of generated dialogues",
      },
    },
  )

  // GET /api/content/dialogues/:id
  .get(
    "/dialogues/:id",
    async ({ params }) => {
      const dialogue = await contentDatabaseService.getDialogue(params.id);
      if (!dialogue) {
        throw new NotFoundError("Dialogue", params.id);
      }
      return { success: true, dialogue };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Dialogue by ID",
        description: "Retrieve a single dialogue by its database ID",
      },
    },
  )

  // PUT /api/content/dialogues/:id - Update Dialogue
  .put(
    "/dialogues/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getDialogue(params.id);
      if (!existing) {
        throw new NotFoundError("Dialogue", params.id);
      }

      // Permission check
      if (existing.createdBy !== user?.id && user?.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this dialogue",
        );
      }

      // Update the Dialogue
      const updated = await contentDatabaseService.updateDialogue(params.id, {
        npcName: body.npcName,
        context: body.context,
        nodes: body.nodes,
        generationParams: body.generationParams,
        version: (existing.version || 1) + 1,
        parentId: body.createVersion ? existing.id : existing.parentId,
      });

      return { success: true, dialogue: updated };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        context: t.Optional(t.String({ maxLength: 5000 })),
        nodes: t.Array(t.Unknown()), // Dialogue nodes array - structure validated at runtime
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())), // Dialogue nodes array - structure validated at runtime
        createVersion: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Content Management"],
        summary: "Update Dialogue",
        description:
          "Update a dialogue with optional versioning. Set createVersion=true to create a new version linked to the original.",
      },
    },
  )

  // DELETE /api/content/dialogues/:id (requires auth)
  .group("", (deleteApp) =>
    deleteApp.use(requireAuthGuard).delete(
      "/dialogues/:id",
      async ({ params }) => {
        await contentDatabaseService.deleteDialogue(params.id);
        return { success: true, message: "Dialogue deleted" };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["Content Management"],
          summary: "Delete Dialogue",
          description: "Delete a dialogue from the database (requires auth)",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  )

  // ========================
  // Lore Retrieval Endpoints
  // ========================

  // GET /api/content/lores
  .get(
    "/lores",
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const offset = query.offset ? parseInt(query.offset) : 0;

      const lores = await contentDatabaseService.listLores(limit, offset);
      return { success: true, lores };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "List Lores",
        description: "Retrieve list of generated lore content",
      },
    },
  )

  // GET /api/content/lores/:id
  .get(
    "/lores/:id",
    async ({ params }) => {
      const lore = await contentDatabaseService.getLore(params.id);
      if (!lore) {
        throw new NotFoundError("Lore", params.id);
      }
      return { success: true, lore };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Lore by ID",
        description: "Retrieve a single lore entry by its database ID",
      },
    },
  )

  // PUT /api/content/lores/:id - Update Lore
  .put(
    "/lores/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getLore(params.id);
      if (!existing) {
        throw new NotFoundError("Lore", params.id);
      }

      // Permission check
      if (existing.createdBy !== user?.id && user?.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this lore",
        );
      }

      // Update the Lore
      const updated = await contentDatabaseService.updateLore(params.id, {
        title: body.title,
        category: body.category,
        summary: body.summary,
        data: body.data,
        generationParams: body.generationParams,
        tags: body.tags,
        version: (existing.version || 1) + 1,
        parentId: body.createVersion ? existing.id : existing.parentId,
      });

      return { success: true, lore: updated };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        category: t.Union([
          t.Literal("history"),
          t.Literal("mythology"),
          t.Literal("religion"),
          t.Literal("politics"),
          t.Literal("geography"),
          t.Literal("culture"),
          t.Literal("magic"),
          t.Literal("technology"),
          t.Literal("creatures"),
          t.Literal("legends"),
          t.Literal("custom"),
        ]),
        summary: t.Optional(t.String({ maxLength: 500 })),
        data: t.Record(t.String(), t.Unknown()), // Lore data structure - validated at runtime
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())), // Lore data structure - validated at runtime
        tags: t.Optional(
          t.Array(t.String({ minLength: 1, maxLength: 50 }), {
            maxItems: 20,
          }),
        ),
        createVersion: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Content Management"],
        summary: "Update Lore",
        description:
          "Update a lore entry with optional versioning. Set createVersion=true to create a new version linked to the original.",
      },
    },
  )

  // DELETE /api/content/lores/:id (requires auth)
  .group("", (deleteApp) =>
    deleteApp.use(requireAuthGuard).delete(
      "/lores/:id",
      async ({ user, params, request }) => {
        // Get lore details before deleting for logging
        const lore = await contentDatabaseService.getLore(params.id);

        await contentDatabaseService.deleteLore(params.id);

        // Log content deletion
        if (lore) {
          await ActivityLogService.logContentDeleted({
            userId: user!.id,
            contentType: "lore",
            contentId: params.id,
            title: lore.title,
            request,
          });
        }

        return { success: true, message: "Lore deleted" };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["Content Management"],
          summary: "Delete Lore",
          description: "Delete a lore entry from the database (requires auth)",
          security: [{ BearerAuth: [] }],
        },
      },
    ),
  )

  // ========================
  // Media Asset Endpoints
  // ========================

  // POST /api/content/media/save-portrait
  .post(
    "/media/save-portrait",
    async ({ body, user }) => {
      const mediaType = body.type || "portrait";
      logger.info(
        {
          context: "Media",
          mediaType,
          entityType: body.entityType,
          entityId: body.entityId,
        },
        "Saving media",
      );

      // Decode base64 image data
      const imageData = Buffer.from(body.imageData, "base64");

      // Generate filename based on type
      const fileName = `${mediaType}_${Date.now()}.png`;

      // Save media file and create database record
      const result = await mediaStorageService.saveMedia({
        type: mediaType as
          | "portrait"
          | "banner"
          | "voice"
          | "music"
          | "sound_effect",
        entityType: body.entityType as
          | "npc"
          | "quest"
          | "lore"
          | "location"
          | "world"
          | "dialogue",
        entityId: body.entityId,
        fileName,
        data: imageData,
        metadata: {
          prompt: body.prompt,
          model: body.model || "dall-e-3",
          mimeType: "image/png",
        },
        createdBy: body.createdBy || user?.id,
      });

      // Create relationship between media and entity
      await relationshipService.createRelationship({
        sourceType: body.entityType as any, // Use the actual entity type (npc, quest, etc.)
        sourceId: body.entityId,
        targetType: body.entityType as any, // Media relationship
        targetId: result.id,
        relationshipType: "related_to" as any,
        strength: "strong",
        metadata: { mediaType: mediaType },
        createdBy: body.createdBy || user?.id,
      });

      logger.info(
        { context: "Media", cdnUrl: result.cdnUrl },
        "Portrait saved successfully",
      );

      return {
        success: true,
        mediaId: result.id,
        fileUrl: result.cdnUrl,
      };
    },
    {
      body: t.Object({
        entityType: t.Union([
          t.Literal("npc"),
          t.Literal("quest"),
          t.Literal("lore"),
          t.Literal("location"),
          t.Literal("world"),
          t.Literal("dialogue"),
        ]),
        entityId: t.String({ minLength: 1, maxLength: 255 }),
        imageData: t.String({ minLength: 100 }), // base64 encoded - minimum realistic size
        type: t.Optional(t.Union([t.Literal("portrait"), t.Literal("banner")])), // "portrait" | "banner" | etc.
        prompt: t.Optional(t.String({ maxLength: 2000 })),
        model: t.Optional(t.String({ maxLength: 100 })),
        createdBy: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Save portrait image",
        description:
          "Save a generated portrait image to persistent storage and link it to an entity",
      },
    },
  )

  // POST /api/content/media/save-voice
  .post(
    "/media/save-voice",
    async ({ body, user }) => {
      logger.info(
        {
          context: "Media",
          entityType: body.entityType,
          entityId: body.entityId,
        },
        "Saving voice",
      );

      // Decode base64 audio data
      const audioData = Buffer.from(body.audioData, "base64");

      // Generate filename
      const fileName = `voice_${Date.now()}.mp3`;

      // Save media file and create database record
      const result = await mediaStorageService.saveMedia({
        type: "voice",
        entityType: body.entityType as
          | "npc"
          | "quest"
          | "lore"
          | "location"
          | "world"
          | "dialogue",
        entityId: body.entityId,
        fileName,
        data: audioData,
        metadata: {
          voiceId: body.voiceId,
          voiceSettings: body.voiceSettings,
          text: body.text,
          duration: body.duration,
          mimeType: "audio/mpeg",
        },
        createdBy: body.createdBy || user?.id,
      });

      // Create relationship between media and entity
      await relationshipService.createRelationship({
        sourceType: "npc",
        sourceId: body.entityId,
        targetType: "npc" as any,
        targetId: result.id,
        relationshipType: "related_to" as any,
        strength: "strong",
        metadata: { mediaType: "voice" },
        createdBy: body.createdBy || user?.id,
      });

      logger.info(
        { context: "Media", cdnUrl: result.cdnUrl },
        "Voice saved successfully",
      );

      return {
        success: true,
        mediaId: result.id,
        fileUrl: result.cdnUrl,
      };
    },
    {
      body: t.Object({
        entityType: t.Union([
          t.Literal("npc"),
          t.Literal("quest"),
          t.Literal("lore"),
          t.Literal("location"),
          t.Literal("world"),
          t.Literal("dialogue"),
        ]),
        entityId: t.String({ minLength: 1, maxLength: 255 }),
        audioData: t.String({ minLength: 100 }), // base64 encoded - minimum realistic size
        voiceId: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        voiceSettings: t.Optional(t.Record(t.String(), t.Unknown())), // ElevenLabs voice settings - dynamic configuration
        text: t.Optional(t.String({ maxLength: 5000 })),
        duration: t.Optional(t.Number({ minimum: 0, maximum: 600 })), // Max 10 minutes
        createdBy: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Save voice audio",
        description:
          "Save a generated voice audio file to persistent storage and link it to an entity",
      },
    },
  )

  // GET /api/content/media/:entityType/:entityId
  .get(
    "/media/:entityType/:entityId",
    async ({ params }) => {
      logger.info(
        {
          context: "Media",
          entityType: params.entityType,
          entityId: params.entityId,
        },
        "Fetching media",
      );

      const media = await mediaStorageService.getMediaForEntity(
        params.entityType,
        params.entityId,
      );

      return {
        success: true,
        media,
      };
    },
    {
      params: t.Object({
        entityType: t.String(),
        entityId: t.String(),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Get entity media",
        description:
          "Retrieve all media assets (portraits, voices, etc.) for a specific entity",
      },
    },
  )

  // ========================
  // Linked Content Generation
  // ========================

  // POST /api/content/generate-quest-for-npc
  .post(
    "/generate-quest-for-npc",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Generating quest for NPC",
      );

      // Generate quest with NPC context
      const result = await contentGenService.generateQuest({
        questType: body.questType,
        difficulty: body.difficulty,
        theme: body.theme,
        context: `This quest is given by ${body.npcName}, a ${body.archetype}. ${body.personality ? `Personality: ${body.personality}` : ""}`,
        quality: body.quality,
      });

      // Save to database
      const quest = await contentDatabaseService.createQuest({
        title: result.quest.title,
        questType: result.quest.questType,
        difficulty: result.quest.difficulty,
        data: result.quest,
        generationParams: {
          npcId: body.npcId,
          npcName: body.npcName,
          archetype: body.archetype,
          personality: body.personality,
          theme: body.theme,
          quality: body.quality,
        },
        tags: [body.questType, body.difficulty, body.npcName],
        createdBy: body.createdBy || user?.id,
        walletAddress: user?.walletAddress || undefined,
      });

      // Create relationship: NPC gives quest
      const relationship = await relationshipService.createRelationship({
        sourceType: "npc",
        sourceId: body.npcId,
        targetType: "quest",
        targetId: quest.id,
        relationshipType: "gives_quest",
        strength: "strong",
        metadata: {
          questGiver: body.npcName,
        },
        createdBy: body.createdBy || user?.id,
      });

      logger.info(
        { context: "ContentGeneration", questId: quest.id },
        "Quest generated and linked to NPC",
      );

      return {
        success: true,
        quest: { ...result.quest, id: quest.id },
        questId: quest.id,
        relationship,
      };
    },
    {
      body: t.Object({
        npcId: t.String({ minLength: 1, maxLength: 255 }),
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        personality: t.Optional(t.String({ maxLength: 500 })),
        questType: t.Union([
          t.Literal("combat"),
          t.Literal("exploration"),
          t.Literal("fetch"),
          t.Literal("escort"),
          t.Literal("puzzle"),
          t.Literal("stealth"),
          t.Literal("diplomatic"),
          t.Literal("crafting"),
          t.Literal("mystery"),
          t.Literal("custom"),
        ]),
        difficulty: t.Union([
          t.Literal("easy"),
          t.Literal("medium"),
          t.Literal("hard"),
          t.Literal("expert"),
        ]),
        theme: t.Optional(t.String({ maxLength: 200 })),
        quality: t.Optional(
          t.Union([
            t.Literal("quality"),
            t.Literal("speed"),
            t.Literal("balanced"),
          ]),
        ),
        createdBy: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate quest for NPC",
        description:
          "Generate a quest given by a specific NPC, automatically creating the relationship",
      },
    },
  )

  // POST /api/content/generate-lore-for-npc
  .post(
    "/generate-lore-for-npc",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Generating lore for NPC",
      );

      // Generate lore that mentions the NPC
      const result = await contentGenService.generateLore({
        category: body.category,
        topic: body.topic,
        context: `This lore should feature or mention ${body.npcName}, a ${body.archetype}. ${body.additionalContext || ""}`,
        quality: body.quality,
      });

      // Save to database with NPC mentioned in characters
      const lore = await contentDatabaseService.createLore({
        title: result.lore.title,
        category: result.lore.category,
        summary: result.lore.summary,
        data: {
          ...result.lore,
          characters: [body.npcName, ...(result.lore.characters || [])],
        },
        generationParams: {
          npcId: body.npcId,
          npcName: body.npcName,
          topic: body.topic,
          context: body.additionalContext,
          quality: body.quality,
        },
        tags: [
          body.category,
          body.npcName,
          ...(result.lore.relatedTopics || []),
        ],
        createdBy: body.createdBy || user?.id,
        walletAddress: user?.walletAddress || undefined,
      });

      // Create relationship: Lore mentions NPC
      const relationship = await relationshipService.createRelationship({
        sourceType: "lore",
        sourceId: lore.id,
        targetType: "npc",
        targetId: body.npcId,
        relationshipType: "mentions",
        strength: "medium",
        metadata: {
          character: body.npcName,
        },
        createdBy: body.createdBy || user?.id,
      });

      logger.info(
        { context: "ContentGeneration", loreId: lore.id },
        "Lore generated and linked to NPC",
      );

      return {
        success: true,
        lore: { ...result.lore, id: lore.id },
        loreId: lore.id,
        relationship,
      };
    },
    {
      body: t.Object({
        npcId: t.String({ minLength: 1, maxLength: 255 }),
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        category: t.Union([
          t.Literal("history"),
          t.Literal("mythology"),
          t.Literal("religion"),
          t.Literal("politics"),
          t.Literal("geography"),
          t.Literal("culture"),
          t.Literal("magic"),
          t.Literal("technology"),
          t.Literal("creatures"),
          t.Literal("legends"),
          t.Literal("custom"),
        ]),
        topic: t.String({ minLength: 1, maxLength: 200 }),
        additionalContext: t.Optional(t.String({ maxLength: 5000 })),
        quality: t.Optional(
          t.Union([
            t.Literal("quality"),
            t.Literal("speed"),
            t.Literal("balanced"),
          ]),
        ),
        createdBy: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate lore for NPC",
        description:
          "Generate lore that features/mentions a specific NPC, automatically creating the relationship",
      },
    },
  )

  // ========================
  // World Generation
  // ========================

  // POST /api/content/generate-world
  .post(
    "/generate-world",
    async ({ body }) => {
      logger.info(
        {
          context: "ContentGeneration",
          complexity: body.complexity || "medium",
          theme: body.theme || "fantasy",
        },
        "Generating world",
      );

      const result = await contentGenService.generateWorld({
        theme: body.theme,
        complexity: body.complexity,
        customPrompt: body.customPrompt,
        quality: body.quality,
        worldConfigId: body.worldConfigId,
        useActiveWorldConfig: body.useActiveWorldConfig,
      });

      logger.info(
        {
          context: "ContentGeneration",
          worldName: result.world.worldName,
        },
        "Successfully generated world",
      );

      return {
        success: true,
        world: result.world,
        rawResponse: result.rawResponse,
      };
    },
    {
      body: Models.GenerateWorldRequest,
      response: Models.GenerateWorldResponse,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate complete game world",
        description:
          "Generate a complete, cohesive game world with interconnected NPCs, assets, locations, and lore using AI.",
      },
    },
  );
