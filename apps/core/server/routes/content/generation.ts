/**
 * Content Generation Routes
 * AI-powered generation for NPCs, quests, dialogue, and lore
 * ALL routes require authentication
 */

import * as Models from "../../models";
import {
  Elysia,
  t,
  authPlugin,
  logger,
  contentGenService,
  contentDatabaseService,
  ActivityLogService,
  authHeaders,
} from "./shared";

export const generationRoutes = new Elysia()
  .use(authPlugin)
  .onBeforeHandle(({ request }) => {
    const url = new URL(request.url);
    logger.debug(
      { method: request.method, path: url.pathname },
      "Content generation request",
    );
  })

  // POST /api/content/generate-dialogue
  .post(
    "/generate-dialogue",
    async ({ body, user }) => {
      logger.info(
        {
          npcName: body.npcName,
          userId: user?.id || "anonymous",
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
        createdBy: user?.id || "anonymous",
        walletAddress: user?.walletAddress || null || undefined,
      });

      logger.info(
        { dialogueId: dialogue.id, npcName: body.npcName },
        "Dialogue generated successfully",
      );
      return { ...result, id: dialogue.id };
    },
    {
      body: Models.GenerateDialogueRequest,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate NPC dialogue",
        description:
          "Generate dialogue tree nodes for an NPC using AI. Supports existing dialogue context. Requires authentication.",
        security: [{ BearerAuth: [] }],
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
            userId: user?.id || "anonymous",
            quality: body.quality,
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
          tags: [],
          createdBy: user?.id || "anonymous",
          walletAddress: user?.walletAddress || null || undefined,
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
            userId: user?.id || "anonymous",
          },
          "Failed to generate NPC",
        );
        throw error;
      }
    },
    {
      body: Models.GenerateNPCRequest,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate complete NPC",
        description:
          "Generate a complete NPC character with personality, dialogue, and behavior using AI. Requires authentication.",
        security: [{ BearerAuth: [] }],
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
          userId: user?.id || "anonymous",
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
        tags: [],
        createdBy: user?.id || "anonymous",
        walletAddress: user?.walletAddress || null || undefined,
      });

      logger.info(
        { questId: quest.id, title: result.quest.title },
        "Quest generated successfully",
      );

      // Log content creation
      await ActivityLogService.logContentCreated({
        userId: user?.id ?? null,
        contentType: "quest",
        contentId: quest.id,
        title: result.quest.title,
      });

      return { ...result, id: quest.id };
    },
    {
      body: Models.GenerateQuestRequest,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate game quest",
        description:
          "Generate a complete quest with objectives, rewards, and narrative using AI. Requires authentication.",
        security: [{ BearerAuth: [] }],
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
          userId: user?.id || "anonymous",
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
        createdBy: user?.id || "anonymous",
        walletAddress: user?.walletAddress || null || undefined,
      });

      logger.info(
        { loreId: lore.id, title: result.lore.title },
        "Lore generated successfully",
      );

      // Log content creation
      await ActivityLogService.logContentCreated({
        userId: user?.id ?? null,
        contentType: "lore",
        contentId: lore.id,
        title: result.lore.title,
      });

      return { ...result, id: lore.id };
    },
    {
      body: Models.GenerateLoreRequest,
      detail: {
        tags: ["Content Generation"],
        summary: "Generate game lore",
        description:
          "Generate rich lore content for world-building using AI. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
