/**
 * Music Generation API Routes
 * ElevenLabs music generation integration for game soundtracks
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { ElevenLabsMusicService } from "../services/ElevenLabsMusicService";
import * as Models from "../models";
import { optionalAuth } from "../middleware/auth";
import { getUserApiKeysWithFallback } from "../utils/getUserApiKeys";
import { InternalServerError } from "../errors";

export const musicRoutes = new Elysia({
  prefix: "/api/music",
  name: "music-generation",
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
          { context: "Music", method: request.method, path: url.pathname },
          "Music request",
        );
      },
    },
    (app) =>
      app
        // Helper to initialize music service with user's API key
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

          const musicService = new ElevenLabsMusicService(
            userApiKeys.elevenLabsApiKey,
          );

          if (!musicService.isAvailable()) {
            throw new InternalServerError(
              "Music generation service not available - ElevenLabs API key invalid",
            );
          }

          return { musicService };
        })

        // POST /api/music/generate - Generate music from prompt
        .post(
          "/generate",
          async ({ body, musicService }) => {
            logger.info(
              {
                context: "Music",
                promptPreview:
                  body.prompt?.substring(0, 50) || "from composition plan",
              },
              "Generating music",
            );

            const audioBuffer = await musicService.generateMusic(body);

            // Return audio file directly as binary
            return new Response(
              new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }),
              {
                headers: {
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.length.toString(),
                  "Cache-Control": "public, max-age=31536000",
                  "Content-Disposition": `attachment; filename="music-${Date.now()}.mp3"`,
                },
              },
            );
          },
          {
            body: Models.GenerateMusicRequest,
            detail: {
              tags: ["Music Generation"],
              summary: "Generate music from prompt",
              description:
                "Generate AI music from text prompt or composition plan. Returns MP3 audio file.",
            },
          },
        )

        // POST /api/music/generate-detailed - Generate music with metadata
        .post(
          "/generate-detailed",
          async ({ body, musicService }) => {
            logger.info(
              {
                context: "Music",
                promptPreview:
                  body.prompt?.substring(0, 50) || "from composition plan",
              },
              "Generating detailed music",
            );

            const result = await musicService.generateMusicDetailed(body);

            return {
              audio: result.audio.toString("base64"),
              metadata: result.metadata,
              format: result.format,
            };
          },
          {
            body: Models.GenerateMusicRequest,
            response: t.Object({
              audio: t.String(),
              metadata: t.Any(),
              format: t.String(),
            }),
            detail: {
              tags: ["Music Generation"],
              summary: "Generate music with metadata",
              description:
                "Generate music and return JSON with base64-encoded audio and metadata",
            },
          },
        )

        // POST /api/music/plan - Create composition plan
        .post(
          "/plan",
          async ({ body, musicService }) => {
            logger.info(
              { context: "Music", promptPreview: body.prompt.substring(0, 50) },
              "Creating composition plan",
            );

            const plan = await musicService.createCompositionPlan(body);

            logger.info(
              { context: "Music", sectionCount: plan.sections?.length || 0 },
              "Composition plan created",
            );

            return plan;
          },
          {
            body: Models.CreateCompositionPlanRequest,
            response: t.Any(),
            detail: {
              tags: ["Music Generation"],
              summary: "Create composition plan",
              description:
                "Generate a composition plan from text prompt (no credits used)",
            },
          },
        )

        // POST /api/music/batch - Batch generate multiple tracks
        .post(
          "/batch",
          async ({ body, musicService }) => {
            logger.info(
              { context: "Music", trackCount: body.tracks.length },
              "Batch generating tracks",
            );

            const results = await musicService.generateBatch(body.tracks);

            // Convert audio buffers to base64 for JSON response
            const jsonResults = results.map((result) => ({
              success: result.success,
              audio: result.audio ? result.audio.toString("base64") : null,
              prompt: result.request.prompt,
              error: "error" in result ? result.error : undefined,
            }));

            return {
              results: jsonResults,
              total: results.length,
              successful: results.filter((r) => r.success).length,
              failed: results.filter((r) => !r.success).length,
            };
          },
          {
            body: Models.BatchMusicRequest,
            response: t.Object({
              results: t.Array(
                t.Object({
                  success: t.Boolean(),
                  audio: t.Nullable(t.String()),
                  prompt: t.Optional(t.String()),
                  error: t.Optional(t.String()),
                }),
              ),
              total: t.Number(),
              successful: t.Number(),
              failed: t.Number(),
            }),
            detail: {
              tags: ["Music Generation"],
              summary: "Batch generate music tracks",
              description:
                "Generate multiple music tracks in parallel (max 10 tracks)",
            },
          },
        )

        // GET /api/music/status - Get service status
        .get(
          "/status",
          async ({ musicService }) => {
            const status = musicService.getStatus();
            return status;
          },
          {
            response: t.Object({
              available: t.Boolean(),
              service: t.String(),
              model: t.String(),
              maxDuration: t.Number(),
              formats: t.Array(t.String()),
            }),
            detail: {
              tags: ["Music Generation"],
              summary: "Get music service status",
              description:
                "Returns music generation service status and capabilities",
            },
          },
        ),
  );
