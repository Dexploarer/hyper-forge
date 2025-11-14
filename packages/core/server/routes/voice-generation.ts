/**
 * Voice Generation API Routes
 * ElevenLabs text-to-speech integration for NPC dialogue
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { ElevenLabsVoiceService } from "../services/ElevenLabsVoiceService";
import { MediaStorageService } from "../services/MediaStorageService";
import * as Models from "../models";
import { optionalAuth } from "../middleware/auth";
import { getUserApiKeysWithFallback } from "../utils/getUserApiKeys";
import { InternalServerError } from "../errors";

const mediaStorageService = new MediaStorageService();

export const voiceGenerationRoutes = new Elysia({
  prefix: "/api/voice",
  name: "voice-generation",
})
  .derive(async (context) => {
    // Extract user from auth token if present (optional)
    const authResult = await optionalAuth({
      request: context.request,
      headers: context.headers,
    });
    return { user: authResult.user };
  })
  .guard(
    {
      beforeHandle: ({ request }) => {
        const url = new URL(request.url);
        logger.info(
          { context: "Voice", method: request.method, path: url.pathname },
          "Voice request",
        );
      },
    },
    (app) =>
      app
        // Helper to initialize voice service with user's API key
        .derive(async ({ user }) => {
          // Fetch user's API keys with env fallback
          const userApiKeys = user?.id
            ? await getUserApiKeysWithFallback(user.id)
            : { elevenLabsApiKey: process.env.ELEVENLABS_API_KEY };

          // Check if ElevenLabs key is configured
          if (!userApiKeys.elevenLabsApiKey) {
            throw new InternalServerError(
              "ElevenLabs API key not configured. Please add your API key in Settings → API Keys.",
            );
          }

          const voiceService = new ElevenLabsVoiceService(
            userApiKeys.elevenLabsApiKey,
          );

          if (!voiceService.isAvailable()) {
            throw new InternalServerError(
              "Voice generation service not available - ElevenLabs API key invalid",
            );
          }

          return { voiceService };
        })

        // GET /api/voice/library - Get available voices
        .get(
          "/library",
          async ({ voiceService }) => {
            const voices = await voiceService.getAvailableVoices();
            return {
              voices,
              count: voices.length,
            };
          },
          {
            // Skip response validation - ElevenLabs SDK returns dynamic voice objects
            detail: {
              tags: ["Voice Generation"],
              summary: "Get available voices",
              description:
                "Returns all available voices from ElevenLabs voice library",
            },
          },
        )

        // POST /api/voice/generate - Generate single voice clip
        .post(
          "/generate",
          async ({ body, voiceService }) => {
            const result = await voiceService.generateVoice(body);
            return result;
          },
          {
            body: Models.GenerateVoiceRequest,
            response: Models.GenerateVoiceResponse,
            detail: {
              tags: ["Voice Generation"],
              summary: "Generate voice from text",
              description:
                "Converts text to speech using ElevenLabs TTS for NPC dialogue",
            },
          },
        )

        // POST /api/voice/batch - Batch generate multiple voice clips
        .post(
          "/batch",
          async ({ body, voiceService }) => {
            const results = await voiceService.generateVoiceBatch(body);
            return results;
          },
          {
            body: Models.BatchVoiceRequest,
            response: Models.BatchVoiceResponse,
            detail: {
              tags: ["Voice Generation"],
              summary: "Batch generate voices",
              description:
                "Generate multiple voice clips in a single request for better efficiency",
            },
          },
        )

        // POST /api/voice/estimate - Estimate cost
        .post(
          "/estimate",
          async ({ body }) => {
            const voiceService = new ElevenLabsVoiceService();
            const estimate = voiceService.estimateCost(
              body.texts,
              body.settings,
            );
            return estimate;
          },
          {
            body: t.Object({
              texts: t.Array(t.String()),
              settings: t.Optional(Models.VoiceSettings),
            }),
            response: t.Object({
              characterCount: t.Number(),
              estimatedCostUSD: t.String(),
              texts: t.Number(),
            }),
            detail: {
              tags: ["Voice Generation"],
              summary: "Estimate cost for voice generation",
              description:
                "Calculate estimated cost based on character count and settings",
            },
          },
        )

        // GET /api/voice/subscription - Get subscription info
        .get(
          "/subscription",
          async ({ voiceService }) => {
            const subscription = await voiceService.getSubscriptionInfo();
            return subscription;
          },
          {
            detail: {
              tags: ["Voice Generation"],
              summary: "Get ElevenLabs subscription info",
              description:
                "Returns current subscription status, character limits, and usage",
            },
          },
        )

        // GET /api/voice/models - Get available models
        .get(
          "/models",
          async ({ voiceService }) => {
            const models = await voiceService.getAvailableModels();
            return {
              models,
              count: models.length,
            };
          },
          {
            response: t.Object({
              models: t.Array(t.Any()),
              count: t.Number(),
            }),
            detail: {
              tags: ["Voice Generation"],
              summary: "Get available voice models",
              description:
                "Returns list of available ElevenLabs TTS models (multilingual, monolingual, turbo)",
            },
          },
        )

        // GET /api/voice/rate-limit - Get rate limit info
        .get(
          "/rate-limit",
          async ({ voiceService }) => {
            const rateLimitInfo = voiceService.getRateLimitInfo();
            return rateLimitInfo;
          },
          {
            detail: {
              tags: ["Voice Generation"],
              summary: "Get rate limit status",
              description: "Returns current rate limit information",
            },
          },
        )

        // POST /api/voice/design - Design a new voice from description
        .post(
          "/design",
          async ({ body, voiceService }) => {
            logger.info(
              {
                context: "Voice",
                descriptionPreview: body.voiceDescription.substring(0, 50),
              },
              "Designing voice",
            );

            const result = await voiceService.designVoice(body);

            logger.info(
              {
                context: "Voice",
                previewCount: (result as any).previews?.length || 0,
              },
              "Voice design complete",
            );

            return result;
          },
          {
            body: Models.DesignVoiceRequest,
            // Skip response validation - ElevenLabs SDK returns dynamic objects
            detail: {
              tags: ["Voice Generation"],
              summary: "Design a new voice from description",
              description:
                "Generate voice previews from text description using ElevenLabs Voice Design API. Returns multiple preview options to choose from.",
            },
          },
        )

        // POST /api/voice/create - Save designed voice to library
        .post(
          "/create",
          async ({ body, voiceService }) => {
            logger.info(
              { context: "Voice", voiceName: body.voiceName },
              "Creating voice from preview",
            );

            const result = await voiceService.createVoiceFromPreview(body);

            logger.info(
              {
                context: "Voice",
                voiceId: (result as any).voiceId || (result as any).voice_id,
              },
              "Voice created successfully",
            );

            return result;
          },
          {
            body: Models.CreateVoiceRequest,
            // Skip response validation - ElevenLabs SDK returns dynamic objects
            detail: {
              tags: ["Voice Generation"],
              summary: "Create voice from preview",
              description:
                "Save a designed voice preview to your ElevenLabs voice library for future use",
            },
          },
        )

        // POST /api/voice/save - Save generated audio to database
        .post(
          "/save",
          async ({ body, user }) => {
            logger.info(
              { context: "Voice", type: body.type || "voice", name: body.name },
              "Saving audio",
            );

            // Decode base64 audio data
            const audioData = Buffer.from(body.audioData, "base64");

            // Determine file extension based on mime type
            const fileExt =
              body.metadata?.mimeType === "audio/wav"
                ? "wav"
                : body.metadata?.mimeType === "audio/ogg"
                  ? "ogg"
                  : "mp3";

            // Generate filename
            const fileName = `${body.type || "voice"}_${Date.now()}.${fileExt}`;

            // Save media file and create database record
            const result = await mediaStorageService.saveMedia({
              type: body.type || "voice",
              fileName,
              data: audioData,
              metadata: body.metadata || {},
              createdBy: user?.id,
            });

            logger.info(
              { context: "Voice", cdnUrl: result.cdnUrl },
              "Audio saved successfully",
            );

            return {
              success: true,
              id: result.id,
              fileUrl: result.cdnUrl,
            };
          },
          {
            body: t.Object({
              name: t.String(),
              type: t.Union([
                t.Literal("voice"),
                t.Literal("music"),
                t.Literal("sound_effect"),
              ]),
              audioData: t.String(), // base64 encoded
              metadata: t.Optional(
                t.Object({
                  voiceId: t.Optional(t.String()),
                  voiceName: t.Optional(t.String()),
                  text: t.Optional(t.String()),
                  prompt: t.Optional(t.String()),
                  description: t.Optional(t.String()),
                  duration: t.Optional(t.Number()),
                  mimeType: t.Optional(t.String()),
                  settings: t.Optional(t.Any()),
                }),
              ),
            }),
            response: t.Object({
              success: t.Boolean(),
              id: t.String(),
              fileUrl: t.String(),
            }),
            detail: {
              tags: ["Voice Generation"],
              summary: "Save generated audio",
              description:
                "Save a generated audio file (voice, music, or SFX) to persistent storage",
            },
          },
        )

        // GET /api/voice/saved - List saved audio
        .get(
          "/saved",
          async ({ query, user }) => {
            logger.info(
              { context: "Voice", type: query.type },
              "Fetching saved audio",
            );

            const limit = query.limit ? parseInt(query.limit) : 50;

            // Get media by type, optionally filtered by user
            const audioTypes = query.type
              ? [query.type]
              : ["voice", "music", "sound_effect"];

            let allAudio: any[] = [];

            for (const type of audioTypes) {
              const audio = await mediaStorageService.getMediaByType(type, {
                limit,
                createdBy: user?.id,
              });
              allAudio = [...allAudio, ...audio];
            }

            // Sort by creation date, most recent first
            allAudio.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

            // Limit results
            if (limit) {
              allAudio = allAudio.slice(0, limit);
            }

            logger.info(
              { context: "Voice", count: allAudio.length },
              "Found saved audio files",
            );

            return {
              success: true,
              audio: allAudio,
              count: allAudio.length,
            };
          },
          {
            query: t.Object({
              type: t.Optional(
                t.Union([
                  t.Literal("voice"),
                  t.Literal("music"),
                  t.Literal("sound_effect"),
                ]),
              ),
              limit: t.Optional(t.String()),
            }),
            response: t.Object({
              success: t.Boolean(),
              audio: t.Array(t.Any()),
              count: t.Number(),
            }),
            detail: {
              tags: ["Voice Generation"],
              summary: "List saved audio",
              description:
                "Retrieve list of saved audio files from persistent storage",
            },
          },
        ),
  );
