/**
 * Material Presets API Client
 * Client for managing material preset configurations
 */

import { apiFetch } from "@/utils/api";

const API_BASE = '/api'

export interface MaterialPreset {
  id: string
  name?: string
  displayName: string
  stylePrompt: string
  description?: string
  category?: string
  tier?: string | number
  color?: string
}

export type MaterialPresetList = MaterialPreset[]

export interface MaterialPresetSaveResponse {
  success: boolean
  message: string
}

export class MaterialPresetsAPIClient {
  /**
   * Get all material presets
   */
  async getMaterialPresets(): Promise<MaterialPresetList> {
    const response = await apiFetch(`${API_BASE}/material-presets`)

    if (!response.ok) {
      throw new Error(`Failed to get material presets: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Save material presets (overwrites entire list)
   */
  async saveMaterialPresets(presets: MaterialPresetList): Promise<MaterialPresetSaveResponse> {
    const response = await apiFetch(`${API_BASE}/material-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(presets),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `Failed to save material presets: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Add a new material preset
   */
  async addMaterialPreset(preset: MaterialPreset): Promise<MaterialPresetSaveResponse> {
    const presets = await this.getMaterialPresets()
    presets.push(preset)
    return await this.saveMaterialPresets(presets)
  }

  /**
   * Update an existing material preset
   */
  async updateMaterialPreset(
    presetId: string,
    updates: Partial<MaterialPreset>,
  ): Promise<MaterialPresetSaveResponse> {
    const presets = await this.getMaterialPresets()
    const index = presets.findIndex((p) => p.id === presetId)

    if (index === -1) {
      throw new Error(`Material preset with id ${presetId} not found`)
    }

    presets[index] = { ...presets[index], ...updates }
    return await this.saveMaterialPresets(presets)
  }

  /**
   * Delete a material preset
   */
  async deleteMaterialPreset(presetId: string): Promise<MaterialPresetSaveResponse> {
    const presets = await this.getMaterialPresets()
    const filtered = presets.filter((p) => p.id !== presetId)

    if (filtered.length === presets.length) {
      throw new Error(`Material preset with id ${presetId} not found`)
    }

    return await this.saveMaterialPresets(filtered)
  }

  /**
   * Get material presets by category
   */
  async getMaterialPresetsByCategory(category: string): Promise<MaterialPresetList> {
    const presets = await this.getMaterialPresets()
    return presets.filter((p) => p.category === category)
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const presets = await this.getMaterialPresets()
    const categories = new Set<string>()

    presets.forEach((preset) => {
      if (preset.category) {
        categories.add(preset.category)
      }
    })

    return Array.from(categories).sort()
  }

  /**
   * Generate a unique ID for a new preset
   */
  generatePresetId(displayName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const slug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${slug}-${timestamp}-${random}`
  }

  /**
   * Validate preset data
   */
  validatePreset(preset: Partial<MaterialPreset>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!preset.id || preset.id.trim() === '') {
      errors.push('ID is required')
    }

    if (!preset.displayName || preset.displayName.trim() === '') {
      errors.push('Display name is required')
    }

    if (!preset.stylePrompt || preset.stylePrompt.trim() === '') {
      errors.push('Style prompt is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const materialPresetsClient = new MaterialPresetsAPIClient()
