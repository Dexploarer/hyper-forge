/**
 * Relationship Routes
 * Generate linked content (quest-for-npc, lore-for-npc)
 * ALL routes require authentication
 */

import {
  Elysia,
  t,
  requireAuthGuard,
  logger,
  contentGenService,
  contentDatabaseService,
  relationshipService,
  authHeaders,
} from "./shared";

export const relationshipRoutes = new Elysia()
  .use(authPlugin)

  // POST /api/content/generate-quest-for-npc
  .post(
    "/generate-quest-for-npc",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Generating quest for NPC",
      );

      const result = await contentGenService.generateQuest({
        questType: body.questType,
        difficulty: body.difficulty,
        theme: body.theme,
        context: `This quest is given by ${body.npcName}, a ${body.archetype}. ${body.personality ? `Personality: ${body.personality}` : ""}`,
        quality: body.quality,
      });

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
        createdBy: user.id,
        walletAddress: user.walletAddress || undefined,
      });

      const relationship = await relationshipService.createRelationship({
        sourceType: "npc",
        sourceId: body.npcId,
        targetType: "quest",
        targetId: quest.id,
        relationshipType: "gives_quest",
        strength: "strong",
        metadata: { questGiver: body.npcName },
        createdBy: user.id,
      });

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
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate quest for NPC",
        description:
          "Generate a quest given by a specific NPC, automatically creating the relationship. Requires authentication.",
        security: [{ BearerAuth: [] }],
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

      const result = await contentGenService.generateLore({
        category: body.category,
        topic: body.topic,
        context: `This lore should feature or mention ${body.npcName}, a ${body.archetype}. ${body.additionalContext || ""}`,
        quality: body.quality,
      });

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
        createdBy: user.id,
        walletAddress: user.walletAddress || undefined,
      });

      const relationship = await relationshipService.createRelationship({
        sourceType: "lore",
        sourceId: lore.id,
        targetType: "npc",
        targetId: body.npcId,
        relationshipType: "mentions",
        strength: "medium",
        metadata: { character: body.npcName },
        createdBy: user.id,
      });

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
      }),
      detail: {
        tags: ["Content Generation"],
        summary: "Generate lore for NPC",
        description:
          "Generate lore that features/mentions a specific NPC, automatically creating the relationship. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
