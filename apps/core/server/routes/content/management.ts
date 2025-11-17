/**
 * Content Management Routes
 * PUT/DELETE endpoints for NPCs, quests, dialogues, and lore
 * ALL routes require authentication
 */

import {
  Elysia,
  t,
  requireAuthGuard,
  logger,
  contentDatabaseService,
  ActivityLogService,
  NotFoundError,
  ForbiddenError,
  authHeaders,
} from "./shared";

export const managementRoutes = new Elysia()
  .use(requireAuthGuard)

  // ==================== NPC Management ====================
  .put(
    "/npcs/:id",
    async ({ params, body }) => {
      const existing = await contentDatabaseService.getNPC(params.id);
      if (!existing) throw new NotFoundError("NPC", params.id);

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
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        data: t.Record(t.String(), t.Unknown()),
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())),
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
        description:
          "Update an NPC with optional versioning. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .delete(
    "/npcs/:id",
    async ({ params }) => {
      await contentDatabaseService.deleteNPC(params.id);
      return { success: true, message: "NPC deleted" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Management"],
        summary: "Delete NPC",
        description: "Delete an NPC. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Quest Management ====================
  .put(
    "/quests/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getQuest(params.id);
      if (!existing) throw new NotFoundError("Quest", params.id);

      if (existing.createdBy !== user.id && user.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this quest",
        );
      }

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
      params: t.Object({ id: t.String() }),
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
        data: t.Record(t.String(), t.Unknown()),
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())),
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
          "Update a quest with optional versioning. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .delete(
    "/quests/:id",
    async ({ user, params, request }) => {
      const quest = await contentDatabaseService.getQuest(params.id);
      await contentDatabaseService.deleteQuest(params.id);

      if (quest) {
        await ActivityLogService.logContentDeleted({
          userId: user.id,
          contentType: "quest",
          contentId: params.id,
          title: quest.title,
          request,
        });
      }

      return { success: true, message: "Quest deleted" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Management"],
        summary: "Delete Quest",
        description: "Delete a quest. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Dialogue Management ====================
  .put(
    "/dialogues/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getDialogue(params.id);
      if (!existing) throw new NotFoundError("Dialogue", params.id);

      if (existing.createdBy !== user.id && user.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this dialogue",
        );
      }

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
      params: t.Object({ id: t.String() }),
      body: t.Object({
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        context: t.Optional(t.String({ maxLength: 5000 })),
        nodes: t.Array(t.Unknown()),
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())),
        createVersion: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Content Management"],
        summary: "Update Dialogue",
        description:
          "Update a dialogue with optional versioning. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .delete(
    "/dialogues/:id",
    async ({ params }) => {
      await contentDatabaseService.deleteDialogue(params.id);
      return { success: true, message: "Dialogue deleted" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Management"],
        summary: "Delete Dialogue",
        description: "Delete a dialogue. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Lore Management ====================
  .put(
    "/lores/:id",
    async ({ params, body, user }) => {
      const existing = await contentDatabaseService.getLore(params.id);
      if (!existing) throw new NotFoundError("Lore", params.id);

      if (existing.createdBy !== user.id && user.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to edit this lore",
        );
      }

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
      params: t.Object({ id: t.String() }),
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
        data: t.Record(t.String(), t.Unknown()),
        generationParams: t.Optional(t.Record(t.String(), t.Unknown())),
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
          "Update a lore entry with optional versioning. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .delete(
    "/lores/:id",
    async ({ user, params, request }) => {
      const lore = await contentDatabaseService.getLore(params.id);
      await contentDatabaseService.deleteLore(params.id);

      if (lore) {
        await ActivityLogService.logContentDeleted({
          userId: user.id,
          contentType: "lore",
          contentId: params.id,
          title: lore.title,
          request,
        });
      }

      return { success: true, message: "Lore deleted" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Management"],
        summary: "Delete Lore",
        description: "Delete a lore entry. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
