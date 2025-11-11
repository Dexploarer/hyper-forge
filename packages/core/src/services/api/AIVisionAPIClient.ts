/**
 * AI Vision API Client
 * Client for GPT-4 Vision weapon handle detection and orientation detection
 */

import type { GripBounds } from '@/types'

// Get API base URL
// In production (Railway), frontend and API are served from same domain, so use relative URLs
// In development, Vite proxy handles /api routes, so use relative URLs
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use relative URLs (same domain)
  // In development, use relative URLs (Vite proxy handles /api -> localhost:3004)
  return "";
}

const API_BASE = `${getApiBaseUrl()}/api`

export interface HandleDetectionParams {
  image: string // base64 image data URL
  angle?: string // Optional angle descriptor (e.g., "side", "front", "diagonal")
  promptHint?: string // Optional custom prompt hint
}

export interface HandleDetectionResponse {
  success: boolean
  gripData?: {
    gripBounds: GripBounds
    confidence: number
    weaponType: string
    gripDescription: string
  }
  error?: string
}

export interface OrientationDetectionParams {
  image: string // base64 image data URL
}

export interface OrientationDetectionResponse {
  success: boolean
  needsFlip: boolean
  reason?: string
  confidence?: number
  error?: string
}

export class AIVisionAPIClient {
  /**
   * Detect weapon handle/grip area using GPT-4 Vision
   */
  async detectWeaponHandle(
    params: HandleDetectionParams,
  ): Promise<HandleDetectionResponse> {
    const response = await fetch(`${API_BASE}/weapon-handle-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Handle detection failed: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Detect if weapon needs 180° rotation (blade vs handle orientation)
   */
  async detectWeaponOrientation(
    params: OrientationDetectionParams,
  ): Promise<OrientationDetectionResponse> {
    const response = await fetch(`${API_BASE}/weapon-orientation-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Orientation detection failed: ${response.status}`)
    }

    return await response.json()
  }
}

export const aiVisionClient = new AIVisionAPIClient()
