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
  // GET /api/media/{type}/{entityType}/{entityId}/{fileName} - Serve files from volume
  .get(
    "/media/*",
    async ({ params }) => {
      const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/gdd-assets";
      const requestPath = (params as any)["*"] as string;
      const filePath = `${volumePath}/${requestPath}`;

      try {
        const file = Bun.file(filePath);
        const exists = await file.exists();

        if (!exists) {
          return new Response("File not found", { status: 404 });
        }

        return new Response(file);
      } catch (error) {
        logger.error({ error, filePath }, "Failed to serve file from volume");
        return new Response("Internal Server Error", { status: 500 });
      }
    },
    {
      detail: {
        tags: ["Media Assets"],
        summary: "Serve media file from volume",
        description:
          "Serves media files from /gdd-assets volume. Public endpoint.",
      },
    },
  )

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
        {
          context: "ContentGeneration",
          npcName: body.npcName,
          tempUrl: imageResult.imageUrl,
        },
        "Portrait generated, downloading and saving to volume...",
      );

      // BEST PRACTICE: Immediately download and save to blob storage
      // Don't return temporary URLs - they expire!
      const response = await fetch(imageResult.imageUrl);
      if (!response.ok) {
        throw new InternalServerError(
          `Failed to download generated image: ${response.status}`,
        );
      }

      const imageData = Buffer.from(await response.arrayBuffer());
      const fileName = `portrait_${body.npcName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;

      // Save to volume and database
      const savedMedia = await mediaStorageService.saveMedia({
        type: "portrait",
        entityType: "npc",
        entityId: body.entityId,
        fileName,
        data: imageData,
        metadata: {
          prompt: imageResult.prompt,
          mimeType: "image/png",
          size: imageData.length,
        },
        createdBy: user.id,
      });

      logger.info(
        {
          context: "ContentGeneration",
          npcName: body.npcName,
          permanentUrl: savedMedia.cdnUrl,
        },
        "Portrait saved to volume successfully",
      );

      return {
        success: true,
        imageUrl: savedMedia.cdnUrl, // Return permanent URL, not temporary
        prompt: imageResult.prompt,
        mediaId: savedMedia.id,
      };
    },
    {
      body: t.Object({
        npcName: t.String({ minLength: 1, maxLength: 100 }),
        entityId: t.String({ minLength: 1, maxLength: 255 }),
        archetype: t.String({ minLength: 1, maxLength: 50 }),
        appearance: t.String({ minLength: 10, maxLength: 500 }),
        personality: t.String({ minLength: 10, maxLength: 500 }),
      }),
      response: t.Object({
        success: t.Boolean(),
        imageUrl: t.String(),
        prompt: t.String(),
        mediaId: t.String(),
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
        {
          context: "ContentGeneration",
          questTitle: body.questTitle,
          tempUrl: imageResult.imageUrl,
        },
        "Banner generated, downloading and saving to volume...",
      );

      // BEST PRACTICE: Immediately download and save to blob storage
      // Don't return temporary URLs - they expire!
      const response = await fetch(imageResult.imageUrl);
      if (!response.ok) {
        throw new InternalServerError(
          `Failed to download generated image: ${response.status}`,
        );
      }

      const imageData = Buffer.from(await response.arrayBuffer());
      const fileName = `banner_${body.questTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;

      // Save to volume and database
      const savedMedia = await mediaStorageService.saveMedia({
        type: "banner",
        entityType: "quest",
        entityId: body.entityId,
        fileName,
        data: imageData,
        metadata: {
          prompt: imageResult.prompt,
          mimeType: "image/png",
          size: imageData.length,
        },
        createdBy: user.id,
      });

      logger.info(
        {
          context: "ContentGeneration",
          questTitle: body.questTitle,
          permanentUrl: savedMedia.cdnUrl,
        },
        "Banner saved to volume successfully",
      );

      return {
        success: true,
        imageUrl: savedMedia.cdnUrl, // Return permanent URL, not temporary
        prompt: imageResult.prompt,
        mediaId: savedMedia.id,
      };
    },
    {
      body: t.Object({
        questTitle: t.String({ minLength: 1, maxLength: 200 }),
        entityId: t.String({ minLength: 1, maxLength: 255 }),
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
        mediaId: t.String(),
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
        let imageData: Buffer;
        let mimeType: string;
        let size: number;

        // Support two patterns:
        // 1. File upload (multipart/form-data) - for user uploads
        // 2. URL (JSON) - for AI-generated images, DOWNLOAD IMMEDIATELY before URL expires
        if (body.image) {
          // Pattern 1: File upload via FormData
          imageData = Buffer.from(await body.image.arrayBuffer());
          mimeType = body.image.type;
          size = body.image.size;
          logger.info(
            { size, mimeType, context: "media" },
            "Received file upload",
          );
        } else if (body.imageUrl) {
          // Pattern 2: URL - CRITICAL: Download immediately before it expires
          logger.info(
            { imageUrl: body.imageUrl, context: "media" },
            "Downloading image from temporary URL before it expires",
          );

          if (body.imageUrl.startsWith("data:")) {
            // Data URL - extract base64 data
            const matches = body.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
              throw new InternalServerError("Invalid data URL format");
            }
            mimeType = matches[1];
            imageData = Buffer.from(matches[2], "base64");
            size = imageData.length;
          } else {
            // HTTP/HTTPS URL - Download NOW (OpenAI URLs expire quickly!)
            logger.info(
              { context: "media" },
              "Fetching image from remote URL...",
            );
            const response = await fetch(body.imageUrl);
            if (!response.ok) {
              throw new InternalServerError(
                `Failed to download image from URL: ${response.status} ${response.statusText}`,
              );
            }
            const arrayBuffer = await response.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
            mimeType = response.headers.get("content-type") || "image/png";
            size = imageData.length;
            logger.info(
              { size, mimeType, context: "media" },
              "Successfully downloaded image from URL",
            );
          }
        } else {
          throw new InternalServerError(
            "Either image file or imageUrl must be provided",
          );
        }

        const mediaType = body.type || "portrait";
        const fileName = `${mediaType}_${Date.now()}.png`;

        logger.info(
          {
            fileName,
            mediaType,
            entityType: body.entityType,
            entityId: body.entityId,
            context: "media",
          },
          "Saving image to volume storage...",
        );

        // Save to /gdd-assets volume with error handling
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
            mimeType,
            size,
          },
          createdBy: user.id,
        });

        logger.info(
          {
            mediaId: result.id,
            fileUrl: result.cdnUrl,
            context: "media",
          },
          "Successfully saved image to volume and database",
        );

        return {
          success: true,
          mediaId: result.id,
          fileUrl: result.cdnUrl,
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

        throw new InternalServerError(
          `Failed to save portrait: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      body: t.Object({
        // Optional file for Pattern 1 (multipart/form-data)
        image: t.Optional(
          t.File({
            type: "image/*",
            maxSize: "10m",
          }),
        ),
        // Optional URL for Pattern 2 (JSON)
        imageUrl: t.Optional(t.String({ minLength: 1, maxLength: 5000 })),
        // Required fields for both patterns
        entityType: t.Union([
          t.Literal("npc"),
          t.Literal("quest"),
          t.Literal("lore"),
          t.Literal("location"),
          t.Literal("world"),
          t.Literal("dialogue"),
        ]),
        entityId: t.String({ minLength: 1, maxLength: 255 }),
        type: t.Optional(t.Union([t.Literal("portrait"), t.Literal("banner")])),
      }),
      detail: {
        tags: ["Media Assets"],
        summary: "Save portrait image",
        description:
          "Save image file via multipart/form-data upload OR provide imageUrl to fetch server-side. Requires authentication.",
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
