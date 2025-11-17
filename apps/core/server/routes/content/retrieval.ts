/**
 * Content Retrieval Routes
 * GET endpoints for listing and fetching NPCs, quests, dialogues, and lore
 * ALL routes require authentication
 */

import {
  Elysia,
  t,
  requireAuthGuard,
  logger,
  contentDatabaseService,
  NotFoundError,
  authHeaders,
} from "./shared";

export const retrievalRoutes = new Elysia()
  .use(requireAuthGuard)

  // ==================== NPCs ====================
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
        description:
          "Retrieve list of generated NPCs. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    "/npcs/:id",
    async ({ params }) => {
      const npc = await contentDatabaseService.getNPC(params.id);
      if (!npc) throw new NotFoundError("NPC", params.id);
      return { success: true, npc };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get NPC by ID",
        description: "Retrieve a single NPC. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Quests ====================
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
        description:
          "Retrieve list of generated quests. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    "/quests/:id",
    async ({ params }) => {
      const quest = await contentDatabaseService.getQuest(params.id);
      if (!quest) throw new NotFoundError("Quest", params.id);
      return { success: true, quest };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Quest by ID",
        description: "Retrieve a single quest. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Dialogues ====================
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
        description:
          "Retrieve list of generated dialogues. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    "/dialogues/:id",
    async ({ params }) => {
      const dialogue = await contentDatabaseService.getDialogue(params.id);
      if (!dialogue) throw new NotFoundError("Dialogue", params.id);
      return { success: true, dialogue };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Dialogue by ID",
        description: "Retrieve a single dialogue. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // ==================== Lores ====================
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
        description:
          "Retrieve list of generated lore. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )
  .get(
    "/lores/:id",
    async ({ params }) => {
      const lore = await contentDatabaseService.getLore(params.id);
      if (!lore) throw new NotFoundError("Lore", params.id);
      return { success: true, lore };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Content Retrieval"],
        summary: "Get Lore by ID",
        description: "Retrieve a single lore entry. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
