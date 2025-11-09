/**
 * Audio API Client
 * Client for ElevenLabs voice, sound effects, and music generation
 */

import type {
  Voice,
  VoicePreview,
  VoiceSettings,
  GenerateVoiceParams,
  DesignVoiceParams,
  CreateVoiceParams,
  GenerateSFXParams,
  SFXEstimate,
  GenerateMusicParams,
  CompositionPlan,
} from '@/types/audio'

const API_BASE = '/api'

export class AudioAPIClient {
  // ==================== Voice Generation ====================

  /**
   * Get available voices from library
   */
  async getVoiceLibrary(): Promise<Voice[]> {
    const response = await fetch(`${API_BASE}/voice/library`)
    if (!response.ok) {
      throw new Error(`Failed to get voice library: ${response.statusText}`)
    }
    const data = await response.json()
    // Map the API response to our Voice interface
    return (data.voices || []).map((v: any) => ({
      voiceId: v.voiceId || v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      labels: v.labels,
      previewUrl: v.previewUrl || v.preview_url
    }))
  }

  /**
   * Generate voice from text (TTS)
   */
  async generateVoice(params: GenerateVoiceParams): Promise<string> {
    const response = await fetch(`${API_BASE}/voice/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate voice: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.success || !data.audioData) {
      throw new Error(data.error || 'Voice generation failed')
    }

    return data.audioData // base64 audio data
  }

  /**
   * Design a new voice from description
   */
  async designVoice(
    params: DesignVoiceParams,
  ): Promise<{ previews: VoicePreview[]; prompt: string }> {
    const response = await fetch(`${API_BASE}/voice/design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to design voice: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create (save) a designed voice to library
   */
  async createVoiceFromPreview(params: CreateVoiceParams): Promise<Voice> {
    const response = await fetch(`${API_BASE}/voice/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to create voice: ${response.statusText}`)
    }

    const data = await response.json()
    // Map the API response to our Voice interface
    return {
      voiceId: data.voice_id,
      name: data.name,
      description: data.description
    }
  }

  /**
   * Batch generate multiple voice clips
   */
  async batchGenerateVoice(params: {
    texts: string[]
    voiceId: string
    settings?: VoiceSettings
  }): Promise<Array<{ success: boolean; audioData?: string; text: string; error?: string }>> {
    const response = await fetch(`${API_BASE}/voice/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to batch generate voices: ${response.statusText}`)
    }

    const data = await response.json()
    return data.results || []
  }

  // ==================== Sound Effects ====================

  /**
   * Generate sound effect from text description
   * Returns audio file blob
   */
  async generateSFX(params: GenerateSFXParams): Promise<Blob> {
    const response = await fetch(`${API_BASE}/sfx/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate SFX: ${response.statusText}`)
    }

    return await response.blob()
  }

  /**
   * Batch generate multiple sound effects
   */
  async batchGenerateSFX(effects: GenerateSFXParams[]): Promise<{
    effects: Array<{
      index: number
      success: boolean
      audioBuffer?: string
      text: string
      size?: number
      error?: string
    }>
    successful: number
    total: number
  }> {
    const response = await fetch(`${API_BASE}/sfx/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effects }),
    })

    if (!response.ok) {
      throw new Error(`Failed to batch generate SFX: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Estimate cost for sound effect generation
   */
  async estimateSFXCost(duration?: number): Promise<SFXEstimate> {
    const url = duration
      ? `${API_BASE}/sfx/estimate?duration=${duration}`
      : `${API_BASE}/sfx/estimate`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to estimate SFX cost: ${response.statusText}`)
    }

    return await response.json()
  }

  // ==================== Music Generation ====================

  /**
   * Generate music from prompt
   * Returns audio file blob
   */
  async generateMusic(params: GenerateMusicParams): Promise<Blob> {
    const response = await fetch(`${API_BASE}/music/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate music: ${response.statusText}`)
    }

    return await response.blob()
  }

  /**
   * Generate music with metadata
   * Returns JSON with base64 audio and metadata
   */
  async generateMusicDetailed(params: GenerateMusicParams): Promise<{
    audio: string
    metadata: any
    format: string
  }> {
    const response = await fetch(`${API_BASE}/music/generate-detailed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate music: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create a composition plan for music generation
   */
  async createCompositionPlan(params: {
    prompt: string
    musicLengthMs?: number
  }): Promise<CompositionPlan> {
    const response = await fetch(`${API_BASE}/music/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to create composition plan: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Batch generate multiple music tracks
   */
  async batchGenerateMusic(tracks: GenerateMusicParams[]): Promise<{
    results: Array<{
      success: boolean
      audio: string | null
      prompt?: string
      error?: string
    }>
    total: number
    successful: number
    failed: number
  }> {
    const response = await fetch(`${API_BASE}/music/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks }),
    })

    if (!response.ok) {
      throw new Error(`Failed to batch generate music: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get music service status
   */
  async getMusicStatus(): Promise<{
    available: boolean
    service: string
    model: string
    maxDuration: number
    formats: string[]
  }> {
    const response = await fetch(`${API_BASE}/music/status`)
    if (!response.ok) {
      throw new Error(`Failed to get music status: ${response.statusText}`)
    }

    return await response.json()
  }
}
