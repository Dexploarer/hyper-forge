/**
 * Voice Status API Client
 * Client for monitoring ElevenLabs voice generation service status
 */

import { apiFetch } from "@/utils/api";

const API_BASE = "/api/voice";

export interface VoiceSubscriptionInfo {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  status: string;
  next_invoice?: {
    amount_due_cents: number;
    next_payment_attempt_unix: number;
  };
}

export interface VoiceRateLimitInfo {
  requestsRemaining: number;
  requestsLimit: number;
  resetTime: number;
  isLimited: boolean;
  nextRequestAllowedAt: number | null;
}

export interface VoiceLibrary {
  voices: VoiceInfo[];
  count: number;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface VoiceModel {
  model_id: string;
  name: string;
  description?: string;
  languages?: { language_id: string; name: string }[];
  can_be_finetuned: boolean;
  can_do_text_to_speech: boolean;
  can_do_voice_conversion: boolean;
  token_cost_factor?: number;
  max_characters_request_free_user?: number;
  max_characters_request_subscribed_user?: number;
}

export interface VoiceModels {
  models: VoiceModel[];
  count: number;
}

export interface GetSubscriptionResponse {
  subscription: VoiceSubscriptionInfo;
}

export interface GetRateLimitResponse extends VoiceRateLimitInfo {}

export interface GetVoiceLibraryResponse extends VoiceLibrary {}

export interface GetVoiceModelsResponse extends VoiceModels {}

export interface VoiceServiceStatus {
  isAvailable: boolean;
  subscription: VoiceSubscriptionInfo | null;
  rateLimit: VoiceRateLimitInfo | null;
  voiceCount: number;
  modelCount: number;
  error?: string;
}

export class VoiceStatusAPIClient {
  /**
   * Get ElevenLabs subscription information
   */
  async getSubscription(): Promise<VoiceSubscriptionInfo> {
    const response = await apiFetch(`${API_BASE}/subscription`);

    if (!response.ok) {
      throw new Error(
        `Failed to get subscription info: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(): Promise<VoiceRateLimitInfo> {
    const response = await apiFetch(`${API_BASE}/rate-limit`);

    if (!response.ok) {
      throw new Error(`Failed to get rate limit info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get voice library (available voices)
   */
  async getVoiceLibrary(): Promise<VoiceLibrary> {
    const response = await apiFetch(`${API_BASE}/library`);

    if (!response.ok) {
      throw new Error(`Failed to get voice library: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get available TTS models
   */
  async getModels(): Promise<VoiceModels> {
    const response = await apiFetch(`${API_BASE}/models`);

    if (!response.ok) {
      throw new Error(`Failed to get voice models: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get comprehensive service status
   */
  async getServiceStatus(): Promise<VoiceServiceStatus> {
    try {
      const [subscription, rateLimit, library, models] = await Promise.all([
        this.getSubscription(),
        this.getRateLimit(),
        this.getVoiceLibrary(),
        this.getModels(),
      ]);

      return {
        isAvailable: true,
        subscription,
        rateLimit,
        voiceCount: library.count,
        modelCount: models.count,
      };
    } catch (error) {
      return {
        isAvailable: false,
        subscription: null,
        rateLimit: null,
        voiceCount: 0,
        modelCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Calculate character usage percentage
   */
  getCharacterUsagePercentage(subscription: VoiceSubscriptionInfo): number {
    if (subscription.character_limit === 0) return 0;
    return Math.round(
      (subscription.character_count / subscription.character_limit) * 100,
    );
  }

  /**
   * Get days until character reset
   */
  getDaysUntilReset(subscription: VoiceSubscriptionInfo): number {
    const now = Date.now() / 1000;
    const resetTime = subscription.next_character_count_reset_unix;
    const secondsUntilReset = resetTime - now;
    return Math.ceil(secondsUntilReset / (60 * 60 * 24));
  }

  /**
   * Format character count (e.g., "10.5K / 30K")
   */
  formatCharacterCount(count: number | undefined): string {
    // Handle undefined or null values
    if (count === undefined || count === null || Number.isNaN(count)) {
      return "0";
    }

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }
}

export const voiceStatusClient = new VoiceStatusAPIClient();
