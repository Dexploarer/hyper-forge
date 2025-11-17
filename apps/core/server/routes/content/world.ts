/**
 * World Generation Routes
 * Generate complete game worlds with interconnected NPCs, quests, and lore
 * ALL routes require authentication
 */

import * as Models from "../../models";
import {
  Elysia,
  requireAuthGuard,
  logger,
  contentGenService,
  authHeaders,
} from "./shared";

export const worldRoutes = new Elysia()
  .use(requireAuthGuard)

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
          "Generate a complete, cohesive game world with interconnected NPCs, assets, locations, and lore using AI. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
