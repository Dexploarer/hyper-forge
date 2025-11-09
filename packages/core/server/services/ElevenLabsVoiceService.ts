/**
 * ElevenLabs Voice Generation Service
 * Text-to-speech integration for NPC dialogue
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export interface VoiceSettings {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface GenerateVoiceParams {
  text: string;
  voiceId: string;
  npcId?: string;
  settings?: VoiceSettings;
}

export interface BatchVoiceParams {
  texts: string[];
  voiceId: string;
  npcId?: string;
  settings?: VoiceSettings;
}

export interface SpeechToSpeechParams {
  audio: Buffer;
  voiceId: string;
  modelId?: string;
  outputFormat?: string;
  stability?: number;
  similarityBoost?: number;
  removeBackgroundNoise?: boolean;
  seed?: number;
}

export interface DesignVoiceParams {
  voiceDescription: string;
  modelId?: string;
  text?: string;
  autoGenerateText?: boolean;
  loudness?: number;
  seed?: number;
  guidanceScale?: number;
  outputFormat?: string;
}

export interface CreateVoiceFromPreviewParams {
  voiceName: string;
  voiceDescription: string;
  generatedVoiceId: string;
  labels?: Record<string, string>;
  playedNotSelectedVoiceIds?: string[];
}

export class ElevenLabsVoiceService {
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

  async getAvailableVoices() {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const response = await this.client.voices.getAll();
    const voices = response.voices || [];

    // Map to ensure consistent field names
    return voices.map((voice: any) => ({
      ...voice,
      voiceId: voice.voiceId || voice.voice_id || voice.name.toLowerCase().replace(/\s+/g, '-'),
      previewUrl: voice.previewUrl || voice.preview_url,
    }));
  }

  async generateVoice(params: GenerateVoiceParams) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const audioStream = await this.client.textToSpeech.convert(params.voiceId, {
      text: params.text,
      modelId: "eleven_multilingual_v2",
      voiceSettings: params.settings
        ? {
            stability: params.settings.stability,
            similarityBoost: params.settings.similarityBoost,
            style: params.settings.style,
            useSpeakerBoost: params.settings.useSpeakerBoost,
          }
        : undefined,
    });

    // Convert stream to buffer
    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    return {
      success: true,
      audioData: buffer.toString("base64"),
      npcId: params.npcId,
    };
  }

  async generateVoiceBatch(params: BatchVoiceParams) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const results = await Promise.allSettled(
      params.texts.map(async (text) => {
        const audioStream = await this.client!.textToSpeech.convert(
          params.voiceId,
          {
            text,
            modelId: "eleven_multilingual_v2",
            voiceSettings: params.settings
              ? {
                  stability: params.settings.stability,
                  similarityBoost: params.settings.similarityBoost,
                  style: params.settings.style,
                  useSpeakerBoost: params.settings.useSpeakerBoost,
                }
              : undefined,
          },
        );

        const reader = audioStream.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

        return {
          success: true,
          audioData: buffer.toString("base64"),
          text,
        };
      }),
    );

    const processedResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          text: params.texts[index],
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    return {
      successful: processedResults.filter((r) => r.success).length,
      total: params.texts.length,
      results: processedResults,
    };
  }

  async getSubscriptionInfo() {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const subscription = await this.client.user.subscription;
    // Ensure we return a plain object, not a proxy or class instance
    return JSON.parse(JSON.stringify(subscription));
  }

  async getAvailableModels() {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    // The SDK doesn't have a direct models endpoint, return commonly used models
    return [
      {
        model_id: "eleven_multilingual_v2",
        name: "Multilingual v2",
        description: "High quality multilingual model",
      },
      {
        model_id: "eleven_monolingual_v1",
        name: "Monolingual v1",
        description: "English-only model",
      },
      {
        model_id: "eleven_turbo_v2",
        name: "Turbo v2",
        description: "Fast, low-latency model",
      },
    ];
  }

  async speechToSpeech(params: SpeechToSpeechParams): Promise<Buffer> {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const audioStream = await this.client.speechToSpeech.convert(
      params.voiceId,
      {
        audio: params.audio,
        modelId: params.modelId || "eleven_multilingual_sts_v2",
        outputFormat: (params.outputFormat || "mp3_44100_128") as any,
        voiceSettings: params.stability || params.similarityBoost
          ? ({
              stability: params.stability,
              similarityBoost: params.similarityBoost,
            } as any)
          : undefined,
        seed: params.seed,
        removeBackgroundNoise: params.removeBackgroundNoise,
      },
    );

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

  async designVoice(params: DesignVoiceParams) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const response = await this.client.textToVoice.design({
      voiceDescription: params.voiceDescription,
      modelId: params.modelId as any,
      text: params.text,
      autoGenerateText: params.autoGenerateText,
      loudness: params.loudness,
      seed: params.seed,
      guidanceScale: params.guidanceScale,
      outputFormat: (params.outputFormat || "mp3_44100_128") as any,
    });

    // The response contains voice previews with generated voice IDs
    return response;
  }

  async createVoiceFromPreview(params: CreateVoiceFromPreviewParams) {
    if (!this.client) {
      throw new Error("ElevenLabs client not initialized");
    }

    const response = await this.client.textToVoice.create({
      voiceName: params.voiceName,
      voiceDescription: params.voiceDescription,
      generatedVoiceId: params.generatedVoiceId,
      labels: params.labels,
      playedNotSelectedVoiceIds: params.playedNotSelectedVoiceIds,
    });

    return response;
  }

  estimateCost(texts: string[], settings?: VoiceSettings) {
    // Calculate total character count
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);

    // ElevenLabs pricing (approximate - update with actual rates)
    const costPerCharacter = 0.00003; // $0.30 per 10k characters

    return {
      characterCount: totalChars,
      estimatedCostUSD: (totalChars * costPerCharacter).toFixed(4),
      texts: texts.length,
    };
  }

  getRateLimitInfo() {
    // ElevenLabs doesn't expose rate limit info directly through SDK
    // Return default values indicating rate limits are healthy
    return {
      requestsRemaining: 1000,
      requestsLimit: 1000,
      resetTime: Date.now() + 3600000, // 1 hour from now
      isLimited: false,
      nextRequestAllowedAt: null,
    };
  }
}
