/**
 * Cached Asset Service Wrapper
 * Adds request deduplication to AssetService methods
 */

import { AssetService, Asset, MaterialPreset } from './AssetService'
import { useRequestCache } from '@/hooks/useRequestCache'

/**
 * Wrapper class that adds caching to AssetService
 * Use this in components via hooks for automatic cache management
 */
export class CachedAssetService {
  private static requestCache = new Map<string, Promise<any>>()

  private static cachedRequest<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!
    }

    const promise = fetcher()
      .then((result) => {
        this.requestCache.delete(key)
        return result
      })
      .catch((error) => {
        this.requestCache.delete(key)
        throw error
      })

    this.requestCache.set(key, promise)
    return promise
  }

  static listAssets(): Promise<Asset[]> {
    return this.cachedRequest('assets-list', () => AssetService.listAssets())
  }

  static getMaterialPresets(): Promise<MaterialPreset[]> {
    return this.cachedRequest('material-presets', () => AssetService.getMaterialPresets())
  }

  // Non-cached methods (mutations)
  static retexture = AssetService.retexture.bind(AssetService)
  static bulkUpdateAssets = AssetService.bulkUpdateAssets.bind(AssetService)
  static uploadVRM = AssetService.uploadVRM.bind(AssetService)
  static getModelUrl = AssetService.getModelUrl.bind(AssetService)
  static getTPoseUrl = AssetService.getTPoseUrl.bind(AssetService)
  static getConceptArtUrl = AssetService.getConceptArtUrl.bind(AssetService)
  static getVRMUrl = AssetService.getVRMUrl.bind(AssetService)
  static getAPIVRMUrl = AssetService.getAPIVRMUrl.bind(AssetService)

  static clearCache(key?: string) {
    if (key) {
      this.requestCache.delete(key)
    } else {
      this.requestCache.clear()
    }
  }
}

