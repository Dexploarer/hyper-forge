/**
 * Material Presets Routes
 * Material preset management endpoints
 */

import { Elysia } from 'elysia'
import path from 'path'
import fs from 'fs'
import * as Models from '../models'

export const createMaterialRoutes = (rootDir: string) => {
  return new Elysia({ prefix: '/api', name: 'materials' })
    .get('/material-presets', async ({ set }) => {
      const presetsPath = path.join(rootDir, 'public/prompts/material-presets.json')
      const file = Bun.file(presetsPath)
      
      if (!(await file.exists())) {
        set.status = 404
        return { error: 'Material presets file not found' }
      }
      
      const presets = JSON.parse(await file.text())
      return presets
    }, {
      response: Models.MaterialPresetList,
      detail: {
        tags: ['Material Presets'],
        summary: 'Get all material presets',
        description: 'Returns a list of all available material presets. (Auth optional)'
      }
    })

    .post('/material-presets', async ({ body }) => {
      const presetsPath = path.join(rootDir, 'public/prompts/material-presets.json')
      await fs.promises.writeFile(presetsPath, JSON.stringify(body, null, 2), 'utf-8')

      return { success: true, message: 'Material presets saved successfully' }
    }, {
      body: Models.MaterialPresetList,
      response: Models.MaterialPresetSaveResponse,
      detail: {
        tags: ['Material Presets'],
        summary: 'Save material presets',
        description: 'Saves the complete list of material presets. (Auth optional)'
      }
    })
}
