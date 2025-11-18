/**
 * Media Asset Routes
 * Portrait/banner generation and media saving
 * ALL routes require authentication
 */

import {
  Elysia,
  t,
  requireAuthGuard,
  logger,
  mediaStorageService,
  relationshipService,
  getUserApiKeysWithFallback,
  AICreationService,
  InternalServerError,
  authHeaders,
} from "./shared";

export const mediaRoutes = new Elysia()
  .use(requireAuthGuard)

  // POST /api/content/generate-npc-portrait
  .post(
    "/generate-npc-portrait",
    async ({ body, user }) => {
      logger.info(
        { context: "ContentGeneration", npcName: body.npcName },
        "Generating portrait for NPC",
      );

      const userApiKeys = await getUserApiKeysWithFallback(user.id);

      if (!userApiKeys.aiGatewayApiKey && !process.env.OPENAI_API_KEY) {
        throw new InternalServerError(
          "AI Gateway API key not configured. Please add your API key in Settings → API Keys.",
        );
      }

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

      const promptParts = [
        `Portrait of ${body.npcName}, a ${body.archetype}`,
        body.appearance,
        `Personality: ${body.personality}`,
        "Professional character portrait, detailed facial features, game character art style, head and shoulders view, square aspect ratio 1:1, centered composition optimized for circular display at 96x96 pixels",
      ];

      const imagePrompt = promptParts.join(". ");
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
        tags: ["Media Assets"],
        summary: "Generate NPC portrait",
        description:
          "Generate an AI portrait image for an NPC. Requires authentication.",
        security: [{ BearerAuth: [] }],
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

      const userApiKeys = await getUserApiKeysWithFallback(user.id);

      if (!userApiKeys.aiGatewayApiKey && !process.env.OPENAI_API_KEY) {
        throw new InternalServerError(
          "AI Gateway API key not configured. Please add your API key in Settings → API Keys.",
        );
      }

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

      const promptParts = [
        `Quest banner artwork for "${body.questTitle}"`,
        body.description,
        "Epic fantasy game quest banner, wide horizontal format, dramatic composition, game UI art style, cinematic lighting, important elements centered vertically",
      ];

      const imagePrompt = promptParts.join(". ");
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
        tags: ["Media Assets"],
        summary: "Generate quest banner",
        description:
          "Generate an AI banner image for a quest. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // POST /api/content/media/save-portrait
  .post(
    "/media/save-portrait",
    async ({ body, user }) => {
      try {
        // Accept either imageUrl (for generated images) or imageData (for uploads)
        let imageData: Buffer;

        if (body.imageUrl) {
          // Check if it's a data URL (base64-encoded image)
          if (body.imageUrl.startsWith("data:")) {
            logger.info(
              { imageUrlPrefix: body.imageUrl.substring(0, 50) + "..." },
              "Extracting base64 data from data URL for portrait save",
            );
            // Data URL format: data:image/png;base64,<base64data>
            // Extract the base64 portion after the comma
            const base64Data = body.imageUrl.split(",")[1];
            if (!base64Data) {
              throw new Error("Invalid data URL format - missing base64 data");
            }
            imageData = Buffer.from(base64Data, "base64");
          } else {
            // HTTP/HTTPS URL - fetch from remote server
            logger.info(
              { imageUrl: body.imageUrl },
              "Fetching image from HTTP URL for portrait save",
            );
            const response = await fetch(body.imageUrl);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch image from URL: ${response.statusText}`,
              );
            }
            const arrayBuffer = await response.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
          }
        } else if (body.imageData) {
          // Use base64 image data directly
          imageData = Buffer.from(body.imageData, "base64");
        } else {
          throw new InternalServerError(
            "Either imageUrl or imageData must be provided",
          );
        }

        const mediaType = body.type || "portrait";
        const fileName = `${mediaType}_${Date.now()}.png`;

        // Save to CDN with error handling
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
          createdBy: user.id,
        });

        // Media assets are linked via entityType/entityId - no relationship needed

        return {
          success: true,
          mediaId: result.id,
          fileUrl: result.cdnUrl, // Match frontend expectation
        };
      } catch (error) {
        logger.error(
          {
            err: error,
            entityType: body.entityType,
            entityId: body.entityId,
          },
          "Failed to save portrait",
        );

        // Provide specific error messages
        if (error instanceof Error) {
          if (error.message.includes("CDN")) {
            throw new InternalServerError(
              "Failed to upload image to CDN. Please try again.",
            );
          }
          if (error.message.includes("database")) {
            throw new InternalServerError(
              "Failed to save media record. Please try again.",
            );
          }
        }

        throw new InternalServerError(
          "Failed to save portrait. Please try again.",
        );
      }
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
        imageUrl: t.Optional(t.String({ minLength: 1, maxLength: 5000 })),
        imageData: t.Optional(t.String({ minLength: 1 })),
        type: t.Optional(t.Union([t.Literal("portrait"), t.Literal("banner")])),
        prompt: t.Optional(t.String({ maxLength: 2000 })),
        model: t.Optional(t.String({ maxLength: 100 })),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Save portrait image",
        description:
          "Save a generated portrait image to persistent storage. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // POST /api/content/media/save-voice
  .post(
    "/media/save-voice",
    async ({ body, user }) => {
      try {
        // Validate base64 audio data
        if (!body.audioData || body.audioData.length < 100) {
          throw new InternalServerError("Invalid or missing audio data");
        }

        const audioData = Buffer.from(body.audioData, "base64");
        const fileName = `voice_${Date.now()}.mp3`;

        // Save to CDN with error handling
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
            duration: body.duration,
            mimeType: "audio/mpeg",
          },
          createdBy: user.id,
        });

        // Media assets are linked via entityType/entityId - no relationship needed

        return {
          success: true,
          mediaId: result.id,
          fileUrl: result.cdnUrl, // Match frontend expectation
        };
      } catch (error) {
        logger.error(
          {
            err: error,
            entityType: body.entityType,
            entityId: body.entityId,
          },
          "Failed to save voice",
        );

        // Provide specific error messages
        if (error instanceof Error) {
          if (error.message.includes("CDN")) {
            throw new InternalServerError(
              "Failed to upload audio to CDN. Please try again.",
            );
          }
          if (error.message.includes("database")) {
            throw new InternalServerError(
              "Failed to save media record. Please try again.",
            );
          }
        }

        throw new InternalServerError(
          "Failed to save voice audio. Please try again.",
        );
      }
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
        audioData: t.String({ minLength: 100 }),
        voiceId: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        voiceSettings: t.Optional(t.Record(t.String(), t.Unknown())),
        text: t.Optional(t.String({ maxLength: 5000 })),
        duration: t.Optional(t.Number({ minimum: 0, maximum: 600 })),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Save voice audio",
        description:
          "Save a generated voice audio file to persistent storage. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  // GET /api/content/media/:entityType/:entityId
  .get(
    "/media/:entityType/:entityId",
    async ({ params }) => {
      try {
        const media = await mediaStorageService.getMediaForEntity(
          params.entityType,
          params.entityId,
        );

        // Transform cdnUrl to fileUrl for frontend compatibility
        const transformedMedia = media.map((asset) => ({
          ...asset,
          fileUrl: asset.cdnUrl, // Add fileUrl field
        }));

        return { success: true, media: transformedMedia };
      } catch (error) {
        logger.error(
          {
            err: error,
            entityType: params.entityType,
            entityId: params.entityId,
          },
          "Failed to fetch media for entity",
        );
        throw new InternalServerError("Failed to retrieve media assets");
      }
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
          "Retrieve all media assets for an entity. Requires authentication.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
