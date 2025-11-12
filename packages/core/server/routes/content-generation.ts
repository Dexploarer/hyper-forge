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
import { optionalAuth } from "../middleware/auth";

const contentGenService = new ContentGenerationService();
const mediaStorageService = new MediaStorageService();
const relationshipService = new RelationshipService();

export const contentGenerationRoutes = new Elysia({
  prefix: "/api/content",
  name: "content-generation",
})
  .derive(async (context) => {
    // Extract user from auth token if present (optional)
    const authResult = await optionalAuth(context as any);
    return { user: authResult.user };
  })
  .guard(
    {
      beforeHandle: ({ request }) => {
        console.log(
          `[ContentGeneration] ${request.method} ${new URL(request.url).pathname}`,
        );
      },
    },
    (app) =>
      app
        // GET /api/content/test - Simple test endpoint
        .get("/test", () => {
          return { message: "Content generation routes are working!" };
        })

        // POST /api/content/generate-dialogue
        .post(
          "/generate-dialogue",
          async ({ body, user }) => {
            try {
              console.log(
                `[ContentGeneration] Generating dialogue${body.npcName ? ` for NPC: ${body.npcName}` : ""}`,
              );

              const result = await contentGenService.generateDialogue({
                npcName: body.npcName,
                npcPersonality: body.npcPersonality,
                prompt: body.prompt,
                context: body.context,
                existingNodes: body.existingNodes,
                quality: body.quality,
                worldConfigId: body.worldConfigId,
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

              console.log(
                `[ContentGeneration] Successfully generated and saved dialogue`,
              );
              return { ...result, id: dialogue.id };
            } catch (error) {
              console.error(
                `[ContentGeneration] Error generating dialogue:`,
                error,
              );
              throw error;
            }
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
          async ({ body, user, set }) => {
            try {
              console.log(
                `[ContentGeneration] Generating NPC${body.archetype ? ` with archetype: ${body.archetype}` : ""}`,
              );

              const result = await contentGenService.generateNPC({
                prompt: body.prompt,
                archetype: body.archetype,
                context: body.context,
                quality: body.quality,
                worldConfigId: body.worldConfigId,
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

              console.log(
                `[ContentGeneration] Successfully generated and saved NPC`,
              );
              return { ...result, id: npc.id };
            } catch (error) {
              console.error("[ContentGeneration] Error generating NPC:", error);
              set.status = 500;
              throw new Error(
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred while generating the NPC",
              );
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
            console.log(
              `[ContentGeneration] Generating${body.difficulty ? ` ${body.difficulty}` : ""}${body.questType ? ` ${body.questType}` : ""} quest`,
            );

            const result = await contentGenService.generateQuest({
              prompt: body.prompt,
              questType: body.questType,
              difficulty: body.difficulty,
              theme: body.theme,
              context: body.context,
              quality: body.quality,
              worldConfigId: body.worldConfigId,
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

            console.log(
              `[ContentGeneration] Successfully generated and saved Quest`,
            );
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
            console.log(
              `[ContentGeneration] Generating lore${body.category ? `: ${body.category}` : ""}${body.topic ? ` - ${body.topic}` : ""}`,
            );

            const result = await contentGenService.generateLore({
              prompt: body.prompt,
              category: body.category,
              topic: body.topic,
              context: body.context,
              quality: body.quality,
              worldConfigId: body.worldConfigId,
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

            console.log(
              `[ContentGeneration] Successfully generated and saved Lore`,
            );
            return { ...result, id: lore.id };
          },
          {
            body: Models.GenerateLoreRequest,
            response: Models.GenerateLoreResponse,
            detail: {
              tags: ["Content Generation"],
              summary: "Generate game lore",
              description:
                "Generate rich lore content for world-building using AI.",
            },
          },
        )

        // POST /api/content/generate-npc-portrait
        .post(
          "/generate-npc-portrait",
          async ({ body }) => {
            console.log(
              `[ContentGeneration] Generating portrait for NPC: ${body.npcName}`,
            );

            // Initialize AI service
            const aiService = new AICreationService({
              openai: {
                apiKey: process.env.OPENAI_API_KEY || "",
                model: "gpt-image-1",
                imageServerBaseUrl:
                  process.env.IMAGE_SERVER_URL || "http://localhost:8080",
              },
              meshy: {
                apiKey: process.env.MESHY_API_KEY || "",
                baseUrl: "https://api.meshy.ai",
              },
            });

            // Build image prompt from NPC data
            const promptParts = [
              `Portrait of ${body.npcName}, a ${body.archetype}`,
              body.appearance,
              `Personality: ${body.personality}`,
              "Professional character portrait, detailed facial features, game character art style, head and shoulders view",
            ];

            const imagePrompt = promptParts.join(". ");

            console.log(`[ContentGeneration] Image prompt: ${imagePrompt}`);

            // Generate image
            const imageResult = await aiService
              .getImageService()
              .generateImage(imagePrompt, "portrait", "realistic");

            console.log(
              `[ContentGeneration] Portrait generated successfully for ${body.npcName}`,
            );

            return {
              success: true,
              imageUrl: imageResult.imageUrl,
              prompt: imageResult.prompt,
            };
          },
          {
            body: t.Object({
              npcName: t.String(),
              archetype: t.String(),
              appearance: t.String(),
              personality: t.String(),
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
          async ({ body }) => {
            console.log(
              `[ContentGeneration] Generating banner for quest: ${body.questTitle}`,
            );

            // Initialize AI service
            const aiService = new AICreationService({
              openai: {
                apiKey: process.env.OPENAI_API_KEY || "",
                model: "gpt-image-1",
                imageServerBaseUrl:
                  process.env.IMAGE_SERVER_URL || "http://localhost:8080",
              },
              meshy: {
                apiKey: process.env.MESHY_API_KEY || "",
                baseUrl: "https://api.meshy.ai",
              },
            });

            // Build image prompt from quest data
            const promptParts = [
              `Quest banner artwork for "${body.questTitle}"`,
              body.description,
              `Quest type: ${body.questType}, Difficulty: ${body.difficulty}`,
              "Epic fantasy game quest banner, wide horizontal format, dramatic composition, game UI art style, 16:9 aspect ratio, cinematic lighting",
            ];

            const imagePrompt = promptParts.join(". ");

            console.log(`[ContentGeneration] Banner prompt: ${imagePrompt}`);

            // Generate image
            const imageResult = await aiService
              .getImageService()
              .generateImage(imagePrompt, "banner", "fantasy");

            console.log(
              `[ContentGeneration] Banner generated successfully for ${body.questTitle}`,
            );

            return {
              success: true,
              imageUrl: imageResult.imageUrl,
              prompt: imageResult.prompt,
            };
          },
          {
            body: t.Object({
              questTitle: t.String(),
              description: t.String(),
              questType: t.String(),
              difficulty: t.String(),
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
                "Generate an AI banner image for a quest based on its details",
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
              throw new Error("NPC not found");
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
              throw new Error("NPC not found");
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
              name: t.String(),
              archetype: t.String(),
              data: t.Any(),
              generationParams: t.Optional(t.Any()),
              tags: t.Optional(t.Array(t.String())),
              createVersion: t.Optional(t.Boolean()),
            }),
            detail: {
              tags: ["Content Management"],
              summary: "Update NPC",
              description:
                "Update an NPC in the database with optional versioning",
            },
          },
        )

        // DELETE /api/content/npcs/:id
        .delete(
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
              description: "Delete an NPC from the database",
            },
          },
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

            const quests = await contentDatabaseService.listQuests(
              limit,
              offset,
            );
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
              throw new Error("Quest not found");
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

        // DELETE /api/content/quests/:id
        .delete(
          "/quests/:id",
          async ({ params }) => {
            await contentDatabaseService.deleteQuest(params.id);
            return { success: true, message: "Quest deleted" };
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            detail: {
              tags: ["Content Management"],
              summary: "Delete Quest",
              description: "Delete a quest from the database",
            },
          },
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
            const dialogue = await contentDatabaseService.getDialogue(
              params.id,
            );
            if (!dialogue) {
              throw new Error("Dialogue not found");
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

        // DELETE /api/content/dialogues/:id
        .delete(
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
              description: "Delete a dialogue from the database",
            },
          },
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
              throw new Error("Lore not found");
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

        // DELETE /api/content/lores/:id
        .delete(
          "/lores/:id",
          async ({ params }) => {
            await contentDatabaseService.deleteLore(params.id);
            return { success: true, message: "Lore deleted" };
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            detail: {
              tags: ["Content Management"],
              summary: "Delete Lore",
              description: "Delete a lore entry from the database",
            },
          },
        )

        // ========================
        // Media Asset Endpoints
        // ========================

        // POST /api/content/media/save-portrait
        .post(
          "/media/save-portrait",
          async ({ body, user }) => {
            const mediaType = body.type || "portrait";
            console.log(
              `[Media] Saving ${mediaType} for ${body.entityType}:${body.entityId}`,
            );

            // Decode base64 image data
            const imageData = Buffer.from(body.imageData, "base64");

            // Generate filename based on type
            const fileName = `${mediaType}_${Date.now()}.png`;

            // Save media file and create database record
            const result = await mediaStorageService.saveMedia({
              type: mediaType as "portrait" | "banner" | "voice" | "music" | "sound_effect",
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

            console.log(
              `[Media] Portrait saved successfully: ${result.fileUrl}`,
            );

            return {
              success: true,
              mediaId: result.id,
              fileUrl: result.fileUrl,
            };
          },
          {
            body: t.Object({
              entityType: t.String(),
              entityId: t.String(),
              imageData: t.String(), // base64 encoded
              type: t.Optional(t.String()), // "portrait" | "banner" | etc.
              prompt: t.Optional(t.String()),
              model: t.Optional(t.String()),
              createdBy: t.Optional(t.String()),
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
            console.log(
              `[Media] Saving voice for ${body.entityType}:${body.entityId}`,
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

            console.log(`[Media] Voice saved successfully: ${result.fileUrl}`);

            return {
              success: true,
              mediaId: result.id,
              fileUrl: result.fileUrl,
            };
          },
          {
            body: t.Object({
              entityType: t.String(),
              entityId: t.String(),
              audioData: t.String(), // base64 encoded
              voiceId: t.Optional(t.String()),
              voiceSettings: t.Optional(t.Any()),
              text: t.Optional(t.String()),
              duration: t.Optional(t.Number()),
              createdBy: t.Optional(t.String()),
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
            console.log(
              `[Media] Fetching media for ${params.entityType}:${params.entityId}`,
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
            console.log(
              `[ContentGeneration] Generating quest for NPC: ${body.npcName}`,
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

            console.log(
              `[ContentGeneration] Quest generated and linked to NPC: ${quest.id}`,
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
              npcId: t.String(),
              npcName: t.String(),
              archetype: t.String(),
              personality: t.Optional(t.String()),
              questType: t.String(),
              difficulty: t.String(),
              theme: t.Optional(t.String()),
              quality: t.Optional(
                t.Union([
                  t.Literal("quality"),
                  t.Literal("speed"),
                  t.Literal("balanced"),
                ]),
              ),
              createdBy: t.Optional(t.String()),
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
            console.log(
              `[ContentGeneration] Generating lore for NPC: ${body.npcName}`,
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

            console.log(
              `[ContentGeneration] Lore generated and linked to NPC: ${lore.id}`,
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
              npcId: t.String(),
              npcName: t.String(),
              archetype: t.String(),
              category: t.String(),
              topic: t.String(),
              additionalContext: t.Optional(t.String()),
              quality: t.Optional(
                t.Union([
                  t.Literal("quality"),
                  t.Literal("speed"),
                  t.Literal("balanced"),
                ]),
              ),
              createdBy: t.Optional(t.String()),
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
            console.log(
              `[ContentGeneration] Generating ${body.complexity || "medium"} ${body.theme || "fantasy"} world`,
            );

            const result = await contentGenService.generateWorld({
              theme: body.theme,
              complexity: body.complexity,
              customPrompt: body.customPrompt,
              quality: body.quality,
            });

            console.log(
              `[ContentGeneration] Successfully generated world: ${result.world.worldName}`,
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
        ),
  );
