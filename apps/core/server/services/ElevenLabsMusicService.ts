/**
 * ElevenLabs Music Generation Service
 * AI music generation for game soundtracks
 */

import { ElevenLabsClient, type ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { logger } from '../utils/logger';

// Simplified composition plan from API (gets converted to ElevenLabs.MusicPrompt)
export interface SimpleCompositionPlan {
  prompt?: string;
  musicLengthMs?: number;
  sections?: Array<{
    name: string;
    duration: number;
    description: string;
  }>;
  modelId?: string;
}

export interface GenerateMusicParams {
  prompt?: string;
  musicLengthMs?: number;
  compositionPlan?: SimpleCompositionPlan | ElevenLabs.MusicPrompt;
  forceInstrumental?: boolean;
  respectSectionsDurations?: boolean;
  storeForInpainting?: boolean;
  modelId?: "music_v1" | string;
  outputFormat?: ElevenLabs.MusicComposeRequestOutputFormat | string;
}

export interface CreateCompositionPlanParams {
  prompt: string;
  musicLengthMs?: number;
  sourceCompositionPlan?: SimpleCompositionPlan | ElevenLabs.MusicPrompt;
  modelId?: "music_v1" | string;
}

export class ElevenLabsMusicService {
  private client: ElevenLabsClient | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ELEVENLABS_API_KEY;
    if (key) {
      this.client = new ElevenLabsClient({ apiKey: key });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Convert simplified composition plan to ElevenLabs MusicPrompt
   */
  private convertToMusicPrompt(
    plan: SimpleCompositionPlan,
  ): ElevenLabs.MusicPrompt {
    const sections: ElevenLabs.SongSection[] =
      plan.sections?.map((section) => ({
        sectionName: section.name,
        durationMs: section.duration,
        positiveLocalStyles: [section.description],
        negativeLocalStyles: [],
        lines: [],
      })) || [];

    return {
      positiveGlobalStyles: plan.prompt ? [plan.prompt] : [],
      negativeGlobalStyles: [],
      sections,
    };
  }

  async generateMusic(params: GenerateMusicParams): Promise<Buffer> {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    // Convert compositionPlan if it's a simple format
    let musicPrompt: ElevenLabs.MusicPrompt | undefined = undefined;
    if (params.compositionPlan) {
      // Check if it's already a MusicPrompt (has positiveGlobalStyles)
      if ("positiveGlobalStyles" in params.compositionPlan) {
        musicPrompt = params.compositionPlan as ElevenLabs.MusicPrompt;
      } else {
        musicPrompt = this.convertToMusicPrompt(
          params.compositionPlan as SimpleCompositionPlan,
        );
      }
    }

    const audioStream = await this.client.music.compose({
      prompt: params.prompt,
      compositionPlan: musicPrompt,
      musicLengthMs: params.musicLengthMs,
      modelId: (params.modelId as "music_v1") || "music_v1",
      forceInstrumental: params.forceInstrumental,
      respectSectionsDurations: params.respectSectionsDurations,
      storeForInpainting: params.storeForInpainting,
      outputFormat:
        params.outputFormat as ElevenLabs.MusicComposeRequestOutputFormat,
    });

    // Convert stream to buffer
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }

  async generateMusicDetailed(params: GenerateMusicParams) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const audioBuffer = await this.generateMusic(params);

    return {
      audio: audioBuffer,
      metadata: {
        prompt: params.prompt,
        modelId: params.modelId || "music_v1",
        lengthMs: params.musicLengthMs,
      },
      format: params.outputFormat || "mp3_44100_128",
    };
  }

  async createCompositionPlan(
    params: CreateCompositionPlanParams,
  ): Promise<ElevenLabs.MusicPrompt> {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    // Note: The SDK may not have a direct composition plan API
    // This might need to call a different endpoint or method
    // Placeholder implementation that returns a proper MusicPrompt
    const sections: ElevenLabs.SongSection[] = [
      {
        sectionName: "intro",
        durationMs: 5000,
        positiveLocalStyles: ["energetic", "uplifting"],
        negativeLocalStyles: [],
        lines: [],
      },
      {
        sectionName: "main",
        durationMs: params.musicLengthMs ? params.musicLengthMs - 10000 : 50000,
        positiveLocalStyles: ["dynamic"],
        negativeLocalStyles: [],
        lines: [],
      },
      {
        sectionName: "outro",
        durationMs: 5000,
        positiveLocalStyles: ["calm", "fade out"],
        negativeLocalStyles: [],
        lines: [],
      },
    ];

    return {
      positiveGlobalStyles: [], // Required by MusicPrompt
      negativeGlobalStyles: [], // Required by MusicPrompt
      sections,
    };
  }

  async generateBatch(tracks: GenerateMusicParams[]) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const results = await Promise.allSettled(
      tracks.map(async (track) => {
        const audio = await this.generateMusic(track);
        return {
          success: true,
          audio,
          request: track,
        };
      }),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          audio: null,
          request: tracks[index],
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  }

  getStatus() {
    return {
      available: this.isAvailable(),
      service: "ElevenLabs Music Generation",
      model: "music_v1",
      maxDuration: 300000, // 5 minutes in ms
      formats: ["mp3_44100_128"],
    };
  }
}
