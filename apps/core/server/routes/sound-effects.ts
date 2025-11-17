/**
 * Sound Effects Generation API Routes
 * ElevenLabs text-to-sound-effects integration for game audio
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { ElevenLabsSoundEffectsService } from "../services/ElevenLabsSoundEffectsService";
import * as Models from "../models";

export const soundEffectsRoutes = new Elysia({
  prefix: "/api/sfx",
  name: "sound-effects-generation",
}).guard(
  {
    beforeHandle: ({ request }) => {
      const url = new URL(request.url);
      logger.info(
        { context: "SFX", method: request.method, path: url.pathname },
        "SFX request",
      );
    },
  },
  (app) =>
    app
      // Helper to initialize SFX service
      .derive(() => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const sfxService = new ElevenLabsSoundEffectsService(apiKey);

        return { sfxService };
      })

      // POST /api/sfx/generate - Generate sound effect
      .post(
        "/generate",
        async ({ body, sfxService, set }) => {
          // Check if service is available
          if (!sfxService.isAvailable()) {
            logger.error(
              { context: "SFX" },
              "Service not available - ELEVENLABS_API_KEY not configured",
            );
            set.status = 503;
            return {
              error: "Service Unavailable",
              message:
                "Sound effects generation service is not configured. Please contact the administrator to set up the ELEVENLABS_API_KEY environment variable.",
              code: "SFX_SERVICE_NOT_CONFIGURED",
            };
          }

          try {
            logger.info(
              { context: "SFX", textPreview: body.text.substring(0, 50) },
              "Generating sound effect",
            );

            const audioBuffer = await sfxService.generateSoundEffect(body);

            logger.info(
              { context: "SFX", sizeBytes: audioBuffer.length },
              "Sound effect generated successfully",
            );

            // Return audio file directly as binary
            return new Response(
              new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }),
              {
                headers: {
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.length.toString(),
                  "Cache-Control": "public, max-age=31536000",
                  "Content-Disposition": `attachment; filename="sfx-${Date.now()}.mp3"`,
                },
              },
            );
          } catch (err) {
            logger.error({ err: err }, "[SFX] Generation failed:");
            set.status = 500;
            return {
              error: "Generation Failed",
              message:
                err instanceof Error
                  ? err.message
                  : "Failed to generate sound effect",
              code: "SFX_GENERATION_ERROR",
            };
          }
        },
        {
          body: Models.GenerateSfxRequest,
          detail: {
            tags: ["Sound Effects"],
            summary: "Generate sound effect from text",
            description:
              "Generate AI sound effect from text description. Returns MP3 audio file. Duration: 0.5-22 seconds.",
          },
        },
      )

      // POST /api/sfx/batch - Batch generate multiple sound effects
      .post(
        "/batch",
        async ({ body, sfxService, set }) => {
          // Check if service is available
          if (!sfxService.isAvailable()) {
            logger.error(
              { context: "SFX" },
              "Service not available - ELEVENLABS_API_KEY not configured",
            );
            set.status = 503;
            return {
              error: "Service Unavailable",
              message: "Sound effects generation service is not configured.",
              code: "SFX_SERVICE_NOT_CONFIGURED",
            };
          }

          try {
            logger.info(
              { context: "SFX", effectCount: body.effects.length },
              "Batch generating sound effects",
            );

            const results = await sfxService.generateSoundEffectBatch(
              body.effects,
            );

            logger.info(
              {
                context: "SFX",
                successful: results.successful,
                total: results.total,
              },
              "Batch generation complete",
            );

            // Convert audio buffers to base64 for JSON response
            const formattedResults = {
              ...results,
              effects: results.effects.map((effect) => ({
                ...effect,
                audioBuffer:
                  "audioBuffer" in effect && effect.audioBuffer
                    ? effect.audioBuffer.toString("base64")
                    : undefined,
              })),
            };

            return formattedResults;
          } catch (err) {
            logger.error({ err: err }, "[SFX] Batch generation failed:");
            set.status = 500;
            return {
              error: "Batch Generation Failed",
              message:
                err instanceof Error
                  ? err.message
                  : "Failed to generate sound effects",
              code: "SFX_BATCH_ERROR",
            };
          }
        },
        {
          body: Models.BatchSfxRequest,
          // Remove response schema to allow error responses with custom status codes
          detail: {
            tags: ["Sound Effects"],
            summary: "Batch generate sound effects",
            description:
              "Generate multiple sound effects in parallel (max 20 effects)",
          },
        },
      )

      // GET /api/sfx/estimate - Estimate cost
      .get(
        "/estimate",
        async ({ query, sfxService }) => {
          const duration = query.duration ? parseFloat(query.duration) : null;

          if (
            duration !== null &&
            (isNaN(duration) || duration < 0.5 || duration > 22)
          ) {
            throw new Error(
              "Invalid duration: must be between 0.5 and 22 seconds",
            );
          }

          const estimate = sfxService.estimateCost(duration);
          return estimate;
        },
        {
          query: t.Object({
            duration: t.Optional(t.String()),
          }),
          response: Models.SfxEstimateResponse,
          detail: {
            tags: ["Sound Effects"],
            summary: "Estimate sound effect generation cost",
            description:
              "Get cost estimate for generating a sound effect of specific duration",
          },
        },
      ),
);
