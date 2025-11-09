/**
 * Audio Generation Types
 * TypeScript interfaces for voice, sound effects, and music generation
 */

// Audio generation types
export type AudioType = 'voice' | 'sfx' | 'music'
export type AudioView = 'config' | 'progress' | 'results'
export type VoiceMode = 'existing' | 'design'

// Voice Generation
export interface VoiceSettings {
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

export interface Voice {
  voiceId: string
  name: string
  category?: string
  description?: string
  labels?: Record<string, string>
  previewUrl?: string
}

export interface VoicePreview {
  generated_voice_id: string
  audio_base_64: string
  duration_secs?: number
  media_type?: string
}

export interface DesignVoiceParams {
  voiceDescription: string
  text?: string
  autoGenerateText?: boolean
  seed?: number
}

export interface CreateVoiceParams {
  voiceName: string
  voiceDescription: string
  generatedVoiceId: string
  labels?: Record<string, string>
}

export interface GenerateVoiceParams {
  text: string
  voiceId: string
  settings?: VoiceSettings
}

// Sound Effects
export interface GenerateSFXParams {
  text: string
  durationSeconds?: number
  promptInfluence?: number
}

export interface SFXEstimate {
  duration: string | number
  credits: number
  estimatedCostUSD: string
}

// Music Generation
export interface GenerateMusicParams {
  prompt?: string
  musicLengthMs?: number
  compositionPlan?: any
  forceInstrumental?: boolean
}

export interface CompositionPlan {
  prompt: string
  musicLengthMs?: number
  sections?: Array<{
    name: string
    duration: number
    description: string
  }>
  modelId?: string
}

// Generated Audio Result
export interface GeneratedAudio {
  id: string
  type: AudioType
  name: string
  audioUrl: string
  audioData?: string // base64 for inline playback
  duration?: number
  metadata: {
    type: AudioType
    prompt?: string
    voiceId?: string
    voiceName?: string
    settings?: VoiceSettings
    durationSeconds?: number
    musicLengthMs?: number
    [key: string]: any
  }
  createdAt: string
}

// Audio Player State
export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}
